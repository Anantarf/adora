"use client";

import { Search, UserCheck2 } from "lucide-react";
import { AddUserDialog } from "@/components/features/AddUserDialog";
import { Input } from "@/components/ui/input";

type UsersManagementHeaderProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  totalAccounts: number;
};

export function UsersManagementHeader({ searchTerm, onSearchTermChange, totalAccounts }: UsersManagementHeaderProps) {
  return (
    <>
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
        <div className="space-y-1">
          <h1 className="text-4xl font-heading uppercase tracking-widest text-foreground">Akses Akun</h1>
          <p className="text-muted-foreground font-medium max-w-lg border-l-2 border-primary/40 pl-4 py-1 tracking-wide">Manajemen hak akses akun orang tua.</p>
        </div>
        <AddUserDialog />
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Cari nama, username, atau email..."
            className="pl-11 h-12 bg-card/60 border-border/50 rounded-[1.2rem] shadow-sm font-medium focus:ring-primary/20"
          />
        </div>
        <div className="px-6 h-12 flex items-center gap-3 bg-secondary text-secondary-foreground rounded-[1.2rem] font-bold text-[10px] uppercase tracking-widest min-w-50 justify-center shadow-lg transition-transform hover:scale-[1.02]">
          <UserCheck2 className="size-4 text-primary" /> Total Akun: {totalAccounts}
        </div>
      </div>
    </>
  );
}
