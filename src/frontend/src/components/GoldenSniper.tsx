import { Crown, Lock } from "lucide-react";
import type { HistoryEntry } from "../hooks/useSignalHistory";
import type { Signal } from "../hooks/useTokenData";
import { fmtPrice } from "../lib/utils";

interface Props {
  signal: Signal | null;
  isPro: boolean;
  onUnlock: () => void;
  scanningForGoldenSniper?: boolean;
  historyEntry?: HistoryEntry | null;
  isAdmin?: boolean;
}

/**
 * Accurate relative time that does NOT reset to "just now" on page refresh.
 * Shows: "Xm ago" or "Xh Ym ago" based on stored createdAt timestamp.
 */
function relativeTime(ts: number): string {
  const totalMins = Math.floor((Date.now() - ts) / 60000);
  if (totalMins < 1) return "< 1m ago";
  if (totalMins < 60) return `${totalMins}m ago`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs < 24) {
    return mins > 0 ? `${hrs}h ${mins}m ago` : `${hrs}h ago`;
  }
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return remHrs > 0 ? `${days}d ${remHrs}h ago` : `${days}d ago`;
}

const COIN_COLORS: Record<string, string> = {
  BTCUSDT: "#F7931A",
  ETHUSDT: "#627EEA",
  SOLUSDT: "#9945FF",
  BNBUSDT: "#F3BA2F",
  XRPUSDT: "#00AAE4",
};

const SCAN_CHECKS = [
  { label: "RSI Check", color: "#00D4FF" },
  { label: "Volume Spike", color: "#D4AF37" },
  { label: "OB+FVG Confluence", color: "#00FF88" },
];

