"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "Verification failed.");
          return;
        }
        setStatus("ok");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong.");
      });
  }, [token]);

  return (
    <>
      {status === "loading" && <p className="text-navy-600">Verifying your email…</p>}
      {status === "ok" && (
        <div>
          <h1 className="font-serif text-2xl text-navy">Email confirmed</h1>
          <p className="mt-4 text-sm text-navy-600">You&rsquo;re all set.</p>
          <Link href="/signin" className="btn-primary mt-6 inline-flex">
            Sign in
          </Link>
        </div>
      )}
      {status === "error" && (
        <div>
          <h1 className="font-serif text-2xl text-navy">Verification failed</h1>
          <p className="mt-4 text-sm text-navy-600">{message}</p>
        </div>
      )}
    </>
  );
}

export default function VerifyPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-content flex min-h-[60vh] items-center justify-center text-center">
        <Suspense fallback={<p className="text-navy-600">Loading…</p>}>
          <VerifyContent />
        </Suspense>
      </main>
    </>
  );
}
