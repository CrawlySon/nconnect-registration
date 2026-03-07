import { NextResponse } from 'next/server';
import { isEmailConfigured, sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isEmailConfigured();

  return NextResponse.json({
    configured,
    message: configured
      ? 'SMTP email je nakonfigurovaný a pripravený na odosielanie'
      : 'Email nie je nakonfigurovaný - chýbajú SMTP údaje',
    instructions: configured ? null : [
      '1. Nastav SMTP_HOST v .env.local (napr. smtp.m1.websupport.sk)',
      '2. Nastav SMTP_PORT v .env.local (napr. 465)',
      '3. Nastav SMTP_USER v .env.local (napr. registracia@nconnect.sk)',
      '4. Nastav SMTP_PASS v .env.local',
      '5. Reštartuj aplikáciu',
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
