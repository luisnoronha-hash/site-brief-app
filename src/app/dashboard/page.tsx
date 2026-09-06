import Link from "next/link";
import { requireAgent } from "@/lib/session";
import { getRemainingAllowanceSummary } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { formatDate, PROPERTY_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireAgent();
  const [allowance, orders] = await Promise.all([
    getRemainingAllowanceSummary(user.id),
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { submittedAt: "desc" } }),
  ]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 border-b border-sand-400 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl text-navy">Your orders</h1>
          <p className="mt-1 text-sm text-graystone">
            {allowance.freeRemaining > 0
              ? `${allowance.freeRemaining} of ${allowance.freeTotal} free analyses remaining`
              : allowance.hasActiveSubscription
                ? `${allowance.allowanceRemaining} of ${allowance.allowanceTotal} included analyses remaining this period`
                : "No free analyses or subscription allowance remaining"}
          </p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">
          New order
        </Link>
      </div>

      <div className="mt-8">
        {orders.length === 0 ? (
          <div className="card text-center">
            <p className="text-sm text-navy-600">You haven&rsquo;t submitted an order yet.</p>
            <Link href="/dashboard/new" className="btn-primary mt-4 inline-flex">
              Submit your first order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border border-sand-400 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-sand-400 bg-sand-100 text-xs uppercase tracking-wide text-graystone">
                <tr>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-sand-400 last:border-0">
                    <td className="px-4 py-3 text-navy-800">{order.address}</td>
                    <td className="px-4 py-3 text-navy-600">{PROPERTY_TYPE_LABELS[order.propertyType]}</td>
                    <td className="px-4 py-3 text-navy-600">{formatDate(order.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-sm text-navy underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
