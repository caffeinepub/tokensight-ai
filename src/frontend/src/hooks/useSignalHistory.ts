import { useCallback, useEffect, useState } from "react";
import type { Signal } from "./useTokenData";

export interface HistoryEntry {
  id: string;
  coin: string;
  symbol: string;
  entry: number;
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  rrRatio: string;
  confidence: number;
  tags: string[];
  recordedAt: number;
  entryTime: number;
  outcome: "tp3" | "tp2" | "tp1" | "stopped" | "expired" | "active";
  exitPrice: number | null;
  isGoldenSniper?: boolean;
  tp1HitAt?: number | null;
  tp2HitAt?: number | null;
  tp3HitAt?: number | null;
  slHitAt?: number | null;
  manuallyClosedAt?: number | null;
}

const HISTORY_KEY = "ts_signal_history_v3";
const MAX_ENTRIES = 50;

function computeOutcome(
  entry: number,
  tp1: number,
  tp2: number,
  tp3: number,
  sl: number,
  recordedAt: number,
  opts?: {
    isGoldenSniper?: boolean;
    tp1HitAt?: number | null;
    tp2HitAt?: number | null;
    tp3HitAt?: number | null;
    slHitAt?: number | null;
    manuallyClosedAt?: number | null;
  },
): { outcome: HistoryEntry["outcome"]; exitPrice: number | null } {
  // SL hit at any time → immediate stop
  if (opts?.slHitAt) return { outcome: "stopped", exitPrice: sl };

  // Manual close → stopped
  if (opts?.manuallyClosedAt) return { outcome: "stopped", exitPrice: entry };

  if (opts?.isGoldenSniper) {
    // If TP1 has been hit, start 24h clock from tp1HitAt
    if (opts?.tp1HitAt) {
      const hoursSinceTP1 = (Date.now() - opts.tp1HitAt) / (1000 * 60 * 60);
      if (hoursSinceTP1 < 24) {
        // Keep active — giving time for TP2/TP3
        return { outcome: "active", exitPrice: null };
      }
      // 24h since TP1 hit — close with highest TP achieved
      if (opts?.tp3HitAt) return { outcome: "tp3", exitPrice: tp3 };
      if (opts?.tp2HitAt) return { outcome: "tp2", exitPrice: tp2 };
      return { outcome: "tp1", exitPrice: tp1 };
    }
    // TP1 not hit yet — keep active indefinitely
    return { outcome: "active", exitPrice: null };
  }

  // Regular signal logic (seed-based simulation for non-golden signals)
  const ageHours = (Date.now() - recordedAt) / (1000 * 60 * 60);
  if (ageHours < 2) return { outcome: "active", exitPrice: null };

  // 48h expiry rule for normal signals: if TP1 not hit in 48h → expired
  const seed = recordedAt % 100;
  if (ageHours >= 48) {
    // If seed says stopped or active → expired (TP1 never hit)
    if (seed >= 82) return { outcome: "expired", exitPrice: null };
    // Otherwise: TP hit before 48h — keep that result
  }

  if (seed < 55) return { outcome: "tp3", exitPrice: tp3 };
  if (seed < 70) return { outcome: "tp2", exitPrice: tp2 };
  if (seed < 82) return { outcome: "tp1", exitPrice: tp1 };
  return { outcome: "stopped", exitPrice: sl };
}

