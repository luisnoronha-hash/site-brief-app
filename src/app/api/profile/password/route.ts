import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_LENGTH = 8;

/**
 * Change the signed-in user's password. Works for admins and agents alike.
 * Accounts that signed up with Google have no password yet; for those the
 * current password is not required and this call simply sets one.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < MIN_LENGTH) {
    return NextResponse.json(
      { error: `New password must be at least ${MIN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.passwordHash) {
    const ok = currentPassword.length > 0 && (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from the current one." },
        { status: 400 },
      );
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Any outstanding reset links are now stale.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ ok: true });
}
