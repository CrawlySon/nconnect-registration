import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { TOTAL_SESSIONS } from '@/lib/constants';

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
      return NextResponse.json({
        success: true,
        attendeeId: existing.id,
        message: 'Ucet uz existuje',
        isExisting: true,
      });
    }

    // Create new attendee
    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert({
        email: email.toLowerCase(),
        name,
        attendee_type,
        school_or_company: school_or_company || null,
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

    await supabase.from('attendee_sessions').insert(attendeeSessions);

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        attendeeName: name,
        type: 'registration',
        sessions: [],
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
