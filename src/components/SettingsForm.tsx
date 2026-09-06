"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Fields = {
  freeAnalysesCount: string;
  monthlyAllowance: string;
  overagePriceCents: string;
  oneOffPriceCents: string;
  subscriptionPriceCents: string;
  rushSurchargeCents: string;
};

export function SettingsForm({ initial }: { initial: Fields }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof Fields>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-xl space-y-4">
      <div>
        <label className="label-field">Free analyses per account (lifetime)</label>
        <input
          type="number"
          min={0}
          className="input-field"
          value={form.freeAnalysesCount}
          onChange={(e) => update("freeAnalysesCount", e.target.value)}
        />
      </div>
      <div>
        <label className="label-field">Monthly allowance included in subscription</label>
        <input
          type="number"
          min={0}
          className="input-field"
          value={form.monthlyAllowance}
          onChange={(e) => update("monthlyAllowance", e.target.value)}
        />
      </div>
      <div>
        <label className="label-field">Overage price (cents, beyond monthly allowance)</label>
        <input
          type="number"
          min={0}
          className="input-field"
          value={form.overagePriceCents}
          onChange={(e) => update("overagePriceCents", e.target.value)}
        />
      </div>
      <div>
        <label className="label-field">Single analysis price — no subscription (cents)</label>
        <input
          type="number"
          min={0}
          className="input-field"
          value={form.oneOffPriceCents}
          onChange={(e) => update("oneOffPriceCents", e.target.value)}
        />
      </div>
      <div>
        <label className="label-field">Subscription price (cents / month, informational)</label>
        <input
          type="number"
          min={0}
          className="input-field"
          value={form.subscriptionPriceCents}
          onChange={(e) => update("subscriptionPriceCents", e.target.value)}
        />
        <p className="mt-1 text-xs text-graystone">
          The actual charge amount is controlled by the Stripe Price configured in STRIPE_PRICE_SUBSCRIPTION.
        </p>
      </div>
      <div>
        <label className="label-field">Rush (24h) surcharge (cents)</label>
        <input
          type="number"
          min={0}
          className="input-field"
          value={form.rushSurchargeCents}
          onChange={(e) => update("rushSurchargeCents", e.target.value)}
        />
      </div>

      {saved && <p className="text-sm text-emerald-700">Settings saved.</p>}
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
