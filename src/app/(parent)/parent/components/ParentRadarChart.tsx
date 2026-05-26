import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from "recharts";

export function ParentRadarChart({ data }: { data: { subject: string; A: number; fullMark: number }[] }) {
  return (
    <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
        <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Komposisi Kemampuan</CardTitle>
        <CardDescription className="text-xs">Perbandingan skor antar aspek teknik dasar.</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 md:pt-6 h-72 md:h-80 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={0}>
          <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
            <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.2} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted-foreground)", fontSize: 9, fontWeight: 700 }} />
            <Radar name="Skor" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)", fontSize: "12px", fontWeight: "bold" }} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
