"use client";


import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { KeyRound, LogOut, User, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateSelfAction } from "@/actions/users";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Sandi baru minimal 6 karakter."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi sandi tidak cocok.",
    path: ["confirmPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = (data: ChangePasswordForm) => {
    startTransition(async () => {
      try {
        await updateSelfAction({ password: data.newPassword });
        toast.success("Sandi berhasil diperbarui.");
        reset();
        onClose();
      } catch (e: any) {
        toast.error(e.message || "Gagal memperbarui sandi.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase flex items-center gap-2">
            <KeyRound className="size-5 text-primary" /> Ubah Kata Sandi
          </DialogTitle>
          <DialogDescription className="text-xs font-medium tracking-wide opacity-70">
            Sandi baru langsung berlaku setelah disimpan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Sandi Baru
            </label>
            <Input
              {...register("newPassword")}
              type="password"
              placeholder="Minimal 6 karakter"
              className="h-11 bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary/50"
            />
            {errors.newPassword && (
              <p className="text-destructive text-[10px] font-bold uppercase ml-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Konfirmasi Sandi
            </label>
            <Input
              {...register("confirmPassword")}
              type="password"
              placeholder="Ulangi sandi baru"
              className="h-11 bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary/50"
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-[10px] font-bold uppercase ml-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest uppercase text-xs rounded-xl shadow-sm"
          >
            {isPending ? "Menyimpan..." : "Simpan Sandi Baru"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserProfileMenu({ variant = "header" }: { variant?: "header" | "sidebar" }) {
  const { data: session } = useSession();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const username = session?.user?.username || "ADMIN";
  const initials = username.slice(0, 2).toUpperCase();

  if (variant === "sidebar") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-left outline-none group">
            <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px] tracking-widest shrink-0 group-hover:bg-primary/20 transition-colors">
              {initials}
            </div>
            <div className="flex flex-col flex-1 min-w-0 leading-none group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-heading font-bold text-foreground truncate">{username}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5">Pengaturan Akun</span>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground/50 group-hover:text-primary group-data-[collapsible=icon]:hidden shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56 bg-card border-border/50 rounded-xl shadow-xl ml-2">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Masuk sebagai</span>
                <span className="text-sm font-heading font-bold text-foreground">{username}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={() => setChangePasswordOpen(true)}
              className="gap-2.5 px-3 py-2 rounded-lg mx-1 cursor-pointer text-xs font-semibold tracking-wide hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
            >
              <KeyRound className="size-3.5" /> Ubah Kata Sandi
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs tracking-widest hover:bg-primary/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          {initials}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-card border-border/50 rounded-xl shadow-xl">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Masuk sebagai</span>
              <span className="text-sm font-heading font-bold text-foreground">{username}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            onClick={() => setChangePasswordOpen(true)}
            className="gap-2.5 px-3 py-2 rounded-lg mx-1 cursor-pointer text-xs font-semibold tracking-wide hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
          >
            <KeyRound className="size-3.5" /> Ubah Kata Sandi
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </>
  );
}
