import { useQuery } from "@tanstack/react-query";
import { fetchActivity } from "@/lib/api";

export function useActivity() {
  return useQuery({
    queryKey: ["activity"],
    queryFn: () => fetchActivity(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
    throwOnError: false,
  });
}
