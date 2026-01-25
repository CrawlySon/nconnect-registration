import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Raw query to sessions
    const { data, error } = await supabase
      .from('sessions')
      .select('id, title, speaker_name')
      .order('id')
      .limit(3);

    return NextResponse.json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + '...',
      error: error?.message || null,
      firstThreeSessions: data,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
