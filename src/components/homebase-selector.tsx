"use client";

import { useState, useEffect, useRef } from "react";
import { getPublicHomebases } from "@/actions/homebase";
import { type homebase as Homebase } from "@prisma/client";

interface HomebaseSelectorProps {
  onSelect: (id: string, name: string) => void;
  value?: string;
  showFull?: boolean;
}

export function HomebaseSelector({
  onSelect,
  value,
  showFull = true,
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
        setHomebases(data as Homebase[]);
      } catch (error) {
        console.error("Gagal mengambil data lokasi:", error);
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
    return <div className="animate-pulse text-muted-foreground">Memuat lokasi...</div>;

  if (homebases.length === 0)
    return <div className="text-destructive">Belum ada lokasi latihan tersedia</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {homebases.map((homebase) => (
        <button
          key={homebase.id}
          onClick={() => onSelect(homebase.id, homebase.name)}
          className={`p-6 border-2 rounded-lg transition-all text-left ${
            value === homebase.id
              ? "border-primary bg-primary/10"
              : "border-white/20 hover:border-primary hover:bg-primary/5"
          }`}
        >
          <h3 className="font-heading font-bold text-xl text-primary mb-2 break-words">
            {homebase.name}
          </h3>
          {showFull && (
            <>
              <p className="text-sm text-muted-foreground mb-1 break-words">{homebase.address}</p>
              <p className="text-sm text-muted-foreground break-words">{homebase.phone}</p>
              {homebase.description && (
                <p className="text-sm text-muted-foreground/70 mt-2 break-words">
                  {homebase.description}
                </p>
              )}
            </>
          )}
        </button>
      ))}
    </div>
  );
}
