import { Metadata } from "next";
import { getObservabilitySnapshotAction } from "@/actions/observability";
import { ObservabilityStats } from "@/components/admin/observability-stats";
import { ObservabilityTable } from "@/components/admin/observability-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Observability | Adora BBC",
  description: "Pantau kesehatan sistem operasional.",
};

export default async function ObservabilityPage({
  searchParams,
}: {
  searchParams?: Promise<{ window?: string }>;
}) {
  const resolvedParams = await searchParams;
  const windowHours = resolvedParams?.window ? parseInt(resolvedParams.window, 10) : 24;
  
  const data = await getObservabilitySnapshotAction({ windowHours });

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Observability Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Pantau log kesalahan, timeout database, dan performa web vitals sistem.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Link href={`/dashboard/observability?window=${windowHours}`} className="flex items-center">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Segarkan Data
            </Link>
          </Button>
        </div>
      </div>

      <ObservabilityStats data={data} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-7">
          <CardHeader>
            <CardTitle>Kejadian Operasional Terbaru</CardTitle>
            <CardDescription>
              Menampilkan {data.recentEvents.length} log `WARN` dan `ERROR` terakhir dalam {windowHours} jam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ObservabilityTable data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
