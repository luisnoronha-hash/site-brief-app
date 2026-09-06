import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatDate,
  PROPERTY_TYPE_LABELS,
  DEADLINE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/format";
import type { OrderStatus } from "@prisma/client";

const STATUS_FILTERS: (OrderStatus | "all")[] = [
  "all",
  "submitted",
  "in_progress",
  "delivered",
  "on_hold",
  "cancelled",
];

function deadlineFor(order: { submittedAt: Date; deadlineTier: string }) {
  const hours = order.deadlineTier === "rush_24h" ? 24 : 48;
  return new Date(order.submittedAt.getTime() + hours * 60 * 60 * 1000);
}

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status;
  const activeStatus =
    statusFilter && statusFilter !== "all" ? (statusFilter as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: activeStatus ? { status: activeStatus } : undefined,
    include: { user: { include: { brokerProfile: true } } },
  });

  const sorted = [...orders].sort((a, b) => deadlineFor(a).getTime() - deadlineFor(b).getTime());

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Fulfillment queue</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin" : `/admin?status=${s}`}
            className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wide ${
              (statusFilter ?? "all") === s
                ? "bg-navy text-sand-100"
                : "border border-sand-400 bg-white text-navy-600 hover:border-navy"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto border border-sand-400 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-sand-400 bg-sand-100 text-xs uppercase tracking-wide text-graystone">
            <tr>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((order) => {
              const due = deadlineFor(order);
              const overdue = due < new Date() && !["delivered", "cancelled"].includes(order.status);
              return (
                <tr key={order.id} className="border-b border-sand-400 last:border-0">
                  <td className={`px-4 py-3 ${overdue ? "font-medium text-red-600" : "text-navy-600"}`}>
                    {formatDate(due)}
                  </td>
                  <td className="px-4 py-3 text-navy-800">{order.address}</td>
                  <td className="px-4 py-3 text-navy-600">
                    {order.user.brokerProfile?.fullName ?? order.user.email}
                  </td>
                  <td className="px-4 py-3 text-navy-600">{PROPERTY_TYPE_LABELS[order.propertyType]}</td>
                  <td className="px-4 py-3 text-navy-600">{DEADLINE_LABELS[order.deadlineTier]}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${order.id}`} className="text-sm text-navy underline">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-navy-600">
                  No orders in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
