import { NextResponse } from 'next/server';
import { isEmailConfigured, sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isEmailConfigured();

  return NextResponse.json({
    configured,
    message: configured
      ? 'Email je nakonfigurovany a pripraveny na odosielanie'
      : 'Email nie je nakonfigurovany - chyba RESEND_API_KEY',
    instructions: configured ? null : [
      '1. Vytvor ucet na https://resend.com',
      '2. Pridaj a over domenu nconnect.sk',
      '3. Nastav RESEND_API_KEY v .env.local',
      '4. Restartuj aplikaciu',
    ],
  });
}

export async function POST(request: Request) {
  try {
    const { to, name } = await request.json();

    if (!to || !name) {
      return NextResponse.json(
        { error: 'Chyba email a meno' },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      attendeeName: name,
      type: 'registration',
      sessions: [],
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        skipped: (result as any).skipped || false,
      }, { status: result.error === 'Email not configured' ? 503 : 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Testovaci email bol odoslany na ${to}`,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Odoslanie zlyhalo' },
      { status: 500 }
    );
  }
}
