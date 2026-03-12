import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tokensight_watchlist";

export function useLocalWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    } catch {}
  }, [watchlist]);

  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const isWatched = useCallback(
    (symbol: string) => watchlist.includes(symbol),
    [watchlist],
  );

  return { watchlist, addToWatchlist, removeFromWatchlist, isWatched };
}
