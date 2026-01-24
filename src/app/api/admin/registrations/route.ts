import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Admin: Add attendee to session
export async function POST(request: NextRequest) {
  try {
    const { attendeeId, sessionId } = await request.json();

    if (!attendeeId || !sessionId) {
      return NextResponse.json(
        { error: 'Chýbajú povinné parametre' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if already registered
    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('attendee_id', attendeeId)
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Účastník je už prihlásený na túto prednášku' },
        { status: 400 }
      );
    }

    // Get session to check capacity
    const { data: session } = await supabase
      .from('sessions')
      .select('capacity, registered_count')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Prednáška nebola nájdená' },
        { status: 404 }
      );
    }

    if (session.registered_count >= session.capacity) {
      return NextResponse.json(
        { error: 'Prednáška je už plne obsadená' },
        { status: 400 }
      );
    }

    // Create registration
    const { error: regError } = await supabase
      .from('registrations')
      .insert({
        attendee_id: attendeeId,
        session_id: sessionId,
      });

    if (regError) {
      console.error('Registration error:', regError);
      return NextResponse.json(
        { error: 'Nepodarilo sa pridať účastníka' },
        { status: 500 }
      );
    }

    // Update count
    await supabase
      .from('sessions')
      .update({ registered_count: session.registered_count + 1 })
      .eq('id', sessionId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
