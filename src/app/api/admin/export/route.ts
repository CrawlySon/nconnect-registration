import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { TIME_SLOTS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'attendees';

    const supabase = createServerClient();

    if (type === 'attendees') {
      const { data: attendees, error } = await supabase
        .from('attendees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: 'Export zlyhal' },
          { status: 500 }
        );
      }

      // Generate CSV
      const headers = ['Meno', 'Email', 'Typ', 'Skola/Firma', 'Registracia'];
      const rows = attendees?.map((a) => [
        a.name,
        a.email,
        a.attendee_type,
        a.school_or_company || '',
        new Date(a.created_at).toLocaleDateString('sk-SK'),
      ]);

      const csv = [
        headers.join(','),
        ...(rows?.map((r) => r.map((c) => `"${c}"`).join(',')) || []),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename=ucastnici.csv',
        },
      });
    }

    if (type === 'registrations') {
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*, stage:stages(*)')
        .order('id');

      if (sessionsError) {
        return NextResponse.json(
          { error: 'Export zlyhal' },
          { status: 500 }
        );
      }

      const { data: registrations, error: regError } = await supabase
        .from('attendee_sessions')
        .select('session_id, attendees(*)')
        .eq('is_registered', true);

      if (regError) {
        return NextResponse.json(
          { error: 'Export zlyhal' },
          { status: 500 }
        );
      }

      // Group registrations by session
      const regMap: Record<number, any[]> = {};
      registrations?.forEach((r) => {
        if (!regMap[r.session_id]) regMap[r.session_id] = [];
        regMap[r.session_id].push(r.attendees);
      });

      // Generate CSV
      const headers = ['Prednaska', 'Stage', 'Cas', 'Recnik', 'Pocet', 'Ucastnici'];
      const rows = sessions?.map((s) => {
        const slot = TIME_SLOTS[s.slot_index];
        const attendees = regMap[s.id] || [];
        return [
          s.title,
          s.stage?.name || '',
          `${slot.start}-${slot.end}`,
          s.speaker_name,
          attendees.length.toString(),
          attendees.map((a: any) => a.name).join('; '),
        ];
      });

      const csv = [
        headers.join(','),
        ...(rows?.map((r) => r.map((c) => `"${c}"`).join(',')) || []),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename=registracie.csv',
        },
      });
    }

    return NextResponse.json({ error: 'Neznamy typ exportu' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}
