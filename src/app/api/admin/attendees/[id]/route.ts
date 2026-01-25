import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Admin: Get single attendee with all registrations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attendeeId = params.id;
    const supabase = createServerClient();

    // Get attendee with registrations
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

    // Get registrations with session details
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        id,
        registered_at,
        session:sessions(
          id,
          title,
          speaker_name,
          speaker_company,
          date,
          start_time,
          end_time,
          stage:stages(name, color)
        )
      `)
      .eq('attendee_id', attendeeId)
      .order('registered_at', { ascending: false });

    if (regError) {
      console.error('Fetch registrations error:', regError);
    }

    return NextResponse.json({
      success: true,
      attendee,
      registrations: registrations || [],
    });
  } catch (error) {
    console.error('Admin attendee detail error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}

// Admin: Delete attendee completely
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attendeeId = params.id;
    const supabase = createServerClient();

    // First, get all registrations to update session counts
    const { data: registrations } = await supabase
      .from('registrations')
      .select('session_id')
      .eq('attendee_id', attendeeId);

    // Delete attendee (cascades to registrations due to FK)
    const { error: deleteError } = await supabase
      .from('attendees')
      .delete()
      .eq('id', attendeeId);

    if (deleteError) {
      console.error('Delete attendee error:', deleteError);
      return NextResponse.json(
        { error: 'Nepodarilo sa vymazať účastníka' },
        { status: 500 }
      );
    }

    // Update session counts for all affected sessions
    if (registrations && registrations.length > 0) {
      for (const reg of registrations) {
        const { data: session } = await supabase
          .from('sessions')
          .select('registered_count')
          .eq('id', reg.session_id)
          .single();

        if (session) {
          await supabase
            .from('sessions')
            .update({ registered_count: Math.max(0, session.registered_count - 1) })
            .eq('id', reg.session_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Účastník bol vymazaný',
    });
  } catch (error) {
    console.error('Admin delete attendee error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
