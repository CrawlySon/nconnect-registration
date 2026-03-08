import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - fetch all feedback for an attendee
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const attendeeId = searchParams.get('attendee');

    if (!attendeeId) {
      return NextResponse.json({ error: 'Chýba ID účastníka' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('session_feedback')
      .select('*')
      .eq('attendee_id', attendeeId);

    if (error) {
      console.error('Feedback fetch error:', error);
      return NextResponse.json({ error: 'Chyba pri načítaní hodnotení' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json({ error: 'Interná chyba servera' }, { status: 500 });
  }
}

// POST - save or update feedback (upsert)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { attendee_id, session_id, rating, comment } = body;

    if (!attendee_id || !session_id || !rating) {
      return NextResponse.json({ error: 'Chýbajú povinné údaje' }, { status: 400 });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Hodnotenie musí byť celé číslo od 1 do 5' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify attendee exists
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('id')
      .eq('id', attendee_id)
      .single();

    if (attendeeError || !attendee) {
      return NextResponse.json({ error: 'Účastník nenájdený' }, { status: 404 });
    }

    // Verify attendee is registered for this session
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id')
      .eq('attendee_id', attendee_id)
      .eq('session_id', session_id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: 'Nie si prihlásený na túto prednášku' }, { status: 403 });
    }

    // Upsert feedback (insert or update on conflict)
    const { data, error } = await supabase
      .from('session_feedback')
      .upsert(
        {
          attendee_id,
          session_id,
          rating,
          comment: comment?.trim() || null,
        },
        { onConflict: 'attendee_id,session_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Feedback upsert error:', error);
      return NextResponse.json({ error: 'Chyba pri ukladaní hodnotenia' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Hodnotenie uložené',
    });
  } catch (error) {
    console.error('Feedback POST error:', error);
    return NextResponse.json({ error: 'Interná chyba servera' }, { status: 500 });
  }
}
