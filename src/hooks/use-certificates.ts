"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCertificatesAction, addCertificateAction, deleteCertificateAction, type CertificateRecord } from "@/actions/certificates";
import { QUERY_KEYS } from "@/lib/constants";

// Hook (GET): Tarik semua sertifikat (Admin)
export const useCertificates = () => {
  return useQuery<CertificateRecord[]>({
    queryKey: QUERY_KEYS.CERTIFICATES,
    queryFn: getCertificatesAction,
    staleTime: 1000 * 60 * 5,
  });
};

// Hook (POST): Tambah sertifikat baru
export const useAddCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; fileUrl: string; playerId?: string; groupId?: string }) => addCertificateAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CERTIFICATES });
    },
  });
};

// Hook (DELETE): Hapus sertifikat
export const useDeleteCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCertificateAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CERTIFICATES });
    },
  });
};
