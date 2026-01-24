import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email je povinný' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Find attendee by email
    const { data: attendee, error } = await supabase
      .from('attendees')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !attendee) {
      return NextResponse.json(
        { error: 'Účet s týmto emailom neexistuje. Zaregistruj sa najprv.' },
        { status: 404 }
      );
    }

    // For simplicity, we'll do direct login without magic link
    // In production, you'd send a magic link email here
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
