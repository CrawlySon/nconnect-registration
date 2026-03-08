import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'registrations';

    const supabase = createServerClient();

    if (type === 'feedback') {
      return await exportFeedback(supabase);
    }

    return await exportRegistrations(supabase);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export zlyhal' },
      { status: 500 }
    );
  }
}

async function exportRegistrations(supabase: ReturnType<typeof createServerClient>) {
  // Get all registrations with attendee and session info
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      registered_at,
      attendee:attendees(name, email, company),
      session:sessions(title, speaker_name, start_time, end_time, stage:stages(name))
    `)
    .order('registered_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Create CSV content
  const headers = ['Meno', 'Email', 'Firma/Škola', 'Prednáška', 'Speaker', 'Stage', 'Čas', 'Dátum registrácie'];

  const rows = (registrations || []).map(reg => {
    const attendee = reg.attendee as any;
    const session = reg.session as any;
    return [
      attendee?.name || '',
      attendee?.email || '',
      attendee?.company || '',
      session?.title || '',
      session?.speaker_name || '',
      session?.stage?.name || '',
      `${session?.start_time || ''} - ${session?.end_time || ''}`,
      new Date(reg.registered_at).toLocaleString('sk-SK'),
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="nconnect26-registrations-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

async function exportFeedback(supabase: ReturnType<typeof createServerClient>) {
  // Get all feedback with attendee and session info
  const { data: feedbacks, error } = await supabase
    .from('session_feedback')
    .select(`
      rating,
      comment,
      created_at,
      attendee:attendees(name, email, company),
      session:sessions(title, speaker_name, stage:stages(name))
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Create CSV content
  const headers = ['Meno', 'Email', 'Firma/Škola', 'Prednáška', 'Speaker', 'Stage', 'Hodnotenie (1-5)', 'Komentár', 'Dátum hodnotenia'];

  const rows = (feedbacks || []).map(fb => {
    const attendee = fb.attendee as any;
    const session = fb.session as any;
    return [
      attendee?.name || '',
      attendee?.email || '',
      attendee?.company || '',
      session?.title || '',
      session?.speaker_name || '',
      session?.stage?.name || '',
      fb.rating,
      fb.comment || '',
      new Date(fb.created_at).toLocaleString('sk-SK'),
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="nconnect26-feedback-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
