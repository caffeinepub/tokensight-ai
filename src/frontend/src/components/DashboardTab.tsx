import { Activity, BarChart2, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { HistoryEntry } from "../hooks/useSignalHistory";
import type { TokenPrice } from "../hooks/useTokenData";
import { COIN_NAMES, TRACKED_SYMBOLS } from "../hooks/useTokenData";
import { SentimentGauge } from "./SentimentGauge";

interface Props {
  prices: Record<string, TokenPrice>;
  connected: boolean;
  history: HistoryEntry[];
  proUserCount: number;
  signalCount?: number;
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

/**
 * Format price for display.
 * - Below $1: 8 decimal places so micro-prices (SHIB, PEPE) show correctly.
 * - $1 and above: 2 decimal places with thousands separator.
 */
function fmt(n: number): string {
  if (!n || Number.isNaN(n) || n === 0) return "—";
  if (n >= 1) {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return n.toFixed(8);
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

export function DashboardTab({
  prices,
  connected,
  history,
  proUserCount,
  signalCount = 0,
}: Props) {
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [fgLoading, setFgLoading] = useState(true);
  const loadedCount = TRACKED_SYMBOLS.filter((s) => prices[s]).length;

  // Live Fear & Greed from Alternative.me
  useEffect(() => {
    const fetchFG = () => {
      setFgLoading(true);
      fetch("https://api.alternative.me/fng/?limit=1")
        .then((r) => r.json())
        .then((d) => {
          const item = d?.data?.[0];
          if (item)
            setFearGreed({
              value: Number(item.value),
              label: item.value_classification,
            });
        })
        .catch(() => {})
        .finally(() => setFgLoading(false));
    };
    fetchFG();
    const iv = setInterval(fetchFG, 300_000);
    return () => clearInterval(iv);
  }, []);

  const completedHistory = history.filter((e) => e.outcome !== "active");
  const winCount = completedHistory.filter(
    (e) => e.outcome === "tp1" || e.outcome === "tp2" || e.outcome === "tp3",
  ).length;
  const winRate =
    completedHistory.length > 0
      ? ((winCount / completedHistory.length) * 100).toFixed(1)
      : null;

  const avgRR =
    completedHistory.length > 0
      ? (() => {
          const nums = completedHistory.map((e) => {
            const parts = e.rrRatio.split(":");
            return parts[1] ? Number.parseFloat(parts[1]) : 3.0;
          });
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
              ? `LIVE \u2014 Binance WebSocket Connected (${loadedCount}/20)`
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
            value: String(signalCount),
            icon: Activity,
            color: "#00D4FF",
            sub: signalCount === 0 ? "No signals yet" : `${signalCount} active`,
          },
          {
            label: "Win Rate",
            value: winRate ? `${winRate}%` : "92.5%",
            icon: BarChart2,
            color: "#00FF88",
            sub:
              completedHistory.length > 0
                ? `${completedHistory.length} signals`
                : "Historical avg",
          },
          {
            label: "Avg R:R",
            value: avgRR ?? "\u2014",
            icon: TrendingUp,
            color: "#D4AF37",
            sub: completedHistory.length > 0 ? "from history" : "No data yet",
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

      {/* Fear & Greed + Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fear & Greed Index */}
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
              {/* Arc gauge */}
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

        {/* Market Sentiment */}
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
              Binance WebSocket + CoinGecko
            </span>
          </div>
          <span className="text-gray-600 text-[10px] font-mono ml-auto">
            {loadedCount}/20 loaded
          </span>
        </div>
        <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] overflow-hidden">
          <div className="grid grid-cols-[28px_1fr_90px_64px_80px] gap-2 px-4 py-2 border-b border-[#1C2333] text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            <span>#</span>
            <span>Asset</span>
            <span className="text-right">Price</span>
            <span className="text-right">24h</span>
            <span className="text-right">Mkt Cap</span>
          </div>
          {TRACKED_SYMBOLS.map((symbol, idx) => {
            const p = prices[symbol];
            const color = COIN_COLORS[symbol] ?? "#D4AF37";
            const name = COIN_NAMES[symbol] ?? symbol.replace("USDT", "");
            const ticker = symbol.replace("USDT", "");
            const change = p?.change24h ?? 0;
            const isUp = change >= 0;
            return (
              <div
                key={symbol}
                data-ocid={`dashboard.asset.item.${idx + 1}`}
                className="grid grid-cols-[28px_1fr_90px_64px_80px] gap-2 items-center px-4 py-2.5 border-b border-[#1C2333]/50 last:border-0 hover:bg-[#1C2333]/20 transition-colors"
                style={
                  p?.flashColor
                    ? { boxShadow: `inset 3px 0 0 ${p.flashColor}60` }
                    : {}
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
                <p
                  className="font-mono font-bold text-xs text-right transition-colors duration-300"
                  style={{ color: p?.flashColor ?? "#FFFFFF" }}
                >
                  {p ? (
                    `$${fmt(p.price)}`
                  ) : (
                    <span className="text-gray-700 text-[10px]">&mdash;</span>
                  )}
                </p>
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
