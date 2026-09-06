import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "This verification link has expired." }, { status: 400 });
  }

  // Claim the token and verify the user in one transaction: if two requests race on
  // the same token (double-click, link prefetch, a retried request), the loser's
  // deleteMany affects zero rows, and Postgres read-committed guarantees that by then
  // the winner's transaction — delete and user update together — has already committed.
  await prisma.$transaction(async (tx) => {
    const deleted = await tx.verificationToken.deleteMany({ where: { token } });
    if (deleted.count === 0) return;
    await tx.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } });
  });

  return NextResponse.json({ ok: true });
}
