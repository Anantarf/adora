"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { toUserErrorMessage } from "@/lib/utils";

interface UploadFieldProps {
  label: string;
  value?: string;
  onUploaded: (url: string) => void;
  error?: string;
  assetKey: string;
  required?: boolean;
  hint?: string;
}

async function uploadAsset(file: File, assetKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("assetKey", assetKey);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Upload gagal.");
  }

  return data.url as string;
}

export function UploadField({
  label,
  value,
  onUploaded,
  error,
  assetKey,
  required = false,
  hint,
}: UploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const previewLabel = value ? "Ganti file" : "Unggah";

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border/50 bg-background/40 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
        <div className="flex items-center gap-3">
          {isUploading ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <Upload className="size-4 text-muted-foreground" />
          )}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">
              {value ? "File berhasil diunggah" : "Pilih file gambar"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              PNG atau JPG, maksimal 2MB.
            </span>
          </div>
        </div>
        <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {previewLabel}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setIsUploading(true);
            try {
              const url = await uploadAsset(file, `${assetKey}_${Date.now()}`);
              onUploaded(url);
              toast.success(`${label} berhasil diunggah.`);
            } catch (error) {
              toast.error(toUserErrorMessage(error, "Upload gagal."));
            } finally {
              setIsUploading(false);
              event.target.value = "";
            }
          }}
        />
      </label>
      {value ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-background/50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="h-28 w-full rounded-lg object-contain bg-background/60"
            />
          </div>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-[11px] font-medium text-primary hover:underline"
          >
            Lihat file terunggah
          </a>
        </div>
      ) : null}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
