import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderSchema, isProfileComplete } from "@/lib/validations";
import { determineEntitlement } from "@/lib/entitlements";
import { stripe } from "@/lib/stripe";
import { sendEmail, sendAdminEmail } from "@/lib/email";
import { orderReceivedEmail, orderReceivedAdminNotice } from "@/lib/email-templates";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { submittedAt: "desc" },
    include: { files: true },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { brokerProfile: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.emailVerified) {
    return NextResponse.json({ error: "Verify your email before ordering an analysis." }, { status: 403 });
  }
  if (!isProfileComplete(user.brokerProfile)) {
    return NextResponse.json(
      { error: "Complete your broker profile before submitting an order." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const decision = await determineEntitlement(user.id, data.deadlineTier);

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      address: data.address,
      placeId: data.placeId || null,
      propertyType: data.propertyType,
      askingPrice: data.askingPrice,
      relationship: data.relationship,
      deadlineTier: data.deadlineTier,
      mlsNumber: data.mlsNumber || null,
      folio: data.folio || null,
      notes: data.notes || null,
      status: "submitted",
      priceCents: decision.totalCents,
      paymentMethod: decision.paymentMethod,
      files: {
        create: data.fileKeys.map((f) => ({ key: f.key, filename: f.filename, kind: "upload" as const })),
      },
    },
  });

  if (decision.paymentMethod === "subscription") {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { allowanceUsed: { increment: 1 } },
    });
  }

  if (decision.requiresPayment) {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: decision.totalCents,
            product_data: {
              name: `Development potential analysis — ${data.address}`,
              description: decision.reason,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: order.id, userId: user.id },
      success_url: `${appUrl()}/dashboard/orders/${order.id}?checkout=success`,
      cancel_url: `${appUrl()}/dashboard/new?checkout=cancelled`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: checkoutSession.id },
    });

    return NextResponse.json({ orderId: order.id, checkoutUrl: checkoutSession.url });
  }

  const { subject, body: html } = orderReceivedEmail(user.locale, data.address);
  await sendEmail(user.email, subject, html);
  const adminNotice = orderReceivedAdminNotice(data.address, user.email);
  await sendAdminEmail(adminNotice.subject, adminNotice.body);

  return NextResponse.json({ orderId: order.id, checkoutUrl: null });
}
