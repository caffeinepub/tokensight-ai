import { Crown, Target, TrendingDown, TrendingUp } from "lucide-react";
import { fmtPrice } from "../lib/format";
import type { SignalStatus, SwingSignal } from "../lib/swingEngine";

interface Props {
  signal: SwingSignal | null;
  scanningForGoldenSniper?: boolean;
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

function calcTargetProfitPct(
  entry: number,
  tp3: number,
  direction: "BUY" | "SELL",
): string {
  if (!entry || !tp3) return "—";
  const pct = Math.abs((tp3 - entry) / entry) * 100;
  return `${direction === "BUY" ? "+" : "-"}${pct.toFixed(2)}%`;
}

const SCAN_CHECKS = [
  { label: "LSTM Layer" },
  { label: "Transformer" },
  { label: "DRL Agent" },
  { label: "OB+FVG" },
];

const COIN_COLORS: Record<string, string> = {
  BTCUSDT: "#F7931A",
  ETHUSDT: "#627EEA",
  SOLUSDT: "#9945FF",
  BNBUSDT: "#F3BA2F",
  XRPUSDT: "#00AAE4",
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
        animation: cfg.pulse ? "pulse 2s ease-in-out infinite" : undefined,
      }}
    >
      {cfg.label}
    </span>
  );
}

