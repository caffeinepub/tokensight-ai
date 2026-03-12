import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "./useActor";

export function useTokenCache() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["tokenCache"],
    queryFn: async () => {
      if (!actor) return "";
      try {
        return await actor.getTokenCache();
      } catch {
        return "";
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useIsPremium() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isPremium"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isPremium();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWatchlist() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["watchlist"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getWatchlist();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubscriptionExpiry() {
  const { actor, isFetching } = useActor();
  return useQuery<[bigint] | []>({
    queryKey: ["subscriptionExpiry"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getSubscriptionExpiry();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToWatchlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.addToWatchlist(symbol);
    },
    onSuccess: (_, symbol) => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(`${symbol} added to watchlist`);
    },
    onError: () => {
      toast.error("Failed to update watchlist");
    },
  });
}

export function useRemoveFromWatchlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeFromWatchlist(symbol);
    },
    onSuccess: (_, symbol) => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(`${symbol} removed from watchlist`);
    },
    onError: () => {
      toast.error("Failed to update watchlist");
    },
  });
}

export function useSubscribePremium() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.subscribePremium();
    },
    onSuccess: (result: string) => {
      queryClient.invalidateQueries({ queryKey: ["isPremium"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionExpiry"] });
      toast.success(result || "Premium activated! Welcome to Pro 🚀");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Payment failed. Please try again.");
    },
  });
}
