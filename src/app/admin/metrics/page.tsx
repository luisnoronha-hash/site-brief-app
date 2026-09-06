import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";

export default async function AdminMetricsPage() {
  const [totalSignups, activeSubscriptions, ordersWithPayment, totalOrders, revenueAgg, recentOrders] =
    await Promise.all([
      prisma.user.count({ where: { role: "agent" } }),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.order.groupBy({ by: ["userId"], where: { paymentMethod: "one_off" } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { priceCents: true } }),
      prisma.order.findMany({
        orderBy: { submittedAt: "desc" },
        take: 200,
        select: { submittedAt: true, priceCents: true },
      }),
    ]);

  const paidUserIds = new Set(ordersWithPayment.map((o) => o.userId));
  const subscriptionUserCount = await prisma.subscription.count({
    where: { status: { in: ["active", "past_due"] } },
  });
  const conversion = totalSignups > 0 ? ((paidUserIds.size + subscriptionUserCount) / totalSignups) * 100 : 0;

  const byMonth = new Map<string, { count: number; revenue: number }>();
  for (const order of recentOrders) {
    const key = `${order.submittedAt.getFullYear()}-${String(order.submittedAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = byMonth.get(key) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += order.priceCents;
    byMonth.set(key, entry);
  }
  const months = Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 6);

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Metrics</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="label-field">Signups</p>
          <p className="mt-2 font-serif text-3xl text-navy">{totalSignups}</p>
        </div>
        <div className="card">
          <p className="label-field">Active subscriptions</p>
          <p className="mt-2 font-serif text-3xl text-navy">{activeSubscriptions}</p>
        </div>
        <div className="card">
          <p className="label-field">Conversion to paid</p>
          <p className="mt-2 font-serif text-3xl text-navy">{conversion.toFixed(1)}%</p>
        </div>
        <div className="card">
          <p className="label-field">Total revenue</p>
          <p className="mt-2 font-serif text-3xl text-navy">{formatCents(revenueAgg._sum.priceCents ?? 0)}</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="label-field">Orders by month ({totalOrders} total)</p>
        <div className="mt-3 overflow-x-auto border border-sand-400 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sand-400 bg-sand-100 text-xs uppercase tracking-wide text-graystone">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {months.map(([month, data]) => (
                <tr key={month} className="border-b border-sand-400 last:border-0">
                  <td className="px-4 py-3 text-navy-800">{month}</td>
                  <td className="px-4 py-3 text-navy-600">{data.count}</td>
                  <td className="px-4 py-3 text-navy-600">{formatCents(data.revenue)}</td>
                </tr>
              ))}
              {months.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-navy-600">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
