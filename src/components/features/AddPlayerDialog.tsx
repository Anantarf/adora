"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddPlayer } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";

import { toast } from "sonner";
import { BatchPlayerUpload } from "@/components/features/BatchPlayerUpload";
import { playerSchema, type PlayerFormValues } from "@/lib/validation/player";
import { PlayerFormFields } from "@/components/features/PlayerFormFields";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, FileUp, ChevronLeft, ChevronRight } from "lucide-react";

interface AddPlayerDialogProps {
  defaultGroupId?: string;
  defaultGroupName?: string;
}

const STEP_CONFIG: Array<{
  id: number;
  label: string;
  fields: FieldPath<PlayerFormValues>[];
}> = [
  {
    id: 1,
    label: "Data Pribadi",
    fields: ["firstName", "lastName", "placeOfBirth", "dateOfBirth", "groupId", "gender", "religion", "weight", "height", "schoolOrigin"],
  },
  {
    id: 2,
    label: "Kontak",
    fields: ["addressLine1", "addressLine2", "city", "province", "postalCode", "ktpAddress", "phoneNumber", "email", "instagram", "parentName", "parentPhoneNumber", "parentAddress"],
  },
  {
    id: 3,
    label: "Medis dan Dokumen",
    fields: ["hasMedicalCondition", "medicalConditionDetail", "photoUrl", "signatureUrl"],
  },
];

function buildDefaultValues(defaultGroupId?: string): PlayerFormValues {
  return {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    placeOfBirth: "",
    gender: "",
    religion: "",
    weight: "",
    height: "",
    schoolOrigin: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    ktpAddress: "",
    email: "",
    phoneNumber: "",
    instagram: "",
    hasMedicalCondition: false,
    medicalConditionDetail: "",
    parentName: "",
    parentAddress: "",
    parentPhoneNumber: "",
    groupId: defaultGroupId ?? "",
    parentId: "",
    photoUrl: "",
    signatureUrl: "",
  };
}

export function AddPlayerDialog({ defaultGroupId, defaultGroupName }: AddPlayerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [step, setStep] = useState(1);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();

  const { mutateAsync: addPlayer, isPending } = useAddPlayer();
  const defaultValues = useMemo(() => buildDefaultValues(defaultGroupId), [defaultGroupId]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    mode: "onChange",
    defaultValues,
  });

  const onSubmit = async (data: PlayerFormValues) => {
    try {
      await addPlayer({ ...data });
      reset(defaultValues);
      setOpen(false);
      toast.success("Pemain baru berhasil didaftarkan!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan tak dikenal.";
      toast.error("Gagal mendaftarkan pemain: " + msg);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setIsBatchMode(false);
    setStep(1);
    reset(buildDefaultValues(defaultGroupId));
  };

  useEffect(() => {
    if (!open || !defaultGroupId) {
      return;
    }

    setValue("groupId", defaultGroupId, { shouldDirty: false, shouldValidate: false });
  }, [defaultGroupId, open, setValue]);

  const goToStep = async (targetStep: number) => {
    if (targetStep === step) return;
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }

    const currentStepConfig = STEP_CONFIG.find((item) => item.id === step);
    const isValid = await trigger(currentStepConfig?.fields, { shouldFocus: true });
    if (isValid) {
      setStep(targetStep);
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    const firstInvalidStep = STEP_CONFIG.find((item) => item.fields.some((field) => !!formErrors[field]));
    if (firstInvalidStep) {
      setStep(firstInvalidStep.id);
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
          <div className="pt-2 space-y-3">
            <div className="max-h-[60vh] sm:max-h-[65vh] overflow-y-auto overflow-x-hidden pr-2 pb-1 custom-scrollbar">
              <BatchPlayerUpload onDone={() => setOpen(false)} />
            </div>
            <div className="border-t border-border/50 pt-2">
              <Button type="button" variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/50 rounded-lg h-10" onClick={() => setIsBatchMode(false)}>
                Kembali
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 pt-4 relative overflow-hidden">
            <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/80">Langkah {step} dari 3</p>
                  <p className="text-xs text-muted-foreground">{STEP_CONFIG[step - 1]?.label}</p>
                </div>
                {defaultGroupName ? <p className="text-right text-[11px] text-muted-foreground">Kelompok aktif: <span className="font-semibold text-foreground">{defaultGroupName}</span></p> : null}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {STEP_CONFIG.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void goToStep(item.id)}
                    className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                      item.id === step
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/50 bg-card/60 text-muted-foreground hover:border-primary/35"
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-[0.24em]">Step {item.id}</span>
                    <span className="mt-1 block text-xs font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-dialog-sm overflow-y-auto overflow-x-hidden pr-2 pb-2 custom-scrollbar">
              <PlayerFormFields
                register={register}
                control={control}
                errors={errors}
                setValue={setValue}
                groups={groups}
                isGroupsLoading={isGroupsLoading}
                groupFieldHint={defaultGroupName ? `Kelompok dari folder aktif sudah dipilih otomatis. Tetap bisa diganti jika perlu.` : undefined}
                step={step}
              />
            </div>

            <div className="mt-2 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <Button type="button" variant="outline" className="h-10 px-4" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>
                  <ChevronLeft className="mr-2 size-4" /> Kembali
                </Button>
                {step < STEP_CONFIG.length ? (
                  <Button type="button" className="h-10 px-4" onClick={() => void goToStep(step + 1)}>
                    Lanjut <ChevronRight className="ml-2 size-4" />
                  </Button>
                ) : null}
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
                
                <Button type="submit" disabled={isPending || step !== STEP_CONFIG.length} className="flex-1 sm:flex-none h-10 px-6 font-bold tracking-widest uppercase text-xs rounded-lg">
                  {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                  {step === STEP_CONFIG.length ? "Simpan" : "Selesaikan Langkah Dulu"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
