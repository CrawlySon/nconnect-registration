import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { enrichSessionsWithAvailability } from '@/lib/utils';

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
    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .order('name');

    if (stagesError) {
      console.error('Stages fetch error:', stagesError);
      return NextResponse.json(
        { error: 'Nepodarilo sa načítať stage' },
        { status: 500 }
      );
    }

    // Get all active sessions with stage info
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        *,
        stage:stages(*)
      `)
      .eq('is_active', true)
      .order('start_time');

    if (sessionsError) {
      console.error('Sessions fetch error:', sessionsError);
      return NextResponse.json(
        { error: 'Nepodarilo sa načítať prednášky' },
        { status: 500 }
      );
    }

    // Get attendee's registrations
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('session_id')
      .eq('attendee_id', attendeeId);

    if (regError) {
      console.error('Registrations fetch error:', regError);
      return NextResponse.json(
        { error: 'Nepodarilo sa načítať registrácie' },
        { status: 500 }
      );
    }

    const registeredIds = registrations?.map(r => r.session_id) || [];
    
    // Enrich sessions with availability info
    const enrichedSessions = enrichSessionsWithAvailability(sessions || [], registeredIds);

    return NextResponse.json({
      success: true,
      attendee,
      stages: stages || [],
      sessions: enrichedSessions,
      registeredIds,
    });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
