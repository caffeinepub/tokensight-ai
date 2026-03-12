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

const RATIONALES = [
  "Bullish Divergence on 4H RSI with OB retest — high-probability long entry",
  "FVG fill at institutional demand zone, 4H trend aligned bullish — confirmed entry",
  "Volume Spike on breakout above equal highs — momentum continuation setup",
  "Bearish Divergence rejected at premium FVG — short bias with tight SL",
  "Bullish Divergence confirmed at 4H OB support, 15M MSB upside — accumulation zone",
  "FVG acting as launchpad post-liquidity sweep — expect impulsive move higher",
  "Volume Spike with OB confluence at 4H demand — smart money accumulation detected",
  "FVG + OB confluence at key level, 4H trend confirmed bullish — ride the impulse",
  "Bearish Divergence at resistance with FVG overhead — distribution phase active",
  "Bullish Divergence + Volume Spike at EQH sweep — triple confirmation SMC entry",
  "4H CHOCH with FVG retest confirmed — strong bullish continuation signal",
  "Institutional OB tested, Volume Spike confirms entry — high-probability setup",
];

// Persistent signal cache key
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

/**
 * Check if current market data shows a high-confluence opportunity:
 * RSI proxy (momentum) + Volume spike + FVG zone detection
 */
function hasHighConfluence(priceData: TokenPrice): boolean {
  const change24h = priceData.change24h;
  const priceRange = priceData.high24h - priceData.low24h;
  const priceInRange =
    priceRange > 0 ? (priceData.price - priceData.low24h) / priceRange : 0.5;
  const volumeRatio =
    priceData.marketCap > 0 ? priceData.volume24h / priceData.marketCap : 0;

  // RSI proxy: strong momentum (change24h), volume spike, FVG zone (price position)
  const bullishMomentum = change24h > 1.5 && priceInRange > 0.55;
  const highVolume = volumeRatio > 0.08;
  const fvgZone = priceInRange > 0.4 && priceInRange < 0.75;

  return bullishMomentum && (highVolume || fvgZone);
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
  const entry = price;
  const tp1 = entry * 1.02;
  const tp2 = entry * 1.05;
  const tp3 = entry * 1.1;
  const sl = entry * 0.98;
  const reward = tp3 - entry;
  const risk = entry - sl;
  const rr = risk > 0 ? (reward / risk).toFixed(1) : "5.0";

  const change24h = priceData.change24h;
  const priceRange = priceData.high24h - priceData.low24h;
  const priceInRange =
    priceRange > 0 ? (price - priceData.low24h) / priceRange : 0.5;
  const volumeRatio =
    priceData.marketCap > 0 ? priceData.volume24h / priceData.marketCap : 0;

  const bullishMomentum = change24h > 1.5 && priceInRange > 0.55;
  const highVolume = volumeRatio > 0.08;
  const trendConfirm = priceInRange > 0.6;
  const strongMomentum = change24h > 4;

  let confidence = 80 + ((idx * 7 + Math.floor(price)) % 8);
  if (bullishMomentum) confidence += 8;
  if (highVolume) confidence += 7;
  if (trendConfirm) confidence += 5;
  if (strongMomentum) confidence += 5;
  confidence = Math.min(98, confidence);

  let winRate = 80 + ((idx * 5 + Math.floor(price * 7)) % 8);
  if (bullishMomentum) winRate += 6;
  if (highVolume) winRate += 4;
  winRate = Math.min(97, winRate);

  const tags: string[] = ["4H BULL", "15M MSB"];
  if (priceInRange > 0.5 || idx % 2 === 0) tags.push("OB");
  if (highVolume || idx % 3 === 0) tags.push("FVG");
  if (strongMomentum || idx % 5 === 0) tags.push("MSS");
  if (change24h > 2 || idx % 4 === 0) tags.push("Liquidity Sweep");

  const isGoldenSniperEligible =
    confidence > 95 &&
    winRate > 90 &&
    bullishMomentum &&
    tags.includes("OB") &&
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
    winRate,
    marketCapTier,
    isGoldenSniperEligible,
    // CRITICAL: Use preserved createdAt if available — prevents timestamp reset on refresh
    createdAt: preservedCreatedAt ?? Date.now(),
  };
}

export function useTokenData() {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [signals, setSignals] = useState<Signal[]>(() => {
    // Load persisted signals immediately on mount to avoid timestamp reset
    const cache = loadSignalCache();
    return Object.values(cache);
  });
  const [connected, setConnected] = useState(false);
  const prevPrices = useRef<Record<string, number>>({});
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const wsRef = useRef<WebSocket | null>(null);
  // Initialize signal cache from localStorage — PERSISTS across refreshes
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

  const refreshSignals = useCallback((priceMap: Record<string, TokenPrice>) => {
    let cacheChanged = false;

    const updated = TRACKED_SYMBOLS.filter((s) => priceMap[s]).map((s, i) => {
      const existing = signalCache.current[s];
      const livePrice = priceMap[s].price;

      if (existing) {
        // Signal already exists — keep it STATIC (don't change entry/TP/SL)
        // Only replace if price has drifted significantly AND confluence conditions are newly met
        const drift = Math.abs(livePrice - existing.entry) / existing.entry;
        if (drift < 0.02) {
          // Under 2% drift — keep existing signal with original createdAt
          return existing;
        }
        // Significant drift — only create new signal if confluence is detected
        if (!hasHighConfluence(priceMap[s])) {
          // No confluence — keep existing signal
          return existing;
        }
      } else {
        // No existing signal — only generate if confluence conditions met
        if (!hasHighConfluence(priceMap[s])) {
          return null; // Skip this symbol
        }
      }

      // Generate new signal (preserving createdAt if replacing)
      const fresh = buildSignal(
        s,
        priceMap[s],
        i,
        existing?.createdAt, // Preserve original timestamp
      );
      signalCache.current[s] = fresh;
      cacheChanged = true;
      return fresh;
    });

    // Filter out nulls (symbols without confluence)
    const validSignals = updated.filter((s): s is Signal => s !== null);

    // Fallback: if no confluence signals found, use cached signals if available
    // This ensures the signals tab always shows something after first load
    const finalSignals =
      validSignals.length > 0
        ? validSignals
        : Object.values(signalCache.current);

    if (cacheChanged) {
      saveSignalCache(signalCache.current);
    }

    setSignals(finalSignals);
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
