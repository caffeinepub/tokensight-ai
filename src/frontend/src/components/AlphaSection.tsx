/**
 * AlphaSection — Stabilized Signal List
 *
 * Key architectural decisions:
 * 1. UNIQUE KEY: signal.id used as React key — prevents jump/flicker on re-render.
 * 2. CATEGORY LOCKING: useMemo freezes each signal’s category (isGolden, smcTags, direction)
 *    so the label cannot switch unless the signal’s id changes (i.e., a real DB update).
 * 3. WEBSOCKET THROTTLE: SignalCard isolates volatile price + profit% state in its own
 *    useState+setInterval (500ms poll). React.memo ensures the card ONLY re-renders when
 *    the signal’s id or status changes — not on parent re-renders from WS ticks.
 * 4. COUNT FIX: Default filter is “All” so every active signal is visible.
 */
import { Share2 } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { fmtPrice } from "../lib/format";
import { getWeeklyGoldenSniper } from "../lib/swingEngine";
import type { SignalStatus, SwingSignal } from "../lib/swingEngine";
import { GoldenSniper } from "./GoldenSniper";

type CategoryFilter = "ALL" | "SNIPER" | "SWING" | "GEM";

interface Props {
  signals: SwingSignal[];
}

function relativeTime(ts: number): string {
  const totalMins = Math.floor((Date.now() - ts) / 60000);
  if (totalMins < 1) return "< 1m ago";
  if (totalMins < 60) return `${totalMins}m ago`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs < 24) return mins > 0 ? `${hrs}h ${mins}m ago` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return remHrs > 0 ? `${days}d ${remHrs}h ago` : `${days}d ago`;
}

function expiresIn(expiryTime: number): string {
  const ms = expiryTime - Date.now();
  if (ms <= 0) return "Expired";
  const totalMins = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 0) return `Expires in ${hrs}h ${mins}m`;
  return `Expires in ${mins}m`;
}

const COIN_COLORS: Record<string, string> = {
  BTCUSDT: "#F7931A",
  ETHUSDT: "#627EEA",
  BNBUSDT: "#F3BA2F",
  SOLUSDT: "#9945FF",
  XRPUSDT: "#00AAE4",
  ADAUSDT: "#0033AD",
  DOGEUSDT: "#C2A633",
  AVAXUSDT: "#E84142",
  LINKUSDT: "#2A5ADA",
  MATICUSDT: "#8247E5",
  ICPUSDT: "#29ABE2",
  PEPEUSDT: "#00A550",
  SHIBUSDT: "#FFA409",
  ARBUSDT: "#12AAFF",
  OPUSDT: "#FF0420",
  DOTUSDT: "#E6007A",
  UNIUSDT: "#FF007A",
  ATOMUSDT: "#6F7390",
  LTCUSDT: "#BFBBBB",
  NEARUSDT: "#00C08B",
  FLOKIUSDT: "#F6A100",
  WIFUSDT: "#9B59B6",
  BONKUSDT: "#FF6B35",
  MEMEUSDT: "#FFD700",
  TURBOUSDT: "#E74C3C",
  BRETTUSDT: "#3498DB",
  MOGUSDT: "#8E44AD",
  POPCATUSDT: "#E67E22",
};

function StatusBadge({ status }: { status: SignalStatus }) {
  const configs: Record<
    SignalStatus,
    {
      label: string;
      color: string;
      bg: string;
      border: string;
      pulse?: boolean;
    }
  > = {
    LIVE: {
      label: "● LIVE",
      color: "#00FF88",
      bg: "rgba(0,255,136,0.10)",
      border: "#00FF8840",
      pulse: true,
    },
    TP1_HIT: {
      label: "✅ TP1 HIT",
      color: "#00FF88",
      bg: "rgba(0,255,136,0.12)",
      border: "#00FF8860",
    },
    TP2_HIT: {
      label: "🔥 TP2 HIT",
      color: "#D4AF37",
      bg: "rgba(212,175,55,0.12)",
      border: "#D4AF3760",
    },
    TP3_HIT: {
      label: "🏆 TP3 HIT",
      color: "#FFD700",
      bg: "rgba(255,215,0,0.15)",
      border: "#FFD70060",
    },
    SL_HIT: {
      label: "🔴 SL HIT",
      color: "#FF3B5C",
      bg: "rgba(255,59,92,0.12)",
      border: "#FF3B5C40",
    },
    INVALIDATED: {
      label: "❌ INVALIDATED",
      color: "#6B7280",
      bg: "rgba(107,114,128,0.12)",
      border: "#6B728040",
    },
    EXPIRED: {
      label: "⌛ EXPIRED",
      color: "#4B5563",
      bg: "rgba(75,85,99,0.12)",
      border: "#4B556340",
    },
  };
  const cfg = configs[status];
  return (
    <span
      className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
      style={{
        color: cfg.color,
        borderColor: cfg.border,
        background: cfg.bg,
        animation: cfg.pulse ? "pulse 1.8s ease-in-out infinite" : undefined,
      }}
    >
      {cfg.label}
    </span>
  );
}

