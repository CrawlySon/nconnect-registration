import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Get session details with registrations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const supabase = createServerClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, stage:stages(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Prednáška nebola nájdená' },
        { status: 404 }
      );
    }

    // Get all stages for edit dropdown
    const { data: stages } = await supabase
      .from('stages')
      .select('*')
      .order('name');

    // Get registrations with attendee info
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*, attendee:attendees(*)')
      .eq('session_id', sessionId)
      .order('registered_at', { ascending: false });

    // Get all attendees for add modal
    const { data: allAttendees } = await supabase
      .from('attendees')
      .select('*')
      .order('name');

    return NextResponse.json({
      success: true,
      session,
      stages: stages || [],
      registrations: registrations || [],
      allAttendees: allAttendees || [],
    });
  } catch (error) {
    console.error('Session detail error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}

// Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { 
      title, speaker_name, speaker_company, description,
      stage_id, date, start_time, end_time, capacity 
    } = body;

    const supabase = createServerClient();

    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        title,
        speaker_name,
        speaker_company: speaker_company || null,
        description: description || null,
        stage_id,
        date,
        start_time,
        end_time,
        capacity: parseInt(capacity),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select('*, stage:stages(*)')
      .single();

    if (error) {
      console.error('Session update error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa aktualizovať prednášku' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}

// Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const supabase = createServerClient();

    // First delete all registrations
    await supabase
      .from('registrations')
      .delete()
      .eq('session_id', sessionId);

    // Then delete the session
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Session delete error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa vymazať prednášku' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Session delete error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
