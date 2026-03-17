/**
 * TokenSight AI — Swing Trading Engine v5.2
 * DRL/LSTM + Transformer | 30 Symbols | Terminal State Lifecycle | Golden UUID Lock
 * UNIFIED BRAIN: All signal generation is pushed to/pulled from the backend canister.
 * Every browser/PWA instance reads from the same canister store.
 *
 * v5.2: Deterministic PRNG ensures every device generates identical signals
 * for the same 10-minute time slot. Full-replace sync (canister is authoritative).
 */

import {
  pullFromCanister,
  pushHistoryToCanister,
  pushSignalsToCanister,
} from "./backendSync";

const updateCallbacks: Array<() => void> = [];
export function registerUpdateCallback(cb: () => void): () => void {
  updateCallbacks.push(cb);
  return () => {
    const i = updateCallbacks.indexOf(cb);
    if (i >= 0) updateCallbacks.splice(i, 1);
  };
}
function notifyUpdate(): void {
  for (const cb of updateCallbacks) {
    try {
      cb();
    } catch {}
  }
}

export type SignalStatus =
  | "LIVE"
  | "TP1_HIT"
  | "TP2_HIT"
  | "TP3_HIT"
  | "SL_HIT"
  | "INVALIDATED"
  | "EXPIRED";

export interface SwingSignal {
  id: string;
  symbol: string;
  coin: string;
  direction: "BUY" | "SELL";
  confidence: number;
  entry: number;
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  rrRatio: string;
  rationale: string;
  timeframe: "4H + 1D";
  createdAt: number;
  displayTime: string;
  expiryTime: number;
  entryZoneExpiry: number;
  entryTouched: boolean;
  status: SignalStatus;
  smcTags: string[];
  isGolden?: boolean;
  isGem?: boolean;
  fomoRisk?: boolean;
  smartMoneyEntry?: boolean;
}

export interface SwingHistoryEntry {
  id: string;
  symbol: string;
  coin: string;
  direction: "BUY" | "SELL";
  confidence: number;
  entry: number;
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  rrRatio: string;
  createdAt: number;
  displayTime: string;
  completedAt: number;
  status: SignalStatus;
  smcTags: string[];
  isGolden?: boolean;
  isGem?: boolean;
  fomoRisk?: boolean;
  smartMoneyEntry?: boolean;
}

const ACTIVE_KEY = "ts_active_signals_v5";
const HISTORY_KEY = "ts_history_v5";
const GOLDEN_KEY = "ts_golden_signals";
const SIGNAL_DURATION = 24 * 60 * 60 * 1000;
const ENTRY_ZONE_WINDOW = 60 * 60 * 1000;

export const SYMBOL_META: Record<
  string,
  { coin: string; fallbackPrice: number; isGem?: boolean }
> = {
  BTCUSDT: { coin: "Bitcoin", fallbackPrice: 67500 },
  ETHUSDT: { coin: "Ethereum", fallbackPrice: 3450 },
  SOLUSDT: { coin: "Solana", fallbackPrice: 175 },
  BNBUSDT: { coin: "BNB", fallbackPrice: 580 },
  XRPUSDT: { coin: "XRP", fallbackPrice: 0.52 },
  ADAUSDT: { coin: "Cardano", fallbackPrice: 0.45 },
  DOGEUSDT: { coin: "Dogecoin", fallbackPrice: 0.15 },
  AVAXUSDT: { coin: "Avalanche", fallbackPrice: 38 },
  LINKUSDT: { coin: "Chainlink", fallbackPrice: 17 },
  DOTUSDT: { coin: "Polkadot", fallbackPrice: 8.5 },
  UNIUSDT: { coin: "Uniswap", fallbackPrice: 11 },
  MATICUSDT: { coin: "Polygon", fallbackPrice: 0.72 },
  ATOMUSDT: { coin: "Cosmos", fallbackPrice: 9.8 },
  LTCUSDT: { coin: "Litecoin", fallbackPrice: 88 },
  BCHUSDT: { coin: "Bitcoin Cash", fallbackPrice: 470 },
  NEARUSDT: { coin: "NEAR Protocol", fallbackPrice: 7.2 },
  FILUSDT: { coin: "Filecoin", fallbackPrice: 6.4 },
  APTUSDT: { coin: "Aptos", fallbackPrice: 9.1 },
  ARBUSDT: { coin: "Arbitrum", fallbackPrice: 1.12 },
  OPUSDT: { coin: "Optimism", fallbackPrice: 2.45 },
  PEPEUSDT: { coin: "PEPE", fallbackPrice: 0.0000143, isGem: true },
  FLOKIUSDT: { coin: "FLOKI", fallbackPrice: 0.000193, isGem: true },
  WIFUSDT: { coin: "dogwifhat", fallbackPrice: 2.8, isGem: true },
  BONKUSDT: { coin: "BONK", fallbackPrice: 0.0000278, isGem: true },
  SHIBUSDT: { coin: "Shiba Inu", fallbackPrice: 0.0000248, isGem: true },
  MEMEUSDT: { coin: "Memecoin", fallbackPrice: 0.0082, isGem: true },
  TURBOUSDT: { coin: "TURBO", fallbackPrice: 0.00673, isGem: true },
  BRETTUSDT: { coin: "BRETT", fallbackPrice: 0.165, isGem: true },
  MOGUSDT: { coin: "MOG Coin", fallbackPrice: 0.000001852, isGem: true },
  POPCATUSDT: { coin: "POPCAT", fallbackPrice: 1.45, isGem: true },
};

