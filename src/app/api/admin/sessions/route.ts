import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { TIME_SLOTS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// Get all sessions for admin with registration counts
export async function GET() {
  try {
    const supabase = createServerClient();

    // Get all sessions with stage info
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*, stage:stages(*)')
      .order('slot_index')
      .order('stage_id');

    if (sessionsError) {
      throw sessionsError;
    }

    // Get registration counts for each session
    const { data: registrationCounts, error: countError } = await supabase
      .from('attendee_sessions')
      .select('session_id')
      .eq('is_registered', true);

    if (countError) {
      throw countError;
    }

    // Count registrations per session
    const countMap: Record<number, number> = {};
    registrationCounts?.forEach(r => {
      countMap[r.session_id] = (countMap[r.session_id] || 0) + 1;
    });

    // Add registration counts to sessions
    const sessionsWithCounts = sessions?.map(session => ({
      ...session,
      registered_count: countMap[session.id] || 0,
    })) || [];

    // Get stages
    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .order('id');

    if (stagesError) {
      throw stagesError;
    }

    return NextResponse.json({
      success: true,
      sessions: sessionsWithCounts,
      stages: stages || [],
      timeSlots: TIME_SLOTS,
    });
  } catch (error) {
    console.error('Admin sessions GET error:', error);
    return NextResponse.json(
      { error: 'Nepodarilo sa načítať prednášky' },
      { status: 500 }
    );
  }
}

// No POST - sessions are fixed at 14
// No DELETE - sessions cannot be removed
