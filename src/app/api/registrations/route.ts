import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { hasTimeConflict } from '@/lib/utils';
import { Session } from '@/types';

export const dynamic = 'force-dynamic';

// Registration locked from conference day
const REGISTRATION_LOCK = new Date('2026-03-26T00:00:00+01:00');

// Register for a session
export async function POST(request: NextRequest) {
  try {
    if (new Date() >= REGISTRATION_LOCK) {
      return NextResponse.json(
        { error: 'Registrácia na prednášky je uzavretá.' },
        { status: 403 }
      );
    }

    const { attendeeId, sessionId } = await request.json();

    if (!attendeeId || !sessionId) {
      return NextResponse.json(
        { error: 'Chýbajú povinné parametre' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get attendee
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', attendeeId)
      .single();

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { error: 'Účastník nebol nájdený' },
        { status: 404 }
      );
    }

    // Get the session to register for
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, stage:stages(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Prednáška nebola nájdená' },
        { status: 404 }
      );
    }

    // Check capacity
    if (session.registered_count >= session.capacity) {
      return NextResponse.json(
        { error: 'Prednáška je už plne obsadená' },
        { status: 400 }
      );
    }

    // Check for existing registration
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('attendee_id', attendeeId)
      .eq('session_id', sessionId)
      .single();

    if (existingReg) {
      return NextResponse.json(
        { error: 'Na túto prednášku si už prihlásený' },
        { status: 400 }
      );
    }

    // Get attendee's current registrations to check for time conflicts
    const { data: currentRegs } = await supabase
      .from('registrations')
      .select('session_id, session:sessions(*)')
      .eq('attendee_id', attendeeId);

    const registeredSessions = (currentRegs?.map(r => r.session) || []) as unknown as Session[];
    
    // Check for time conflicts
    const conflictingSession = registeredSessions.find(s => hasTimeConflict(session, s));
    if (conflictingSession) {
      return NextResponse.json(
        { error: `Časový konflikt s prednáškou "${conflictingSession.title}"` },
        { status: 400 }
      );
    }

    // Create registration
    const { error: regError } = await supabase
      .from('registrations')
      .insert({
        attendee_id: attendeeId,
        session_id: sessionId,
      });

    if (regError) {
      console.error('Registration insert error:', regError);
      return NextResponse.json(
        { error: 'Registrácia zlyhala' },
        { status: 500 }
      );
    }

    // Increment registered count
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ registered_count: session.registered_count + 1 })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Count update error:', updateError);
    }

    // Get updated list of registered sessions for email
    const { data: updatedRegs } = await supabase
      .from('registrations')
      .select('session:sessions(*, stage:stages(*))')
      .eq('attendee_id', attendeeId);

    const allSessions = (updatedRegs?.map(r => r.session) || []) as unknown as Session[];

    // Send confirmation email
    try {
      await sendEmail({
        to: attendee.email,
        attendeeName: attendee.name,
        type: 'session_added',
        sessions: allSessions,
        changedSession: session,
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Úspešne prihlásený na prednášku',
    });
  } catch (error) {
    console.error('Registration POST error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}

// Unregister from a session
export async function DELETE(request: NextRequest) {
  try {
    if (new Date() >= REGISTRATION_LOCK) {
      return NextResponse.json(
        { error: 'Zmeny registrácií sú uzavreté.' },
        { status: 403 }
      );
    }

    const { attendeeId, sessionId } = await request.json();

    if (!attendeeId || !sessionId) {
      return NextResponse.json(
        { error: 'Chýbajú povinné parametre' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get attendee
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', attendeeId)
      .single();

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { error: 'Účastník nebol nájdený' },
        { status: 404 }
      );
    }

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, stage:stages(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Prednáška nebola nájdená' },
        { status: 404 }
      );
    }

    // Check if registration exists
    const { data: registration, error: regCheckError } = await supabase
      .from('registrations')
      .select('id')
      .eq('attendee_id', attendeeId)
      .eq('session_id', sessionId)
      .single();

    if (regCheckError || !registration) {
      return NextResponse.json(
        { error: 'Na túto prednášku nie si prihlásený' },
        { status: 400 }
      );
    }

    // Delete registration
    const { error: deleteError } = await supabase
      .from('registrations')
      .delete()
      .eq('id', registration.id);

    if (deleteError) {
      console.error('Registration delete error:', deleteError);
      return NextResponse.json(
        { error: 'Odhlásenie zlyhalo' },
        { status: 500 }
      );
    }

    // Decrement registered count
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ registered_count: Math.max(0, session.registered_count - 1) })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Count update error:', updateError);
    }

    // Get updated list of registered sessions for email
    const { data: updatedRegs } = await supabase
      .from('registrations')
      .select('session:sessions(*, stage:stages(*))')
      .eq('attendee_id', attendeeId);

    const allSessions = (updatedRegs?.map(r => r.session) || []) as unknown as Session[];

    // Send confirmation email
    try {
      await sendEmail({
        to: attendee.email,
        attendeeName: attendee.name,
        type: 'session_removed',
        sessions: allSessions,
        changedSession: session,
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Úspešne odhlásený z prednášky',
    });
  } catch (error) {
    console.error('Registration DELETE error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
