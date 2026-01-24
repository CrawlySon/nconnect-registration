import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Debug endpoint to check registrations
// Usage: /api/debug/registrations?email=xxx@example.com
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const attendeeId = searchParams.get('attendee');

    const supabase = createServerClient();

    let attendee = null;

    if (email) {
      const { data } = await supabase
        .from('attendees')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
      attendee = data;
    } else if (attendeeId) {
      const { data } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', attendeeId)
        .single();
      attendee = data;
    }

    if (!attendee) {
      return NextResponse.json({
        error: 'Attendee not found',
        searchedBy: email ? `email: ${email}` : `id: ${attendeeId}`,
      }, { status: 404 });
    }

    // Get registrations
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        id,
        session_id,
        registered_at,
        session:sessions(id, title, start_time)
      `)
      .eq('attendee_id', attendee.id);

    // Get all registrations count
    const { count: totalRegistrations } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      debug: true,
      attendee: {
        id: attendee.id,
        email: attendee.email,
        name: attendee.name,
        created_at: attendee.created_at,
      },
      registrations: {
        count: registrations?.length || 0,
        data: registrations,
        error: regError?.message || null,
      },
      database: {
        totalRegistrationsInDb: totalRegistrations,
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
