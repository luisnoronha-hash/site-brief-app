import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brokerProfileSchema } from "@/lib/validations";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = brokerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const profile = await prisma.brokerProfile.upsert({
    where: { userId: session.user.id },
    update: {
      fullName: data.fullName,
      licenseNumber: data.licenseNumber,
      brokerage: data.brokerage,
      officeAddress: data.officeAddress,
      phone: data.phone,
      email: data.email,
      website: data.website || null,
      reportLanguage: data.reportLanguage,
      ...(data.headshotKey !== undefined ? { headshotKey: data.headshotKey } : {}),
      ...(data.logoKey !== undefined ? { logoKey: data.logoKey } : {}),
    },
    create: {
      userId: session.user.id,
      fullName: data.fullName,
      licenseNumber: data.licenseNumber,
      brokerage: data.brokerage,
      officeAddress: data.officeAddress,
      phone: data.phone,
      email: data.email,
      website: data.website || null,
      reportLanguage: data.reportLanguage,
      headshotKey: data.headshotKey ?? null,
      logoKey: data.logoKey ?? null,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { locale: data.reportLanguage },
  });

  return NextResponse.json({ ok: true, profile });
}
