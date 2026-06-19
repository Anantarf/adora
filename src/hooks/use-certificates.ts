"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCertificatesAction, addCertificateAction, deleteCertificateAction, getPlayerCertificatesAction, type CertificateRecord } from "@/actions/certificates";
import { QUERY_KEYS } from "@/lib/constants";

// Hook (GET): Tarik semua sertifikat (Admin)
export function useCertificates() {
  return useQuery<CertificateRecord[]>({
    queryKey: QUERY_KEYS.CERTIFICATES,
    queryFn: getCertificatesAction,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook (POST): Tambah sertifikat baru
export function useAddCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; fileUrl: string; playerId: string }) => addCertificateAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CERTIFICATES });
    },
  });
}

// Hook (DELETE): Hapus sertifikat
export function useDeleteCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCertificateAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CERTIFICATES });
    },
  });
}

export function usePlayerCertificates(
  playerId: string | null,
  options?: {
    initialData?: Awaited<ReturnType<typeof getPlayerCertificatesAction>>;
    initialDataUpdatedAt?: number;
  },
) {
  return useQuery({
    queryKey: ["player-certificates", playerId],
    queryFn: () => getPlayerCertificatesAction(playerId!),
    enabled: Boolean(playerId),
    staleTime: 1000 * 60 * 5,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialDataUpdatedAt,
  });
}
