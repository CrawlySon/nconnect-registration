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
      .from('session_feedback')
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

    // Get survey stats
    const { data: surveyData } = await supabase
      .from('survey_responses')
      .select('answers, attendee:attendees(name)')
      .order('created_at', { ascending: false });

    const surveys = surveyData || [];
    const totalSurveys = surveys.length;

    // NPS calculation
    const npsValues = surveys.map(s => (s.answers as any)?.nps).filter((v: any) => typeof v === 'number');
    const npsPromoters = npsValues.filter((v: number) => v >= 9).length;
    const npsDetractors = npsValues.filter((v: number) => v <= 6).length;
    const npsScore = npsValues.length > 0 ? Math.round(((npsPromoters - npsDetractors) / npsValues.length) * 100) : null;

    // Average star ratings from survey
    const speakerQualityVals = surveys.map(s => (s.answers as any)?.speaker_quality).filter((v: any) => typeof v === 'number');
    const organizationVals = surveys.map(s => (s.answers as any)?.organization).filter((v: any) => typeof v === 'number');
    const avgSpeakerQuality = speakerQualityVals.length > 0 ? speakerQualityVals.reduce((a: number, b: number) => a + b, 0) / speakerQualityVals.length : null;
    const avgOrganization = organizationVals.length > 0 ? organizationVals.reduce((a: number, b: number) => a + b, 0) / organizationVals.length : null;

    // Volunteer interest
    const volunteerCount = surveys.filter(s => (s.answers as any)?.volunteer === 'ano').length;

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
      surveyStats: {
        totalSurveys,
        npsScore,
        avgSpeakerQuality,
        avgOrganization,
        volunteerCount,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
