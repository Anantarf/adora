import type { ComponentType, ReactNode } from "react";

type AdminStatePanelProps = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  tone?: "default" | "danger";
  action?: ReactNode;
  className?: string;
};

export function AdminStatePanel({
  icon: Icon,
  title,
  description,
  tone = "default",
  action,
  className = "",
}: AdminStatePanelProps) {
  const isDanger = tone === "danger";

  return (
    <div
      className={`flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center ${
        isDanger
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-border/50 bg-background/30 text-muted-foreground"
      } ${className}`}
    >
      {Icon ? (
        <Icon className={`size-10 ${isDanger ? "text-destructive/60" : "text-muted-foreground/50"}`} />
      ) : null}
      <div className="space-y-1">
        <p className={`text-sm font-semibold ${isDanger ? "text-destructive" : "text-muted-foreground"}`}>
          {title}
        </p>
        {description ? (
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
