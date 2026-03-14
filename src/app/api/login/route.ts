import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyPassword } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email a heslo sú povinné' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Neplatný formát emailovej adresy' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: attendee, error } = await supabase
      .from('attendees')
      .select('id, name, email, password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !attendee) {
      return NextResponse.json(
        { error: 'Nesprávny email alebo heslo.' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, attendee.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Nesprávny email alebo heslo.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      attendeeId: attendee.id,
      message: 'Prihlásenie úspešné',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
