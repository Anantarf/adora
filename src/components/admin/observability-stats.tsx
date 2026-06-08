import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, XCircle, ActivitySquare } from "lucide-react";
import type { ObservabilitySnapshot } from "@/lib/observability-snapshot";

export function ObservabilityStats({ data }: { data: ObservabilitySnapshot }) {
  const { totals, windowHours } = data;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sistem Error ({windowHours}j)</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totals.errorEvents}</div>
          <p className="text-xs text-muted-foreground">
            Insiden error atau unhandled exception
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Peringatan ({windowHours}j)</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totals.warnEvents}</div>
          <p className="text-xs text-muted-foreground">
            Peringatan timeout atau rate limit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bad Web Vitals ({windowHours}j)</CardTitle>
          <ActivitySquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totals.badWebVitals}</div>
          <p className="text-xs text-muted-foreground">
            Laporan skor LCP/CLS buruk
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
