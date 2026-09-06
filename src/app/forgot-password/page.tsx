"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="container-content flex min-h-[60vh] items-center justify-center py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-2xl text-navy">Reset your password</h1>
          {sent ? (
            <p className="mt-6 text-sm text-navy-600">
              If an account exists for that email, we&rsquo;ve sent a reset link.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label-field">Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
