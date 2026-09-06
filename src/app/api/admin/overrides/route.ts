import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getSettingNumber, setSetting } from "@/lib/settings";

function bonusCreditKey(userId: string) {
  return `bonus_free:${userId}`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "grant_free_credit") {
    const { userId, amount } = body;
    if (!userId || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const current = await getSettingNumber(bonusCreditKey(userId));
    await setSetting(bonusCreditKey(userId), String(current + amount));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "comp_order") {
    const { orderId } = body;
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { priceCents: 0, paymentMethod: "free" },
    });
    return NextResponse.json({ ok: true, order });
  }

  if (body.action === "refund_order") {
    const { orderId } = body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.stripePaymentIntentId) {
      return NextResponse.json({ error: "This order has no associated payment to refund." }, { status: 400 });
    }
    await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
