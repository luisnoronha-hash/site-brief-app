"use client";

import { useState } from "react";

export function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } finally {
      setLoading(false);
    }
  }
  return (
    <button onClick={handleClick} disabled={loading} className="btn-primary">
      {loading ? "Redirecting…" : "Subscribe — $99/mo"}
    </button>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }
  return (
    <button onClick={handleClick} disabled={loading} className="btn-secondary">
      {loading ? "Redirecting…" : "Manage billing"}
    </button>
  );
}

export function CancelSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  async function handleClick() {
    if (!confirm("Cancel your subscription? It will remain active until the end of the current billing period.")) {
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/stripe/cancel", { method: "POST" });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }
  if (done) return <p className="text-sm text-navy-600">Your subscription will end at the period close.</p>;
  return (
    <button onClick={handleClick} disabled={loading} className="text-sm text-graystone underline">
      {loading ? "Cancelling…" : "Cancel subscription"}
    </button>
  );
}
