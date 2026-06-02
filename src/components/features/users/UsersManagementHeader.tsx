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

export function UsersManagementHeader({
  searchTerm,
  onSearchTermChange,
  totalAccounts,
  role,
  onRoleChange,
}: UsersManagementHeaderProps) {
  const isParent = role === "PARENT";

  return (
    <>
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-6 md:flex-row md:items-center md:pb-8">
        <p className="text-sm text-muted-foreground">
          {isParent
            ? "Kelola akun orang tua dan akses mereka ke portal pemain."
            : "Kelola akun admin yang memiliki akses ke sistem klub."}
        </p>
        <AddUserDialog role={role} />
      </div>

      <div className="flex w-fit gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
        <button
          onClick={() => onRoleChange("PARENT")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            isParent
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted/40"
          }`}
        >
          Orang Tua
        </button>
        <button
          onClick={() => onRoleChange("ADMIN")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            !isParent
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted/40"
          }`}
        >
          Admin
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="relative w-full flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/75" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Cari nama atau username..."
            className="h-12 rounded-xl border-border/50 bg-card/60 pl-11 font-medium shadow-sm focus:ring-primary/20"
          />
        </div>
        <div className="flex h-12 min-w-40 items-center justify-center gap-2.5 rounded-full border border-border/50 bg-muted/30 px-5 text-xs font-semibold text-foreground shadow-sm">
          <UserCheck2 className="size-4 text-primary" />
          Total Akun: {totalAccounts}
        </div>
      </div>
    </>
  );
}
