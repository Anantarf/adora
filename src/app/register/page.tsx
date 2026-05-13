"use client";

import { useState, useMemo, Suspense, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { HomebaseSelector } from "@/components/homebase-selector";
import { submitRegistration } from "@/actions/register";
import { PROGRAMS } from "@/lib/constants/programs";
import { CONTACT } from "@/lib/constants/contact";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/features/landing-header";
import { FadeIn } from "@/components/animations/fade-in";
import { getAcademicYear } from "@/lib/utils";
import React from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

type FormState = { name: string; phone: string; email: string; ageGroup: string };

const FORM_FIELDS: Array<{
  key: Exclude<keyof FormState, "ageGroup">;
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  sanitize?: (val: string) => string;
}> = [
  {
    key: "name",
    type: "text",
    label: "Nama Lengkap Pemain",
    required: true,
    placeholder: "Contoh: Muhammad Arya Putra",
    autoComplete: "name",
    inputMode: "text",
    sanitize: (v) => v.replace(/[^a-zA-Z\s.'\-]/g, ""),
  },
  {
    key: "phone",
    type: "tel",
    label: "No. WhatsApp Orang Tua",
    required: true,
    placeholder: "Contoh: 08123456789",
    autoComplete: "tel",
    inputMode: "tel",
    sanitize: (v) => v.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, ""),
  },
  {
    key: "email",
    type: "email",
    label: "Email (Opsional)",
    required: false,
    placeholder: "Contoh: orang.tua@email.com",
    autoComplete: "email",
    inputMode: "email",
  },
];

const INPUT_CLASS =
  "w-full px-4 py-3 min-h-12 bg-black/40 border-2 border-white/10 rounded-xl text-white placeholder:text-white/30 text-base md:text-sm font-medium focus:outline-none focus:border-brand-yellow focus:bg-black/60 transition-colors";

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
    if (!selectedHomebase?.id) {
      setError("Mohon pilih homebase terlebih dahulu.");
      return;
    }
    if (!form.ageGroup) {
      setError("Mohon pilih Program / Kelompok Usia terlebih dahulu.");
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
    <main className="min-h-screen bg-page-dark text-white relative overflow-hidden pt-18">
      <LandingHeader />
      
      {/* Background Textures */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-200 h-200 bg-brand-purple rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-150 h-150 bg-brand-orange rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
        <div className="absolute inset-0 pattern-halftone opacity-30"></div>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-9 pb-5 md:pt-12 md:pb-8 text-center px-4 z-10">
        <div className="inline-flex skew-box bg-brand-yellow text-black px-4 py-1.5 mb-6 border-2 border-black shadow-[4px_4px_0px_#000]">
          <span className="unskew-content block font-heading font-black uppercase text-xs tracking-widest italic">
            // JOIN THE SQUAD //
          </span>
        </div>
        <h1 className="font-heading font-black text-3xl md:text-5xl tracking-tighter uppercase text-white mb-3 leading-tight italic drop-shadow-lg py-2">
          FORM <span className="inline-block text-transparent bg-clip-text bg-linear-to-br from-brand-orange to-red-500 pr-6">PENDAFTARAN</span>
        </h1>
        <p className="text-white/70 text-sm md:text-base max-w-xl mx-auto font-medium">
          Isi data dengan lengkap. Langkah awal menuju Kejurkot dimulai dari sini.
        </p>
      </section>

      {/* ── Main Form ── */}
      <div className="container mx-auto px-4 pb-20 relative z-10">
        <div className="max-w-3xl mx-auto">

          <div className="space-y-6 md:space-y-10">

            {/* Step 1: Pilih Homebase */}
            <div className="bg-surface-dark border-2 border-white/10 p-6 md:p-8 rounded-[1.5rem] shadow-2xl relative">
              <div className="absolute -top-5 -left-3 md:-left-5">
                <div className="skew-box w-12 h-12 bg-brand-purple text-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                  <span className="unskew-content font-heading font-black text-2xl italic">1</span>
                </div>
              </div>
              <div className="mb-8 pl-10 md:pl-12">
                <h2 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-widest text-white italic">PILIH LOKASI LATIHAN</h2>
                <p className="text-white/60 font-medium text-xs md:text-sm">Pilih homebase yang paling dekat dengan Anda</p>
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
              <div className="bg-surface-dark border-2 border-white/10 p-6 md:p-8 rounded-[1.5rem] shadow-2xl relative mt-12 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="absolute -top-5 -left-3 md:-left-5">
                  <div className="skew-box w-12 h-12 bg-brand-orange text-black border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                    <span className="unskew-content font-heading font-black text-2xl italic">2</span>
                  </div>
                </div>
                <div className="mb-8 pl-10 md:pl-12">
                  <h2 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-widest text-white italic">DATA CALON PEMAIN</h2>
                  <p className="text-white/60 font-medium text-xs md:text-sm">Pastikan nomor WhatsApp aktif untuk konfirmasi admin.</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Text inputs dari config */}
                    {FORM_FIELDS.map(({ key, type, label, required, placeholder, autoComplete, inputMode, sanitize }) => (
                      <div key={key}>
                        <label className="block font-bold text-white/80 uppercase tracking-widest text-xs mb-2">
                          {label} {required && <span className="text-brand-orange">*</span>}
                        </label>
                        <input
                          type={type}
                          value={form[key]}
                          disabled={isSubmitted}
                          autoComplete={autoComplete}
                          inputMode={inputMode}
                          enterKeyHint={key === "email" ? "next" : "done"}
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
                    <div className="pt-3">
                      <label className="block font-bold text-white/80 uppercase tracking-widest text-[10px] mb-3">
                        PILIH KELOMPOK USIA <span className="text-brand-orange">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PROGRAMS.map(({ label, ages, image, desc }) => {
                          const isSelected = form.ageGroup === label;
                          return (
                            <button
                              key={label}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => setForm((f) => ({ ...f, ageGroup: label }))}
                              className={`text-left px-4 py-4 min-h-24 rounded-2xl border-2 transition-all duration-300 flex flex-col relative overflow-hidden ${
                                isSelected
                                  ? "bg-brand-purple/20 border-brand-purple ring-4 ring-brand-purple/20 shadow-[0_0_30px_rgba(138,43,226,0.3)]"
                                  : "bg-black/40 border-white/10 hover:border-white/30 hover:bg-black/60"
                              } ${isSubmitted ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
                            >

                              
                              <div className="flex items-start justify-between w-full relative z-10">
                                <div>
                                  <h4 className={`font-heading font-black text-base md:text-xl tracking-widest mb-1 italic uppercase ${isSelected ? "text-brand-yellow" : "text-white"}`}>
                                    {label}
                                  </h4>
                                  <div className={`inline-block px-2 py-0.5 rounded bg-white/10 font-bold tracking-widest text-[9px] mb-2 ${isSelected ? "text-white" : "text-white/60"}`}>
                                    {ages}
                                  </div>
                                </div>
                              </div>
                              <p className={`text-xs md:text-sm font-medium leading-relaxed mt-2 ${isSelected ? "text-white/90" : "text-white/50"}`}>
                                {desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {isSubmitted ? (
                      <div className="bg-green-500/10 border-2 border-green-500/50 rounded-2xl p-8 text-center space-y-6 mt-10 animate-in zoom-in-95 duration-500">
                        <CheckCircle2 className="size-16 text-green-400 mx-auto" />
                        <div>
                          <h3 className="font-heading font-black text-2xl md:text-3xl text-green-400 uppercase tracking-widest italic mb-2">PENDAFTARAN SUKSES!</h3>
                          <p className="text-white/70 text-sm md:text-base font-medium">
                            Data Anda sudah masuk ke sistem kami. Langkah terakhir, klik tombol di bawah untuk konfirmasi via WhatsApp.
                          </p>
                        </div>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex skew-box items-center justify-center gap-3 bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 transition-all text-base uppercase tracking-widest hover:scale-[1.05] shadow-[4px_4px_0px_#000] border-2 border-black w-full sm:w-auto"
                        >
                          <span className="unskew-content flex items-center gap-2 italic">
                            <MessageCircle className="size-5" />
                            KONFIRMASI ADMIN
                          </span>
                        </a>
                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={handleReset}
                            className="cursor-pointer text-white/50 hover:text-white font-bold text-xs uppercase tracking-widest transition-all underline underline-offset-4"
                          >
                            Daftar Anggota Lain
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-8">
                        {error && (
                          <div className="bg-red-500/20 border-l-4 border-red-500 px-5 py-4 mb-6 text-red-100 text-sm font-bold flex items-center gap-3">
                            <span className="text-red-500 text-xl">⚠️</span> {error}
                          </div>
                        )}

                        <Button
                          type="submit"
                          loading={isPending}
                          loadingText="MEMPROSES..."
                          className="w-full skew-box bg-linear-to-r from-brand-orange to-red-600 hover:from-brand-yellow hover:to-brand-orange text-white hover:text-black font-black px-6 py-3 md:px-8 md:py-4 transition-all text-sm md:text-base uppercase tracking-widest hover:scale-[1.02] shadow-[6px_6px_0px_#000] border-2 border-black group h-auto"
                        >
                          <span className="unskew-content flex items-center justify-center gap-2 italic">
                            KIRIM PENDAFTARAN
                            <span className="group-hover:translate-x-2 transition-transform">→</span>
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {!selectedHomebase?.name && (
              <div className="text-center pt-8 animate-pulse">
                <p className="text-brand-yellow font-black text-xs tracking-widest uppercase italic">
                  ↑ PILIH LOKASI DI ATAS UNTUK LANJUT ↑
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t-4 border-brand-purple py-6 md:py-8 bg-black/60 backdrop-blur-md">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-brand-orange transition-colors">
            ← KEMBALI
          </Link>
          <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase">
            &copy; {new Date().getFullYear()} ADORA Basketball Club
          </p>
          <div className="flex items-center gap-6">
            <a
              href={`https://instagram.com/${CONTACT.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 text-xs font-bold uppercase hover:text-brand-orange transition-colors"
            >
              IG @{CONTACT.instagram}
            </a>
            <a
              href={`https://www.tiktok.com/@${CONTACT.tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 text-xs font-bold uppercase hover:text-brand-orange transition-colors"
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
