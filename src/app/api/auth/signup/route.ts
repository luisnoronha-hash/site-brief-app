import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { verificationEmail } from "@/lib/email-templates";
import { appUrl } from "@/lib/app-url";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  const token = randomUUID();
  await prisma.verificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  const { subject, body: html } = verificationEmail(user.locale, token);
  await sendEmail(user.email, subject, html);

  // Without a mail provider the confirmation link is never delivered, which
  // leaves a brand-new account permanently unable to sign in. Hand the link
  // back so the signup still completes; once RESEND_API_KEY is set this branch
  // stops firing and the link only ever travels by email.
  if (!isEmailConfigured()) {
    return NextResponse.json({ ok: true, verifyUrl: `${appUrl()}/verify?token=${token}` });
  }

  return NextResponse.json({ ok: true });
}