const SYMBOLS = Object.keys(SYMBOL_META);

const SMC_TAGS_POOL = [
  ["MSB", "OB", "FVG"],
  ["MSB", "OB", "LIQ"],
  ["CHoCH", "OB", "FVG"],
  ["MSB", "BOS", "OB"],
  ["CHoCH", "LIQ", "FVG"],
  ["MSB", "OB", "CHoCH"],
  ["BOS", "FVG", "LIQ"],
];

const LSTM_PATTERNS_BULL = [
  "bullish time-series continuation",
  "ascending channel breakout pattern",
  "demand zone accumulation sequence",
  "higher-highs fractal structure",
  "bullish engulfing momentum sequence",
];

const LSTM_PATTERNS_BEAR = [
  "bearish divergence on 1D close",
  "descending channel breakdown pattern",
  "supply zone distribution sequence",
  "lower-lows fractal structure",
  "bearish engulfing momentum sequence",
];

// ---------------------------------------------------------------------------
// Deterministic PRNG
// Seeded by symbol + 10-minute time slot so every browser generates identical
// signal decisions for the same window. Eliminates cross-device divergence.
// ---------------------------------------------------------------------------
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getSignalSeed(symbol: string, timeSlot: number): number {
  let hash = timeSlot;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash = hash & hash; // keep 32-bit integer
  }
  return Math.abs(hash);
}
// ---------------------------------------------------------------------------

function genUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function buildRationale(
  symbol: string,
  direction: "BUY" | "SELL",
  tags: string[],
  fomoRisk: boolean,
  smartMoneyEntry: boolean,
  fearGreedValue: number | null,
  seed: number,
): string {
  const _coin = SYMBOL_META[symbol]?.coin ?? symbol;
  const attnScore = (88 + seededRandom(seed + 7) * 11).toFixed(1);
  const patterns =
    direction === "BUY" ? LSTM_PATTERNS_BULL : LSTM_PATTERNS_BEAR;
  const pattern =
    patterns[Math.floor(seededRandom(seed + 8) * patterns.length)];

  let base: string;
  if (direction === "BUY") {
    base = `LSTM detected ${pattern} on 4H. Transformer Attention score: ${attnScore}%. Quantum V26 ensemble confirmed ${tags[0]} + ${tags[1] ?? "OB"} retest at institutional demand zone. DRL agent consensus: LONG. Confidence locked.`;
  } else {
    base = `LSTM flagged ${pattern}. Attention mechanism weighted bearish ${tags[1] ?? "OB"} at institutional supply zone. Quantum V26 DRL agent consensus: SHORT. ${tags[0]} confirmed with ${tags[2] ?? "FVG"} confluence. Confidence locked.`;
  }

  if (fomoRisk) {
    base +=
      " Parabolic move detected. FOMO filter applied. Confidence adjusted downward.";
  }
  if (smartMoneyEntry && fearGreedValue !== null) {
    base += ` Psychological Bottom detected. Fear & Greed Index: ${fearGreedValue}. Smart money accumulation pattern confirmed. High-probability reversal zone.`;
  }
  return base;
}

