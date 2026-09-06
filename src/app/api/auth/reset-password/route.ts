import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Claim the token and update the password in one transaction: if two requests race
  // on the same token, the loser's deleteMany affects zero rows, and Postgres
  // read-committed guarantees that by then the winner's transaction has committed.
  await prisma.$transaction(async (tx) => {
    const deleted = await tx.passwordResetToken.deleteMany({ where: { token } });
    if (deleted.count === 0) return;
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
  });

  return NextResponse.json({ ok: true });
}
