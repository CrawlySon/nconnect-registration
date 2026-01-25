import { Resend } from 'resend';
import { Session } from '@/types';
import { TIME_SLOTS } from './constants';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = 'nConnect <noreply@nconnect.sk>';

interface SendEmailParams {
  to: string;
  attendeeName: string;
  type: 'registration' | 'sessions_updated';
  sessions: Session[];
  attendeeId: string;
}

export async function sendEmail({ to, attendeeName, type, sessions, attendeeId }: SendEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const sessionsUrl = `${appUrl}/sessions?attendee=${attendeeId}`;

  const subject = type === 'registration'
    ? 'Vitaj na nConnect26!'
    : 'Tvoje prednasky na nConnect26';

  const heading = type === 'registration'
    ? 'Registracia uspesna'
    : 'Aktualizacia prednasok';

  const message = type === 'registration'
    ? 'Dakujeme za registraciu na IT konferenciu nConnect26! Teraz si mozes vybrat prednasky.'
    : 'Tu je aktualny prehlad tvojich vybranych prednasok.';

  const sortedSessions = [...sessions].sort((a, b) => a.slot_index - b.slot_index);

  const sessionsHtml = sortedSessions.length > 0
    ? sortedSessions.map(session => {
        const slot = TIME_SLOTS[session.slot_index];
        return `
          <div style="background: #f8fafc; border-left: 4px solid ${session.stage?.color || '#FF6B35'}; padding: 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0;">
            <div style="color: #64748B; font-size: 14px; margin-bottom: 8px;">
              ${slot.start} - ${slot.end} | ${session.stage?.name || 'Stage'}
            </div>
            <div style="font-weight: bold; color: #0A1628; margin-bottom: 4px;">${session.title}</div>
            <div style="color: #64748B; font-size: 14px;">${session.speaker_name}${session.speaker_company ? ` - ${session.speaker_company}` : ''}</div>
          </div>
        `;
      }).join('')
    : '<p style="color: #64748B;">Zatial nemas vybrane ziadne prednasky.</p>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0A1628; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: #00D4FF; margin: 0; font-size: 28px;">nConnect<span style="color: #FF6B35;">26</span></h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">26. marca 2026 | Studentske centrum UKF Nitra</p>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #0A1628; margin: 0 0 16px 0;">${heading}</h2>
          <p style="color: #374151;">Ahoj <strong>${attendeeName}</strong>,</p>
          <p style="color: #374151;">${message}</p>

          <h3 style="color: #0A1628; margin: 24px 0 16px 0;">Tvoje prednasky</h3>
          ${sessionsHtml}

          <div style="text-align: center; margin-top: 32px;">
            <a href="${sessionsUrl}" style="background: linear-gradient(135deg, #FF6B35 0%, #f97316 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Spravovat prednasky
            </a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 24px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #64748B; font-size: 14px; margin: 0;">
            © nConnect26 | <a href="mailto:info@nconnect.sk" style="color: #00D4FF;">info@nconnect.sk</a>
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const resendClient = getResend();

    if (!resendClient) {
      console.log('[EMAIL] Resend not configured');
      return { success: false, skipped: true };
    }

    const { data, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('[EMAIL] Error:', error);
      return { success: false, error };
    }

    console.log(`[EMAIL] Sent to ${to}`);
    return { success: true, data };
  } catch (error) {
    console.error('[EMAIL] Exception:', error);
    return { success: false, error };
  }
}
