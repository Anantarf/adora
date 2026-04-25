"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserCircle, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProfileForm } from "./ProfileForm";

export function ProfileDialog() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) return null;

  const initialData = {
    name: session.user.name || "",
    email: session.user.email || "",
    username: session.user.username || "",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all px-3 py-2 rounded-md hover:bg-secondary/10"
          >
            <UserCircle className="size-5" />
            <span className="hidden sm:inline">Profil</span>
          </button>
        }
      />
      <DialogContent className="sm:max-w-2xl bg-card border-border/50 overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-b border-border/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
              <Settings2 className="size-6 text-primary" />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle className="text-2xl font-heading uppercase tracking-widest text-foreground">
                Pengaturan <span className="text-primary">Profil</span>
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-wider opacity-60">
                Kelola identitas & keamanan akun keluarga
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <ProfileForm 
            initialData={initialData} 
            onSuccess={() => setOpen(false)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
