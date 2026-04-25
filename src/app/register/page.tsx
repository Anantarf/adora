"use client";

import { useState, useMemo, Suspense, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { HomebaseSelector } from "@/components/homebase-selector";
import { Starfield } from "@/components/ui/starfield";
import { submitRegistration } from "@/actions/register";
import { PROGRAMS } from "@/lib/constants/programs";
import { PROGRAM_ICONS } from "@/lib/constants/program-icons";
import { CONTACT } from "@/lib/constants/contact";
import React from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

type FormState = { name: string; phone: string; email: string; ageGroup: string };

const FORM_FIELDS: Array<{
  key: Exclude<keyof FormState, "ageGroup">;
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
  sanitize?: (val: string) => string;
}> = [
  {
    key: "name",
    type: "text",
    label: "Nama Lengkap Pemain",
    required: true,
    placeholder: "Contoh: Muhammad Arya Putra",
    sanitize: (v) => v.replace(/[^a-zA-Z\s.'\-]/g, ""),
  },
  {
    key: "phone",
    type: "tel",
    label: "No. WhatsApp Orang Tua",
    required: true,
    placeholder: "Contoh: 08123456789",
    sanitize: (v) => v.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, ""),
  },
  {
    key: "email",
    type: "email",
    label: "Email (Opsional)",
    required: false,
    placeholder: "Contoh: orang.tua@email.com",
  },
];

const INPUT_CLASS =
  "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary transition-colors";

// ─── Inner (uses useSearchParams — harus di dalam Suspense) ──────────────────

function RegisterContent() {
  const searchParams    = useSearchParams();
  const paramHomebaseId = searchParams.get("homebase");

  const [selectedHomebase, setSelectedHomebase] = useState<{ id: string; name: string } | null>(
    paramHomebaseId ? { id: paramHomebaseId, name: "" } : null
  );
  const [form, setForm] = useState<FormState>({ name: "", phone: "", email: "", ageGroup: "" });

  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waUrl = useMemo(() => {
    const message = [
      "Halo Adora Basketball Club, saya telah mengisi form pendaftaran anggota baru di website. Mohon info untuk kelanjutan proses pendaftaran dan pembayarannya.",
      form.name             ? `Nama      : ${form.name}`             : "",
      form.phone            ? `No HP     : ${form.phone}`            : "",
      form.email            ? `Email     : ${form.email}`            : "",
      form.ageGroup         ? `Program   : ${form.ageGroup}`         : "",
      selectedHomebase?.name ? `Homebase  : ${selectedHomebase.name}` : "",
    ].filter(Boolean).join("\n");
    return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
  }, [form, selectedHomebase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.phone || !form.ageGroup || !selectedHomebase?.id) {
      setError("Mohon lengkapi semua data wajib yang bertanda *");
      return;
    }

    startTransition(async () => {
      const result = await submitRegistration({
        playerName: form.name,
        phone: form.phone,
        email: form.email,
        ageGroup: form.ageGroup,
        homebaseId: selectedHomebase.id,
      });

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.error ?? "Gagal mengirim pendaftaran. Silakan coba lagi.");
      }
    });
  };

  const handleReset = () => {
    setForm({ name: "", phone: "", email: "", ageGroup: "" });
    setSelectedHomebase(null);
    setIsSubmitted(false);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-page-dark text-foreground relative overflow-hidden">
      <Starfield />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-page-dark/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Kembali ke beranda" className="flex items-center gap-3 group">
            <div className="w-8 h-8 flex items-center justify-center transition-all">
              <Image src="/logo-adora.png" alt="Adora BC" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-heading text-xl tracking-widest uppercase text-white group-hover:text-primary transition-colors hidden sm:block">
              ADORA <span className="text-primary">BC</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white px-5 py-2 rounded-full hover:bg-white hover:text-black transition-all"
          >
            Login
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative py-20 text-center px-4 z-10">
        <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-8">
          Pendaftaran Anggota Baru
        </div>
        <h1 className="font-heading text-5xl md:text-7xl tracking-widest uppercase text-white mb-4 leading-none">
          Bergabung dengan <span className="text-primary">ADORA</span>
        </h1>
        <p className="text-white/60 text-sm max-w-xl mx-auto leading-relaxed">
          Jadilah bagian dari komunitas basket terbaik. Pilih homebase, isi data, lalu hubungi kami via WhatsApp.
        </p>
      </section>

      {/* ── Main Form ── */}
      <div className="container mx-auto px-4 pb-12 relative z-10">
        <div className="max-w-3xl mx-auto">

          <div className="space-y-10">

            {/* Step 1: Pilih Homebase */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-9 rounded-full bg-primary flex items-center justify-center font-heading text-black font-bold text-sm shrink-0">1</div>
                <div>
                  <h2 className="font-heading text-xl uppercase tracking-widest text-white">Pilih Homebase</h2>
                  <p className="text-white/40 text-xs">Pilih homebase yang paling dekat dengan Anda</p>
                </div>
              </div>
              <HomebaseSelector
                value={selectedHomebase?.id}
                onSelect={(id, name) => setSelectedHomebase({ id, name })}
                showFull
                disabled={isSubmitted}
              />
            </div>

            {/* Step 2: Form (muncul setelah homebase ter-resolve namanya) */}
            {selectedHomebase?.name && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-9 rounded-full bg-primary flex items-center justify-center font-heading text-black font-bold text-sm shrink-0">2</div>
                  <div>
                    <h2 className="font-heading text-xl uppercase tracking-widest text-white">Data Pendaftar</h2>
                    <p className="text-white/40 text-xs">Isi data di bawah untuk mempercepat proses pendaftaran</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                    {/* Text inputs dari config */}
                    {FORM_FIELDS.map(({ key, type, label, required, placeholder, sanitize }) => (
                      <div key={key}>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-white/50 mb-2">
                          {label} {required && <span className="text-primary">*</span>}
                        </label>
                        <input
                          type={type}
                          value={form[key]}
                          disabled={isSubmitted}
                          onChange={(e) => {
                            const val = sanitize ? sanitize(e.target.value) : e.target.value;
                            setForm((f) => ({ ...f, [key]: val }));
                          }}
                          placeholder={placeholder}
                          className={`${INPUT_CLASS} ${isSubmitted ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                    ))}

                    {/* Program (Cards) */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-white/50 mb-3">
                        Program / Kelompok Usia <span className="text-primary">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PROGRAMS.map(({ label, ages, iconName, desc }) => {
                          const isSelected = form.ageGroup === label;
                          const Icon = PROGRAM_ICONS[iconName];
                          return (
                            <button
                              key={label}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => setForm((f) => ({ ...f, ageGroup: label }))}
                              className={`text-center px-4 py-4 rounded-xl border transition-all duration-300 flex flex-col items-center ${
                                isSelected
                                  ? "bg-primary/10 border-primary ring-2 ring-primary/50"
                                  : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                              } ${isSubmitted ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
                            >
                              <div className={`mb-1 transition-colors ${isSelected ? "text-primary" : "text-white/50"}`} aria-hidden="true">
                                <Icon className="w-8 h-8" />
                              </div>
                              <h4 className={`font-heading text-xl tracking-widest mb-0.5 ${isSelected ? "text-primary" : "text-white"}`}>
                                {label}
                              </h4>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2">
                                {ages}
                              </span>
                              <p className="text-white/60 text-[11px] leading-relaxed">
                                {desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {isSubmitted ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center space-y-4 mt-6">
                        <CheckCircle2 className="size-12 text-green-400 mx-auto" />
                        <h3 className="font-heading text-xl text-green-400 uppercase tracking-widest">Pendaftaran Terkirim!</h3>
                        <p className="text-white/60 text-sm">
                          Data Anda sudah kami simpan. Langkah terakhir, silakan klik tombol WhatsApp di bawah untuk konfirmasi pendaftaran ke Admin.
                        </p>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer mt-4 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-full transition-all text-sm uppercase tracking-widest hover:scale-[1.02]"
                        >
                          <MessageCircle className="size-4" />
                          Hubungi Admin (WA)
                        </a>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="cursor-pointer w-full mt-2 border border-white/20 hover:border-white/40 text-white/50 hover:text-white/80 text-xs uppercase tracking-widest transition-all py-2.5 rounded-full"
                        >
                          Daftar Anggota Lain
                        </button>
                      </div>
                    ) : (
                      <>
                        {error && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs font-medium">
                            ⚠️ {error}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isPending}
                          className="cursor-pointer mt-2 w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/80 text-black font-bold px-8 py-3.5 rounded-full transition-all text-sm uppercase tracking-widest hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPending ? "Menyimpan Data..." : "Kirim Pendaftaran"}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            )}

            {!selectedHomebase?.name && (
              <p className="text-white/20 text-xs text-center tracking-widest uppercase">
                ↑ Pilih homebase di atas untuk melanjutkan
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/10 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <Link href="/" className="text-white/30 text-xs hover:text-primary transition-colors">
            ← Kembali ke Beranda
          </Link>
          <p className="text-white/20 text-[10px]">
            &copy; {new Date().getFullYear()} ADORA Basketball Club
          </p>
          <div className="flex items-center gap-4">
            <a
              href={`https://instagram.com/${CONTACT.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 text-xs hover:text-primary transition-colors"
            >
              IG @{CONTACT.instagram}
            </a>
            <a
              href={`https://www.tiktok.com/@${CONTACT.tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 text-xs hover:text-primary transition-colors"
            >
              TikTok @{CONTACT.tiktok}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
