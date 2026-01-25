import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SessionWithStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attendeeId = searchParams.get('attendee');

    if (!attendeeId) {
      return NextResponse.json(
        { error: 'Chyba attendee parametra' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get all sessions with stage info
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        *,
        stage:stages(*)
      `)
      .order('id');

    if (sessionsError) {
      console.error('Sessions fetch error:', sessionsError);
      return NextResponse.json(
        { error: 'Nepodarilo sa nacitat prednasky' },
        { status: 500 }
      );
    }

    // Get attendee's registrations - filter by is_registered=true in query
    const { data: attendeeSessions, error: attendeeError } = await supabase
      .from('attendee_sessions')
      .select('session_id')
      .eq('attendee_id', attendeeId)
      .eq('is_registered', true);

    if (attendeeError) {
      console.error('Attendee sessions fetch error:', attendeeError);
      return NextResponse.json(
        { error: 'Nepodarilo sa nacitat registracie' },
        { status: 500 }
      );
    }

    // Get registration counts for all sessions
    const { data: counts, error: countsError } = await supabase
      .from('attendee_sessions')
      .select('session_id')
      .eq('is_registered', true);

    if (countsError) {
      console.error('Counts fetch error:', countsError);
      return NextResponse.json(
        { error: 'Nepodarilo sa nacitat pocty' },
        { status: 500 }
      );
    }

    // Create count map
    const countMap: Record<number, number> = {};
    counts?.forEach((c) => {
      countMap[c.session_id] = (countMap[c.session_id] || 0) + 1;
    });

    // Create registration map - all returned sessions are registered (filtered in query)
    const registrationMap: Record<number, boolean> = {};
    attendeeSessions?.forEach((as) => {
      registrationMap[as.session_id] = true;
    });

    // Find which slots user is registered for
    const registeredSlots = new Set<number>();
    sessions?.forEach((session) => {
      if (registrationMap[session.id]) {
        registeredSlots.add(session.slot_index);
      }
    });

    // Build response with status
    const sessionsWithStatus: SessionWithStatus[] = sessions?.map((session) => {
      const isRegistered = registrationMap[session.id] === true;
      const registeredCount = countMap[session.id] || 0;
      const isFull = registeredCount >= session.capacity;
      const hasConflict = !isRegistered && registeredSlots.has(session.slot_index);

      return {
        ...session,
        is_registered: isRegistered,
        registered_count: registeredCount,
        is_full: isFull,
        has_conflict: hasConflict,
      };
    }) || [];

    // Debug log
    const registeredIds = Object.keys(registrationMap).map(Number);
    console.log('Attendee:', attendeeId, 'Registered sessions:', registeredIds, 'Count map sample:', Object.entries(countMap).slice(0, 3));

    return NextResponse.json({
      sessions: sessionsWithStatus,
      _debug: {
        attendeeSessionsCount: attendeeSessions?.length,
        registeredSessionIds: registeredIds,
        totalCounts: counts?.length,
      }
    });
  } catch (error) {
    console.error('Sessions error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}
