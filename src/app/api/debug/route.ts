import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const attendeeId = searchParams.get('attendee') || '77e37a90-11fe-4371-8f29-d8a0df3b7ed3';

  const supabase = createServerClient();

  // Test 1: Get all attendee_sessions for this user
  const { data: allSessions, error: error1 } = await supabase
    .from('attendee_sessions')
    .select('*')
    .eq('attendee_id', attendeeId);

  // Test 2: Get only registered ones
  const { data: registeredOnly, error: error2 } = await supabase
    .from('attendee_sessions')
    .select('*')
    .eq('attendee_id', attendeeId)
    .eq('is_registered', true);

  // Test 3: Get all with is_registered = true (any user)
  const { data: allRegistered, error: error3 } = await supabase
    .from('attendee_sessions')
    .select('session_id')
    .eq('is_registered', true);

  return NextResponse.json({
    attendeeId,
    test1_allForUser: {
      count: allSessions?.length || 0,
      error: error1?.message || null,
      data: allSessions?.slice(0, 3),
    },
    test2_registeredForUser: {
      count: registeredOnly?.length || 0,
      error: error2?.message || null,
      data: registeredOnly,
    },
    test3_allRegisteredAnyUser: {
      count: allRegistered?.length || 0,
      error: error3?.message || null,
    },
  });
}
