"use client";

import { useState, useEffect, useRef } from "react";
import { getPublicHomebases } from "@/actions/homebase";
import { type homebase as Homebase } from "@prisma/client";
import { MapPin, Phone } from "lucide-react";

interface HomebaseSelectorProps {
  onSelect: (id: string, name: string) => void;
  value?: string;
  showFull?: boolean;
  disabled?: boolean;
}

/** Strip parenthetical suffix: "ADORA Gandul (Pusat)" → "ADORA Gandul" */
function displayName(name: string): string {
  return name.replace(/\s*\(.*?\)\s*$/, "").trim();
}

/** Format raw phone to +62 xxx */
function formatPhone(phone: string): string {
  if (phone.startsWith("62")) return `+${phone}`;
  return phone;
}

export function HomebaseSelector({
  onSelect,
  value,
  showFull = true,
  disabled = false,
}: HomebaseSelectorProps) {
  const [homebases, setHomebases] = useState<Homebase[]>([]);
  const [loading, setLoading] = useState(true);
  const initialValue = useRef(value);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; });

  useEffect(() => {
    const fetchHomebases = async () => {
      try {
        const data = await getPublicHomebases();
        const rank = (n: string) =>
          n.toLowerCase().includes("gandul") || n.toLowerCase().includes("pusat") ? 0 : 1;
        const sorted = [...(data as Homebase[])].sort((a, b) => rank(a.name) - rank(b.name));
        setHomebases(sorted);
      } catch (error) {
        console.error("Gagal mengambil data homebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomebases();
  }, []);

  // Auto-resolve nama saat data load dan ada pre-selected value dari URL param
  useEffect(() => {
    if (!initialValue.current || homebases.length === 0) return;
    const match = homebases.find((h) => h.id === initialValue.current);
    if (match) onSelectRef.current(match.id, match.name);
  }, [homebases]);

  if (loading)
    return <div className="animate-pulse text-muted-foreground">Memuat homebase...</div>;

  if (homebases.length === 0)
    return <div className="text-destructive">Belum ada homebase tersedia</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {homebases.map((homebase) => {
        const isSelected = value === homebase.id;
        return (
          <button
            key={homebase.id}
            onClick={() => !disabled && onSelect(homebase.id, homebase.name)}
            disabled={disabled}
            className={`p-5 md:p-6 border-2 rounded-2xl transition-all duration-300 text-left relative overflow-hidden flex flex-col ${
              isSelected
                ? "border-brand-purple bg-brand-purple/20 ring-4 ring-brand-purple/20 shadow-[0_0_30px_rgba(138,43,226,0.3)]"
                : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-black/60"
            } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
          >


            <div className="relative z-10">
              {/* Nama tanpa "(Pusat)" */}
              <h3 className={`font-heading font-black text-xl md:text-2xl uppercase tracking-widest italic mb-3 break-words ${isSelected ? "text-brand-yellow" : "text-white"}`}>
                {displayName(homebase.name)}
              </h3>

              {showFull && (
                <div className="flex flex-col gap-2.5">
                  {homebase.description && (
                    <div className="inline-block bg-white/10 px-2.5 py-1 rounded self-start">
                      <p className={`text-[10px] font-bold uppercase tracking-widest break-words ${isSelected ? "text-white" : "text-brand-orange"}`}>
                        📍 {homebase.description}
                      </p>
                    </div>
                  )}
                  {/* Alamat */}
                  <p className={`text-xs md:text-sm flex items-start gap-2.5 mt-1.5 font-medium leading-relaxed break-words ${isSelected ? "text-white/90" : "text-white/60"}`}>
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 shrink-0 opacity-50" />
                    {homebase.address}
                  </p>
                  {/* Telepon */}
                  {homebase.phone && (
                    <p className={`text-xs md:text-sm flex items-center gap-2.5 font-medium break-words ${isSelected ? "text-white/90" : "text-white/60"}`}>
                      <Phone className="w-4 h-4 md:w-5 md:h-5 shrink-0 opacity-50" />
                      {formatPhone(homebase.phone)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
