import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { attendeeId, sessionId, register } = await request.json();

    if (!attendeeId || !sessionId || typeof register !== 'boolean') {
      return NextResponse.json(
        { error: 'Chybaju povinne parametre' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get session info
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('slot_index, capacity')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Prednaska neexistuje' },
        { status: 404 }
      );
    }

    if (register) {
      // Check capacity
      const { count } = await supabase
        .from('attendee_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('is_registered', true);

      if (count !== null && count >= session.capacity) {
        return NextResponse.json(
          { error: 'Prednaska je plna' },
          { status: 400 }
        );
      }

      // Check for conflict in same slot
      const { data: conflict } = await supabase
        .from('attendee_sessions')
        .select('session_id, sessions!inner(slot_index)')
        .eq('attendee_id', attendeeId)
        .eq('is_registered', true)
        .eq('sessions.slot_index', session.slot_index)
        .neq('session_id', sessionId)
        .single();

      if (conflict) {
        return NextResponse.json(
          { error: 'V tomto case mas uz inu prednasku' },
          { status: 400 }
        );
      }
    }

    // Upsert registration (insert if not exists, update if exists)
    const { error: upsertError } = await supabase
      .from('attendee_sessions')
      .upsert({
        attendee_id: attendeeId,
        session_id: sessionId,
        is_registered: register,
        registered_at: register ? new Date().toISOString() : null,
      }, {
        onConflict: 'attendee_id,session_id',
      });

    if (upsertError) {
      console.error('Registration upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Nepodarilo sa aktualizovat registraciu' },
        { status: 500 }
      );
    }

    // Send email with updated sessions
    try {
      const { data: attendee } = await supabase
        .from('attendees')
        .select('email, name')
        .eq('id', attendeeId)
        .single();

      if (attendee) {
        const { data: registeredSessions } = await supabase
          .from('attendee_sessions')
          .select('sessions(*, stage:stages(*))')
          .eq('attendee_id', attendeeId)
          .eq('is_registered', true);

        const sessions = registeredSessions?.map((r) => r.sessions).filter(Boolean) || [];

        await sendEmail({
          to: attendee.email,
          attendeeName: attendee.name,
          type: 'sessions_updated',
          sessions: sessions as any[],
          attendeeId,
        });
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: register ? 'Registracia uspesna' : 'Odhlasenie uspesne',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}
