"use client";
import { unwrapAction } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getUsersAction,
    createUserAction,
    updateUserAction,
    resetPasswordAction,
    deleteUserAction,
    updateSelfAction,
} from "@/actions/users";
import { toast } from "sonner";

/**
 * ADORA Basketball - Global User Hooks (Admin Only)
 * Leverages React Query 5 for caching and optimistic updates.
 */

export const useUsers = (role: "PARENT" | "ADMIN" = "PARENT") => {
  return useQuery({
    queryKey: ["users", role],
    queryFn: () => getUsersAction(role),
  });
};

export const useAddUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createUserAction(data).then(unwrapAction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Akun orang tua berhasil dibuat!");
    },
    onError: (err: Error) => {
      toast.error(`Gagal membuat akun: ${err.message}`);
    }
  });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateUserAction>[1] }) => updateUserAction(id, data).then(unwrapAction),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.success("Data akun diperbarui!");
      },
      onError: (err: Error) => {
        toast.error(`Gagal memperbarui: ${err.message}`);
      }
    });
};

export const useResetPassword = () => {
    return useMutation({
      mutationFn: ({ id, newPassword }: { id: string; newPassword?: string }) => resetPasswordAction(id, newPassword).then(unwrapAction),
      onSuccess: (res) => {
        toast.success(res.message);
      },
      onError: (err: Error) => {
        toast.error(`Reset gagal: ${err.message}`);
      }
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: any) => deleteUserAction(data).then(unwrapAction),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.success("Akun berhasil dihapus.");
      },
      onError: (err: Error) => {
        toast.error(`Hapus gagal: ${err.message}`);
      }
    });
};

export const useUpdateSelf = () => {
  return useMutation({
    mutationFn: (data: any) => updateSelfAction(data).then(unwrapAction),
    onSuccess: () => {
      toast.success("Profil Anda berhasil diperbarui!");
    },
    onError: (err: Error) => {
      toast.error(`Gagal update profil: ${err.message}`);
    }
  });
};
