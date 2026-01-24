import { Resend } from 'resend';
import { Session } from '@/types';

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
  
  switch (type) {
    case 'registration':
      subject = 'Vitaj na nConnect26! 🎉';
      heading = 'Registrácia úspešná';
      message = `Ďakujeme za registráciu na konferenciu nConnect26. Teraz si môžeš vybrať prednášky, ktoré chceš navštíviť.`;
      break;
    case 'session_added':
      subject = `Prihlásenie na prednášku: ${changedSession?.title}`;
      heading = 'Prihlásenie na prednášku';
      message = `Úspešne si sa prihlásil/a na prednášku "${changedSession?.title}".`;
      break;
    case 'session_removed':
      subject = `Odhlásenie z prednášky: ${changedSession?.title}`;
      heading = 'Odhlásenie z prednášky';
      message = `Bol/a si odhlásený/á z prednášky "${changedSession?.title}".`;
      break;
    case 'update':
      subject = 'Aktualizácia tvojich prednášok na nConnect26';
      heading = 'Aktualizácia registrácie';
      message = 'Tvoj výber prednášok bol aktualizovaný.';
      break;
  }
  
  const sessionsHtml = sessions.length > 0 ? `
    <h3 style="color: #1E3A5F; margin-top: 24px;">Tvoje prednášky:</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
      <thead>
        <tr style="background: #0A1628; color: white;">
          <th style="padding: 12px; text-align: left;">Čas</th>
          <th style="padding: 12px; text-align: left;">Prednáška</th>
          <th style="padding: 12px; text-align: left;">Stage</th>
        </tr>
      </thead>
      <tbody>
        ${sessions.map(session => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px;">${session.start_time} - ${session.end_time}</td>
            <td style="padding: 12px;">
              <strong>${session.title}</strong><br/>
              <span style="color: #64748B;">${session.speaker_name}</span>
            </td>
            <td style="padding: 12px;">${session.stage?.name || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color: #64748B;">Zatiaľ nemáš vybrané žiadne prednášky.</p>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0A1628 0%, #1E3A5F 100%); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #00D4FF; margin: 0; font-size: 28px;">nConnect26</h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0;">26. marca 2026 • Študentské centrum UKF Nitra</p>
        </div>
        
        <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #0A1628; margin-top: 0;">${heading}</h2>
          <p>Ahoj ${attendeeName},</p>
          <p>${message}</p>
          
          ${sessionsHtml}
          
          <div style="margin-top: 32px;">
            <a href="${appUrl}" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Spravovať registráciu
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="color: #64748B; font-size: 14px;">
            Ak máš otázky, napíš nám na <a href="mailto:kontakt@nconnect.sk" style="color: #00D4FF;">kontakt@nconnect.sk</a>
          </p>
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
