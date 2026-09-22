"use client";

import { useState } from "react";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirm) {
      setMessage({ kind: "error", text: "The two new passwords do not match." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error ?? "Could not change the password." });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setMessage({ kind: "ok", text: "Password updated." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-xl space-y-4">
      {hasPassword ? (
        <div>
          <label className="label-field">Current password</label>
          <input
            type="password"
            autoComplete="current-password"
            className="input-field"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
      ) : (
        <p className="text-sm text-graystone">
          This account signed in with Google and has no password yet. Set one to also sign in with
          email and password.
        </p>
      )}
      <div>
        <label className="label-field">New password</label>
        <input
          type="password"
          autoComplete="new-password"
          className="input-field"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
        <p className="mt-1 text-xs text-graystone">At least 8 characters.</p>
      </div>
      <div>
        <label className="label-field">Confirm new password</label>
        <input
          type="password"
          autoComplete="new-password"
          className="input-field"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
        />
      </div>
      {message && (
        <p className={`text-sm ${message.kind === "ok" ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Saving…" : hasPassword ? "Change password" : "Set password"}
      </button>
    </form>
  );
}
