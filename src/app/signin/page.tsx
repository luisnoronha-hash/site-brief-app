"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "working" | "sent">("idle");
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setVerifyUrl(null);
    setResendState("idle");
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error === "EMAIL_NOT_VERIFIED") {
        setError("This account still needs its email confirmed before you can sign in.");
        setNeedsVerification(true);
        return;
      }
      if (res?.error) {
        setError("Incorrect email or password.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendState("working");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not resend the link.");
        setResendState("idle");
        return;
      }
      setVerifyUrl(typeof data.verifyUrl === "string" ? data.verifyUrl : null);
      setResendState("sent");
    } catch {
      setError("Could not resend the link.");
      setResendState("idle");
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="container-content flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-2xl text-navy">Sign in</h1>

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
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {needsVerification && resendState !== "sent" && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendState === "working"}
                className="text-sm text-navy underline"
              >
                {resendState === "working" ? "Sending…" : "Send me the confirmation link again"}
              </button>
            )}
            {resendState === "sent" &&
              (verifyUrl ? (
                <div className="rounded border border-sand-400 bg-sand-100 p-3 text-sm">
                  <p className="text-navy-600">
                    Email delivery isn&rsquo;t configured on this environment yet, so here is the
                    confirmation link directly:
                  </p>
                  <a href={verifyUrl} className="mt-2 inline-block font-medium text-navy underline">
                    Confirm email
                  </a>
                </div>
              ) : (
                <p className="text-sm text-emerald-700">
                  Sent — check your inbox for the confirmation link.
                </p>
              ))}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-graystone underline">
              Forgot password?
            </Link>
            <Link href="/signup" className="text-navy underline">
              Create account
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
