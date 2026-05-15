import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBuddyReads, fetchBuddyReadMessages, postBuddyReadMessage } from "@/lib/api";

export function useBuddyRooms() {
  return useQuery({
    queryKey: ["buddy-rooms"],
    queryFn: () => fetchBuddyReads(),
    staleTime: 30_000,
    throwOnError: false,
  });
}

export function useBuddyMessages(roomId: string | null) {
  return useQuery({
    queryKey: ["buddy-messages", roomId],
    queryFn: () => fetchBuddyReadMessages(roomId!),
    enabled: roomId !== null,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    throwOnError: false,
  });
}

export function useSendBuddyMessage(roomId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postBuddyReadMessage(roomId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buddy-messages", roomId] });
    },
  });
}
