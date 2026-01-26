import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendRegistrationEmail } from '@/lib/email';
import { TOTAL_SESSIONS } from '@/lib/constants';
import { generatePassword, hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const { email, name, attendee_type, school_or_company } = await request.json();

    if (!email || !name || !attendee_type) {
      return NextResponse.json(
        { error: 'Email, meno a typ ucastnika su povinne' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if already exists
    const { data: existing } = await supabase
      .from('attendees')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Tento email je uz zaregistrovany. Pouzi prihlasenie.' },
        { status: 400 }
      );
    }

    // Generate password
    const plainPassword = generatePassword();
    const passwordHash = hashPassword(plainPassword);

    // Create new attendee
    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert({
        email: email.toLowerCase(),
        name,
        attendee_type,
        school_or_company: school_or_company || null,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { error: 'Registracia zlyhala' },
        { status: 500 }
      );
    }

    // Create 14 attendee_sessions records
    const attendeeSessions = [];
    for (let sessionId = 1; sessionId <= TOTAL_SESSIONS; sessionId++) {
      attendeeSessions.push({
        attendee_id: attendee.id,
        session_id: sessionId,
        is_registered: false,
      });
    }

    const { error: sessionsError } = await supabase
      .from('attendee_sessions')
      .insert(attendeeSessions);

    if (sessionsError) {
      console.error('Failed to create attendee_sessions:', sessionsError);
    }

    // Send welcome email with password
    try {
      await sendRegistrationEmail({
        to: email,
        attendeeName: name,
        password: plainPassword,
        attendeeId: attendee.id,
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      attendeeId: attendee.id,
      message: 'Registracia uspesna',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Interna chyba servera' },
      { status: 500 }
    );
  }
}
