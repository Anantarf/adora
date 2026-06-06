import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";

export function ParentProgressionChart({ data }: { data: { name: string; Overall: number }[] }) {
  if (data.length <= 1) return null;

  return (
    <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
        <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Grafik Perkembangan</CardTitle>
        <CardDescription className="text-xs">Perubahan hasil evaluasi anak Anda dari satu periode ke periode berikutnya.</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 md:pt-6 h-64 md:h-72">
        <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
          <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.1} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)" }} itemStyle={{ fontSize: "12px", fontWeight: "bold" }} />
            <Line type="monotone" name="Total Skor" dataKey="Overall" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
