"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsersAction, createUserAction, updateUserAction, resetPasswordAction, deleteUserAction, updateSelfAction, getParentUsersAction } from "@/actions/users";
import { QUERY_KEYS } from "@/lib/constants";
import { toast } from "sonner";

type UsersList = Awaited<ReturnType<typeof getUsersAction>>;
type CreateUserInput = Parameters<typeof createUserAction>[0];
type DeleteUserInput = Parameters<typeof deleteUserAction>[0];
type UpdateSelfInput = Parameters<typeof updateSelfAction>[0];

export const useUsers = (role: "PARENT" | "ADMIN" = "PARENT") => {
  return useQuery<UsersList>({
    queryKey: QUERY_KEYS.USERS(role),
    queryFn: () => getUsersAction(role),
  });
};

export const useAddUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUserAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS_BASE });
      toast.success("Akun orang tua berhasil dibuat!");
    },
    onError: () => {
      toast.error("Gagal membuat akun. Periksa kembali data yang dimasukkan.");
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateUserAction>[1] }) => updateUserAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS_BASE });
      toast.success("Data akun diperbarui!");
    },
    onError: () => {
      toast.error("Gagal memperbarui akun. Silakan coba kembali.");
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword?: string }) => resetPasswordAction(id, newPassword),
    onSuccess: (res) => {
      toast.success(res.message);
    },
    onError: () => {
      toast.error("Gagal me-reset kata sandi. Silakan coba kembali.");
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS_BASE });
      toast.success("Akun berhasil dihapus.");
    },
    onError: () => {
      toast.error("Gagal menghapus akun. Pastikan tidak ada data pemain yang tertaut.");
    },
  });
};

export function useParents() {
  return useQuery({
    queryKey: QUERY_KEYS.PARENTS,
    queryFn: getParentUsersAction,
    staleTime: 1000 * 60 * 5,
  });
}

export const useUpdateSelf = () => {
  return useMutation({
    mutationFn: updateSelfAction,
    onSuccess: () => {
      toast.success("Profil Anda berhasil diperbarui!");
    },
    onError: () => {
      toast.error("Gagal memperbarui profil. Periksa kembali data yang dimasukkan.");
    },
  });
};
