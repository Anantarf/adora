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
  const initialValue = useRef(value); // capture sekali saat mount

  useEffect(() => {
    const fetchHomebases = async () => {
      try {
        const data = await getPublicHomebases();
        setHomebases(data as Homebase[]);
      } catch (error) {
        console.error("Failed to fetch homebases:", error);
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
    if (match) onSelect(match.id, match.name);
  }, [homebases, onSelect]);

  if (loading)
    return (
      <div className="animate-pulse text-gray-400">
        Loading locations...
      </div>
    );

  if (homebases.length === 0)
    return <div className="text-red-400">No locations available</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {homebases.map((homebase) => (
        <button
          key={homebase.id}
          onClick={() => onSelect(homebase.id, homebase.name)}
          className={`p-6 border-2 rounded-lg transition-all text-left ${
            value === homebase.id
              ? "border-primary bg-primary/10 shadow-lg shadow-primary/50"
              : "border-white/20 hover:border-primary hover:bg-primary/5"
          }`}
        >
          <h3 className="font-bold text-xl text-primary mb-2">
            {homebase.name}
          </h3>
          {showFull && (
            <>
              <p className="text-sm text-gray-400 mb-1">{homebase.address}</p>
              <p className="text-sm text-gray-400">{homebase.phone}</p>
              {homebase.description && (
                <p className="text-sm text-gray-500 mt-2">
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
