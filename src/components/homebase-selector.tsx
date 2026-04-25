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
      {homebases.map((homebase) => (
        <button
          key={homebase.id}
          onClick={() => !disabled && onSelect(homebase.id, homebase.name)}
          disabled={disabled}
          className={`p-6 border-2 rounded-lg transition-all text-left ${
            value === homebase.id
              ? "border-primary bg-primary/10"
              : "border-white/20 hover:border-primary hover:bg-primary/5"
          } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
        >
          {/* Nama tanpa "(Pusat)" */}
          <h3 className="font-heading font-bold text-xl text-primary mb-3 break-words">
            {displayName(homebase.name)}
          </h3>

          {showFull && (
            <div className="flex flex-col gap-1.5">
              {homebase.description && (
                <p className="text-xs font-bold text-primary/80 uppercase tracking-widest mb-1 break-words">
                  {homebase.description}
                </p>
              )}
              {/* Alamat */}
              <p className="text-sm text-white/70 flex items-start gap-1.5 break-words">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
                {homebase.address}
              </p>
              {/* Telepon */}
              {homebase.phone && (
                <p className="text-sm text-white/70 flex items-center gap-1.5 break-words">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                  {formatPhone(homebase.phone)}
                </p>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
