import Link from "next/link";
import { requireAgent } from "@/lib/session";
import { isProfileComplete } from "@/lib/validations";
import { getRemainingAllowanceSummary } from "@/lib/entitlements";
import { OrderForm } from "@/components/OrderForm";

export default async function NewOrderPage() {
  const user = await requireAgent();

  if (!isProfileComplete(user.brokerProfile)) {
    return (
      <div className="max-w-lg">
        <h1 className="font-serif text-2xl text-navy">Complete your profile first</h1>
        <p className="mt-3 text-sm text-navy-600">
          Your broker profile appears on every report. Finish it before submitting an order.
        </p>
        <Link href="/dashboard/profile" className="btn-primary mt-6 inline-flex">
          Complete profile
        </Link>
      </div>
    );
  }

  const allowance = await getRemainingAllowanceSummary(user.id);

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">New order</h1>
      <p className="mt-1 text-sm text-graystone">
        {allowance.freeRemaining > 0
          ? `You have ${allowance.freeRemaining} free ${allowance.freeRemaining === 1 ? "analysis" : "analyses"} remaining.`
          : allowance.hasActiveSubscription
            ? `You have ${allowance.allowanceRemaining} of ${allowance.allowanceTotal} included analyses remaining this period.`
            : "This order will be billed at the single-analysis rate."}
      </p>
      <div className="mt-8">
        <OrderForm />
      </div>
    </div>
  );
}
