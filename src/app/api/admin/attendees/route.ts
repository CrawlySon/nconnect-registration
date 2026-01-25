import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Admin: Get all attendees with their registration counts
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: attendees, error } = await supabase
      .from('attendees')
      .select(`
        *,
        registrations:registrations(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch attendees error:', error);
      return NextResponse.json(
        { error: 'Nepodarilo sa načítať účastníkov' },
        { status: 500 }
      );
    }

    // Transform the data to include registration count
    const attendeesWithCount = attendees?.map(a => ({
      ...a,
      registration_count: a.registrations?.[0]?.count || 0,
      registrations: undefined,
    })) || [];

    return NextResponse.json({
      success: true,
      attendees: attendeesWithCount,
    });
  } catch (error) {
    console.error('Admin attendees error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
