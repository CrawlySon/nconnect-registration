import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        stage:stages(*)
      `)
      .order('id');

    if (error) {
      console.error('Sessions fetch error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa nacitat prednasky' },
        { status: 500 }
      );
    }

    // Get registration counts
    const { data: counts } = await supabase
      .from('attendee_sessions')
      .select('session_id')
      .eq('is_registered', true);

    const countMap: Record<number, number> = {};
    counts?.forEach((c) => {
      countMap[c.session_id] = (countMap[c.session_id] || 0) + 1;
    });

    const sessionsWithCounts = sessions?.map((session) => ({
      ...session,
      registered_count: countMap[session.id] || 0,
    }));

    return NextResponse.json({ sessions: sessionsWithCounts });
  } catch (error) {
    console.error('Admin sessions error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}
