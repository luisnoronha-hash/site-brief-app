import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { orderInProgressEmail } from "@/lib/email-templates";

const ALLOWED_STATUSES = ["submitted", "in_progress", "on_hold", "cancelled"] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Use the deliverable upload endpoint to mark an order delivered." },
      { status: 400 }
    );
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status },
    include: { user: true },
  });

  if (status === "in_progress") {
    const { subject, body: html } = orderInProgressEmail(order.user.locale, order.address);
    await sendEmail(order.user.email, subject, html);
  }

  return NextResponse.json({ ok: true, order });
}
