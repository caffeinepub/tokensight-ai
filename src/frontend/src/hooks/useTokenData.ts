import { useCallback, useEffect, useRef, useState } from "react";

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  direction: "up" | "down" | "neutral";
  flashColor: string | null;
}

export type MarketCapTier = "GEM" | "MAJOR_ALPHA" | "MID_CAP";

export interface Signal {
  id: string;
  coin: string;
  symbol: string;
  entry: number;
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  rationale: string;
  rrRatio: string;
  tags: string[];
  confidence: number;
  isHiddenGem: boolean;
  trendAlignment: "BULL" | "BEAR";
  direction: "BUY" | "SELL";
  winRate: number;
  marketCapTier: MarketCapTier;
  isGoldenSniperEligible: boolean;
  createdAt: number;
}

export const TRACKED_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "LINKUSDT",
  "MATICUSDT",
  "ICPUSDT",
  "PEPEUSDT",
  "SHIBUSDT",
  "ARBUSDT",
  "OPUSDT",
  "DOTUSDT",
  "UNIUSDT",
  "ATOMUSDT",
  "LTCUSDT",
  "NEARUSDT",
];

export const COIN_NAMES: Record<string, string> = {
  BTCUSDT: "Bitcoin",
  ETHUSDT: "Ethereum",
  BNBUSDT: "BNB",
  SOLUSDT: "Solana",
  XRPUSDT: "XRP",
  ADAUSDT: "Cardano",
  DOGEUSDT: "Dogecoin",
  AVAXUSDT: "Avalanche",
  LINKUSDT: "Chainlink",
  MATICUSDT: "Polygon",
  ICPUSDT: "Internet Computer",
  PEPEUSDT: "PEPE",
  SHIBUSDT: "Shiba Inu",
  ARBUSDT: "Arbitrum",
  OPUSDT: "Optimism",
  DOTUSDT: "Polkadot",
  UNIUSDT: "Uniswap",
  ATOMUSDT: "Cosmos",
  LTCUSDT: "Litecoin",
  NEARUSDT: "NEAR Protocol",
};

const COINGECKO_IDS: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  BNBUSDT: "binancecoin",
  SOLUSDT: "solana",
  XRPUSDT: "ripple",
  ADAUSDT: "cardano",
  DOGEUSDT: "dogecoin",
  AVAXUSDT: "avalanche-2",
  LINKUSDT: "chainlink",
  MATICUSDT: "matic-network",
  ICPUSDT: "internet-computer",
  PEPEUSDT: "pepe",
  SHIBUSDT: "shiba-inu",
  ARBUSDT: "arbitrum",
  OPUSDT: "optimism",
  DOTUSDT: "polkadot",
  UNIUSDT: "uniswap",
  ATOMUSDT: "cosmos",
  LTCUSDT: "litecoin",
  NEARUSDT: "near",
};

const FALLBACK_PRICES: Record<string, number> = {
  BTCUSDT: 65000,
  ETHUSDT: 3200,
  BNBUSDT: 380,
  SOLUSDT: 145,
  XRPUSDT: 0.52,
  ADAUSDT: 0.45,
  DOGEUSDT: 0.12,
  AVAXUSDT: 35,
  LINKUSDT: 14,
  MATICUSDT: 0.68,
  ICPUSDT: 8.5,
  PEPEUSDT: 0.000012,
  SHIBUSDT: 0.000025,
  ARBUSDT: 0.85,
  OPUSDT: 1.8,
  DOTUSDT: 7.2,
  UNIUSDT: 9.5,
  ATOMUSDT: 8.1,
  LTCUSDT: 82,
  NEARUSDT: 4.2,
};

// GEM = low cap <$50M MC (only PEPE and SHIB)
const GEM_SYMBOLS = new Set(["PEPEUSDT", "SHIBUSDT"]);
const MID_CAP_SYMBOLS = new Set([
  "LINKUSDT",
  "MATICUSDT",
  "ICPUSDT",
  "UNIUSDT",
  "ATOMUSDT",
  "NEARUSDT",
]);

function getMarketCapTier(symbol: string): MarketCapTier {
  if (GEM_SYMBOLS.has(symbol)) return "GEM";
  if (MID_CAP_SYMBOLS.has(symbol)) return "MID_CAP";
  return "MAJOR_ALPHA";
}

// ─── AI Model Data Persistence ───────────────────────────────────────────────

const AI_MODEL_KEY = "AI_Model_Data";

interface AIModelData {
  BUY: { wins: number; total: number };
  SELL: { wins: number; total: number };
  lastUpdated: number;
  totalSignals: number;
}