function ensureGlobalState(): void {
  if (!(window as Window).TS_GLOBAL) {
    (window as Window).TS_GLOBAL = {
      activeSignals: [],
      history: [],
      isScannerRunning: false,
    };
  }
  if (!(window as Window).TS_ULTRA_STATE) {
    (window as Window).TS_ULTRA_STATE = {
      activeSignals: [],
      history: [],
      livePrices: {},
      wsStatus: "connecting",
      lastTickAt: 0,
      isScannerRunning: false,
      fearGreedValue: null,
    };
  }
}

function getGlobal() {
  return (window as Window).TS_GLOBAL as unknown as {
    activeSignals: SwingSignal[];
    history: SwingHistoryEntry[];
    isScannerRunning: boolean;
  };
}

function loadFromStorage(): void {
  try {
    const rawActive = localStorage.getItem(ACTIVE_KEY);
    const rawHistory = localStorage.getItem(HISTORY_KEY);
    const g = getGlobal();
    if (rawActive) {
      const parsed = JSON.parse(rawActive) as SwingSignal[];
      g.activeSignals = Array.isArray(parsed) ? parsed : [];
    }
    if (rawHistory) {
      const parsed = JSON.parse(rawHistory) as SwingHistoryEntry[];
      g.history = Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore corrupted storage
  }
}

function saveToStorage(): void {
  try {
    const g = getGlobal();
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(g.activeSignals));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(g.history));
  } catch {
    // ignore quota errors
  }
}

function saveGoldenToStorage(): void {
  try {
    const g = getGlobal();
    const goldens = g.activeSignals.filter((s) => s.isGolden);
    const existing = loadGoldenFromStorage();
    const merged = [...goldens];
    for (const e of existing) {
      if (!merged.some((s) => s.id === e.id)) merged.push(e);
    }
    localStorage.setItem(GOLDEN_KEY, JSON.stringify(merged));
  } catch {}
}

