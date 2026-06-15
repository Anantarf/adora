"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type ParentPanel = "ringkasan" | "dokumen" | "riwayat";

const VALID_PANELS: ParentPanel[] = ["ringkasan", "dokumen", "riwayat"];

function isValidPanel(value: string | null): value is ParentPanel {
  return VALID_PANELS.includes(value as ParentPanel);
}

interface ParentPanelContextValue {
  activePanel: ParentPanel;
  setPanel: (panel: ParentPanel) => void;
}

const ParentPanelContext = createContext<ParentPanelContextValue | null>(null);

export function useParentPanel(): ParentPanelContextValue {
  const context = useContext(ParentPanelContext);
  if (!context) {
    throw new Error("useParentPanel must be used within ParentPanelProvider");
  }
  return context;
}

/**
 * ParentPanelProvider — reads initial panel from URL search params,
 * provides activePanel state to children, and syncs URL on change.
 *
 * Must be wrapped in <Suspense> at the layout level because it uses
 * useSearchParams internally.
 */
export function ParentPanelProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawPanel = searchParams.get("panel");
  const initialPanel: ParentPanel = isValidPanel(rawPanel) ? rawPanel : "ringkasan";

  const [activePanel, setActivePanelState] = useState<ParentPanel>(initialPanel);

  // Sync state when the URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    const raw = searchParams.get("panel");
    const resolved: ParentPanel = isValidPanel(raw) ? raw : "ringkasan";
    setActivePanelState(resolved);
  }, [searchParams]);

  const setPanel = useCallback(
    (panel: ParentPanel) => {
      setActivePanelState(panel);
      router.push(`/parent?panel=${panel}`, { scroll: false });
    },
    [router],
  );

  return (
    <ParentPanelContext.Provider value={{ activePanel, setPanel }}>
      {children}
    </ParentPanelContext.Provider>
  );
}
