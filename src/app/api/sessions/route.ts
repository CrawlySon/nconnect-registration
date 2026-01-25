import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { TIME_SLOTS, TOTAL_SESSIONS } from '@/lib/constants';
import { SessionWithStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attendeeId = searchParams.get('attendee');

    if (!attendeeId) {
      return NextResponse.json(
        { error: 'Chýba ID účastníka' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify attendee exists
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

    // Get all stages
    const { data: stages } = await supabase
      .from('stages')
      .select('*');

    // Get all 14 sessions with stage info
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*, stage:stages(*)')
      .order('slot_index')
      .order('stage_id');

    if (sessionsError) {
      console.error('Sessions fetch error:', sessionsError);
      return NextResponse.json(
        { error: 'Nepodarilo sa načítať prednášky' },
        { status: 500 }
      );
    }

    // Get attendee's session registrations
    let { data: attendeeSessions } = await supabase
      .from('attendee_sessions')
      .select('session_id, is_registered')
      .eq('attendee_id', attendeeId);

    // If attendee has no sessions yet (old attendee), initialize them
    if (!attendeeSessions || attendeeSessions.length === 0) {
      const newSessions = [];
      for (let sessionId = 1; sessionId <= TOTAL_SESSIONS; sessionId++) {
        newSessions.push({
          attendee_id: attendeeId,
          session_id: sessionId,
          is_registered: false,
        });
      }
      await supabase.from('attendee_sessions').insert(newSessions);
      attendeeSessions = newSessions.map(s => ({
        session_id: s.session_id,
        is_registered: s.is_registered,
      }));
    }

    // Get registration counts for all sessions
    const { data: regCounts } = await supabase
      .from('attendee_sessions')
      .select('session_id')
      .eq('is_registered', true);

    const countMap: Record<number, number> = {};
    regCounts?.forEach(r => {
      countMap[r.session_id] = (countMap[r.session_id] || 0) + 1;
    });

    // Build registration map for this attendee
    const registrationMap: Record<number, boolean> = {};
    attendeeSessions?.forEach(as => {
      registrationMap[as.session_id] = as.is_registered;
    });

    // Find which slot_indexes this attendee is registered for
    const registeredSlots = new Set<number>();
    sessions?.forEach(s => {
      if (registrationMap[s.id]) {
        registeredSlots.add(s.slot_index);
      }
    });

    // Enrich sessions with status
    const sessionsWithStatus: SessionWithStatus[] = (sessions || []).map(session => {
      const registered_count = countMap[session.id] || 0;
      const is_registered = registrationMap[session.id] || false;
      const is_full = registered_count >= session.capacity;
      // Has conflict if another session in same slot is registered (and this one isn't)
      const has_conflict = !is_registered && registeredSlots.has(session.slot_index);

      return {
        ...session,
        registered_count,
        is_registered,
        is_full,
        has_conflict,
      };
    });

    return NextResponse.json({
      success: true,
      attendee,
      stages: stages || [],
      sessions: sessionsWithStatus,
      timeSlots: TIME_SLOTS,
    });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