function ScanningState() {
  return (
    <>
      <style>{`
        @keyframes scanPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes radar { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes dotCycle0 { 0%,33%,100% { background:#00D4FF; opacity:1; } 34%,99% { opacity:0.2; } }
        @keyframes dotCycle1 { 0%,33% { opacity:0.2; } 34%,66%,100% { background:#D4AF37; opacity:1; } 67%,99% { opacity:0.2; } }
        @keyframes dotCycle2 { 0%,66% { opacity:0.2; } 67%,99%,100% { background:#00FF88; opacity:1; } }
        @keyframes scanLine { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
      `}</style>

      <div className="text-center py-6">
        {/* Radar circle */}
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
        <p className="text-gray-500 font-mono text-xs mb-4">
          Monitoring 20 assets for 95%+ confluence setup
        </p>

        <div className="relative h-0.5 bg-[#1C2333] rounded-full overflow-hidden mb-4 mx-8">
          <div
            className="absolute top-0 left-0 h-full w-1/4 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #D4AF37, transparent)",
              animation: "scanLine 1.5s ease-in-out infinite",
            }}
          />
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          {SCAN_CHECKS.map((check, i) => (
            <div key={check.label} className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-gray-400">
                {check.label}
              </span>
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{
                  backgroundColor: check.color,
                  animation: `dotCycle${i} 3s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function GoldenSniper({
  signal,
  isPro,
  onUnlock,
  scanningForGoldenSniper,
  historyEntry,
  isAdmin,
}: Props) {
  const isEligible =
    signal !== null && signal.confidence > 95 && signal.winRate > 90;

  return (
    <div
      data-ocid="signals.golden_sniper_card"
      className="relative rounded-xl overflow-hidden border mb-6"
      style={{
        borderColor: "#D4AF37",
        boxShadow: isEligible
          ? "0 0 24px rgba(212,175,55,0.3), 0 0 48px rgba(212,175,55,0.1)"
          : scanningForGoldenSniper
            ? "0 0 20px rgba(212,175,55,0.15), 0 0 40px rgba(0,212,255,0.05)"
            : "0 0 16px rgba(212,175,55,0.1)",
        background:
          "linear-gradient(135deg, #0D1117 0%, #12100A 50%, #0D1117 100%)",
      }}
    >
      <div
        className="h-0.5 w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, #D4AF37, #FFD700, #D4AF37, transparent)",
        }}
      />

      <div className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Crown className="text-[#FFD700]" size={20} />
          <span className="text-[#FFD700] font-mono font-bold text-sm tracking-widest">
            THE GOLDEN SNIPER
          </span>
          {isEligible && (
            <span className="bg-[#D4AF37]/20 text-[#FFD700] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#D4AF37]/40">
              Triple Confirmation
            </span>
          )}
          {isEligible && signal && (
            <div className="text-gray-500 text-[10px] font-mono ml-auto flex flex-col items-end">
              <span>
                Detected:{" "}
                {new Date(signal.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                  hour12: false,
                })}{" "}
                UTC
              </span>
              <span>Elapsed: {relativeTime(signal.createdAt)}</span>
            </div>
          )}
          {scanningForGoldenSniper && !isEligible && (
            <span
              className="text-[#00D4FF] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#00D4FF]/40"
              style={{
                background: "rgba(0,212,255,0.08)",
                animation: "scanPulse 2s ease-in-out infinite",
              }}
            >
              🔍 Scanning...
            </span>
          )}
        </div>

        {isAdmin ? (
          <ScanningState />
        ) : !isEligible ? (
          scanningForGoldenSniper ? (
            !isPro ? (
              <div className="relative">
                <div className="opacity-30 blur-sm select-none pointer-events-none">
                  <ScanningState />
                </div>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
                  style={{ background: "rgba(8,11,20,0.7)" }}
                >
                  <Lock className="text-[#D4AF37] mb-2" size={28} />
                  <p className="text-[#FFD700] font-bold text-sm mb-3">
                    Unlock Golden Sniper
                  </p>
                  <button
                    type="button"
                    data-ocid="signals.golden_sniper_unlock_button"
                    onClick={onUnlock}
                    className="px-6 py-2 rounded-full text-sm font-mono font-bold transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #D4AF37, #FFD700)",
                      color: "#080B14",
                    }}
                  >
                    🔒 Unlock Golden Sniper
                  </button>
                </div>
              </div>
            ) : (
              <ScanningState />
            )
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 font-mono text-sm">
                🎯 No Golden Sniper setup today — awaiting 95%+ confluence
              </p>
              <p className="text-gray-600 font-mono text-xs mt-1">
                Requires Confidence &gt;95% · Win-Rate &gt;90% · OB + FVG +
                Liquidity Sweep
              </p>
            </div>
          )
        ) : (
          <>
            <p className="text-[#D4AF37]/60 font-mono text-[11px] mb-4">
              Confidence &gt;95% · Win-Rate &gt;90%
            </p>

            <div className="flex gap-2 mb-3 flex-wrap">
              {["OB Confirmed ✓", "FVG Fill ✓", "Liquidity Sweep ✓"].map(
                (p) => (
                  <span
                    key={p}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(212,175,55,0.15)",
                      color: "#D4AF37",
                      border: "1px solid rgba(212,175,55,0.4)",
                    }}
                  >
                    {p}
                  </span>
                ),
              )}
            </div>

            {isPro && historyEntry && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {historyEntry.tp1HitAt && (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      background: "rgba(0,255,136,0.12)",
                      color: "#00FF88",
                      border: "1px solid rgba(0,255,136,0.4)",
                    }}
                  >
                    ✅ TP1 Hit
                  </span>
                )}
                {historyEntry.tp2HitAt && (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      background: "rgba(255,160,0,0.12)",
                      color: "#FFA000",
                      border: "1px solid rgba(255,160,0,0.4)",
                    }}
                  >
                    🔥🔥 TP2 Hit
                  </span>
                )}
                {historyEntry.tp3HitAt && (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      background: "rgba(212,175,55,0.15)",
                      color: "#FFD700",
                      border: "1px solid rgba(212,175,55,0.4)",
                    }}
                  >
                    🚀 TP3 Hit
                  </span>
                )}
              </div>
            )}

            {!isPro ? (
              <div className="relative">
                <div className="blur-sm select-none pointer-events-none">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold"
                      style={{
                        background: `${COIN_COLORS[signal!.symbol] ?? "#D4AF37"}20`,
                        borderColor: `${COIN_COLORS[signal!.symbol] ?? "#D4AF37"}60`,
                        color: COIN_COLORS[signal!.symbol] ?? "#D4AF37",
                      }}
                    >
                      {signal!.symbol.replace("USDT", "").slice(0, 3)}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">
                        {signal!.coin}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Entry: ${fmtPrice(signal!.entry)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["Entry", "TP1", "TP2", "TP3"].map((l) => (
                      <div
                        key={l}
                        className="bg-[#080B14] rounded-lg p-2 text-center"
                      >
                        <p className="text-[10px] text-gray-500">{l}</p>
                        <p className="text-xs font-mono text-white">$XXXXX</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080B14]/60 rounded-lg">
                  <Lock className="text-[#D4AF37] mb-2" size={28} />
                  <p className="text-[#FFD700] font-bold text-sm mb-3">
                    Pro Only — Unlock The Golden Sniper
                  </p>
                  <button
                    type="button"
                    data-ocid="signals.unlock_pro_button"
                    onClick={onUnlock}
                    className="px-6 py-2 rounded-full text-sm font-mono font-bold transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #D4AF37, #FFD700)",
                      color: "#080B14",
                    }}
                  >
                    🔒 Unlock Pro Access
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold"
                    style={{
                      background: `${COIN_COLORS[signal!.symbol] ?? "#D4AF37"}20`,
                      borderColor: `${COIN_COLORS[signal!.symbol] ?? "#D4AF37"}60`,
                      color: COIN_COLORS[signal!.symbol] ?? "#D4AF37",
                    }}
                  >
                    {signal!.symbol.replace("USDT", "").slice(0, 3)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">
                      {signal!.coin}
                    </p>
                    <p className="text-gray-400 text-xs italic">
                      {signal!.rationale}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[#D4AF37] text-xs font-mono">R:R</p>
                    <p className="text-[#FFD700] font-bold font-mono">
                      {signal!.rrRatio}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { label: "ENTRY", value: signal!.entry, color: "#00D4FF" },
                    { label: "TP1", value: signal!.tp1, color: "#00FF88" },
                    { label: "TP2", value: signal!.tp2, color: "#00FF88" },
                    { label: "TP3", value: signal!.tp3, color: "#FFD700" },
                    { label: "SL", value: signal!.sl, color: "#FF3B5C" },
                  ].map(({ label, value, color: c }) => (
                    <div
                      key={label}
                      className="bg-[#080B14] rounded-lg p-2 text-center border border-[#1C2333]"
                    >
                      <p className="text-[10px] text-gray-500 mb-0.5">
                        {label}
                      </p>
                      <p
                        className="text-xs font-mono font-bold overflow-hidden text-ellipsis"
                        style={{ color: c }}
                        title={String(value)}
                      >
                        ${fmtPrice(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
