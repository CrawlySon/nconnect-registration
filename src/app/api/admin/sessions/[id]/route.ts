import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        *,
        stage:stages(*)
      `)
      .eq('id', parseInt(id))
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Prednaska neexistuje' },
        { status: 404 }
      );
    }

    // Get registration count
    const { count } = await supabase
      .from('attendee_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', parseInt(id))
      .eq('is_registered', true);

    return NextResponse.json({
      session: {
        ...session,
        registered_count: count || 0,
      },
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, speaker_name, speaker_company, description, capacity } = body;

    const supabase = createServerClient();

    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        title,
        speaker_name,
        speaker_company: speaker_company || null,
        description: description || null,
        capacity: capacity || 60,
      })
      .eq('id', parseInt(id))
      .select(`
        *,
        stage:stages(*)
      `)
      .single();

    if (error) {
      console.error('Session update error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa aktualizovat prednasku' },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}
