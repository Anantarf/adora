"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type ParentPanel = "ringkasan" | "dokumen" | "riwayat";

const VALID_PANELS: ParentPanel[] = ["ringkasan", "dokumen", "riwayat"];
const DEFAULT_PANEL: ParentPanel = "ringkasan";

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
 * ParentPanelProvider - URL adalah satu-satunya sumber kebenaran untuk panel aktif.
 * `activePanel` diturunkan dari search params, `setPanel` hanya mendorong URL baru.
 *
 * Provider ini memakai useSearchParams, jadi harus dibungkus <Suspense> di level layout.
 */
export function ParentPanelProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activePanel = useMemo<ParentPanel>(
    () => (isValidPanel(searchParams.get("panel")) ? (searchParams.get("panel") as ParentPanel) : DEFAULT_PANEL),
    [searchParams],
  );

  const setPanel = useCallback(
    (panel: ParentPanel) => {
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