function ScanningState() {
  return (
    <>
      <style>{`
        @keyframes scanPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes radar { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes dotCycle0 { 0%,25%,100% { background:#00D4FF; opacity:1; } 26%,99% { opacity:0.2; } }
        @keyframes dotCycle1 { 0%,25% { opacity:0.2; } 26%,50%,100% { background:#D4AF37; opacity:1; } 51%,99% { opacity:0.2; } }
        @keyframes dotCycle2 { 0%,50% { opacity:0.2; } 51%,75%,100% { background:#00FF88; opacity:1; } 76%,99% { opacity:0.2; } }
        @keyframes dotCycle3 { 0%,75% { opacity:0.2; } 76%,99%,100% { background:#9945FF; opacity:1; } }
      `}</style>
      <div className="text-center py-6">
        <div className="relative inline-flex items-center justify-center mb-4">
          <div
            className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/20 relative"
            style={{ animation: "scanPulse 2s ease-in-out infinite" }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 270deg, rgba(212,175,55,0.6) 360deg)",
                animation: "radar 2s linear infinite",
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-[#D4AF37] -translate-x-1/2 -translate-y-1/2"
              style={{ animation: "scanPulse 1s ease-in-out infinite" }}
            />
          </div>
        </div>
        <p
          className="text-[#D4AF37] font-mono font-bold text-sm tracking-widest mb-1"
          style={{ animation: "scanPulse 1.8s ease-in-out infinite" }}
        >
          DRL SCANNING MARKET...
        </p>
        <p className="text-gray-500 text-xs font-mono mb-4">
          180-day baseline + real-time alignment · awaiting 98.5%+ confidence
        </p>
        <div className="flex items-center justify-center gap-4">
          {SCAN_CHECKS.map((check, i) => (
            <div key={check.label} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ animation: `dotCycle${i} 4s ease-in-out infinite` }}
              />
              <span className="text-gray-600 text-[9px] font-mono hidden sm:block">
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function GoldenSniper({ signal, scanningForGoldenSniper }: Props) {
  const shortId = signal ? signal.id.slice(-8) : null;
  const targetProfitPct = signal
    ? calcTargetProfitPct(signal.entry, signal.tp3, signal.direction)
    : "—";
  const dirColor = signal?.direction === "BUY" ? "#00FF88" : "#FF3B5C";

  return (
    <div
      data-ocid="golden.card"
      className="rounded-xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0D1117 0%, #1A1400 100%)",
        borderColor: "#D4AF37",
        boxShadow: "0 0 20px rgba(212,175,55,0.08)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2 border-b"
        style={{ borderColor: "#D4AF3720" }}
      >
        <Crown className="text-[#D4AF37]" size={16} />
        <span className="text-[#D4AF37] font-mono font-bold text-sm tracking-wider">
          GOLDEN SNIPER
        </span>
        {shortId && (
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
            style={{
              color: "#6B7280",
              borderColor: "#374151",
              background: "rgba(55,65,81,0.3)",
            }}
          >
            ID: #{shortId}
          </span>
        )}
        <span
          className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full border"
          style={{
            color: "#D4AF37",
            borderColor: "#D4AF3740",
            background: "rgba(212,175,55,0.06)",
          }}
        >
          98.5%+ CONFIDENCE
        </span>
      </div>

      {scanningForGoldenSniper || !signal ? (
        <ScanningState />
      ) : (
        <div className="p-4">
          {/* Coin + direction header */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs"
              style={{
                background: `${COIN_COLORS[signal.symbol] ?? "#D4AF37"}20`,
                border: `2px solid ${COIN_COLORS[signal.symbol] ?? "#D4AF37"}80`,
                color: COIN_COLORS[signal.symbol] ?? "#D4AF37",
              }}
            >
              {signal.symbol.replace("USDT", "").slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold">{signal.coin}</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border flex items-center gap-1"
                  style={{
                    color: dirColor,
                    borderColor: dirColor,
                    background:
                      signal.direction === "BUY"
                        ? "rgba(0,255,136,0.12)"
                        : "rgba(255,59,92,0.12)",
                  }}
                >
                  {signal.direction === "BUY" ? (
                    <TrendingUp size={10} />
                  ) : (
                    <TrendingDown size={10} />
                  )}
                  {signal.direction}
                </span>
                <StatusBadge status={signal.status} />
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
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-gray-500 text-[10px] font-mono">
                  🕐 {signal.displayTime}
                </span>
                <span className="text-gray-600 text-[10px]">·</span>
                <span className="text-gray-500 text-[10px] font-mono">
                  {relativeTime(signal.createdAt)}
                </span>
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[#D4AF37] font-mono font-bold text-lg">
                {signal.confidence}%
              </div>
              <div className="text-gray-500 text-[9px] font-mono">
                confidence
              </div>
            </div>
          </div>

          {/* KEY TRADING INFO: Action / Entry Price / Target Profit */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div
              className="rounded-lg p-3 text-center"
              style={{
                background:
                  signal.direction === "BUY"
                    ? "rgba(0,255,136,0.06)"
                    : "rgba(255,59,92,0.06)",
                border: `1px solid ${dirColor}30`,
              }}
            >
              <div className="text-[9px] font-mono text-gray-500 mb-1">
                ACTION
              </div>
              <div
                className="font-mono font-black text-sm flex items-center justify-center gap-1"
                style={{ color: dirColor }}
              >
                {signal.direction === "BUY" ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {signal.direction}
              </div>
              <div
                className="text-[9px] font-mono mt-0.5"
                style={{ color: dirColor }}
              >
                {signal.direction === "BUY" ? "Bullish" : "Bearish"}
              </div>
            </div>
            <div
              className="rounded-lg p-3 text-center"
              style={{
                background: "rgba(212,175,55,0.06)",
                border: "1px solid #D4AF3730",
              }}
            >
              <div className="text-[9px] font-mono text-gray-500 mb-1">
                ENTRY PRICE
              </div>
              <div
                className="font-mono font-bold text-sm text-[#D4AF37]"
                style={{
                  width: "auto",
                  overflow: "visible",
                  whiteSpace: "nowrap",
                }}
              >
                {fmtPrice(signal.entry)}
              </div>
              <div className="text-[9px] font-mono text-gray-600 mt-0.5">
                Locked at creation
              </div>
            </div>
            <div
              className="rounded-lg p-3 text-center"
              style={{
                background: "rgba(255,215,0,0.06)",
                border: "1px solid #FFD70030",
              }}
            >
              <div className="text-[9px] font-mono text-gray-500 mb-1 flex items-center justify-center gap-1">
                <Target size={8} /> TARGET PROFIT
              </div>
              <div
                className="font-mono font-bold text-sm text-[#FFD700]"
                style={{
                  width: "auto",
                  overflow: "visible",
                  whiteSpace: "nowrap",
                }}
              >
                {fmtPrice(signal.tp3)}
              </div>
              <div
                className="font-mono font-black text-xs mt-0.5"
                style={{ color: dirColor }}
              >
                {targetProfitPct}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {signal.fomoRisk && (
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border"
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
                className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border"
                style={{
                  color: "#00FF88",
                  borderColor: "#00FF8840",
                  background: "rgba(0,255,136,0.08)",
                }}
              >
                🧠 SMART MONEY ENTRY
              </span>
            )}
            {signal.alignmentScore !== undefined && (
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border"
                style={{
                  color: "#00D4FF",
                  borderColor: "#00D4FF40",
                  background: "rgba(0,212,255,0.08)",
                }}
              >
                📊 {(signal.alignmentScore * 100).toFixed(0)}% ALIGNMENT
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {signal.smcTags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                style={{
                  color: "#D4AF37",
                  borderColor: "#D4AF3740",
                  background: "rgba(212,175,55,0.08)",
                }}
              >
                {tag}
              </span>
            ))}
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
          </div>

          <div className="grid grid-cols-5 gap-2 mb-3">
            {[
              { label: "Entry", value: signal.entry, color: "#D4AF37" },
              { label: "TP1", value: signal.tp1, color: "#00FF88" },
              { label: "TP2", value: signal.tp2, color: "#00D4FF" },
              { label: "TP3", value: signal.tp3, color: "#FFD700" },
              { label: "SL", value: signal.sl, color: "#FF3B5C" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-lg p-2 text-center"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${color}20`,
                }}
              >
                <div className="text-[9px] font-mono text-gray-500 mb-0.5">
                  {label}
                </div>
                <div
                  className="font-mono font-bold text-[11px]"
                  style={{
                    color,
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

          <p className="text-gray-400 text-[10px] font-mono leading-relaxed">
            {signal.rationale}
          </p>
          <div className="mt-2 text-[9px] font-mono text-gray-600">
            R/R Ratio: {signal.rrRatio} · Signal ID: #{signal.id.slice(-8)} ·
            Locked until terminal state
          </div>
        </div>
      )}
    </div>
  );
}
