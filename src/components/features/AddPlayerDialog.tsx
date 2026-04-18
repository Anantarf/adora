"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddPlayer } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { toast } from "sonner";
import { BatchPlayerUpload } from "@/components/features/BatchPlayerUpload";
import { playerSchema, type PlayerFormValues } from "@/lib/validation/player";
import { PlayerFormFields } from "@/components/features/PlayerFormFields";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

export function AddPlayerDialog() {
  const [open, setOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { mutateAsync: addPlayer, isPending } = useAddPlayer();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<PlayerFormValues>({ resolver: zodResolver(playerSchema) });

  const onSubmit = async (data: PlayerFormValues) => {
    try {
      await addPlayer(data);
      reset();
      setOpen(false);
      toast.success("Pemain baru berhasil didaftarkan!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan tak dikenal.";
      toast.error("Gagal menambahkan pemain: " + msg);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setIsBatchMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="xl" className="w-full sm:w-auto">
            <Plus className="size-4" /> Tambah Pemain
          </Button>
        }
      />

      <DialogContent className={`${isBatchMode ? "sm:max-w-2xl" : "sm:max-w-3xl"} bg-card border-border/50`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-foreground tracking-wide">
            {isBatchMode ? "Tambah Banyak Pemain" : "Registrasi Pemain Baru"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isBatchMode ? "Unggah berkas Excel, periksa datanya, lalu simpan." : "Masukkan data pemain satu per satu."}
          </DialogDescription>
        </DialogHeader>

        {isBatchMode ? (
          <div className="pt-4">
            <BatchPlayerUpload onDone={() => setOpen(false)} />
            <Button variant="ghost" className="w-full mt-4 text-sm font-medium text-muted-foreground" onClick={() => setIsBatchMode(false)}>
              Kembali ke Input Manual
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <PlayerFormFields register={register} control={control} errors={errors} groups={groups} isGroupsLoading={isGroupsLoading} />

            <div className="pt-6 flex flex-col gap-2">
              <Button type="submit" disabled={isPending} className="w-full h-10 font-semibold text-sm">
                {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                Simpan Data
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsBatchMode(true)}>
                Unggah Banyak Pemain (File Excel)
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
