import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email a heslo su povinne' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Find attendee by email
    const { data: attendee, error } = await supabase
      .from('attendees')
      .select('id, password_hash, name')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !attendee) {
      return NextResponse.json(
        { error: 'Nespravny email alebo heslo' },
        { status: 401 }
      );
    }

    // Verify password
    if (!verifyPassword(password.toUpperCase(), attendee.password_hash)) {
      return NextResponse.json(
        { error: 'Nespravny email alebo heslo' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      attendeeId: attendee.id,
      name: attendee.name,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Prihlasenie zlyhalo' },
      { status: 500 }
    );
  }
}
