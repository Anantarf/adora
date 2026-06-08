import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { ObservabilitySnapshot } from "@/lib/observability-snapshot";

export function ObservabilityTable({ data }: { data: ObservabilitySnapshot }) {
  const events = data.recentEvents;

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <p className="text-sm text-muted-foreground">Tidak ada event operasional penting di periode ini.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Tingkat</TableHead>
            <TableHead>Sumber</TableHead>
            <TableHead>Pesan</TableHead>
            <TableHead className="text-right">Durasi / Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="whitespace-nowrap font-medium">
                {format(new Date(event.createdAt), "dd MMM HH:mm:ss", { locale: id })}
              </TableCell>
              <TableCell>
                <Badge variant={event.severity === "ERROR" ? "destructive" : "outline"} className={event.severity === "WARN" ? "border-amber-500 text-amber-500" : ""}>
                  {event.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs">{event.source}</span>
              </TableCell>
              <TableCell className="max-w-[300px] truncate" title={event.message}>
                {event.message}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                {event.durationMs ? `${event.durationMs}ms` : "-"}
                {event.statusCode ? ` / ${event.statusCode}` : ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
