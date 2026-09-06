"use client";

import { useRef, useState } from "react";

export type UploadedFile = { key: string; filename: string };

type Props = {
  prefix: "headshots" | "logos" | "order-uploads";
  accept?: string;
  label: string;
  hint?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  value?: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
};

export function FileUpload({
  prefix,
  accept = "image/png,image/jpeg,application/pdf",
  label,
  hint,
  multiple = false,
  maxSizeMb = 25,
  value = [],
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of Array.from(fileList)) {
        if (file.size > maxSizeMb * 1024 * 1024) {
          setError(`${file.name} exceeds the ${maxSizeMb}MB limit.`);
          continue;
        }
        const signRes = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type, prefix }),
        });
        if (!signRes.ok) {
          // Surface the server's reason when it has one: "storage isn't set up"
          // is not something retrying will fix.
          const body = await signRes.json().catch(() => null);
          setError(
            typeof body?.error === "string"
              ? body.error
              : "Could not prepare upload. Please try again."
          );
          continue;
        }
        const { key, uploadUrl } = await signRes.json();
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) {
          setError("Upload failed. Please try again.");
          continue;
        }
        uploaded.push({ key, filename: file.name });
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded.slice(0, 1));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeFile(key: string) {
    onChange(value.filter((f) => f.key !== key));
  }

  return (
    <div>
      <label className="label-field">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary text-xs"
        >
          {uploading ? "Uploading…" : "Choose file" + (multiple ? "s" : "")}
        </button>
        {hint && <span className="text-xs text-graystone">{hint}</span>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {value.length > 0 && (
        <ul className="mt-3 space-y-1">
          {value.map((f) => (
            <li key={f.key} className="flex items-center justify-between text-sm text-navy-600">
              <span className="truncate">{f.filename}</span>
              <button
                type="button"
                onClick={() => removeFile(f.key)}
                className="ml-3 text-xs text-graystone underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
