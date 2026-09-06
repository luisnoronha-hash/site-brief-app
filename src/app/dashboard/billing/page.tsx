import { requireAgent } from "@/lib/session";
import { getRemainingAllowanceSummary } from "@/lib/entitlements";
import { formatDate } from "@/lib/format";
import { SubscribeButton, ManageBillingButton, CancelSubscriptionButton } from "@/components/BillingActions";

export default async function BillingPage() {
  const user = await requireAgent();
  const allowance = await getRemainingAllowanceSummary(user.id);

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-2xl text-navy">Billing</h1>

      <div className="card mt-6">
        <p className="label-field">Free analyses</p>
        <p className="mt-1 text-navy-800">
          {allowance.freeRemaining} of {allowance.freeTotal} remaining
        </p>
      </div>

      <div className="card mt-4">
        {allowance.hasActiveSubscription ? (
          <>
            <p className="label-field">Subscription</p>
            <p className="mt-1 text-navy-800">
              {allowance.allowanceRemaining} of {allowance.allowanceTotal} included analyses remaining this
              period
            </p>
            {allowance.currentPeriodEnd && (
              <p className="mt-1 text-sm text-graystone">
                Renews {formatDate(allowance.currentPeriodEnd)}
              </p>
            )}
            <p className="mt-1 text-sm text-graystone">
              Additional analyses this period are billed at the overage rate.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <ManageBillingButton />
              <CancelSubscriptionButton />
            </div>
          </>
        ) : (
          <>
            <p className="label-field">No active subscription</p>
            <p className="mt-1 text-sm text-navy-600">
              Subscribe for $99/month to include analyses every period, or continue paying per analysis at
              the single-analysis rate.
            </p>
            <div className="mt-4">
              <SubscribeButton />
            </div>
          </>
        )}
      </div>

      <div className="card mt-4">
        <p className="label-field">Invoices &amp; payment method</p>
        <p className="mt-1 text-sm text-navy-600">Manage your card and download past invoices via Stripe.</p>
        <div className="mt-4">
          <ManageBillingButton />
        </div>
      </div>
    </div>
  );
}
