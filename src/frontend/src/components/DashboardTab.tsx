import { Activity, BarChart2, TrendingUp, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TokenPrice } from "../hooks/useTokenData";
import { COIN_NAMES, TRACKED_SYMBOLS } from "../hooks/useTokenData";
import { fmtPrice } from "../lib/format";
import type { SwingHistoryEntry, SwingSignal } from "../lib/swingEngine";
import { setFearGreedValue } from "../lib/swingEngine";
import { ModelPerformance } from "./ModelPerformance";
import { SentimentGauge } from "./SentimentGauge";

interface Props {
  prices: Record<string, TokenPrice>;
  connected: boolean;
  swingHistory?: SwingHistoryEntry[];
  proUserCount: number;
  signalCount?: number;
  activeSignalsCount?: number;
  topSignal?: SwingSignal | null;
}

const COIN_COLORS: Record<string, string> = {
  BTCUSDT: "#F7931A",
  ETHUSDT: "#627EEA",
  ICPUSDT: "#29ABE2",
  SOLUSDT: "#9945FF",
  BNBUSDT: "#F3BA2F",
  XRPUSDT: "#00AAE4",
  ADAUSDT: "#0033AD",
  DOGEUSDT: "#C2A633",
  AVAXUSDT: "#E84142",
  LINKUSDT: "#2A5ADA",
  MATICUSDT: "#8247E5",
  PEPEUSDT: "#00A550",
  SHIBUSDT: "#FFA409",
  ARBUSDT: "#12AAFF",
  OPUSDT: "#FF0420",
  DOTUSDT: "#E6007A",
  UNIUSDT: "#FF007A",
  ATOMUSDT: "#6F7390",
  LTCUSDT: "#BFBBBB",
  NEARUSDT: "#00C08B",
};

