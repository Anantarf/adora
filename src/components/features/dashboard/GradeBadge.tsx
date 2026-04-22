import { letterGrade } from "@/lib/metrics";

const GRADE_STYLES = {
  A: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  B: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  C: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  D: "text-destructive bg-destructive/10 border-destructive/30",
} as const;

interface GradeBadgeProps {
  score: number;
  variant?: "compact" | "full";
}

export function GradeBadge({ score, variant = "compact" }: GradeBadgeProps) {
  const { letter, label } = letterGrade(score);
  const styles = GRADE_STYLES[letter];

  if (variant === "full") {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Nilai Akhir
        </span>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${styles}`}>
          <span className="text-xl font-black">{letter}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-black ${styles}`}>
      {letter}
    </div>
  );
}
