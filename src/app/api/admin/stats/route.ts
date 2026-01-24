import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get total attendees
    const { count: totalAttendees } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true });

    // Get total active sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('capacity, registered_count')
      .eq('is_active', true);

    const totalSessions = sessions?.length || 0;

    // Get total registrations
    const { count: totalRegistrations } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });

    // Calculate average fill rate
    let averageSessionFill = 0;
    if (sessions && sessions.length > 0) {
      const totalFill = sessions.reduce((sum, s) => {
        return sum + (s.registered_count / s.capacity) * 100;
      }, 0);
      averageSessionFill = totalFill / sessions.length;
    }

    // Get recent attendees
    const { data: recentAttendees } = await supabase
      .from('attendees')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      stats: {
        totalAttendees: totalAttendees || 0,
        totalSessions,
        totalRegistrations: totalRegistrations || 0,
        averageSessionFill,
      },
      recentAttendees: recentAttendees || [],
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
