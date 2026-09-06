"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload, type UploadedFile } from "@/components/FileUpload";

type Profile = {
  fullName: string;
  licenseNumber: string;
  brokerage: string;
  officeAddress: string;
  phone: string;
  email: string;
  website: string;
  reportLanguage: "en" | "pt";
  headshotKey: string | null;
  logoKey: string | null;
};

export function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [headshot, setHeadshot] = useState<UploadedFile[]>(
    initial.headshotKey ? [{ key: initial.headshotKey, filename: "Current headshot" }] : []
  );
  const [logo, setLogo] = useState<UploadedFile[]>(
    initial.logoKey ? [{ key: initial.logoKey, filename: "Current logo" }] : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          headshotKey: headshot[0]?.key ?? null,
          logoKey: logo[0]?.key ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Please check the fields below and try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-6">
      <div>
        <h2 className="font-serif text-lg text-navy">Required information</h2>
        <p className="text-xs text-graystone">
          Printed on every report. Your first order is blocked until this is complete.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Full name</label>
          <input
            required
            className="input-field"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Florida license number</label>
          <input
            required
            className="input-field"
            value={form.licenseNumber}
            onChange={(e) => update("licenseNumber", e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Brokerage name</label>
          <input
            required
            className="input-field"
            value={form.brokerage}
            onChange={(e) => update("brokerage", e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Direct phone</label>
          <input
            required
            className="input-field"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field">Office address</label>
          <input
            required
            className="input-field"
            value={form.officeAddress}
            onChange={(e) => update("officeAddress", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field">Email</label>
          <input
            required
            type="email"
            className="input-field"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
      </div>

      <div className="border-t border-sand-400 pt-6">
        <h2 className="font-serif text-lg text-navy">Optional</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Website</label>
          <input
            className="input-field"
            placeholder="https://"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Preferred report language</label>
          <select
            className="input-field"
            value={form.reportLanguage}
            onChange={(e) => update("reportLanguage", e.target.value as "en" | "pt")}
          >
            <option value="en">English</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>
      </div>

      <FileUpload
        prefix="headshots"
        label="Headshot"
        hint="JPG/PNG, min 600×600, square crop"
        accept="image/png,image/jpeg"
        value={headshot}
        onChange={setHeadshot}
      />
      <FileUpload
        prefix="logos"
        label="Brokerage logo"
        hint="PNG with transparency preferred, min 1000px wide"
        accept="image/png,image/jpeg"
        value={logo}
        onChange={setLogo}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Profile saved.</p>}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
