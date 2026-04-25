"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeForcedPasswordAction } from "@/actions/users";

export function ForcePasswordDialog({ isOpen }: { isOpen: boolean }) {
  const { update } = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error("Kata Sandi Terlalu Singkat", {
        description: "Password baru minimal terdiri dari 8 karakter."
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Kata Sandi Tidak Cocok", {
        description: "Konfirmasi password harus sama persis dengan password baru."
      });
      return;
    }

    setIsLoading(true);
    try {
      await changeForcedPasswordAction(password);
      toast.success("Kata Sandi Diperbarui", {
        description: "Password Anda berhasil diubah. Mengamankan sesi..."
      });
      // Force NextAuth to refresh the JWT and session so mustChangePassword becomes false
      await update({ mustChangePassword: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mengubah password.";
      toast.error("Gagal", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md" 
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-col items-center text-center pb-4">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-heading uppercase tracking-widest text-primary">
            Keamanan Akun
          </DialogTitle>
          <DialogDescription className="text-sm">
            Akun Anda menggunakan kata sandi bawaan atau baru saja di-reset. Untuk melindungi keamanan data Anda, silakan buat kata sandi baru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Kata sandi baru (min. 8 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-4"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Konfirmasi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 pr-4"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full font-bold uppercase tracking-widest" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              "Simpan Password & Lanjutkan"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
