"use client";

import { Search, UserCheck2 } from "lucide-react";
import { AddUserDialog } from "@/components/features/AddUserDialog";
import { Input } from "@/components/ui/input";

type UsersManagementHeaderProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  totalAccounts: number;
  role: "PARENT" | "ADMIN";
  onRoleChange: (role: "PARENT" | "ADMIN") => void;
};

export function UsersManagementHeader({ searchTerm, onSearchTermChange, totalAccounts, role, onRoleChange }: UsersManagementHeaderProps) {
  const isParent = role === "PARENT";
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-4xl font-heading uppercase tracking-widest text-foreground">Manajemen Akun</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">{isParent ? "Kelola akun orang tua dan akses mereka ke portal pemain." : "Kelola akun admin yang memiliki akses ke sistem manajemen klub."}</p>
        </div>
        <AddUserDialog role={role} />
      </div>

      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl w-fit border border-border/50">
        <button onClick={() => onRoleChange("PARENT")} className={`px-4 py-2 rounded-lg text-micro transition-all ${isParent ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted"}`}>
          Orang Tua
        </button>
        <button onClick={() => onRoleChange("ADMIN")} className={`px-4 py-2 rounded-lg text-micro transition-all ${!isParent ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted"}`}>
          Admin
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75" />
          <Input value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)} placeholder="Cari nama atau username..." className="pl-11 h-12 bg-card/60 border-border/50 rounded-pill shadow-sm font-medium focus:ring-primary/20" />
        </div>
        <div className="px-5 h-12 flex items-center gap-2.5 bg-muted/30 border border-border/50 text-foreground rounded-full font-bold text-micro min-w-40 justify-center shadow-sm">
          <UserCheck2 className="size-4 text-primary" /> Total Akun: {totalAccounts}
        </div>
      </div>
    </>
  );
}
