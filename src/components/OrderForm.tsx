"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { FileUpload, type UploadedFile } from "@/components/FileUpload";

export function OrderForm() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState("vacant_land");
  const [askingPrice, setAskingPrice] = useState("");
  const [relationship, setRelationship] = useState("has_listing");
  const [deadlineTier, setDeadlineTier] = useState("standard_48h");
  const [mlsNumber, setMlsNumber] = useState("");
  const [folio, setFolio] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          placeId,
          propertyType,
          askingPrice: Math.round(Number(askingPrice)),
          relationship,
          deadlineTier,
          mlsNumber: mlsNumber || undefined,
          folio: folio || undefined,
          notes: notes || undefined,
          fileKeys: files,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Please check the form and try again.");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      router.push(`/dashboard/orders/${data.orderId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-6">
      <div>
        <label className="label-field">Property address</label>
        <AddressAutocomplete
          value={address}
          onChange={(addr, pid) => {
            setAddress(addr);
            setPlaceId(pid);
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Property type</label>
          <select
            className="input-field"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="vacant_land">Vacant land</option>
            <option value="teardown_single_family">Teardown — single family</option>
            <option value="small_multifamily">Small multifamily</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label-field">Asking / expected price</label>
          <input
            required
            type="number"
            min={1}
            step={1}
            className="input-field"
            placeholder="750000"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Your relationship to the property</label>
          <select
            className="input-field"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
          >
            <option value="has_listing">Has the listing</option>
            <option value="competing_for_listing">Competing for the listing</option>
            <option value="representing_buyer">Representing a buyer</option>
          </select>
        </div>
        <div>
          <label className="label-field">Deadline</label>
          <select
            className="input-field"
            value={deadlineTier}
            onChange={(e) => setDeadlineTier(e.target.value)}
          >
            <option value="standard_48h">Standard (48 hours)</option>
            <option value="rush_24h">Rush (24 hours) — surcharge applies</option>
          </select>
        </div>
        <div>
          <label className="label-field">MLS number (optional)</label>
          <input className="input-field" value={mlsNumber} onChange={(e) => setMlsNumber(e.target.value)} />
        </div>
        <div>
          <label className="label-field">Folio number (optional)</label>
          <input className="input-field" value={folio} onChange={(e) => setFolio(e.target.value)} />
        </div>
      </div>

      <FileUpload
        prefix="order-uploads"
        label="Files (optional)"
        hint="Survey, plans, MLS sheet, photos — PDF/JPG/PNG, max 25MB each"
        accept="application/pdf,image/jpeg,image/png"
        multiple
        value={files}
        onChange={setFiles}
      />

      <div>
        <label className="label-field">Notes (optional)</label>
        <textarea
          className="input-field"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Submitting…" : "Submit order"}
      </button>
    </form>
  );
}
