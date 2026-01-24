import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Get all sessions for admin
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*, stage:stages(*)')
      .order('start_time');

    if (sessionsError) {
      throw sessionsError;
    }

    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .order('name');

    if (stagesError) {
      throw stagesError;
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      stages: stages || [],
    });
  } catch (error) {
    console.error('Admin sessions GET error:', error);
    return NextResponse.json(
      { error: 'Nepodarilo sa načítať prednášky' },
      { status: 500 }
    );
  }
}

// Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, speaker_name, speaker_company, description,
      stage_id, date, start_time, end_time, capacity 
    } = body;

    if (!title || !speaker_name || !stage_id || !date || !start_time || !end_time || !capacity) {
      return NextResponse.json(
        { error: 'Chýbajú povinné polia' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        title,
        speaker_name,
        speaker_company: speaker_company || null,
        description: description || null,
        stage_id,
        date,
        start_time,
        end_time,
        capacity: parseInt(capacity),
        registered_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Session create error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa vytvoriť prednášku' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Admin sessions POST error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