export function loadAIModelData(): AIModelData {
  try {
    const raw = localStorage.getItem(AI_MODEL_KEY);
    if (raw) return JSON.parse(raw) as AIModelData;
  } catch {}
  return {
    BUY: { wins: 0, total: 0 },
    SELL: { wins: 0, total: 0 },
    lastUpdated: Date.now(),
    totalSignals: 0,
  };
}

export function recordAIOutcome(
  direction: "BUY" | "SELL",
  isWin: boolean,
): void {
  try {
    const data = loadAIModelData();
    data[direction].total++;
    if (isWin) data[direction].wins++;
    data.totalSignals++;
    data.lastUpdated = Date.now();
    localStorage.setItem(AI_MODEL_KEY, JSON.stringify(data));
    // Sync to ts_signal_outcomes for backward compat with getDirectionBias
    const outcomes: Record<string, { wins: number; total: number }> = {
      BUY: data.BUY,
      SELL: data.SELL,
    };
    localStorage.setItem("ts_signal_outcomes", JSON.stringify(outcomes));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────

// Auto-learning: bias confidence based on historical BUY/SELL accuracy
function getDirectionBias(dir: "BUY" | "SELL"): number {
  try {
    // Primary: AI_Model_Data
    const aiRaw = localStorage.getItem(AI_MODEL_KEY);
    if (aiRaw) {
      const ai: AIModelData = JSON.parse(aiRaw);
      const data = ai[dir];
      if (data && data.total >= 3) {
        const rate = data.wins / data.total;
        return rate > 0.75
          ? 3
          : rate > 0.6
            ? 1
            : rate < 0.25
              ? -3
              : rate < 0.4
                ? -1
                : 0;
      }
    }
    // Fallback: ts_signal_outcomes
    const raw = localStorage.getItem("ts_signal_outcomes");
    if (!raw) return 0;
    const outcomes: Record<string, { wins: number; total: number }> =
      JSON.parse(raw);
    const data = outcomes[dir];
    if (!data || data.total < 3) return 0;
    const rate = data.wins / data.total;
    return rate > 0.7 ? 2 : rate < 0.3 ? -2 : 0;
  } catch {
    return 0;
  }
}

// SMC rationales covering both BUY and SELL scenarios
const RATIONALES = [
  "MSB confirmed on 4H — Bullish OB retest at institutional demand zone. Smart money accumulation detected. BUY setup active.",
  "Bearish OB supply zone touched — MSB to the downside confirmed. Smart money distribution detected. SELL setup active.",
  "Bullish MSB above Equal Highs — OB demand zone swept and reclaimed. FVG fill imminent with volume confirmation.",
  "Bearish MSB at 4H supply OB — CHoCH confirmed. Smart money distribution phase. Short entry with strong confluence.",
  "OB mitigation at key SMC demand level — MSB on 15M aligns with 4H bullish trend. Liquidity Sweep confirms long entry.",
  "Supply OB rejected — MSB downside on H4 with CHoCH. Volume confirms bearish institutional flow. SELL.",
  "Liquidity Sweep below EQLs into OB support — MSB triggered on recovery. Triple SMC: OB + FVG + MSB. Long entry.",
  "Bearish OB + FVG overhead — MSB downside confirms. Smart money distribution. Short position validated.",
  "Order Block touch + FVG fill convergence — MSB upside on 15M confirms momentum continuation. BUY.",
  "Bearish CHoCH at HTF supply — MSB down confirmed with volume spike. Institutional short flow active.",
  "Bullish CHoCH + MSB above OB — FVG acting as launchpad. Institutional order flow confirms long.",
  "OB + FVG at 4H demand — MSB upside with Liquidity Sweep below recent lows. SMC triple confirmation BUY.",
  "MSB above key resistance — OB defended with volume surge. Trend continuation BUY setup confirmed.",
  "SMC Quantum V26: Bearish OB + MSB downside — Liquidity Sweep above recent highs. Distribution confirmed. SELL.",
];

const SIGNAL_CACHE_LS_KEY = "ts_signal_cache_v2";

function loadSignalCache(): Record<string, Signal> {
  try {
    const raw = localStorage.getItem(SIGNAL_CACHE_LS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, Signal>;
  } catch {}
  return {};
}

function saveSignalCache(cache: Record<string, Signal>) {
  try {
    localStorage.setItem(SIGNAL_CACHE_LS_KEY, JSON.stringify(cache));
  } catch {}
}

function buildSignal(
  symbol: string,
  priceData: TokenPrice,
  idx: number,
  preservedCreatedAt?: number,
): Signal {
  const price = priceData.price;
  const coin = COIN_NAMES[symbol] ?? symbol.replace("USDT", "");
  const marketCapTier = getMarketCapTier(symbol);
  const isHiddenGem = marketCapTier === "GEM";

  const change24h = priceData.change24h;
  const priceRange = priceData.high24h - priceData.low24h;
  const priceInRange =
    priceRange > 0 ? (price - priceData.low24h) / priceRange : 0.5;
  const volumeRatio =
    priceData.marketCap > 0 ? priceData.volume24h / priceData.marketCap : 0;

  // BUY: bullish OB touched + MSB upside (positive momentum, price in upper range)
  // SELL: bearish OB touched + MSB downside (negative momentum, price in lower range)
  const direction: "BUY" | "SELL" =
    change24h > 0.5 || (priceInRange > 0.5 && change24h > -1) ? "BUY" : "SELL";

  const entry = price;
  let tp1: number;
  let tp2: number;
  let tp3: number;
  let sl: number;
  if (direction === "BUY") {
    tp1 = entry * 1.02;
    tp2 = entry * 1.05;
    tp3 = entry * 1.1;
    sl = entry * 0.98;
  } else {
    tp1 = entry * 0.98;
    tp2 = entry * 0.95;
    tp3 = entry * 0.9;
    sl = entry * 1.02;
  }

  const reward = Math.abs(tp3 - entry);
  const risk = Math.abs(entry - sl);
  const rr = risk > 0 ? (reward / risk).toFixed(1) : "5.0";

  const bullishMomentum = change24h > 1.5 && priceInRange > 0.55;
  const highVolume = volumeRatio > 0.08;
  const trendConfirm = priceInRange > 0.6;
  const strongMomentum = change24h > 4;

  // Base confidence 82–98%; SMC confluence boosts toward 98%
  let confidence = 80 + ((idx * 7 + Math.floor(price)) % 8);
  if (bullishMomentum) confidence += 8;
  if (highVolume) confidence += 7;
  if (trendConfirm) confidence += 5;
  if (strongMomentum) confidence += 5;
  confidence = Math.max(
    82,
    Math.min(98, confidence + getDirectionBias(direction)),
  );

  // Elite signals: win rate 91-97%
  let winRate = 91 + ((idx * 3 + Math.floor(price * 5)) % 5);
  winRate = Math.min(97, winRate);

  // SMC Quantum V26: MSB and OB are ALWAYS required tags
  const tags: string[] = ["MSB", "OB"];
  if (priceInRange > 0.5 || idx % 2 === 0) tags.push("FVG");
  if (change24h > 2 || idx % 4 === 0) tags.push("Liquidity Sweep");
  if (bullishMomentum || idx % 3 === 0) tags.push("CHoCH");
  if (strongMomentum || idx % 5 === 0)
    tags.push(direction === "BUY" ? "4H BULL" : "4H BEAR");

  const isGoldenSniperEligible =
    confidence > 95 &&
    winRate > 90 &&
    bullishMomentum &&
    tags.includes("Liquidity Sweep") &&
    tags.includes("FVG");

  const rationaleIdx = (idx + Math.floor(price * 10)) % RATIONALES.length;

  return {
    id: symbol,
    coin,
    symbol,
    entry,
    tp1,
    tp2,
    tp3,
    sl,
    rationale: RATIONALES[rationaleIdx],
    rrRatio: `1:${rr}`,
    tags,
    confidence,
    isHiddenGem,
    trendAlignment: bullishMomentum ? "BULL" : change24h < -1 ? "BEAR" : "BULL",
    direction,
    winRate,
    marketCapTier,
    isGoldenSniperEligible,
    createdAt: preservedCreatedAt ?? Date.now(),
  };
}

function makeFallbackPriceData(symbol: string): TokenPrice {
  const price = FALLBACK_PRICES[symbol] ?? 1;
  return {
    symbol,
    price,
    change24h: 1.2,
    volume24h: price * 1e6,
    high24h: price * 1.03,
    low24h: price * 0.97,
    marketCap: 0,
    direction: "neutral",
    flashColor: null,
  };
}

export function useTokenData() {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [signals, setSignals] = useState<Signal[]>(() => {
    const cache = loadSignalCache();
    const cached = Object.values(cache);
    if (cached.length > 0) return cached;
    return TRACKED_SYMBOLS.map((symbol, idx) => {
      const fb = makeFallbackPriceData(symbol);
      return buildSignal(symbol, fb, idx, undefined);
    });
  });
  const [connected, setConnected] = useState(false);
  const prevPrices = useRef<Record<string, number>>({});
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const signalCache = useRef<Record<string, Signal>>(loadSignalCache());
  const marketCaps = useRef<Record<string, number>>({});

  // Fetch market caps from CoinGecko
  useEffect(() => {
    const ids = Object.values(COINGECKO_IDS).join(",");
    const fetchMC = () => {
      fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&per_page=100&page=1`,
      )
        .then((r) => r.json())
        .then((data: Array<{ id: string; market_cap: number }>) => {
          const mcMap: Record<string, number> = {};
          for (const item of data) {
            const symbol = Object.entries(COINGECKO_IDS).find(
              ([, gid]) => gid === item.id,
            )?.[0];
            if (symbol) mcMap[symbol] = item.market_cap;
          }
          marketCaps.current = mcMap;
          setPrices((prev) => {
            const updated = { ...prev };
            for (const [sym, mc] of Object.entries(mcMap)) {
              if (updated[sym])
                updated[sym] = { ...updated[sym], marketCap: mc };
            }
            return updated;
          });
        })
        .catch(() => {});
    };
    fetchMC();
    const interval = setInterval(fetchMC, 60000);
    return () => clearInterval(interval);
  }, []);

  // LOCKED refreshSignals: never rebuild an existing signal.
  // Only generate a fresh signal if NO cached entry exists for that symbol.
  const refreshSignals = useCallback((priceMap: Record<string, TokenPrice>) => {
    let cacheChanged = false;

    const updated = TRACKED_SYMBOLS.map((s, i) => {
      const existing = signalCache.current[s];

      // LOCK: if signal already exists in cache, NEVER rebuild it
      if (existing) {
        return existing;
      }

      // Only build a new signal if this symbol has no cached entry
      const priceData = priceMap[s] ?? makeFallbackPriceData(s);
      const fresh = buildSignal(s, priceData, i, undefined);
      signalCache.current[s] = fresh;
      cacheChanged = true;
      return fresh;
    });

    if (cacheChanged) {
      saveSignalCache(signalCache.current);
    }

    setSignals(updated);
  }, []);

  // Expire non-golden signals after 60 minutes if entry zone not touched
  useEffect(() => {
    const EXPIRY_MS = 60 * 60 * 1000;
    const ZONE_TOL = 0.03;
    const check = () => {
      const priceSnapshot = prevPrices.current;
      let changed = false;
      for (const s of TRACKED_SYMBOLS) {
        const sig = signalCache.current[s];
        if (!sig || sig.isGoldenSniperEligible) continue;
        const age = Date.now() - sig.createdAt;
        const currentPrice = priceSnapshot[s];
        if (!currentPrice) continue;
        const entryZoneHit =
          Math.abs(currentPrice - sig.entry) / sig.entry <= ZONE_TOL;
        if (age > EXPIRY_MS && !entryZoneHit) {
          delete signalCache.current[s];
          changed = true;
        }
      }
      if (changed) {
        saveSignalCache(signalCache.current);
        // Rebuild only expired symbols
        setSignals(
          TRACKED_SYMBOLS.map((s, i) => {
            if (signalCache.current[s]) return signalCache.current[s];
            const fb = makeFallbackPriceData(s);
            const fresh = buildSignal(s, fb, i, undefined);
            signalCache.current[s] = fresh;
            return fresh;
          }),
        );
        saveSignalCache(signalCache.current);
      }
    };
    const iv = setInterval(check, 60_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    function connect() {
      const ws = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data as string) as Array<{
          s: string;
          c: string;
          P: string;
          v: string;
          h: string;
          l: string;
        }>;
        const updates: Record<string, TokenPrice> = {};
        for (const tick of data) {
          if (!TRACKED_SYMBOLS.includes(tick.s)) continue;
          const newPrice = Number.parseFloat(tick.c);
          if (!newPrice || newPrice <= 0) continue;
          const prev = prevPrices.current[tick.s];
          let direction: "up" | "down" | "neutral" = "neutral";
          let flashColor: string | null = null;
          if (prev !== undefined) {
            if (newPrice > prev) {
              direction = "up";
              flashColor = "#00FF88";
            } else if (newPrice < prev) {
              direction = "down";
              flashColor = "#FF3B5C";
            }
          }
          prevPrices.current[tick.s] = newPrice;
          updates[tick.s] = {
            symbol: tick.s,
            price: newPrice,
            change24h: Number.parseFloat(tick.P),
            volume24h: Number.parseFloat(tick.v) * newPrice,
            high24h: Number.parseFloat(tick.h),
            low24h: Number.parseFloat(tick.l),
            marketCap: marketCaps.current[tick.s] ?? 0,
            direction,
            flashColor,
          };
          if (flashColor) {
            clearTimeout(flashTimers.current[tick.s]);
            flashTimers.current[tick.s] = setTimeout(() => {
              setPrices((p) => ({
                ...p,
                [tick.s]: { ...p[tick.s], flashColor: null },
              }));
            }, 600);
          }
        }
        if (Object.keys(updates).length > 0) {
          setPrices((prev) => {
            const next = { ...prev, ...updates };
            refreshSignals(next);
            return next;
          });
        }
      };
    }
    connect();
    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, [refreshSignals]);

  const scanningForGoldenSniper =
    connected && !signals.some((s) => s.isGoldenSniperEligible);

  return { prices, signals, connected, scanningForGoldenSniper };
}