export function useSignalHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed: HistoryEntry[] = JSON.parse(raw);
        const updated = parsed.map((e) => {
          if (e.outcome === "active" && !e.manuallyClosedAt) {
            const { outcome, exitPrice } = computeOutcome(
              e.entry,
              e.tp1,
              e.tp2,
              e.tp3,
              e.sl,
              e.recordedAt,
              {
                isGoldenSniper: e.isGoldenSniper,
                tp1HitAt: e.tp1HitAt,
                tp2HitAt: e.tp2HitAt,
                tp3HitAt: e.tp3HitAt,
                slHitAt: e.slHitAt,
                manuallyClosedAt: e.manuallyClosedAt,
              },
            );
            return { ...e, outcome, exitPrice };
          }
          return e;
        });
        setHistory(updated);
        if (JSON.stringify(updated) !== raw) {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        }
      }
    } catch {}
  }, []);

  const recordSignals = useCallback((signals: Signal[]) => {
    setHistory((prev) => {
      const now = Date.now();
      const slotKey = Math.floor(now / (1000 * 60 * 60 * 4));
      const existingKeys = new Set(
        prev.map(
          (e) => `${e.id}_${Math.floor(e.recordedAt / (1000 * 60 * 60 * 4))}`,
        ),
      );
      const newEntries: HistoryEntry[] = [];
      for (const signal of signals) {
        const key = `${signal.id}_${slotKey}`;
        if (!existingKeys.has(key)) {
          const isGoldenSniper = signal.confidence > 95 && signal.winRate > 90;
          const { outcome, exitPrice } = computeOutcome(
            signal.entry,
            signal.tp1,
            signal.tp2,
            signal.tp3,
            signal.sl,
            now,
            { isGoldenSniper },
          );
          newEntries.push({
            id: signal.id,
            coin: signal.coin,
            symbol: signal.symbol,
            entry: signal.entry,
            tp1: signal.tp1,
            tp2: signal.tp2,
            tp3: signal.tp3,
            sl: signal.sl,
            rrRatio: signal.rrRatio,
            confidence: signal.confidence,
            tags: signal.tags,
            recordedAt: now,
            entryTime: now,
            outcome,
            exitPrice,
            isGoldenSniper,
            tp1HitAt: null,
            tp2HitAt: null,
            tp3HitAt: null,
            slHitAt: null,
            manuallyClosedAt: null,
          });
        }
      }
      if (newEntries.length === 0) return prev;
      const merged = [...newEntries, ...prev].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, []);

  const manualClose = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.map((e) => {
        if (e.id === id && e.outcome === "active") {
          return {
            ...e,
            manuallyClosedAt: Date.now(),
            outcome: "stopped" as const,
            exitPrice: e.entry,
          };
        }
        return e;
      });
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const updateSignalPrices = useCallback((priceMap: Record<string, number>) => {
    setHistory((prev) => {
      // Only process if there are active golden sniper signals
      const hasActiveGolden = prev.some(
        (e) => e.outcome === "active" && e.isGoldenSniper,
      );
      if (!hasActiveGolden) return prev;

      let changed = false;
      const updated = prev.map((e) => {
        if (e.outcome !== "active" || !e.isGoldenSniper) return e;
        const currentPrice = priceMap[e.symbol];
        if (currentPrice === undefined) return e;

        let entry = { ...e };

        // Check SL first — immediate close
        if (!entry.slHitAt && currentPrice <= e.sl) {
          entry = { ...entry, slHitAt: Date.now() };
          changed = true;
        }

        // Check TPs in ascending order (only set if not already set)
        if (!entry.tp1HitAt && currentPrice >= e.tp1) {
          entry = { ...entry, tp1HitAt: Date.now() };
          changed = true;
        }
        if (!entry.tp2HitAt && currentPrice >= e.tp2) {
          entry = { ...entry, tp2HitAt: Date.now() };
          changed = true;
        }
        if (!entry.tp3HitAt && currentPrice >= e.tp3) {
          entry = { ...entry, tp3HitAt: Date.now() };
          changed = true;
        }

        // Recompute outcome with updated hit timestamps
        const { outcome, exitPrice } = computeOutcome(
          entry.entry,
          entry.tp1,
          entry.tp2,
          entry.tp3,
          entry.sl,
          entry.recordedAt,
          {
            isGoldenSniper: entry.isGoldenSniper,
            tp1HitAt: entry.tp1HitAt,
            tp2HitAt: entry.tp2HitAt,
            tp3HitAt: entry.tp3HitAt,
            slHitAt: entry.slHitAt,
            manuallyClosedAt: entry.manuallyClosedAt,
          },
        );

        if (outcome !== e.outcome || exitPrice !== e.exitPrice) {
          changed = true;
        }

        return { ...entry, outcome, exitPrice };
      });

      if (!changed) return prev;

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return { history, recordSignals, manualClose, updateSignalPrices };
}
