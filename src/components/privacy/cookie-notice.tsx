"use client";

import { useState } from "react";

const COOKIE_NOTICE_STORAGE_KEY = "adora-cookie-notice-acknowledged";

export function CookieNotice() {
  const [visible, setVisible] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) !== "true",
  );

  const acknowledge = () => {
    window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <section
      aria-label="Pemberitahuan cookie"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-xl border border-border/70 bg-card/95 p-3 text-card-foreground shadow-lg backdrop-blur md:bottom-4 md:p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <span aria-hidden="true" className="size-3.5 rounded-sm border border-primary bg-primary/30" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Pemberitahuan cookie</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Situs ini menggunakan cookie esensial untuk autentikasi, keamanan sesi, dan preferensi tampilan.
            Beberapa konten atau tautan dapat terhubung ke layanan pihak ketiga seperti penyimpanan dokumen
            dan peta eksternal.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:shrink-0"
          onClick={acknowledge}
        >
          Mengerti
        </button>
        <button
          type="button"
          aria-label="Tutup pemberitahuan cookie"
          className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
          onClick={acknowledge}
        >
          <span aria-hidden="true" className="text-base leading-none">x</span>
        </button>
      </div>
    </section>
  );
}
