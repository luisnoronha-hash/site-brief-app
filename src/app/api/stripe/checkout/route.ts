import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.subscription?.status === "active") {
    return NextResponse.json({ error: "You already have an active subscription." }, { status: 400 });
  }

  let customerId = user.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_SUBSCRIPTION, quantity: 1 }],
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
    success_url: `${appUrl()}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl()}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ checkoutUrl: checkoutSession.url });
}
