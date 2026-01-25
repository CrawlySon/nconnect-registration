import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { TIME_SLOTS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// Get session details with registrations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId) || sessionId < 1 || sessionId > 14) {
      return NextResponse.json(
        { error: 'Neplatné ID prednášky' },
        { status: 400 }
      );
    }

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

    // Get registration count
    const { count: registeredCount } = await supabase
      .from('attendee_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('is_registered', true);

    // Get registrations with attendee info
    const { data: registrations } = await supabase
      .from('attendee_sessions')
      .select('*, attendee:attendees(*)')
      .eq('session_id', sessionId)
      .eq('is_registered', true)
      .order('registered_at', { ascending: false });

    // Get time slot info
    const timeSlot = TIME_SLOTS[session.slot_index];

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        registered_count: registeredCount || 0,
        time_slot: timeSlot,
      },
      registrations: registrations || [],
    });
  } catch (error) {
    console.error('Session detail error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}

// Update session content only (title, speaker, description, capacity)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId) || sessionId < 1 || sessionId > 14) {
      return NextResponse.json(
        { error: 'Neplatné ID prednášky' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, speaker_name, speaker_company, description, capacity } = body;

    if (!title || !speaker_name) {
      return NextResponse.json(
        { error: 'Názov a meno rečníka sú povinné' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        title,
        speaker_name,
        speaker_company: speaker_company || null,
        description: description || null,
        capacity: capacity ? parseInt(capacity) : 60,
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

// No DELETE - sessions are fixed and cannot be removed
