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

    // Get feedback stats
    const { data: feedbackData } = await supabase
      .from('feedback')
      .select('rating, session_id, comment, attendee:attendees(name, email), session:sessions(title, speaker_name)')
      .order('created_at', { ascending: false });

    const feedbackList = feedbackData || [];
    const totalFeedback = feedbackList.length;
    const averageRating = totalFeedback > 0
      ? feedbackList.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
      : 0;
    const withComments = feedbackList.filter(f => f.comment).length;

    // Per-session averages
    const sessionRatings: Record<string, { title: string; speaker: string; ratings: number[]; comments: string[] }> = {};
    for (const f of feedbackList) {
      const s = f.session as any;
      if (!sessionRatings[f.session_id]) {
        sessionRatings[f.session_id] = {
          title: s?.title || '',
          speaker: s?.speaker_name || '',
          ratings: [],
          comments: [],
        };
      }
      sessionRatings[f.session_id].ratings.push(f.rating);
      if (f.comment) sessionRatings[f.session_id].comments.push(f.comment);
    }

    const sessionFeedbackStats = Object.entries(sessionRatings)
      .map(([id, data]) => ({
        sessionId: id,
        title: data.title,
        speaker: data.speaker,
        avgRating: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
        count: data.ratings.length,
        comments: data.comments.length,
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    return NextResponse.json({
      success: true,
      stats: {
        totalAttendees: totalAttendees || 0,
        totalSessions,
        totalRegistrations: totalRegistrations || 0,
        averageSessionFill,
        totalFeedback,
        averageRating,
        withComments,
      },
      recentAttendees: recentAttendees || [],
      sessionFeedbackStats,
      recentFeedback: feedbackList.slice(0, 20).map(f => ({
        rating: f.rating,
        comment: f.comment,
        attendeeName: (f.attendee as any)?.name,
        sessionTitle: (f.session as any)?.title,
      })),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