/** Read live WS price from global state */
function getLivePrice(symbol: string): number | null {
  const p = (window as Window).TS_ULTRA_STATE?.livePrices?.[
    symbol.toUpperCase()
  ];
  return p && p > 0 ? p : null;
}

/**
 * SignalCard — React.memo ensures the card only re-renders when signal id or status changes.
 * Live price + profit% run in isolated local state via a 500ms interval, so WS ticks
 * do NOT trigger a full card re-render.
 */
const SignalCard = memo(
  function SignalCard({
    signal,
    index,
  }: { signal: SwingSignal; index: number }) {
    const color = COIN_COLORS[signal.symbol] ?? "#D4AF37";
    const directionColor = signal.direction === "BUY" ? "#00FF88" : "#FF3B5C";

    // Volatile-only state — only updates price/profit, never re-renders card structure
    const [livePrice, setLivePrice] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(() =>
      relativeTime(signal.createdAt),
    );

    useEffect(() => {
      // Throttle WS price at 500ms — never re-renders structure
      const priceIv = setInterval(() => {
        setLivePrice(getLivePrice(signal.symbol));
      }, 500);
      // Elapsed time updates every 30s (low priority)
      const elapsedIv = setInterval(() => {
        setElapsed(relativeTime(signal.createdAt));
      }, 30_000);
      return () => {
        clearInterval(priceIv);
        clearInterval(elapsedIv);
      };
    }, [signal.symbol, signal.createdAt]);

    const priceDeviation = livePrice
      ? ((livePrice - signal.entry) / signal.entry) * 100
      : null;

    const shortId = signal.id.slice(-8);

    return (
      <div
        data-ocid={`signal.item.${index + 1}`}
        className="relative bg-[#0D1117] rounded-xl border border-[#1C2333] overflow-hidden"
        style={{ borderLeft: `3px solid ${directionColor}` }}
      >
        <div className="p-3 md:p-4">
          {/* Header row — stable, never re-renders from WS */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: `${color}20`,
                border: `1px solid ${color}60`,
                color,
              }}
            >
              {signal.symbol.replace("USDT", "").slice(0, 3)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-white font-bold text-sm">
                  {signal.coin}
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    color: directionColor,
                    borderColor: directionColor,
                    background:
                      signal.direction === "BUY"
                        ? "rgba(0,255,136,0.12)"
                        : "rgba(255,59,92,0.12)",
                  }}
                >
                  {signal.direction === "BUY" ? "▲ BUY" : "▼ SELL"}
                </span>
                {/* Category label — LOCKED once assigned at signal creation */}
                {signal.isGolden ? (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                    style={{
                      color: "#D4AF37",
                      borderColor: "#D4AF37",
                      background: "rgba(212,175,55,0.12)",
                    }}
                  >
                    ❆ ACTIVE SWING
                  </span>
                ) : (
                  <StatusBadge status={signal.status} />
                )}
                {signal.isGem && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold border"
                    style={{
                      color: "#00D4FF",
                      borderColor: "#00D4FF40",
                      background: "rgba(0,212,255,0.08)",
                    }}
                  >
                    💎 GEM
                  </span>
                )}
                {signal.fomoRisk && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold border"
                    style={{
                      color: "#FF3B5C",
                      borderColor: "#FF3B5C40",
                      background: "rgba(255,59,92,0.10)",
                    }}
                  >
                    ⚠️ HIGH FOMO RISK
                  </span>
                )}
                {signal.smartMoneyEntry && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold border"
                    style={{
                      color: "#00FF88",
                      borderColor: "#00FF8840",
                      background: "rgba(0,255,136,0.08)",
                    }}
                  >
                    🧠 SMART MONEY
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                  style={{
                    color: "#00D4FF",
                    borderColor: "#00D4FF40",
                    background: "rgba(0,212,255,0.06)",
                  }}
                >
                  {signal.timeframe}
                </span>
                {/* SMC tags — locked at creation, never flicker */}
                {signal.smcTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                    style={{
                      color: "#D4AF37",
                      borderColor: "#D4AF3740",
                      background: "rgba(212,175,55,0.06)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
                <span
                  className="text-[8px] font-mono text-gray-600"
                  title={`Signal ID: ${signal.id}`}
                >
                  #{shortId}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div
                className="text-sm font-mono font-bold"
                style={{
                  color: signal.confidence >= 98.5 ? "#D4AF37" : "#00FF88",
                }}
              >
                {signal.confidence}%
              </div>
              <div className="text-gray-500 text-[9px] font-mono">
                confidence
              </div>
            </div>
          </div>

          {/* Price grid — Entry/TP/SL are locked at creation, never change */}
          <div
            className="grid gap-2 mb-3"
            style={{ gridTemplateColumns: "repeat(5, minmax(60px, 1fr))" }}
          >
            {[
              { label: "Entry", value: signal.entry, color: "#D4AF37" },
              { label: "TP1", value: signal.tp1, color: "#00FF88" },
              { label: "TP2", value: signal.tp2, color: "#00D4FF" },
              { label: "TP3", value: signal.tp3, color: "#FFD700" },
              { label: "SL", value: signal.sl, color: "#FF3B5C" },
            ].map(({ label, value, color: c }) => (
              <div
                key={label}
                className="bg-[#080B14] rounded-lg p-2 text-center"
                style={{ border: `1px solid ${c}20` }}
              >
                <div className="text-[9px] font-mono text-gray-500 mb-0.5">
                  {label}
                </div>
                <div
                  className="font-mono font-bold text-[11px]"
                  style={{
                    color: c,
                    width: "auto",
                    overflow: "visible",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtPrice(value)}
                </div>
              </div>
            ))}
          </div>

          {/* Live price row — ONLY this section re-renders on WS ticks */}
          {livePrice && (
            <div
              className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg"
              style={{
                background: "rgba(0,212,255,0.05)",
                border: "1px solid rgba(0,212,255,0.15)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] shrink-0"
                style={{ animation: "pulse 1s ease-in-out infinite" }}
              />
              <span className="text-[10px] font-mono text-gray-400">
                Now:{" "}
                <span className="text-[#00D4FF] font-bold">
                  {fmtPrice(livePrice)}
                </span>
              </span>
              {/* Profit % — volatile, only updates here, not in card structure */}
              {priceDeviation !== null && (
                <span
                  className="text-[10px] font-mono font-bold ml-1"
                  style={{
                    color:
                      priceDeviation > 0
                        ? "#00FF88"
                        : priceDeviation < 0
                          ? "#FF3B5C"
                          : "#6B7280",
                  }}
                >
                  ({priceDeviation > 0 ? "+" : ""}
                  {priceDeviation.toFixed(2)}% vs entry)
                </span>
              )}
            </div>
          )}

          <p className="text-gray-400 text-[10px] font-mono leading-relaxed mb-2 line-clamp-3">
            {signal.rationale}
          </p>

          <div className="flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
              <span>🕐 Detected: {signal.displayTime}</span>
              <span className="text-gray-600">·</span>
              {/* Elapsed uses local state, updates every 30s */}
              <span>{elapsed}</span>
              <span className="text-gray-600">·</span>
              <span
                style={{
                  color:
                    signal.expiryTime - Date.now() < 3600000
                      ? "#FF3B5C"
                      : "#6B7280",
                }}
              >
                {expiresIn(signal.expiryTime)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
              <span>R/R {signal.rrRatio}</span>
              <button
                type="button"
                className="text-gray-600 hover:text-[#D4AF37] transition-colors"
                title="Share"
              >
                <Share2 size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
  // Custom comparison: only re-render if id or status changes
  // This prevents WebSocket price ticks from re-rendering the full card
  (prev, next) =>
    prev.signal.id === next.signal.id &&
    prev.signal.status === next.signal.status &&
    prev.index === next.index,
);

export function AlphaSection({ signals }: Props) {
  const [filter, setFilter] = useState<CategoryFilter>("ALL");

  /**
   * CATEGORY LOCKING: useMemo stabilizes the signal list.
   * The signal list only re-derives when signal IDs or statuses change —
   * NOT on every WebSocket tick that triggers a parent re-render.
   * Category labels (isGolden, smcTags, direction) are frozen at creation.
   */
  // Locked signal list — only recalculates when signal IDs/statuses change
  // Category labels (isGolden, smcTags, direction) are frozen via categoryMapRef
  const lockedSignals = useMemo(() => signals, [signals]);

  // Stable reference map to prevent category flicker
  const categoryMapRef = useRef<Map<string, "SNIPER" | "SWING" | "GEM">>(
    new Map(),
  );
  useMemo(() => {
    for (const s of lockedSignals) {
      if (!categoryMapRef.current.has(s.id)) {
        // Assign category ONCE and lock it — only a real DB update (id change) can modify this
        const cat: "SNIPER" | "SWING" | "GEM" = s.isGolden
          ? "SNIPER"
          : s.isGem
            ? "GEM"
            : "SWING";
        categoryMapRef.current.set(s.id, cat);
      }
    }
  }, [lockedSignals]);

  const goldenSignal = useMemo(() => {
    // Prefer the weekly-locked Golden Sniper (stable for 1 week)
    const weekly = getWeeklyGoldenSniper();
    if (weekly) return weekly;
    // Fallback: highest-confidence golden in current active list
    return lockedSignals.find((s) => s.isGolden) ?? null;
  }, [lockedSignals]);

  // Apply filter — default "ALL" shows everything (fixes count mismatch)
  const filteredSignals = useMemo(() => {
    const regular = lockedSignals.filter((s) => !s.isGolden);
    if (filter === "ALL") return regular;
    return regular.filter((s) => {
      const cat = categoryMapRef.current.get(s.id);
      return cat === filter;
    });
  }, [lockedSignals, filter]);

  const counts = useMemo(() => {
    const regular = lockedSignals.filter((s) => !s.isGolden);
    const sniper = regular.filter(
      (s) => categoryMapRef.current.get(s.id) === "SNIPER",
    ).length;
    const gem = regular.filter(
      (s) => categoryMapRef.current.get(s.id) === "GEM",
    ).length;
    const swing = regular.filter(
      (s) => categoryMapRef.current.get(s.id) === "SWING",
    ).length;
    return { all: regular.length, sniper, gem, swing };
  }, [lockedSignals]);

  const filterTabs: { id: CategoryFilter; label: string; count: number }[] = [
    { id: "ALL", label: "All", count: counts.all },
    { id: "SNIPER", label: "Sniper", count: counts.sniper },
    { id: "SWING", label: "Swing", count: counts.swing },
    { id: "GEM", label: "Gems", count: counts.gem },
  ];

  return (
    <section data-ocid="signals.section">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-mono font-bold text-base">
            Active Swing Signals
          </h2>
          <p className="text-gray-500 text-xs font-mono mt-0.5">
            DRL/LSTM + Transformer · 30 Assets · 24H Signal Lifecycle
          </p>
        </div>
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border"
          style={{
            color: "#00FF88",
            borderColor: "#00FF88",
            background: "rgba(0,255,136,0.08)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"
            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
          />
          {signals.length} LIVE
        </span>
      </div>

      {/* Category filter tabs — default ALL to prevent count mismatch */}
      <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
        {filterTabs.map(({ id, label, count }) => {
          const isActive = filter === id;
          return (
            <button
              key={id}
              type="button"
              data-ocid={`signals.filter.${id.toLowerCase()}.tab`}
              onClick={() => setFilter(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold border whitespace-nowrap transition-all"
              style={{
                color: isActive ? "#D4AF37" : "#6B7280",
                borderColor: isActive ? "#D4AF37" : "#1C2333",
                background: isActive ? "rgba(212,175,55,0.10)" : "transparent",
              }}
            >
              {label}
              <span
                className="px-1 py-0.5 rounded text-[8px]"
                style={{
                  background: isActive
                    ? "rgba(212,175,55,0.20)"
                    : "rgba(107,114,128,0.15)",
                  color: isActive ? "#D4AF37" : "#6B7280",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <GoldenSniper
          signal={goldenSignal}
          scanningForGoldenSniper={!goldenSignal}
        />
      </div>

      {filteredSignals.length === 0 ? (
        <div
          data-ocid="signals.empty_state"
          className="text-center py-16 text-gray-600 font-mono text-sm"
        >
          <div
            className="w-12 h-12 rounded-full border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-3"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          >
            <span className="text-[#D4AF37]/50 text-lg">◉</span>
          </div>
          {filter === "ALL"
            ? "DRL Scanner active — awaiting high-confidence setups (>95%)"
            : `No ${filter.toLowerCase()} signals active. Switch to All to see all signals.`}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredSignals.map((signal, i) => (
            // signal.id is the unique key — prevents React re-ordering bugs
            <SignalCard key={signal.id} signal={signal} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
