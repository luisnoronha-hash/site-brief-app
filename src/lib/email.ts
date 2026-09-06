import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, html: string) {
  const from = process.env.EMAIL_FROM ?? "Site Brief <no-reply@site-brief.com>";

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send to ${to}: ${subject}`);
    return { skipped: true };
  }

  return resend.emails.send({ from, to, subject, html });
}

export async function sendAdminEmail(subject: string, html: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return { skipped: true };
  return sendEmail(adminEmail, subject, html);
}
