import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { formatTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get all attendees
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false });

    if (attendeesError) throw attendeesError;

    // Get all registrations with session info
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        attendee_id,
        session:sessions(
          title,
          speaker_name,
          start_time,
          end_time,
          stage:stages(name)
        )
      `)
      .order('session(start_time)', { ascending: true });

    if (regError) throw regError;

    // Group registrations by attendee
    const sessionsByAttendee: Record<string, string[]> = {};
    (registrations || []).forEach(reg => {
      const session = reg.session as any;
      if (!session) return;

      if (!sessionsByAttendee[reg.attendee_id]) {
        sessionsByAttendee[reg.attendee_id] = [];
      }

      const sessionInfo = `${formatTime(session.start_time)}-${formatTime(session.end_time)} | ${session.stage?.name || 'N/A'} | ${session.title} (${session.speaker_name})`;
      sessionsByAttendee[reg.attendee_id].push(sessionInfo);
    });

    // Create CSV content
    const headers = ['Meno', 'Email', 'Firma/Škola', 'Datum registracie', 'Pocet prednasok', 'Zoznam prednasok'];

    const rows = (attendees || []).map(attendee => {
      const sessions = sessionsByAttendee[attendee.id] || [];
      return [
        attendee.name || '',
        attendee.email || '',
        attendee.company || '',
        new Date(attendee.created_at).toLocaleString('sk-SK'),
        sessions.length.toString(),
        sessions.join(' | '),
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csv = '\ufeff' + [headers.join(','), ...rows].join('\n'); // BOM for Excel UTF-8

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="nconnect26-ucastnici-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Attendees export error:', error);
    return NextResponse.json(
      { error: 'Export zlyhal' },
      { status: 500 }
    );
  }
}
