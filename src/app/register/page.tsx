"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { HomebaseSelector } from "@/components/homebase-selector";
import { Starfield } from "@/components/ui/starfield";

// ─── Constants ────────────────────────────────────────────────────────────────

const AGE_GROUPS = [
  { label: "KU‑7",  ages: "7 – 9 Tahun",   icon: "⭐", desc: "Program Kids perdana — mengenalkan basket melalui permainan & gerak dasar." },
  { label: "KU‑10", ages: "10 – 12 Tahun",  icon: "🌱", desc: "Fondasi teknik dan ball-handling. Latihan terstruktur mulai di level ini." },
  { label: "KU‑15", ages: "13 – 15 Tahun",  icon: "⚡", desc: "Pengembangan taktik, fisik & mental kompetisi. Aktif mengikuti ASBC & Liga." },
  { label: "KU‑18", ages: "16 – 18 Tahun",  icon: "🏆", desc: "Persiapan KEJURKOT & turnamen nasional dengan standar pelatihan profesional." },
];

type FormState = { name: string; phone: string; email: string; ageGroup: string };

const FORM_FIELDS: Array<{
  key: Exclude<keyof FormState, "ageGroup">;
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
}> = [
  { key: "name",  type: "text",  label: "Nama Lengkap Pemain",     required: true,  placeholder: "Contoh: Muhammad Arya Putra" },
  { key: "phone", type: "tel",   label: "No. WhatsApp Orang Tua", required: true,  placeholder: "Contoh: 08123456789" },
  { key: "email", type: "email", label: "Email",                  required: false, placeholder: "Contoh: orang.tua@email.com" },
];

const PRICING = {
  registration: "Rp 470.000",
  monthly:      "Rp 350.000",
};

const BANK = {
  name:    "BNI",
  account: "1227456425",
  holder:  "Dodi Aminullah",
};

const CONTACT = {
  whatsapp:  "6281213043753",
  instagram: "@adorabbc",
};

const INPUT_CLASS =
  "w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary transition-colors";

// ─── Inner (uses useSearchParams — harus di dalam Suspense) ──────────────────

