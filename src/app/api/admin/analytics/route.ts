import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const stageId = searchParams.get('stage');
    const sessionId = searchParams.get('session');

    // Get all stages
    const { data: stages } = await supabase
      .from('stages')
      .select('*')
      .order('name');

    // Get all sessions
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('id, title, stage_id, registered_count, capacity')
      .eq('is_active', true)
      .order('registered_count', { ascending: false });

    // Build registrations query with optional filters
    let registrationsQuery = supabase
      .from('registrations')
      .select(`
        id,
        registered_at,
        session:sessions (
          id,
          title,
          stage_id
        )
      `);

    const { data: registrations, error: regError } = await registrationsQuery;

    if (regError) throw regError;

    // Filter registrations based on stage/session
    let filteredRegistrations = registrations || [];
    if (stageId) {
      filteredRegistrations = filteredRegistrations.filter(
        r => r.session?.stage_id === stageId
      );
    }
    if (sessionId) {
      filteredRegistrations = filteredRegistrations.filter(
        r => r.session?.id === sessionId
      );
    }

    // Group registrations by day
    const registrationsByDay: Record<string, number> = {};
    filteredRegistrations.forEach(reg => {
      const date = new Date(reg.registered_at).toISOString().split('T')[0];
      registrationsByDay[date] = (registrationsByDay[date] || 0) + 1;
    });

    // Convert to array and sort
    const dailyRegistrations = Object.entries(registrationsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get top sessions
    const topSessions = (allSessions || [])
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        title: s.title,
        registered: s.registered_count,
        capacity: s.capacity,
        fillRate: Math.round((s.registered_count / s.capacity) * 100),
      }));

    // Calculate overall stats
    const totalAttendees = new Set(filteredRegistrations.map(r => r.id)).size;
    const totalRegistrations = filteredRegistrations.length;

    // Calculate average sessions per attendee (from all registrations)
    const { count: uniqueAttendees } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true });

    const { count: allRegistrationsCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });

    const avgSessionsPerAttendee = uniqueAttendees && uniqueAttendees > 0
      ? (allRegistrationsCount || 0) / uniqueAttendees
      : 0;

    // Get sessions for filter dropdown (filtered by stage if selected)
    let sessionsForFilter = allSessions || [];
    if (stageId) {
      sessionsForFilter = sessionsForFilter.filter(s => s.stage_id === stageId);
    }

    return NextResponse.json({
      success: true,
      dailyRegistrations,
      topSessions,
      stages: stages || [],
      sessions: sessionsForFilter.map(s => ({ id: s.id, title: s.title })),
      stats: {
        totalAttendees: uniqueAttendees || 0,
        totalRegistrations: allRegistrationsCount || 0,
        filteredRegistrations: totalRegistrations,
        avgSessionsPerAttendee: Math.round(avgSessionsPerAttendee * 10) / 10,
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
