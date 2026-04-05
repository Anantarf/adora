"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import { useGroups } from "@/hooks/use-groups";
import { AddGroupDialog } from "@/components/features/AddGroupDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function GroupsPage() {
  const { data: groups, isLoading, isError } = useGroups();

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Manajemen Grup Latihan</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Tambah dan atur batch kelompok atlet untuk pembagian sesi kehadiran dan evaluasi rapor.</p>
        </div>
        <AddGroupDialog />
      </div>

      {/* Modern Data Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-[80px] text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">No</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Nama Grup</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground text-right">Syarat / Deskripsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-primary font-bold">
                    <Loader2 className="size-5 animate-spin" /> Load data...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-destructive font-medium">
                  Gagal terkoneksi ke server.
                </TableCell>
              </TableRow>
            )}
            {groups?.length === 0 && !isLoading && !isError && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground font-semibold">
                  Belum ada grup yang dibuka. 
                </TableCell>
              </TableRow>
            )}
            {groups?.map((group, idx) => (
              <TableRow key={group.id} className="group hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-semibold text-secondary">{group.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm text-right">{group.description || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/10 text-xs font-medium text-muted-foreground">
          <span>Total {groups?.length || 0} Kelas Aktif</span>
        </div>
      </div>

       <div className="mt-4 flex items-start gap-4 rounded-xl bg-secondary/5 p-4 border border-secondary/10">
        <ShieldAlert className="size-5 text-secondary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <h4 className="text-[10px] uppercase font-semibold tracking-widest text-secondary">Relasi Integral</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">Menghapus Grup akan berdampak pada hilangnya label Kelas di Data Pemain dan Rapor historis *(Cascade Delete)*. Pastikan grup kosong sebelum meminta penghapusan administratif.</p>
        </div>
      </div>
    </div>
  );
}
