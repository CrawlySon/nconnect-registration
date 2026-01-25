import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get('stage');
    const sessionId = searchParams.get('session');

    const supabase = createServerClient();

    // Build query for registrations
    let query = supabase
      .from('attendee_sessions')
      .select(`
        registered_at,
        session_id,
        sessions!inner(stage_id)
      `)
      .eq('is_registered', true)
      .not('registered_at', 'is', null);

    if (sessionId) {
      query = query.eq('session_id', parseInt(sessionId));
    } else if (stageId) {
      query = query.eq('sessions.stage_id', stageId);
    }

    const { data: registrations, error } = await query;

    if (error) {
      console.error('Analytics fetch error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa nacitat analytiku' },
        { status: 500 }
      );
    }

    // Group by date
    const dateMap: Record<string, number> = {};
    registrations?.forEach((r) => {
      if (r.registered_at) {
        const date = r.registered_at.split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
      }
    });

    // Convert to array sorted by date
    const chartData = Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get total stats
    const { count: totalAttendees } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true });

    const { count: totalRegistrations } = await supabase
      .from('attendee_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_registered', true);

    return NextResponse.json({
      chartData,
      stats: {
        totalAttendees: totalAttendees || 0,
        totalRegistrations: totalRegistrations || 0,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}
