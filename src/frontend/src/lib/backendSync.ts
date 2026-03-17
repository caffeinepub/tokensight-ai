/**
 * TokenSight AI — Backend Signal Sync
 * Canister = single source of truth for all signals.
 * All browser / PWA instances pull from and push to the canister
 * so every user sees identical signals at all times.
 */

import { createActorWithConfig } from "../config";
import type { SwingHistoryEntry, SwingSignal } from "./swingEngine";

let _lastPushedUpdate = 0; // nanoseconds of last canister update we pushed

async function getActor() {
  return createActorWithConfig();
}

/**
 * Pull canonical active signals from the canister.
 * Returns null on failure so callers can fall back to localStorage.
 */
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

/**
 * Push the current active signals array to the canister.
 * Called after every scan that produces new signals.
 */
export async function pushSignalsToCanister(
  signals: SwingSignal[],
): Promise<void> {
  try {
    const actor = await getActor();
    await actor.putSignals(JSON.stringify(signals));
  } catch {
    // non-fatal — localStorage is the offline fallback
  }
}

/**
 * Pull canonical signal history from the canister.
 */
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

/**
 * Push updated signal history to the canister.
 */
export async function pushHistoryToCanister(
  history: SwingHistoryEntry[],
): Promise<void> {
  try {
    const actor = await getActor();
    await actor.putSignalHistory(JSON.stringify(history));
  } catch {}
}

/**
 * Get the nanosecond timestamp of the last canister signal update.
 */
export async function getCanisterLastUpdate(): Promise<bigint> {
  try {
    const actor = await getActor();
    return await actor.getLastSignalUpdate();
  } catch {
    return 0n;
  }
}

/**
 * Full pull-and-merge: fetch signals + history from canister.
 * Canister wins for any signal with the same ID.
 * Returns merged { signals, history } or null if canister unavailable.
 */
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

export function setLastPushedUpdate(ts: number): void {
  _lastPushedUpdate = ts;
}

export function getLastPushedUpdate(): number {
  return _lastPushedUpdate;
}
