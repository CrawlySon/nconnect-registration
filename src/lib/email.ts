import { Resend } from 'resend';
import { Session } from '@/types';
import { formatTime } from './utils';

// Lazy initialization to avoid build errors
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
  type: 'registration' | 'session_added' | 'session_removed' | 'update';
  sessions: Session[];
  changedSession?: Session;
}

export async function sendEmail({ to, attendeeName, type, sessions, changedSession }: SendEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let subject = '';
  let heading = '';
  let message = '';
  let emoji = '';

  switch (type) {
    case 'registration':
      subject = 'Vitaj na nConnect26!';
      heading = 'Registrácia úspešná';
      emoji = '🎉';
      message = `Ďakujeme za registráciu na IT konferenciu nConnect26! Teraz si môžeš vybrať prednášky, ktoré chceš navštíviť.`;
      break;
    case 'session_added':
      subject = `Prihlásenie na prednášku: ${changedSession?.title}`;
      heading = 'Prihlásenie potvrdené';
      emoji = '✅';
      message = `Úspešne si sa prihlásil/a na prednášku "<strong>${changedSession?.title}</strong>".`;
      break;
    case 'session_removed':
      subject = `Odhlásenie z prednášky: ${changedSession?.title}`;
      heading = 'Odhlásenie z prednášky';
      emoji = '📝';
      message = `Bol/a si odhlásený/á z prednášky "<strong>${changedSession?.title}</strong>".`;
      break;
    case 'update':
      subject = 'Prehľad tvojich prednášok na nConnect26';
      heading = 'Prehľad registrácie';
      emoji = '📋';
      message = 'Tu je aktuálny prehľad tvojich vybraných prednášok.';
      break;
  }

  // Sort sessions by time
  const sortedSessions = [...sessions].sort((a, b) => a.start_time.localeCompare(b.start_time));

  const sessionsHtml = sortedSessions.length > 0 ? `
    <div style="margin-top: 24px;">
      <h3 style="color: #0A1628; margin-bottom: 16px; font-size: 18px;">📅 Tvoj program na nConnect26</h3>
      ${sortedSessions.map(session => `
        <div style="background: #f8fafc; border-left: 4px solid ${session.stage?.color || '#00D4FF'}; padding: 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="background: ${session.stage?.color || '#00D4FF'}22; color: ${session.stage?.color || '#00D4FF'}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${session.stage?.name || 'Stage'}
            </span>
            <span style="color: #64748B; font-size: 14px; margin-left: 12px;">
              🕐 ${formatTime(session.start_time)} - ${formatTime(session.end_time)}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; color: #0A1628; font-size: 16px;">${session.title}</h4>
          <p style="margin: 0; color: #64748B; font-size: 14px;">
            👤 ${session.speaker_name}${session.speaker_company ? ` • ${session.speaker_company}` : ''}
          </p>
        </div>
      `).join('')}
    </div>
  ` : `
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="margin: 0; color: #92400e;">
        ⚠️ Zatiaľ nemáš vybrané žiadne prednášky. Klikni na tlačidlo nižšie a vyber si z ponuky.
      </p>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f1f5f9;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0A1628 0%, #1E3A5F 100%); padding: 32px; text-align: center;">
            <h1 style="color: #00D4FF; margin: 0; font-size: 32px; font-weight: bold;">nConnect<span style="color: #FF6B35;">26</span></h1>
            <p style="color: #94a3b8; margin: 12px 0 0 0; font-size: 14px;">
              📍 26. marca 2026 • Študentské centrum UKF Nitra
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 48px;">${emoji}</span>
              <h2 style="color: #0A1628; margin: 16px 0 0 0; font-size: 24px;">${heading}</h2>
            </div>

            <p style="font-size: 16px;">Ahoj <strong>${attendeeName}</strong>,</p>
            <p style="font-size: 16px;">${message}</p>

            ${sessionsHtml}

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #f97316 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(255, 107, 53, 0.4);">
                Spravovať prednášky →
              </a>
            </div>

            <!-- Info box -->
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin-top: 32px;">
              <p style="margin: 0; color: #0369a1; font-size: 14px;">
                💡 <strong>Tip:</strong> Môžeš si kedykoľvek zmeniť výber prednášok až do dňa konferencie.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 14px; text-align: center;">
              Máš otázky? Napíš nám na <a href="mailto:info@nconnect.sk" style="color: #00D4FF; text-decoration: none;">info@nconnect.sk</a>
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
              © 2026 nConnect • Fakulta prírodných vied a informatiky UKF Nitra
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const resendClient = getResend();
    
    if (!resendClient) {
      console.log('Resend not configured, skipping email');
      return { success: true, data: null };
    }
    
    const { data, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error };
  }
}
