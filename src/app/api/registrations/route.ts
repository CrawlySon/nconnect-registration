import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Toggle registration for a session
export async function POST(request: NextRequest) {
  try {
    const { attendeeId, sessionId, register } = await request.json();

    if (!attendeeId || sessionId === undefined || typeof register !== 'boolean') {
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

    // Get session with slot_index
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

    if (register) {
      // Check capacity
      const { count: registeredCount } = await supabase
        .from('attendee_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('is_registered', true);

      if ((registeredCount || 0) >= session.capacity) {
        return NextResponse.json(
          { error: 'Prednáška je už plne obsadená' },
          { status: 400 }
        );
      }

      // Check for time conflict (same slot_index)
      const { data: attendeeSessions } = await supabase
        .from('attendee_sessions')
        .select('session_id')
        .eq('attendee_id', attendeeId)
        .eq('is_registered', true);

      if (attendeeSessions && attendeeSessions.length > 0) {
        const registeredSessionIds = attendeeSessions.map(as => as.session_id);

        // Get sessions to check their slot_index
        const { data: registeredSessions } = await supabase
          .from('sessions')
          .select('id, slot_index')
          .in('id', registeredSessionIds);

        const hasConflict = registeredSessions?.some(
          rs => rs.slot_index === session.slot_index && rs.id !== sessionId
        );

        if (hasConflict) {
          return NextResponse.json(
            { error: 'Máš už prihlásenú inú prednášku v tomto čase' },
            { status: 400 }
          );
        }
      }
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from('attendee_sessions')
      .update({
        is_registered: register,
        registered_at: register ? new Date().toISOString() : null,
      })
      .eq('attendee_id', attendeeId)
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Registration update error:', updateError);
      return NextResponse.json(
        { error: 'Nepodarilo sa aktualizovať registráciu' },
        { status: 500 }
      );
    }

    // Get all registered sessions for email
    const { data: registeredSessions } = await supabase
      .from('attendee_sessions')
      .select('session_id')
      .eq('attendee_id', attendeeId)
      .eq('is_registered', true);

    const registeredIds = registeredSessions?.map(r => r.session_id) || [];

    let allSessions: any[] = [];
    if (registeredIds.length > 0) {
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*, stage:stages(*)')
        .in('id', registeredIds);
      allSessions = sessionsData || [];
    }

    // Send email notification
    try {
      await sendEmail({
        to: attendee.email,
        attendeeName: attendee.name,
        type: register ? 'session_added' : 'session_removed',
        sessions: allSessions,
        changedSession: session,
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: register ? 'Prihlásenie úspešné' : 'Odhlásenie úspešné',
      is_registered: register,
    });
  } catch (error) {
    console.error('Registration toggle error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
