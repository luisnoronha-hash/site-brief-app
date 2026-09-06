import { prisma } from "@/lib/prisma";
import { getSetting, getSettingNumber, SETTING_KEYS } from "@/lib/settings";
import type { DeadlineTier, PaymentMethod } from "@prisma/client";

/** Admin-granted bonus credits (comp'd on top of the standard free allocation) are stored per user in Setting. */
async function getBonusFreeCredits(userId: string): Promise<number> {
  const value = await getSetting(`bonus_free:${userId}`);
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export type EntitlementDecision = {
  paymentMethod: PaymentMethod;
  baseCents: number;
  rushCents: number;
  totalCents: number;
  requiresPayment: boolean;
  reason: string;
};

function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

/**
 * Free-tier abuse control: the lifetime free allocation is shared across every
 * account that carries the same license number or the same brokerage email
 * domain, not granted fresh per signup.
 */
async function getRelatedUserIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { brokerProfile: true },
  });
  if (!user) return [userId];

  const domain = emailDomain(user.email);
  const license = user.brokerProfile?.licenseNumber;

  const related = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: `@${domain}` } },
        ...(license ? [{ brokerProfile: { licenseNumber: license } }] : []),
      ],
    },
    select: { id: true },
  });

  const ids = new Set(related.map((u) => u.id));
  ids.add(userId);
  return Array.from(ids);
}

async function getFreeAnalysesUsed(userId: string): Promise<number> {
  const userIds = await getRelatedUserIds(userId);
  return prisma.order.count({
    where: {
      userId: { in: userIds },
      paymentMethod: "free",
      status: { not: "cancelled" },
    },
  });
}

export async function determineEntitlement(
  userId: string,
  deadlineTier: DeadlineTier
): Promise<EntitlementDecision> {
  const [freeAnalysesCount, monthlyAllowance, overagePriceCents, oneOffPriceCents, rushSurchargeCents] =
    await Promise.all([
      getSettingNumber(SETTING_KEYS.freeAnalysesCount),
      getSettingNumber(SETTING_KEYS.monthlyAllowance),
      getSettingNumber(SETTING_KEYS.overagePriceCents),
      getSettingNumber(SETTING_KEYS.oneOffPriceCents),
      getSettingNumber(SETTING_KEYS.rushSurchargeCents),
    ]);

  const rushCents = deadlineTier === "rush_24h" ? rushSurchargeCents : 0;

  const bonusCredits = await getBonusFreeCredits(userId);
  const effectiveFreeCount = freeAnalysesCount + bonusCredits;
  const freeUsed = await getFreeAnalysesUsed(userId);
  if (freeUsed < effectiveFreeCount) {
    return {
      paymentMethod: "free",
      baseCents: 0,
      rushCents,
      totalCents: rushCents,
      requiresPayment: rushCents > 0,
      reason: `Free analysis (${freeUsed + 1} of ${effectiveFreeCount})`,
    };
  }

  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (subscription && subscription.status === "active") {
    if (subscription.allowanceUsed < monthlyAllowance) {
      return {
        paymentMethod: "subscription",
        baseCents: 0,
        rushCents,
        totalCents: rushCents,
        requiresPayment: rushCents > 0,
        reason: `Included in subscription (${subscription.allowanceUsed + 1} of ${monthlyAllowance} this period)`,
      };
    }
    return {
      paymentMethod: "one_off",
      baseCents: overagePriceCents,
      rushCents,
      totalCents: overagePriceCents + rushCents,
      requiresPayment: true,
      reason: "Subscription allowance used for this period — overage rate applies",
    };
  }

  return {
    paymentMethod: "one_off",
    baseCents: oneOffPriceCents,
    rushCents,
    totalCents: oneOffPriceCents + rushCents,
    requiresPayment: true,
    reason: "No active subscription — single analysis rate applies",
  };
}

export async function getRemainingAllowanceSummary(userId: string) {
  const [freeAnalysesCount, monthlyAllowance] = await Promise.all([
    getSettingNumber(SETTING_KEYS.freeAnalysesCount),
    getSettingNumber(SETTING_KEYS.monthlyAllowance),
  ]);
  const bonusCredits = await getBonusFreeCredits(userId);
  const effectiveFreeCount = freeAnalysesCount + bonusCredits;
  const freeUsed = await getFreeAnalysesUsed(userId);
  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  return {
    freeRemaining: Math.max(effectiveFreeCount - freeUsed, 0),
    freeTotal: effectiveFreeCount,
    hasActiveSubscription: subscription?.status === "active",
    allowanceRemaining: subscription
      ? Math.max(monthlyAllowance - subscription.allowanceUsed, 0)
      : 0,
    allowanceTotal: monthlyAllowance,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
  };
}