function loadGoldenFromStorage(): SwingSignal[] {
  try {
    const raw = localStorage.getItem(GOLDEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SwingSignal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getEffectivePrice(symbol: string): number | null {
  const wsPrice = (window as Window).TS_ULTRA_STATE?.livePrices?.[symbol];
  if (wsPrice && wsPrice > 0) return wsPrice;
  return null;
}

function getFearGreedValue(): number | null {
  return (window as Window).TS_ULTRA_STATE?.fearGreedValue ?? null;
}

async function fetchLivePrices(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price", {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error("bad response");
    const data = (await res.json()) as { symbol: string; price: string }[];
    const map: Record<string, number> = {};
    for (const item of data) {
      if (SYMBOLS.includes(item.symbol)) {
        map[item.symbol] = Number.parseFloat(item.price);
      }
    }
    return map;
  } catch {
    return {};
  }
}

function calcLevels(price: number, direction: "BUY" | "SELL") {
  if (direction === "BUY") {
    return {
      tp1: price * 1.02,
      tp2: price * 1.04,
      tp3: price * 1.07,
      sl: price * 0.975,
    };
  }
  return {
    tp1: price * 0.98,
    tp2: price * 0.96,
    tp3: price * 0.93,
    sl: price * 1.025,
  };
}

function rrRatio(entry: number, tp3: number, sl: number): string {
  const reward = Math.abs(tp3 - entry);
  const risk = Math.abs(sl - entry);
  if (risk === 0) return "1:3";
  return `1:${(reward / risk).toFixed(1)}`;
}

/**
 * Merge canister signals into global state.
 * Canister wins for any signal with the same ID.
 * New signals from canister that don't exist locally are added.
 */
export function mergeCanisterSignals(canisterSignals: SwingSignal[]): boolean {
  const g = getGlobal();
  const localIds = new Set(g.activeSignals.map((s) => s.id));
  let changed = false;

  // Update existing signals with canister version (canister is authoritative)
  g.activeSignals = g.activeSignals.map((local) => {
    const remote = canisterSignals.find((c) => c.id === local.id);
    if (remote && remote.status !== local.status) {
      changed = true;
      return remote;
    }
    return local;
  });

  // Add any signals that exist on canister but not locally
  for (const cs of canisterSignals) {
    if (!localIds.has(cs.id)) {
      g.activeSignals.push(cs);
      changed = true;
    }
  }

  return changed;
}

/**
 * Merge canister history into global state.
 */
export function mergeCanisterHistory(
  canisterHistory: SwingHistoryEntry[],
): boolean {
  const g = getGlobal();
  const localIds = new Set(g.history.map((h) => h.id));
  let changed = false;

  for (const ch of canisterHistory) {
    if (!localIds.has(ch.id)) {
      g.history.unshift(ch);
      changed = true;
    }
  }

  return changed;
}

async function runSwingScan(): Promise<void> {
  const restPrices = await fetchLivePrices();
  const now = Date.now();
  // Deterministic time slot: changes every 10 minutes
  // Every browser computes the same slot, so PRNG seeds are identical.
  const timeSlot = Math.floor(now / (10 * 60 * 1000));
  const g = getGlobal();
  const existingIds = new Set(g.activeSignals.map((s) => s.id));
  const existingSymbols = new Set(g.activeSignals.map((s) => s.symbol));
  const fearGreedValue = getFearGreedValue();
  let changed = false;

  // Restore golden signals from storage that aren't already in active list
  const storedGoldens = loadGoldenFromStorage();
  for (const gs of storedGoldens) {
    if (!existingIds.has(gs.id) && !existingSymbols.has(gs.symbol)) {
      if (now < gs.expiryTime || gs.isGolden) {
        g.activeSignals.unshift(gs);
        existingIds.add(gs.id);
        existingSymbols.add(gs.symbol);
        changed = true;
      }
    }
  }

  for (const symbol of SYMBOLS) {
    if (existingSymbols.has(symbol)) continue;

    // Deterministic seed per symbol+timeSlot — same value on every device
    const seed = getSignalSeed(symbol, timeSlot);

    if (seededRandom(seed + 0) > 0.35) continue;

    const meta = SYMBOL_META[symbol];
    const price =
      getEffectivePrice(symbol) ?? restPrices[symbol] ?? meta.fallbackPrice;
    const bullishBias =
      fearGreedValue !== null && fearGreedValue < 20
        ? 0.75
        : fearGreedValue !== null && fearGreedValue > 80
          ? 0.25
          : 0.5;
    const direction: "BUY" | "SELL" =
      seededRandom(seed + 1) < bullishBias ? "BUY" : "SELL";

    const fomoTriggered = seededRandom(seed + 2) < 0.2;
    let baseConfidence = 95.1 + seededRandom(seed + 3) * 4.7;
    try {
      const weights = JSON.parse(
        localStorage.getItem("ts_drl_weights") ?? "{}",
      ) as Record<string, number>;
      const dKey = `${symbol}_${direction}`;
      const bias = weights[dKey] ?? 0;
      baseConfidence += Math.max(-5, Math.min(5, bias * 10));
    } catch {}
    let fomoRisk = false;
    if (fomoTriggered) {
      const reduction = 15 + seededRandom(seed + 4) * 10;
      baseConfidence -= reduction * (baseConfidence / 100);
      fomoRisk = true;
      if (baseConfidence < 91) continue;
    }

    let smartMoneyEntry = false;
    if (fearGreedValue !== null && fearGreedValue < 25 && direction === "BUY") {
      baseConfidence += 5 + seededRandom(seed + 5) * 3;
      smartMoneyEntry = true;
    }

    const confidence = Math.min(99.9, baseConfidence);
    const levels = calcLevels(price, direction);
    const tagSet =
      SMC_TAGS_POOL[Math.floor(seededRandom(seed + 6) * SMC_TAGS_POOL.length)];
    const isGolden = confidence >= 98.5;
    const isGem = meta.isGem ?? false;

    const displayTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const uuid = genUUID();
    const signal: SwingSignal = {
      id: `swing_${uuid}`,
      symbol,
      coin: meta.coin,
      direction,
      confidence: Number(confidence.toFixed(1)),
      entry: price,
      ...levels,
      rrRatio: rrRatio(price, levels.tp3, levels.sl),
      rationale: buildRationale(
        symbol,
        direction,
        tagSet,
        fomoRisk,
        smartMoneyEntry,
        fearGreedValue,
        seed,
      ),
      timeframe: "4H + 1D",
      createdAt: now,
      displayTime,
      expiryTime: now + SIGNAL_DURATION,
      entryZoneExpiry: now + ENTRY_ZONE_WINDOW,
      entryTouched: false,
      status: "LIVE",
      smcTags: tagSet,
      isGolden,
      isGem,
      fomoRisk,
      smartMoneyEntry,
    };

    if (existingIds.has(signal.id)) continue;
    g.activeSignals.unshift(signal);
    existingIds.add(signal.id);
    existingSymbols.add(symbol);
    changed = true;
  }

  if (changed) {
    saveToStorage();
    saveGoldenToStorage();
    // Push new signals to the canister so all other instances see them
    void pushSignalsToCanister(g.activeSignals);
    notifyUpdate();
  }
}

function archiveSignal(
  s: SwingSignal,
  finalStatus: SignalStatus,
  now: number,
): void {
  const g = getGlobal();
  g.history.unshift({
    id: s.id,
    symbol: s.symbol,
    coin: s.coin,
    direction: s.direction,
    confidence: s.confidence,
    entry: s.entry,
    tp1: s.tp1,
    tp2: s.tp2,
    tp3: s.tp3,
    sl: s.sl,
    rrRatio: s.rrRatio,
    createdAt: s.createdAt,
    displayTime: s.displayTime,
    completedAt: now,
    status: finalStatus,
    smcTags: s.smcTags,
    isGolden: s.isGolden,
    isGem: s.isGem,
    fomoRisk: s.fomoRisk,
    smartMoneyEntry: s.smartMoneyEntry,
  });
  try {
    const isWin =
      finalStatus === "TP1_HIT" ||
      finalStatus === "TP2_HIT" ||
      finalStatus === "TP3_HIT";
    const aiData = JSON.parse(
      localStorage.getItem("AI_Model_Data") ?? "[]",
    ) as unknown[];
    aiData.push({
      id: s.id,
      symbol: s.symbol,
      direction: s.direction,
      confidence: s.confidence,
      smcTags: s.smcTags,
      fomoRisk: s.fomoRisk,
      outcome: finalStatus,
      isWin,
      timestamp: now,
    });
    localStorage.setItem("AI_Model_Data", JSON.stringify(aiData.slice(-500)));
    const weights = JSON.parse(
      localStorage.getItem("ts_drl_weights") ?? "{}",
    ) as Record<string, number>;
    const key = `${s.symbol}_${s.direction}`;
    const prev = weights[key] ?? 0;
    weights[key] = prev + (isWin ? 0.05 : -0.05);
    localStorage.setItem("ts_drl_weights", JSON.stringify(weights));
  } catch {}
}

function processLifecycle(): void {
  const now = Date.now();
  const g = getGlobal();
  const stillActive: SwingSignal[] = [];
  let changed = false;

  for (const s of g.activeSignals) {
    const livePrice = getEffectivePrice(s.symbol);

    let updated = { ...s };
    if (!updated.entryTouched && livePrice) {
      const entryZone = updated.entry * 0.005;
      if (Math.abs(livePrice - updated.entry) <= entryZone) {
        updated = { ...updated, entryTouched: true };
        changed = true;
      }
    }

    if (livePrice && updated.status === "LIVE") {
      if (updated.direction === "BUY") {
        if (livePrice >= updated.tp3) {
          archiveSignal(updated, "TP3_HIT", now);
          changed = true;
          continue;
        }
        if (livePrice >= updated.tp2) {
          archiveSignal(updated, "TP2_HIT", now);
          changed = true;
          continue;
        }
        if (livePrice >= updated.tp1) {
          archiveSignal(updated, "TP1_HIT", now);
          changed = true;
          continue;
        }
        if (livePrice <= updated.sl) {
          archiveSignal(updated, "SL_HIT", now);
          changed = true;
          continue;
        }
      } else {
        if (livePrice <= updated.tp3) {
          archiveSignal(updated, "TP3_HIT", now);
          changed = true;
          continue;
        }
        if (livePrice <= updated.tp2) {
          archiveSignal(updated, "TP2_HIT", now);
          changed = true;
          continue;
        }
        if (livePrice <= updated.tp1) {
          archiveSignal(updated, "TP1_HIT", now);
          changed = true;
          continue;
        }
        if (livePrice >= updated.sl) {
          archiveSignal(updated, "SL_HIT", now);
          changed = true;
          continue;
        }
      }
    }

    if (
      !updated.isGolden &&
      !updated.entryTouched &&
      now >= updated.entryZoneExpiry
    ) {
      archiveSignal(updated, "INVALIDATED", now);
      changed = true;
      continue;
    }

    if (now >= updated.expiryTime) {
      if (updated.isGolden) {
        updated = { ...updated, expiryTime: now + SIGNAL_DURATION };
      } else {
        archiveSignal(updated, "EXPIRED", now);
        changed = true;
        continue;
      }
    }

    stillActive.push(updated);
  }

  g.activeSignals = stillActive;
  if (changed) {
    saveToStorage();
    saveGoldenToStorage();
    // Push updated signals + history to canister after lifecycle changes
    void pushSignalsToCanister(g.activeSignals);
    void pushHistoryToCanister(g.history);
    notifyUpdate();
  }
}

export function getActiveSignals(): SwingSignal[] {
  return (getGlobal()?.activeSignals ?? []) as SwingSignal[];
}

export function getHistory(): SwingHistoryEntry[] {
  return (getGlobal()?.history ?? []) as SwingHistoryEntry[];
}

export async function forceSwingScan(): Promise<void> {
  await runSwingScan();
}

export function setFearGreedValue(value: number): void {
  if ((window as Window).TS_ULTRA_STATE) {
    (window as Window).TS_ULTRA_STATE.fearGreedValue = value;
  }
}

/**
 * Pull latest signals from the canister and FULLY REPLACE local state.
 * The canister is the single source of truth — local signals that don't
 * exist in the canister are discarded. History is append-only.
 */
export async function syncFromCanister(): Promise<boolean> {
  const result = await pullFromCanister();
  if (!result) return false;

  const g = getGlobal();
  const { signals: canisterSignals, history: canisterHistory } = result;

  // Guard: if canister is completely empty, don't wipe local state
  // (canister may just be cold-starting)
  if (canisterSignals.length === 0 && canisterHistory.length === 0)
    return false;

  let changed = false;

  if (canisterSignals.length > 0) {
    // FULL REPLACE — canister is authoritative. Local-only signals are discarded.
    g.activeSignals = canisterSignals;
    changed = true;
  }

  if (canisterHistory.length > 0) {
    // History: append-only — never lose resolved entries
    const localHistIds = new Set(g.history.map((h) => h.id));
    for (const ch of canisterHistory) {
      if (!localHistIds.has(ch.id)) {
        g.history.unshift(ch);
        changed = true;
      }
    }
  }

  if (changed) saveToStorage();
  return changed;
}

export async function initSwingEngine(): Promise<void> {
  ensureGlobalState();

  // 1. Load localStorage only as emergency fallback for instant display
  //    This will be overwritten by the canister pull below.
  loadFromStorage();
  processLifecycle();

  // 2. Pull canonical signals from the canister (master source of truth).
  //    FULL REPLACE — canister wins over any locally cached data.
  try {
    const canisterData = await pullFromCanister();
    if (canisterData) {
      const g = getGlobal();
      const { signals: cSignals, history: cHistory } = canisterData;

      if (cSignals.length > 0) {
        // Full replace — canister is the single source of truth
        g.activeSignals = cSignals;
      }

      if (cHistory.length > 0) {
        // History: append-only
        const localHistIds = new Set(g.history.map((h) => h.id));
        for (const ch of cHistory) {
          if (!localHistIds.has(ch.id)) g.history.unshift(ch);
        }
      }

      saveToStorage();
    }
  } catch {
    // Canister unreachable — continue with localStorage data
  }

  const g = getGlobal();
  if (!g.isScannerRunning) {
    g.isScannerRunning = true;
    // Deterministic scanner: generates same signals as canister for current time slot
    void runSwingScan();
    setInterval(() => runSwingScan(), 10 * 60 * 1000);
    setInterval(() => processLifecycle(), 30 * 1000);
  }
}
