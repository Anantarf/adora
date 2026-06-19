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
import { normalizeDateInputToISO } from "@/lib/date-utils";
import { toUserErrorMessage } from "@/lib/utils";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, FileUp, ChevronLeft, ChevronRight, X } from "lucide-react";

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
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
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
    formState: { errors, isDirty },
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    mode: "onChange",
    defaultValues,
  });

  const onSubmit = async (data: PlayerFormValues) => {
    try {
      await addPlayer({ ...data, dateOfBirth: normalizeDateInputToISO(data.dateOfBirth) });
      setConfirmDiscardOpen(false);
      setOpen(false);
      setIsBatchMode(false);
      setStep(1);
      reset(defaultValues);
      toast.success("Pemain baru berhasil didaftarkan!");
    } catch (error) {
      toast.error(toUserErrorMessage(error, "Gagal mendaftarkan pemain."));
    }
  };

  const resetDialogState = () => {
    setIsBatchMode(false);
    setStep(1);
    setConfirmDiscardOpen(false);
    reset(buildDefaultValues(defaultGroupId));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialogState();
    }
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
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button size="xl" className="w-full sm:w-auto">
              <Plus className="size-4" /> Tambah Pemain
            </Button>
          }
        />

        <DialogContent showCloseButton={false} className={`${isBatchMode ? "sm:max-w-2xl" : "sm:max-w-3xl"} bg-card border-border/50 max-h-[92vh] flex flex-col`}>
          <DialogHeader className="border-b border-border/50 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 pr-2">
              <DialogTitle className="text-xl font-heading text-foreground tracking-wide">
                {isBatchMode ? "Tambah Banyak Pemain" : "Registrasi Pemain Baru"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isBatchMode ? "Unggah berkas Excel, periksa datanya, lalu simpan." : "Masukkan data pemain satu per satu."}
              </DialogDescription>
              </div>
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                  />
                }
              >
                <X className="size-4" />
                <span className="sr-only">Tutup dialog</span>
              </DialogClose>
            </div>
            {!isBatchMode && (
              <div className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-dashed border-muted-foreground/30 px-3 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  onClick={() => setIsBatchMode(true)}
                >
                  <FileUp className="size-3.5 mr-1.5 shrink-0" />
                  Unggah Excel
                </Button>
              </div>
            )}
          </DialogHeader>

          {isBatchMode ? (
            <div className="pt-2 space-y-3 flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2 pb-1 custom-scrollbar">
                <BatchPlayerUpload onDone={() => setOpen(false)} />
              </div>
              <div className="border-t border-border/50 pt-2">
                <Button type="button" variant="ghost" className="h-10 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50" onClick={() => setIsBatchMode(false)}>
                  Kembali
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1 min-h-0 flex flex-col space-y-4 pt-4 relative overflow-hidden">
              <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/40 px-4 py-3 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium tracking-wide text-primary">
                        Langkah {step}/3
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {STEP_CONFIG[step - 1]?.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {STEP_CONFIG.map((item) => {
                        const isActive = item.id === step;
                        const isCompleted = item.id < step;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={item.id > step}
                            onClick={() => void goToStep(item.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed ${
                              isActive
                                ? "border-primary bg-primary/10 text-primary"
                                : isCompleted
                                  ? "border-primary/30 bg-primary/5 text-primary/90"
                                  : "border-border/50 bg-card text-muted-foreground"
                            }`}
                          >
                            <span
                              className={`inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : isCompleted
                                    ? "bg-primary/15 text-primary"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isCompleted ? (
                                <svg
                                  className="size-2.5 stroke-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                item.id
                              )}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {defaultGroupName ? (
                    <div className="rounded-full border border-primary/10 bg-primary/10 px-2.5 py-1">
                      <p className="text-[10px] font-medium text-muted-foreground">
                        Kelompok: <span className="font-bold text-primary">{defaultGroupName}</span>
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2 pb-2 custom-scrollbar">
                <PlayerFormFields
                  register={register}
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  groups={groups}
                  isGroupsLoading={isGroupsLoading}
                  groupFieldHint={defaultGroupName ? `Kelompok dari folder ini sudah dipilih otomatis, namun bisa diubah.` : undefined}
                  step={step}
                />
              </div>

              <div className="mt-2 pt-4 border-t border-border/50 flex flex-row items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-4 rounded-xl"
                  disabled={step === 1}
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="mr-2 size-4" /> Kembali
                </Button>

                <div className="flex gap-2">
                  {step < STEP_CONFIG.length ? (
                    <Button
                      type="button"
                      className="h-10 rounded-xl px-5 text-sm font-semibold"
                      onClick={() => void goToStep(step + 1)}
                    >
                      Lanjut <ChevronRight className="ml-2 size-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-10 px-6 font-bold tracking-widest uppercase text-xs rounded-xl"
                    >
                      {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                      Simpan
                    </Button>
                  )}
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent className="sm:max-w-md bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-heading tracking-wide text-foreground">Batalkan Input Pemain?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Data yang sudah Anda isi di form ini akan hilang jika dialog ditutup sekarang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="h-10 font-semibold border-border/50">
              Lanjut Isi
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="h-10 font-semibold"
              onClick={() => {
                setOpen(false);
                resetDialogState();
              }}
            >
              Tutup Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
