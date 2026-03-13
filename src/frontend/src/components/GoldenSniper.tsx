import { Crown } from "lucide-react";
import { fmtPrice } from "../lib/format";
import type { SwingSignal } from "../lib/swingEngine";

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

const SCAN_CHECKS = [
  { label: "RSI Check" },
  { label: "Volume Spike" },
  { label: "OB+FVG Confluence" },
];

const COIN_COLORS: Record<string, string> = {
  BTCUSDT: "#F7931A",
  ETHUSDT: "#627EEA",
  SOLUSDT: "#9945FF",
  BNBUSDT: "#F3BA2F",
  XRPUSDT: "#00AAE4",
};

function ScanningState() {
  return (
    <>
      <style>{`
        @keyframes scanPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes radar { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes dotCycle0 { 0%,33%,100% { background:#00D4FF; opacity:1; } 34%,99% { opacity:0.2; } }
        @keyframes dotCycle1 { 0%,33% { opacity:0.2; } 34%,66%,100% { background:#D4AF37; opacity:1; } 67%,99% { opacity:0.2; } }
        @keyframes dotCycle2 { 0%,66% { opacity:0.2; } 67%,99%,100% { background:#00FF88; opacity:1; } }
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
          AI SCANNING MARKET...
        </p>
        <p className="text-gray-500 text-xs font-mono mb-4">
          Waiting for 99%+ confidence Golden Sniper setup
        </p>
        <div className="flex items-center justify-center gap-3">
          {SCAN_CHECKS.map((check, i) => (
            <div key={check.label} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ animation: `dotCycle${i} 3s ease-in-out infinite` }}
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
        <span
          className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full border"
          style={{
            color: "#D4AF37",
            borderColor: "#D4AF3740",
            background: "rgba(212,175,55,0.06)",
          }}
        >
          99%+ CONFIDENCE
        </span>
      </div>

      {scanningForGoldenSniper || !signal ? (
        <ScanningState />
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
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
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">{signal.coin}</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    color: signal.direction === "BUY" ? "#00FF88" : "#FF3B5C",
                    borderColor:
                      signal.direction === "BUY" ? "#00FF88" : "#FF3B5C",
                    background:
                      signal.direction === "BUY"
                        ? "rgba(0,255,136,0.12)"
                        : "rgba(255,59,92,0.12)",
                  }}
                >
                  {signal.direction === "BUY" ? "\u25b2 BUY" : "\u25bc SELL"}
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    color: "#D4AF37",
                    borderColor: "#D4AF37",
                    background: "rgba(212,175,55,0.12)",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                >
                  \u2726 ACTIVE SWING
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-gray-500 text-[10px] font-mono">
                  \uD83D\uDD50 {signal.displayTime}
                </span>
                <span className="text-gray-600 text-[10px]">\u00b7</span>
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
            R/R Ratio: {signal.rrRatio} \u00b7 Signal active until TP3 or SL hit
          </div>
        </div>
      )}
    </div>
  );
}
