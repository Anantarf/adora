"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PencilLine } from "lucide-react";

import { useUpdateUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UserItem } from "./UserAccountCard";

const schema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong"),
  username: z
    .string()
    .min(4, "Username minimal 4 karakter")
    .regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, dan underscore"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutateAsync: updateUser, isPending } = useUpdateUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    reset({
      name: user.name ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
    });
  }, [reset, user]);

  if (!user) {
    return null;
  }

  const onSubmit = async (values: FormValues) => {
    await updateUser({
      id: user.id,
      data: {
        name: values.name.trim(),
        username: values.username.trim(),
        email: values.email?.trim() || undefined,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <PencilLine className="size-5 text-primary" />
            Edit Akun
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Perbarui informasi dasar akun tanpa mengubah peran atau data lainnya.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="edit-user-name" className="ml-1 text-xs font-medium text-muted-foreground">
              Nama Lengkap
            </label>
            <Input
              id="edit-user-name"
              {...register("name")}
              className="h-11 rounded-xl border-border/50 bg-background/50"
            />
            {errors.name ? <p className="ml-1 text-xs font-medium text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-user-username" className="ml-1 text-xs font-medium text-muted-foreground">
              Username
            </label>
            <Input
              id="edit-user-username"
              {...register("username")}
              className="h-11 rounded-xl border-border/50 bg-background/50"
            />
            {errors.username ? <p className="ml-1 text-xs font-medium text-destructive">{errors.username.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-user-email" className="ml-1 text-xs font-medium text-muted-foreground">
              Email
            </label>
            <Input
              id="edit-user-email"
              {...register("email")}
              className="h-11 rounded-xl border-border/50 bg-background/50"
              placeholder="opsional@contoh.com"
            />
            {errors.email ? <p className="ml-1 text-xs font-medium text-destructive">{errors.email.message}</p> : null}
          </div>

          <Button type="submit" disabled={isPending} className="h-11 w-full rounded-xl">
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
