import { useQuery } from "@tanstack/react-query";
import { getPublicHomebases } from "@/actions/homebase";

export const useHomebases = () =>
  useQuery({
    queryKey: ["homebases"],
    queryFn: async () => {
      const data = await getPublicHomebases();
      return data.map((h) => ({ id: h.id, name: h.name }));
    },
    staleTime: 1000 * 60 * 30, // homebases jarang berubah
  });