function RegisterContent() {
  const searchParams    = useSearchParams();
  const paramHomebaseId = searchParams.get("homebase");

  const [selectedHomebase, setSelectedHomebase] = useState<{ id: string; name: string } | null>(
    paramHomebaseId ? { id: paramHomebaseId, name: "" } : null
  );
  const [form, setForm] = useState<FormState>({ name: "", phone: "", email: "", ageGroup: "" });

  const waMessage = [
    "Halo Adora Basketball Club, saya ingin mendaftar sebagai anggota baru.",
    form.name      ? `Nama      : ${form.name}`             : "",
    form.phone     ? `No HP     : ${form.phone}`            : "",
    form.email     ? `Email     : ${form.email}`            : "",
    form.ageGroup  ? `Program   : ${form.ageGroup}`         : "",
    selectedHomebase?.name ? `Lokasi    : ${selectedHomebase.name}` : "",
  ].filter(Boolean).join("\n");

  const waUrl = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(waMessage)}`;

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-foreground relative overflow-hidden">
      <Starfield />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0d0d0d]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Kembali ke beranda">
            <span className="font-heading text-2xl tracking-widest uppercase text-white hover:text-primary transition-colors">
              ADORA <span className="text-primary">BC</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-[10px] font-bold uppercase tracking-widest border border-primary/50 text-primary px-5 py-2 rounded-full hover:bg-primary hover:text-black transition-all"
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
          Jadilah bagian dari komunitas basket terbaik. Pilih lokasi, isi data, lalu hubungi kami via WhatsApp.
        </p>
      </section>

      {/* ── Main 2-Column ── */}
      <div className="container mx-auto px-4 pb-12 relative z-10">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* LEFT: Selector + Conditional Form */}
          <div className="space-y-10">

            {/* Step 1: Pilih Lokasi */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-9 rounded-full bg-primary flex items-center justify-center font-heading text-black font-bold text-sm shrink-0">1</div>
                <div>
                  <h2 className="font-heading text-xl uppercase tracking-widest text-white">Pilih Lokasi</h2>
                  <p className="text-white/40 text-xs">Pilih homebase yang paling dekat dengan Anda</p>
                </div>
              </div>
              <HomebaseSelector
                value={selectedHomebase?.id}
                onSelect={(id, name) => setSelectedHomebase({ id, name })}
                showFull
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

                <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                  {/* Text inputs dari config */}
                  {FORM_FIELDS.map(({ key, type, label, required, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-white/50 mb-2">
                        {label} {required && <span className="text-primary">*</span>}
                      </label>
                      <input
                        type={type}
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className={INPUT_CLASS}
                      />
                    </div>
                  ))}

                  {/* Program (select — berbeda struktur dari inputs) */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-white/50 mb-2">
                      Program / Kelompok Usia
                    </label>
                    <select
                      value={form.ageGroup}
                      onChange={(e) => setForm((f) => ({ ...f, ageGroup: e.target.value }))}
                      className={`${INPUT_CLASS} appearance-none cursor-pointer`}
                    >
                      <option value="" className="bg-[#0d0d0d]">-- Pilih Program --</option>
                      {AGE_GROUPS.map(({ label, ages }) => (
                        <option key={label} value={label} className="bg-[#0d0d0d]">
                          {label} ({ages})
                        </option>
                      ))}
                    </select>
                  </div>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-full transition-all text-sm uppercase tracking-widest shadow-lg shadow-green-600/20 hover:scale-[1.02]"
                  >
                    <span>💬</span>
                    Kirim via WhatsApp
                  </a>
                </div>
              </div>
            )}

            {!selectedHomebase?.name && (
              <p className="text-white/20 text-xs text-center tracking-widest uppercase">
                ↑ Pilih lokasi di atas untuk melanjutkan
              </p>
            )}
          </div>

          {/* RIGHT: Sticky pricing + bank info */}
          <aside className="lg:sticky lg:top-20 space-y-4">

            {/* Biaya */}
            <div className="border-l-4 border-l-primary bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-5">💰 Biaya Pendaftaran</div>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-white/60 text-sm leading-relaxed">
                    Pendaftaran<br />
                    <span className="text-white/30 text-[10px]">termasuk bulan pertama</span>
                  </span>
                  <span className="font-heading text-lg text-primary shrink-0 ml-4">{PRICING.registration}</span>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                  <span className="text-white/60 text-sm">Iuran Bulanan</span>
                  <div className="text-right">
                    <span className="font-heading text-lg text-primary">{PRICING.monthly}</span>
                    <span className="text-white/30 text-[10px] block">/bulan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank transfer */}
            <div className="border-l-4 border-l-primary bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-5">🏦 Cara Pembayaran</div>
              <div className="space-y-4">
                <div>
                  <div className="text-white/40 text-[9px] uppercase tracking-[0.3em] font-bold mb-1">Bank</div>
                  <div className="font-heading text-xl text-white tracking-widest">{BANK.name}</div>
                </div>
                <div>
                  <div className="text-white/40 text-[9px] uppercase tracking-[0.3em] font-bold mb-1">No. Rekening</div>
                  <div className="font-heading text-2xl text-primary tracking-[0.15em]">{BANK.account}</div>
                </div>
                <div>
                  <div className="text-white/40 text-[9px] uppercase tracking-[0.3em] font-bold mb-1">Atas Nama</div>
                  <div className="text-white font-semibold text-sm">{BANK.holder}</div>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="text-white/40 text-[9px] uppercase tracking-[0.3em] font-bold mb-1">Tunai</div>
                  <div className="text-white/60 text-xs">Bisa dibayar langsung saat latihan</div>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </div>

      {/* ── Program Kami (Info Grid) ── */}
      <div className="relative z-10 w-full border-y border-white/8 bg-white/[0.025]">
        <section className="container mx-auto px-4 py-20">
          <h2 className="font-heading text-3xl md:text-4xl text-primary uppercase tracking-widest mb-3 text-center">Program Kami</h2>
          <p className="text-white/40 text-sm text-center mb-12">Pilih kelompok usia yang sesuai dengan pemain Anda</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {AGE_GROUPS.map(({ label, ages, icon, desc }) => (
              <div
                key={label}
                className="bg-white/5 border border-white/10 hover:border-primary/40 rounded-2xl p-6 text-center transition-all hover:bg-white/[0.08] hover:-translate-y-1"
              >
                <div className="text-3xl mb-3" aria-hidden="true">{icon}</div>
                <div className="font-heading text-2xl text-white tracking-widest mb-1">{label}</div>
                <div className="text-primary/60 text-[9px] font-bold uppercase tracking-widest mb-4">{ages}</div>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
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
          <a
            href={`https://instagram.com/${CONTACT.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 text-xs hover:text-primary transition-colors"
          >
            {CONTACT.instagram}
          </a>
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
