import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine } from "recharts";

function shortenPeriodLabel(label: string) {
  return label.length > 18 ? `${label.slice(0, 18)}...` : label;
}

export function ParentProgressionChart({ data }: { data: { name: string; Overall: number }[] }) {
  if (data.length === 0) {
    return null;
  }

  if (data.length === 1) {
    const firstEvaluation = data[0];

    return (
      <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
        <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
          <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Grafik Perkembangan</CardTitle>
          <CardDescription className="text-xs">
            Perbandingan perkembangan akan muncul setelah ada minimal dua periode evaluasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:p-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Evaluasi Pertama
            </p>
            <p className="mt-3 text-4xl font-black tabular-nums text-primary">
              {firstEvaluation.Overall}
              <span className="ml-1 text-base font-bold text-muted-foreground">/100</span>
            </p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{firstEvaluation.name}</p>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-dashed border-border/60 bg-background/30 p-5">
            <p className="text-sm font-semibold text-foreground">Belum cukup data untuk membandingkan perkembangan.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Nilai ini adalah titik awal evaluasi. Setelah periode berikutnya diterbitkan, grafik akan
              menunjukkan apakah perkembangan anak naik, turun, atau stabil.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
        <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Grafik Perkembangan</CardTitle>
        <CardDescription className="text-xs">Perubahan nilai evaluasi anak Anda dari satu periode ke periode berikutnya.</CardDescription>
      </CardHeader>
      <CardContent className="h-60 pt-4 md:h-64 md:pt-5">
        <ResponsiveContainer width="100%" height={195} minWidth={0} minHeight={0}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.1} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 600 }}
              tickFormatter={shortenPeriodLabel}
              tickLine={false}
              axisLine={false}
              minTickGap={12}
              dy={10}
            />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [`${value}/100`, "Nilai Evaluasi"]}
              labelFormatter={(label) => `Periode: ${label}`}
              contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)" }}
              itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
            />
            <ReferenceLine
              y={75}
              stroke="var(--primary)"
              strokeOpacity={0.2}
              strokeDasharray="4 4"
              label={{ value: "Acuan baik 75", position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <Line type="monotone" name="Nilai Evaluasi" dataKey="Overall" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
          Semakin tinggi garis, semakin baik hasil evaluasi. Angka dibaca dari 0 sampai 100.
        </p>
      </CardContent>
    </Card>
  );
}
