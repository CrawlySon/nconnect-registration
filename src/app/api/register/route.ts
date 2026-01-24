import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, name, company } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email a meno sú povinné' },
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
      // Return existing attendee
      return NextResponse.json({
        success: true,
        attendeeId: existing.id,
        message: 'Účet už existuje',
      });
    }

    // Create new attendee
    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert({
        email: email.toLowerCase(),
        name,
        company: company || null,
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
      // Don't fail registration if email fails
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
