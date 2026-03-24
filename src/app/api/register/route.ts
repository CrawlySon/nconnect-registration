import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { hashPassword } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Registration deadline: 25.3.2026 (closed from this date)
    const REGISTRATION_DEADLINE = new Date('2026-03-25T00:00:00+01:00');
    if (new Date() >= REGISTRATION_DEADLINE) {
      return NextResponse.json(
        { error: 'Registrácia je uzatvorená. Uvidíme sa na konferencii!' },
        { status: 403 }
      );
    }

    const { email, name, company, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, meno a heslo sú povinné' },
        { status: 400 }
      );
    }

    // Server-side email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Neplatný formát emailovej adresy' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Heslo musí mať aspoň 6 znakov' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if attendee already exists
    const { data: existing } = await supabase
      .from('attendees')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Tento email je už zaregistrovaný. Použi prihlásenie.', alreadyExists: true },
        { status: 409 }
      );
    }

    // Hash password and create attendee
    const passwordHash = await hashPassword(password);
    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert({
        email: email.toLowerCase(),
        name,
        company: company || null,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { error: 'Registrácia zlyhala. Skús to znova.' },
        { status: 500 }
      );
    }

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        attendeeName: name,
        type: 'registration',
        sessions: [],
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return NextResponse.json({
      success: true,
      attendeeId: attendee.id,
      message: 'Registrácia úspešná',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Interná chyba servera' },
      { status: 500 }
    );
  }
}
