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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error === "EMAIL_NOT_VERIFIED") {
        setError("Please verify your email before signing in. Check your inbox for the confirmation link.");
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
