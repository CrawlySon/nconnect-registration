import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Generate .ics calendar file with all registered sessions for an attendee
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Find attendee by email
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('id, name')
      .eq('email', email)
      .single();

    if (attendeeError || !attendee) {
      return NextResponse.json({ error: 'Účastník nenájdený' }, { status: 404 });
    }

    // Get all registered sessions
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        session_id,
        session:sessions (
          title,
          speaker_name,
          speaker_company,
          description,
          date,
          start_time,
          end_time,
          stage:stages (name)
        )
      `)
      .eq('attendee_id', attendee.id);

    if (regError) {
      return NextResponse.json({ error: 'Chyba pri načítaní registrácií' }, { status: 500 });
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ error: 'Žiadne registrácie' }, { status: 404 });
    }

    // Generate .ics content
    const now = new Date();
    const timestamp = formatIcsDate(now);

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//nConnect26//Registration//SK',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:nConnect26 - Môj program',
      'X-WR-TIMEZONE:Europe/Bratislava',
      // Timezone definition
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Bratislava',
      'BEGIN:STANDARD',
      'DTSTART:19701025T030000',
      'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'END:STANDARD',
      'BEGIN:DAYLIGHT',
      'DTSTART:19700329T020000',
      'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'END:DAYLIGHT',
      'END:VTIMEZONE',
    ];

    for (const reg of registrations) {
      const session = reg.session as any;
      if (!session) continue;

      // Convert date "2026-03-26" and time "09:00:00" to ICS format
      const dateClean = session.date.replace(/-/g, '');
      const startClean = session.start_time.replace(/:/g, '').substring(0, 6).padEnd(6, '0');
      const endClean = session.end_time.replace(/:/g, '').substring(0, 6).padEnd(6, '0');

      const stageName = session.stage?.name || '';
      const description = [
        session.speaker_name + (session.speaker_company ? ` • ${session.speaker_company}` : ''),
        stageName ? `Stage: ${stageName}` : '',
        session.description || '',
        '',
        'nConnect26 - IT konferencia',
      ].filter(Boolean).join('\\n');

      icsContent.push(
        'BEGIN:VEVENT',
        `DTSTART;TZID=Europe/Bratislava:${dateClean}T${startClean}`,
        `DTEND;TZID=Europe/Bratislava:${dateClean}T${endClean}`,
        `DTSTAMP:${timestamp}`,
        `UID:${reg.session_id}@nconnect26`,
        `SUMMARY:${escapeIcsText(session.title)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        `LOCATION:Študentské centrum UKF\\, Dražovská 2\\, Nitra`,
        `ORGANIZER;CN=nConnect26:mailto:info@nconnect.sk`,
        'STATUS:CONFIRMED',
        // Reminder 30 min before
        'BEGIN:VALARM',
        'TRIGGER:-PT30M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcsText(session.title)} začína o 30 minút`,
        'END:VALARM',
        'END:VEVENT',
      );
    }

    icsContent.push('END:VCALENDAR');

    const icsString = icsContent.join('\r\n');

    return new Response(icsString, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="nconnect26-program.ics"',
      },
    });
  } catch (error) {
    console.error('Calendar generation error:', error);
    return NextResponse.json({ error: 'Chyba pri generovaní kalendára' }, { status: 500 });
  }
}

// Format Date to ICS timestamp (UTC)
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Escape special characters for ICS format
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
