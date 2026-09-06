"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  userId: string;
  currentStatus: string;
  hasPaymentIntent: boolean;
};

export function AdminOrderActions({ orderId, userId, currentStatus, hasPaymentIntent }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function updateStatus(newStatus: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Could not update status.");
        return;
      }
      setStatus(newStatus);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function uploadDeliverable(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/orders/${orderId}/deliverable`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Upload failed.");
        return;
      }
      setMessage("Report delivered.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function runOverride(action: string, extra: Record<string, unknown> = {}) {
    if (action === "refund_order" && !confirm("Refund this order's payment via Stripe?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, orderId, userId, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Action failed.");
        return;
      }
      setMessage("Done.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="label-field">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["submitted", "in_progress", "on_hold", "cancelled"].map((s) => (
            <button
              key={s}
              disabled={busy || status === s}
              onClick={() => updateStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wide ${
                status === s ? "bg-navy text-sand-100" : "border border-sand-400 hover:border-navy"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="label-field">Upload finished report</p>
        <p className="mt-1 text-xs text-graystone">
          Upload the analysis PDF — LANA will merge it with the agent&rsquo;s branded cover, header/footer,
          and disclaimer page, then mark the order delivered and email the agent.
        </p>
        <form onSubmit={uploadDeliverable} className="mt-3 flex items-center gap-3">
          <input ref={fileRef} type="file" accept="application/pdf" className="text-sm" />
          <button type="submit" disabled={busy} className="btn-primary text-xs">
            Upload &amp; deliver
          </button>
        </form>
      </div>

      <div className="card">
        <p className="label-field">Overrides</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={() => runOverride("comp_order")}
            className="btn-secondary text-xs"
          >
            Comp this order
          </button>
          <button
            disabled={busy || !hasPaymentIntent}
            onClick={() => runOverride("refund_order")}
            className="btn-secondary text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            Refund payment
          </button>
          <button
            disabled={busy}
            onClick={() => runOverride("grant_free_credit", { amount: 1 })}
            className="btn-secondary text-xs"
          >
            Grant agent +1 free credit
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-navy-700">{message}</p>}
    </div>
  );
}
