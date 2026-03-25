/**
 * TokenSight AI — Backend Signal Sync v2
 * Canister = single source of truth for signals + ML patterns.
 */

import { createActorWithConfig } from "../config";
import type { SwingHistoryEntry, SwingSignal } from "./swingEngine";

let _lastPushedUpdate = 0;

async function getActor() {
  return createActorWithConfig();
}

export async function pullSignalsFromCanister(): Promise<SwingSignal[] | null> {
  try {
    const actor = await getActor();
    const json = await actor.getSignals();
    if (!json || json === "[]") return null;
    const parsed = JSON.parse(json) as SwingSignal[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function pushSignalsToCanister(
  signals: SwingSignal[],
): Promise<void> {
  try {
    const actor = await getActor();
    await actor.putSignals(JSON.stringify(signals));
  } catch {}
}

export async function pullHistoryFromCanister(): Promise<
  SwingHistoryEntry[] | null
> {
  try {
    const actor = await getActor();
    const json = await actor.getSignalHistory();
    if (!json || json === "[]") return null;
    const parsed = JSON.parse(json) as SwingHistoryEntry[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function pushHistoryToCanister(
  history: SwingHistoryEntry[],
): Promise<void> {
  try {
    const actor = await getActor();
    await actor.putSignalHistory(JSON.stringify(history));
  } catch {}
}

export async function getCanisterLastUpdate(): Promise<bigint> {
  try {
    const actor = await getActor();
    return await actor.getLastSignalUpdate();
  } catch {
    return 0n;
  }
}

export async function pullFromCanister(): Promise<{
  signals: SwingSignal[];
  history: SwingHistoryEntry[];
} | null> {
  try {
    const [canisterSignals, canisterHistory] = await Promise.all([
      pullSignalsFromCanister(),
      pullHistoryFromCanister(),
    ]);
    return {
      signals: canisterSignals ?? [],
      history: canisterHistory ?? [],
    };
  } catch {
    return null;
  }
}

// ---- Auto ML Pattern Store (ICP Stable Memory) ----

export interface MLPattern {
  symbol: string;
  trendDir: "BULL" | "BEAR";
  strength: number;
  bullWins: number;
  bearWins: number;
  bullLosses: number;
  bearLosses: number;
  lastUpdated: number;
}

export async function pullMLPatternsFromCanister(): Promise<Record<
  string,
  MLPattern
> | null> {
  try {
    const actor = await getActor();
    const json = await actor.getMLPatterns();
    if (!json || json === "{}") return null;
    return JSON.parse(json) as Record<string, MLPattern>;
  } catch {
    return null;
  }
}

export async function pushMLPatternsToCanister(
  patterns: Record<string, MLPattern>,
): Promise<void> {
  try {
    const actor = await getActor();
    await actor.putMLPatterns(JSON.stringify(patterns));
  } catch {}
}

export function setLastPushedUpdate(ts: number): void {
  _lastPushedUpdate = ts;
}

export function getLastPushedUpdate(): number {
  return _lastPushedUpdate;
}
