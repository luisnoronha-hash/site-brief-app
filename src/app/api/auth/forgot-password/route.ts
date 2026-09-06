import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always respond ok to avoid leaking which emails are registered.
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  const token = randomUUID();
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60) },
  });

  const { subject, body: html } = passwordResetEmail(user.locale, token);
  await sendEmail(user.email, subject, html);

  return NextResponse.json({ ok: true });
}
