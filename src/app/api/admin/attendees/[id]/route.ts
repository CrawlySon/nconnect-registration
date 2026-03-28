import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const attendeeId = params.id;

    // Delete registrations first (cascade)
    await supabase
      .from('registrations')
      .delete()
      .eq('attendee_id', attendeeId);

    // Delete feedback
    await supabase
      .from('session_feedback')
      .delete()
      .eq('attendee_id', attendeeId);

    // Delete attendee
    const { error } = await supabase
      .from('attendees')
      .delete()
      .eq('id', attendeeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete attendee error:', error);
    return NextResponse.json(
      { error: 'Nepodarilo sa odstrániť účastníka' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const attendeeId = params.id;

    // Get attendee
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('id, name, email, company, created_at, updated_at')
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
        session:sessions (
          id,
          title,
          speaker_name,
          speaker_company,
          date,
          start_time,
          end_time,
          stage:stages (
            id,
            name,
            color
          )
        )
      `)
      .eq('attendee_id', attendeeId)
      .order('registered_at', { ascending: false });

    if (regError) throw regError;

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
