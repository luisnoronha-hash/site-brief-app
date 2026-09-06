"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.[0] ?? data.error ?? "Something went wrong.");
        return;
      }
      setVerifyUrl(typeof data.verifyUrl === "string" ? data.verifyUrl : null);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <>
        <SiteHeader />
        <main className="container-content flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md text-center">
            <h1 className="font-serif text-2xl text-navy">
              {verifyUrl ? "Confirm your email" : "Check your inbox"}
            </h1>
            {verifyUrl ? (
              <>
                <p className="mt-4 text-sm text-navy-600">
                  Email delivery isn&rsquo;t configured on this environment yet, so we can&rsquo;t
                  send the confirmation link to <strong>{email}</strong>. Use this link instead:
                </p>
                <a href={verifyUrl} className="btn-primary mt-6 inline-block">
                  Confirm email
                </a>
              </>
            ) : (
              <p className="mt-4 text-sm text-navy-600">
                We&rsquo;ve sent a confirmation link to <strong>{email}</strong>. Verify your email
                to complete your broker profile and submit your first order.
              </p>
            )}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="container-content flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-2xl text-navy">Create your account</h1>
          <p className="mt-2 text-sm text-graystone">Your first 3 analyses are free.</p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="btn-secondary mt-8 w-full"
            type="button"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-graystone">
            <div className="h-px flex-1 bg-sand-400" />
            or
            <div className="h-px flex-1 bg-sand-400" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <label className="label-field">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-graystone">
            Already have an account?{" "}
            <Link href="/signin" className="text-navy underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
