/**
 * Resolves ProgramIconName strings to Lucide React components.
 * Kept separate from programs.ts so that pure data stays serializable,
 * while the icon map (which imports React components) lives here.
 */
import { Sprout, Target, Flame, Trophy, type LucideProps } from "lucide-react";
import type { ProgramIconName } from "./programs";
import type React from "react";

export const PROGRAM_ICONS: Record<ProgramIconName, React.ComponentType<LucideProps>> = {
  Sprout,
  Target,
  Flame,
  Trophy,
};
