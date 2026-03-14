import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('attendees')
      .select('id, name, email, company, created_at, updated_at', { count: 'exact' });

    // Add search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    // Get paginated results
    const { data: attendees, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get registration counts for each attendee
    const attendeeIds = attendees?.map(a => a.id) || [];

    let registrationCounts: Record<string, number> = {};
    if (attendeeIds.length > 0) {
      const { data: regData } = await supabase
        .from('registrations')
        .select('attendee_id')
        .in('attendee_id', attendeeIds);

      if (regData) {
        registrationCounts = regData.reduce((acc, r) => {
          acc[r.attendee_id] = (acc[r.attendee_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // Enrich attendees with registration counts
    const enrichedAttendees = attendees?.map(a => ({
      ...a,
      registration_count: registrationCounts[a.id] || 0,
    })) || [];

    return NextResponse.json({
      success: true,
      attendees: enrichedAttendees,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin attendees error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
