import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer, putObject, buildObjectKey } from "@/lib/s3";
import { generateBrandedReport } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";
import { reportDeliveredEmail } from "@/lib/email-templates";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: { include: { brokerProfile: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const profile = order.user.brokerProfile;
  if (!profile) {
    return NextResponse.json({ error: "This agent has no broker profile on file." }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Upload a PDF file." }, { status: 400 });
  }

  const analysisPdfBytes = Buffer.from(await file.arrayBuffer());

  const [headshotBytes, logoBytes] = await Promise.all([
    profile.headshotKey ? getObjectBuffer(profile.headshotKey).catch(() => null) : Promise.resolve(null),
    profile.logoKey ? getObjectBuffer(profile.logoKey).catch(() => null) : Promise.resolve(null),
  ]);

  const merged = await generateBrandedReport({
    address: order.address,
    agentName: profile.fullName,
    licenseNumber: profile.licenseNumber,
    brokerage: profile.brokerage,
    brokeragePhone: profile.phone,
    brokerageEmail: profile.email,
    brokerageWebsite: profile.website,
    headshotBytes,
    logoBytes,
    analysisPdfBytes,
  });

  const key = buildObjectKey(`deliverables/${order.id}`, "development-analysis.pdf");
  await putObject(key, merged, "application/pdf");

  await prisma.$transaction([
    prisma.orderFile.create({
      data: { orderId: order.id, key, filename: "development-analysis.pdf", kind: "deliverable" },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: "delivered", deliveredAt: new Date() },
    }),
  ]);

  const { subject, body: html } = reportDeliveredEmail(order.user.locale, order.address);
  await sendEmail(order.user.email, subject, html);

  return NextResponse.json({ ok: true });
}
