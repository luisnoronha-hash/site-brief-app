import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  orderReceivedEmail,
  orderReceivedAdminNotice,
  paymentSucceededEmail,
  paymentFailedEmail,
  subscriptionCancelledEmail,
} from "@/lib/email-templates";
import { sendAdminEmail } from "@/lib/email";
import { formatCents } from "@/lib/format";

export const runtime = "nodejs";

function toDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000);
}

async function upsertSubscriptionFromStripe(
  userId: string,
  stripeCustomerId: string,
  stripeSub: Stripe.Subscription
) {
  const currentPeriodStart = toDate(stripeSub.current_period_start);
  const currentPeriodEnd = toDate(stripeSub.current_period_end);
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeCustomerId,
      stripeSubscriptionId: stripeSub.id,
      status: stripeSub.status as never,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    create: {
      userId,
      stripeCustomerId,
      stripeSubscriptionId: stripeSub.id,
      status: stripeSub.status as never,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      allowanceUsed: 0,
    },
  });
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "payment" && session.metadata?.orderId) {
        const order = await prisma.order.update({
          where: { id: session.metadata.orderId },
          data: { stripePaymentIntentId: (session.payment_intent as string) ?? null },
          include: { user: true },
        });

        const { subject, body: html } = orderReceivedEmail(order.user.locale, order.address);
        await sendEmail(order.user.email, subject, html);
        const paidSubject = paymentSucceededEmail(order.user.locale, formatCents(order.priceCents));
        await sendEmail(order.user.email, paidSubject.subject, paidSubject.body);
        const adminNotice = orderReceivedAdminNotice(order.address, order.user.email);
        await sendAdminEmail(adminNotice.subject, adminNotice.body);
      }

      if (session.mode === "subscription" && session.metadata?.userId && session.subscription) {
        const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertSubscriptionFromStripe(
          session.metadata.userId,
          session.customer as string,
          stripeSub
        );
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = stripeSub.metadata?.userId;
        if (userId) {
          await upsertSubscriptionFromStripe(userId, invoice.customer as string, stripeSub);
          // New billing period starts: reset the included-analyses allowance.
          await prisma.subscription.update({ where: { userId }, data: { allowanceUsed: 0 } });

          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            const { subject, body: html } = paymentSucceededEmail(
              user.locale,
              formatCents(invoice.amount_paid)
            );
            await sendEmail(user.email, subject, html);
          }
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = stripeSub.metadata?.userId;
        if (userId) {
          await prisma.subscription.updateMany({
            where: { userId },
            data: { status: "past_due" },
          });
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            const { subject, body: html } = paymentFailedEmail(user.locale);
            await sendEmail(user.email, subject, html);
          }
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.userId;
      if (userId) {
        await upsertSubscriptionFromStripe(userId, stripeSub.customer as string, stripeSub);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.userId;
      if (userId) {
        await prisma.subscription.updateMany({
          where: { userId },
          data: { status: "canceled", cancelAtPeriodEnd: false },
        });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const { subject, body: html } = subscriptionCancelledEmail(user.locale);
          await sendEmail(user.email, subject, html);
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
