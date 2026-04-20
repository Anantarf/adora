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
import { Plus, Loader2, FileUp } from "lucide-react";

export function AddPlayerDialog() {
  const [open, setOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [step, setStep] = useState(1);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { mutateAsync: addPlayer, isPending } = useAddPlayer();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<PlayerFormValues>({ resolver: zodResolver(playerSchema), mode: "onChange" });

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
    if (!nextOpen) {
      setIsBatchMode(false);
      setStep(1);
    }
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
              Kembali
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 relative overflow-hidden">
            <div className="max-h-dialog-sm overflow-y-auto overflow-x-hidden pr-2 pb-2 scrollbar-thin">
              <PlayerFormFields register={register} control={control} errors={errors} groups={groups} isGroupsLoading={isGroupsLoading} step={step} />
            </div>

            <div className="mt-2 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
                {[1, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(s)}
                    className={`h-10 w-12 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-base ${
                      s === step
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 sm:flex-none h-10 px-4 text-xs font-medium text-muted-foreground border-dashed border-muted-foreground/30 hover:border-primary/50 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" 
                  onClick={() => setIsBatchMode(true)}
                >
                  <FileUp className="size-3.5 mr-2 shrink-0" />
                  Unggah Excel (Banyak Pemain)
                </Button>
                
                <Button type="submit" disabled={!isValid || isPending} className={`flex-1 sm:flex-none h-10 px-6 font-bold tracking-widest uppercase text-xs shadow-lg rounded-lg ${isValid ? "shadow-primary/20" : ""}`}>
                  {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                  Simpan
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
