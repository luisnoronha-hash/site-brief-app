import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { verificationEmail } from "@/lib/email-templates";
import { appUrl } from "@/lib/app-url";

/**
 * Re-issues an email verification link for an existing unverified account.
 *
 * Gated on the account's own password rather than the email address alone:
 * an email-only endpoint would let anyone confirm which addresses have
 * accounts, and let them spray verification mail at those addresses.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  // Drop any outstanding tokens so an old link can't be replayed later.
  await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

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

  if (!isEmailConfigured()) {
    return NextResponse.json({ ok: true, verifyUrl: `${appUrl()}/verify?token=${token}` });
  }

  return NextResponse.json({ ok: true });
}
