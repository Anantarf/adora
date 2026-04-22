"use client";

import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SCORE_MAX } from "@/lib/metrics";

interface PerformanceTrendChartProps {
  trend: { name: string; val: number }[];
  isLoading: boolean;
}

export function PerformanceTrendChart({ trend, isLoading }: PerformanceTrendChartProps) {
  return (
    <Card className="border-border/50 bg-card shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="font-heading text-base uppercase tracking-widest text-foreground">
          Performa Pemain
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Rata-rata nilai bulanan seluruh pemain
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-[220px] pb-6">
        {isLoading ? (
          <Skeleton className="flex-1 w-full rounded-xl" />
        ) : trend.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 w-full gap-3 rounded-xl border border-dashed border-border/50 text-center">
            <TrendingUp className="size-8 text-muted-foreground/30" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Belum Ada Data Performa
            </p>
            <p className="text-xs text-muted-foreground/60">
              Data akan muncul setelah rapor pertama diterbitkan.
            </p>
          </div>
        ) : (
          <div className="flex-1 w-full relative min-h-[200px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--muted-foreground)"
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, SCORE_MAX]}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}
                    formatter={(value) => [value, "Rata-rata Nilai"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#trendGradient)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
