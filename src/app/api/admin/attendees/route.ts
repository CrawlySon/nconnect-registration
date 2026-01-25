import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: attendees, error } = await supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Attendees fetch error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa nacitat ucastnikov' },
        { status: 500 }
      );
    }

    // Get registration counts per attendee
    const { data: registrations } = await supabase
      .from('attendee_sessions')
      .select('attendee_id')
      .eq('is_registered', true);

    const countMap: Record<string, number> = {};
    registrations?.forEach((r) => {
      countMap[r.attendee_id] = (countMap[r.attendee_id] || 0) + 1;
    });

    const attendeesWithCounts = attendees?.map((a) => ({
      ...a,
      sessions_count: countMap[a.id] || 0,
    }));

    return NextResponse.json({ attendees: attendeesWithCounts });
  } catch (error) {
    console.error('Admin attendees error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Chyba ID parametra' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Delete attendee (cascade will delete attendee_sessions)
    const { error } = await supabase
      .from('attendees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Attendee delete error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa vymazat ucastnika' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin attendee delete error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}
