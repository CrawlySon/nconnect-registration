import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface SessionUpdate {
  id: string;
  title: string;
  speaker_name: string;
  speaker_company: string | null;
  capacity: number;
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { sessions }: { sessions: SessionUpdate[] } = await request.json();

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json(
        { error: 'Ziadne data na aktualizaciu' },
        { status: 400 }
      );
    }

    // Update each session
    const results = await Promise.all(
      sessions.map(async (session) => {
        const { data, error } = await supabase
          .from('sessions')
          .update({
            title: session.title,
            speaker_name: session.speaker_name,
            speaker_company: session.speaker_company || null,
            capacity: session.capacity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.id)
          .select()
          .single();

        if (error) {
          console.error(`Error updating session ${session.id}:`, error);
          return { id: session.id, success: false, error: error.message };
        }

        return { id: session.id, success: true, data };
      })
    );

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Nepodarilo sa aktualizovat ${failed.length} prednasok`,
        details: failed,
        updated: results.filter(r => r.success).length,
      }, { status: 207 });
    }

    return NextResponse.json({
      success: true,
      message: `Uspesne aktualizovanych ${sessions.length} prednasok`,
      updated: sessions.length,
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}
