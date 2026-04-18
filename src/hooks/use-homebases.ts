import { useQuery } from "@tanstack/react-query";
import { getPublicHomebases } from "@/actions/homebase";
import { QUERY_KEYS } from "@/lib/constants";

export const useHomebases = () =>
  useQuery({
    queryKey: QUERY_KEYS.HOMEBASES,
    queryFn: async () => {
      const data = await getPublicHomebases();
      return data.map((h) => ({ id: h.id, name: h.name }));
    },
    staleTime: 1000 * 60 * 30, // homebases jarang berubah
  });