function fmt(n: number, lastKnown?: number): string {
  const v = !n || Number.isNaN(n) || n <= 0 ? (lastKnown ?? 0) : n;
  if (v <= 0) return "\u2014";
  if (v >= 1) {
    return v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (v < 0.001) return v.toFixed(8);
  return v.toFixed(6);
}

function fmtMC(n: number): string {
  if (!n) return "\u2014";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

interface FearGreed {
  value: number;
  label: string;
}

function getWsPrice(symbol: string): number | null {
  const p = (window as Window).TS_ULTRA_STATE?.livePrices?.[symbol];
  return p && p > 0 ? p : null;
}

export function DashboardTab({
  prices,
  connected,
  swingHistory,
  proUserCount,
  signalCount = 0,
  activeSignalsCount,
  topSignal,
}: Props) {
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [fgLoading, setFgLoading] = useState(true);
  const [flashMap, setFlashMap] = useState<
    Record<string, "up" | "down" | null>
  >({});
  const prevPricesRef = useRef<Record<string, number>>({});
  const flashTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const loadedCount = TRACKED_SYMBOLS.filter((s) => prices[s]).length;
  const lastKnownPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    for (const [sym, data] of Object.entries(prices)) {
      if (data.price > 0) lastKnownPricesRef.current[sym] = data.price;
    }
  }, [prices]);

  useEffect(() => {
    const iv = setInterval(() => {
      const wsState = (window as Window).TS_ULTRA_STATE?.livePrices ?? {};
      const updates: Record<string, "up" | "down"> = {};
      for (const [sym, price] of Object.entries(wsState)) {
        const prev = prevPricesRef.current[sym];
        if (prev !== undefined && price !== prev) {
          updates[sym] = price > prev ? "up" : "down";
          if (flashTimersRef.current[sym])
            clearTimeout(flashTimersRef.current[sym]);
          flashTimersRef.current[sym] = setTimeout(() => {
            setFlashMap((m) => ({ ...m, [sym]: null }));
          }, 600);
        }
        prevPricesRef.current[sym] = price;
        lastKnownPricesRef.current[sym] = price;
      }
      if (Object.keys(updates).length > 0)
        setFlashMap((m) => ({ ...m, ...updates }));
    }, 100);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const fetchFG = () => {
      setFgLoading(true);
      fetch("https://api.alternative.me/fng/?limit=1")
        .then((r) => r.json())
        .then((d) => {
          const item = d?.data?.[0];
          if (item) {
            const fgVal = Number(item.value);
            setFearGreed({ value: fgVal, label: item.value_classification });
            setFearGreedValue(fgVal);
          }
        })
        .catch(() => {})
        .finally(() => setFgLoading(false));
    };
    fetchFG();
    const iv = setInterval(fetchFG, 300_000);
    return () => clearInterval(iv);
  }, []);

  const swingCompleted = (swingHistory ?? []).filter(
    (e) => e.status !== "LIVE",
  );
  const swingWins = swingCompleted.filter(
    (e) =>
      e.status === "TP1_HIT" ||
      e.status === "TP2_HIT" ||
      e.status === "TP3_HIT",
  ).length;
  const winTotal = swingCompleted.length;
  const winRate =
    winTotal > 0 ? ((swingWins / winTotal) * 100).toFixed(1) : null;

  const avgRR =
    swingCompleted.length > 0
      ? (() => {
          const nums = swingCompleted
            .filter((e) => e.entry > 0 && e.sl > 0 && e.tp3 > 0)
            .map((e) => Math.abs(e.tp3 - e.entry) / Math.abs(e.sl - e.entry));
          if (nums.length === 0) return null;
          const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
          return `1:${avg.toFixed(1)}`;
        })()
      : null;

  const fearGreedColor = fearGreed
    ? fearGreed.value < 25
      ? "#FF3B5C"
      : fearGreed.value < 45
        ? "#FF9500"
        : fearGreed.value < 55
          ? "#D4AF37"
          : fearGreed.value < 75
            ? "#00D4FF"
            : "#00FF88"
    : "#D4AF37";

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-[#00FF88] animate-pulse" : "bg-[#FF3B5C]"
            }`}
          />
          <span className="text-xs font-mono text-gray-500">
            {connected
              ? `LIVE — Binance WebSocket Connected (${loadedCount}/20)`
              : "Connecting to Binance..."}
          </span>
        </div>
        {connected && (
          <span
            className="text-[#00FF88] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#00FF88]/30 animate-pulse"
            style={{ background: "rgba(0,255,136,0.08)" }}
          >
            ● LIVE
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Signals Today",
            value: String(activeSignalsCount ?? signalCount),
            icon: Activity,
            color: "#00D4FF",
            sub:
              (activeSignalsCount ?? signalCount) === 0
                ? "No signals yet"
                : `${activeSignalsCount ?? signalCount} active`,
          },
          {
            label: "Win Rate",
            value: winRate ? `${winRate}%` : "Training...",
            icon: BarChart2,
            color: "#00FF88",
            sub:
              swingCompleted.length > 0
                ? `${swingCompleted.length} resolved`
                : "Syncing data...",
          },
          {
            label: "Avg R:R",
            value: avgRR ?? "—",
            icon: TrendingUp,
            color: "#D4AF37",
            sub: swingCompleted.length > 0 ? "from history" : "No data yet",
          },
          {
            label: "Pro Users",
            value: String(proUserCount),
            icon: Users,
            color: "#9945FF",
            sub: "verified on-chain",
          },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div
            key={label}
            className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-4 flex items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-gray-500 text-[10px] mb-0.5 truncate">
                {label}
              </p>
              <p className="font-mono font-bold text-base text-white leading-tight">
                {value}
              </p>
              {sub && (
                <p className="text-gray-600 text-[10px] font-mono truncate">
                  {sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Top Pick of the Week — unified across Dashboard, Live Signals, and Golden Sniper */}
      {topSignal && (
        <div className="rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#1A1600]/80 to-[#0B0E11] p-4 flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
            <span className="text-[#D4AF37] font-black text-sm">TS</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#D4AF37] font-mono font-bold uppercase tracking-widest mb-0.5">
              Golden Sniper — Top Pick This Week
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-base">
                {topSignal.coin} ({topSignal.symbol})
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${topSignal.direction === "BUY" ? "bg-[#00FF88]/20 text-[#00FF88]" : "bg-[#FF4444]/20 text-[#FF4444]"}`}
              >
                {topSignal.direction}
              </span>
              <span className="text-[#D4AF37] text-xs font-mono">
                {topSignal.confidence.toFixed(1)}% conf
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-gray-400 font-mono">Entry</div>
            <div className="text-white font-mono text-sm font-semibold">
              {typeof topSignal.entry === "number"
                ? topSignal.entry.toFixed(topSignal.entry < 1 ? 8 : 2)
                : topSignal.entry}
            </div>
          </div>
        </div>
      )}
      {/* Model Performance Section */}
      <ModelPerformance />

      {/* Fear & Greed + Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-mono font-bold text-sm">
                FEAR & GREED INDEX
              </h3>
              <p className="text-gray-500 text-xs">via Alternative.me API</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              <span className="text-[#FFD700] text-[10px] font-mono bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                LIVE
              </span>
            </div>
          </div>
          {fgLoading && !fearGreed ? (
            <div className="flex items-center gap-2 text-gray-500 text-xs font-mono py-4">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              Fetching from Alternative.me...
            </div>
          ) : fearGreed ? (
            <div className="flex items-center gap-6">
              <div
                className="relative shrink-0"
                style={{ width: 96, height: 96 }}
              >
                <svg
                  viewBox="0 0 36 36"
                  className="w-full h-full -rotate-90"
                  aria-label="Fear and Greed gauge"
                  role="img"
                >
                  <title>Fear and Greed gauge</title>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#1C2333"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={fearGreedColor}
                    strokeWidth="3"
                    strokeDasharray={`${fearGreed.value} ${100 - fearGreed.value}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="font-mono font-bold text-xl"
                    style={{ color: fearGreedColor }}
                  >
                    {fearGreed.value}
                  </span>
                </div>
              </div>
              <div>
                <p
                  className="font-mono font-bold text-lg"
                  style={{ color: fearGreedColor }}
                >
                  {fearGreed.label}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Market sentiment score
                </p>
                {fearGreed.value < 25 && (
                  <div
                    className="mt-2 px-2 py-1 rounded text-[9px] font-mono font-bold border"
                    style={{
                      color: "#00FF88",
                      borderColor: "#00FF8840",
                      background: "rgba(0,255,136,0.06)",
                    }}
                  >
                    🧠 EXTREME FEAR — Smart Money Entry Zone Active
                  </div>
                )}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {[
                    "Extreme Fear",
                    "Fear",
                    "Neutral",
                    "Greed",
                    "Extreme Greed",
                  ].map((l, i) => {
                    const ranges = [
                      [0, 25],
                      [25, 45],
                      [45, 55],
                      [55, 75],
                      [75, 101],
                    ];
                    const isActive =
                      fearGreed.value >= ranges[i][0] &&
                      fearGreed.value < ranges[i][1];
                    return (
                      <span
                        key={l}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isActive ? "text-white" : "text-gray-600"}`}
                        style={
                          isActive
                            ? {
                                background: `${fearGreedColor}30`,
                                border: `1px solid ${fearGreedColor}50`,
                              }
                            : {}
                        }
                      >
                        {l}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-xs font-mono py-4">
              Data unavailable
            </p>
          )}
        </div>

        <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-mono font-bold text-sm">
                MARKET SENTIMENT
              </h3>
              <p className="text-gray-500 text-xs">SMC + Social Combined</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              <span className="text-[#FFD700] text-[10px] font-mono bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                LIVE
              </span>
            </div>
          </div>
          <SentimentGauge
            showSubScores
            fearGreedValue={fearGreed?.value ?? null}
            prices={prices}
          />
        </div>
      </div>

      {/* Top 20 Assets */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-white font-mono font-bold text-xs tracking-wider">
            TOP 20 ASSETS
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
            <span className="text-[#00D4FF] text-[10px] font-mono">
              Binance WebSocket
            </span>
          </div>
          <span className="text-gray-600 text-[10px] font-mono ml-auto">
            {loadedCount}/20 loaded
          </span>
        </div>
        <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] overflow-hidden">
          <div className="grid grid-cols-[28px_1fr_100px_64px_80px] gap-2 px-4 py-2 border-b border-[#1C2333] text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            <span>#</span>
            <span>Asset</span>
            <span className="text-right">Price</span>
            <span className="text-right">24h</span>
            <span className="text-right">Mkt Cap</span>
          </div>
          {TRACKED_SYMBOLS.map((symbol, idx) => {
            const p = prices[symbol];
            const wsPrice = getWsPrice(symbol);
            const displayPrice =
              wsPrice ?? p?.price ?? lastKnownPricesRef.current[symbol];
            const color = COIN_COLORS[symbol] ?? "#D4AF37";
            const name = COIN_NAMES[symbol] ?? symbol.replace("USDT", "");
            const ticker = symbol.replace("USDT", "");
            const change = p?.change24h ?? 0;
            const isUp = change >= 0;
            const flash = flashMap[symbol];
            const flashColor =
              flash === "up" ? "#00FF88" : flash === "down" ? "#FF3B5C" : null;
            return (
              <div
                key={symbol}
                data-ocid={`dashboard.asset.item.${idx + 1}`}
                className="grid grid-cols-[28px_1fr_100px_64px_80px] gap-2 items-center px-4 py-2.5 border-b border-[#1C2333]/50 last:border-0 hover:bg-[#1C2333]/20 transition-colors"
                style={
                  flashColor
                    ? {
                        boxShadow: `inset 3px 0 0 ${flashColor}80`,
                        transition: "box-shadow 0.3s",
                      }
                    : { transition: "box-shadow 0.3s" }
                }
              >
                <span className="text-gray-600 text-[10px] font-mono text-center">
                  {idx + 1}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                    style={{
                      background: `${color}20`,
                      border: `1px solid ${color}50`,
                      color,
                    }}
                  >
                    {ticker.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-xs leading-tight truncate">
                      {name}
                    </p>
                    <p className="text-gray-600 text-[10px] font-mono">
                      {ticker}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center justify-end gap-1">
                  <p
                    className="font-mono font-bold text-xs transition-colors duration-200"
                    style={{ color: flashColor ?? "#FFFFFF" }}
                  >
                    {displayPrice ? (
                      `$${fmt(displayPrice)}`
                    ) : (
                      <span className="text-gray-700 text-[10px]">&mdash;</span>
                    )}
                  </p>
                  {wsPrice && (
                    <span
                      className="text-[8px] font-mono"
                      style={{
                        color: "#00D4FF",
                        animation: "pulse 1s ease-in-out infinite",
                      }}
                    >
                      ●
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] font-mono font-bold px-1 py-0.5 rounded text-right"
                  style={{
                    color: isUp ? "#00FF88" : "#FF3B5C",
                    background: isUp ? "#00FF8810" : "#FF3B5C10",
                  }}
                >
                  {p ? `${isUp ? "+" : ""}${change.toFixed(2)}%` : "\u2014"}
                </span>
                <span className="text-gray-400 text-[10px] font-mono text-right">
                  {p?.marketCap ? fmtMC(p.marketCap) : "\u2014"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
