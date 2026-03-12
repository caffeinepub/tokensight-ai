import { Lock, Share2 } from "lucide-react";
import type { HistoryEntry } from "../hooks/useSignalHistory";
import type { Signal } from "../hooks/useTokenData";
import { GoldenSniper } from "./GoldenSniper";
import { ShareMyWin } from "./ShareMyWin";

interface Props {
  signals: Signal[];
  isPro: boolean;
  onUnlock: () => void;
  scanningForGoldenSniper?: boolean;
  goldenHistoryEntry?: HistoryEntry | null;
}

function fmt(n: number): string {
  if (n < 0.0001) return n.toFixed(8);
  if (n < 0.001) return n.toFixed(7);
  if (n < 1) return n.toFixed(5);
  if (n < 100) return n.toFixed(3);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function relativeTime(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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
};

function SignalCard({
  signal,
  index,
  isPro,
  onUnlock,
}: { signal: Signal; index: number; isPro: boolean; onUnlock: () => void }) {
  const color = COIN_COLORS[signal.symbol] ?? "#D4AF37";
  // Only GEM tokens are hidden gems (Pro-locked)
  const isLocked = !isPro && signal.isHiddenGem;
  // For free users, lock all signals beyond the first non-gem one
  const isLockedByTier = !isPro && index > 0;

  const locked = isLocked || isLockedByTier;
  const createdAt = signal.createdAt ?? Date.now();

  return (
    <div
      data-ocid={`signal.item.${index + 1}`}
      className="relative bg-[#0D1117] rounded-xl border border-[#1C2333] overflow-hidden"
      style={{
        borderLeft: `3px solid ${signal.trendAlignment === "BULL" ? "#00FF88" : "#FF3B5C"}`,
      }}
    >
      {locked && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
          style={{
            background: "rgba(8,11,20,0.88)",
            backdropFilter: "blur(5px)",
          }}
        >
          <Lock className="text-[#D4AF37] mb-2" size={22} />
          <p className="text-white font-bold text-xs mb-2">Pro Signal</p>
          <button
            type="button"
            data-ocid="signals.unlock_pro_button"
            onClick={onUnlock}
            className="px-4 py-1.5 rounded-full font-mono font-bold text-xs"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #FFD700)",
              color: "#080B14",
            }}
          >
            Unlock Pro
          </button>
        </div>
      )}
      <div className={locked ? "blur-sm select-none pointer-events-none" : ""}>
        <div className="p-3 md:p-4">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-2">
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
                {signal.marketCapTier === "GEM" && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border"
                    style={{
                      color: "#FFD700",
                      borderColor: "#D4AF37",
                      background: "rgba(212,175,55,0.15)",
                    }}
                  >
                    💎 GEM
                  </span>
                )}
                {signal.marketCapTier === "MAJOR_ALPHA" && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border"
                    style={{
                      color: "#00D4FF",
                      borderColor: "#00D4FF",
                      background: "rgba(0,212,255,0.1)",
                    }}
                  >
                    ⚡ MAJOR ALPHA
                  </span>
                )}
                {signal.marketCapTier === "MID_CAP" && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border"
                    style={{
                      color: "#6B7280",
                      borderColor: "#374151",
                      background: "rgba(107,114,128,0.1)",
                    }}
                  >
                    MID CAP
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {signal.tags.map((t) => (
                <span
                  key={t}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1C2333] text-gray-400"
                >
                  {t}
                </span>
              ))}
              <span className="text-[9px] font-mono text-gray-500 ml-1">
                🕒 {relativeTime(createdAt)}
              </span>
            </div>
          </div>

          {/* Confidence + Win Rate */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 font-mono">CONF:</span>
              <span
                className="text-[10px] font-mono font-bold"
                style={{
                  color: signal.confidence > 90 ? "#00FF88" : "#D4AF37",
                }}
              >
                {signal.confidence}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 font-mono">WIN:</span>
              <span
                className="text-[10px] font-mono font-bold"
                style={{ color: signal.winRate > 85 ? "#00FF88" : "#D4AF37" }}
              >
                {signal.winRate}%
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 ml-auto">
              R:R {signal.rrRatio}
            </span>
          </div>

          {/* Rationale */}
          <p className="text-gray-500 text-[10px] italic mb-3">
            {signal.rationale}
          </p>

          {/* Price grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: "ENTRY", value: signal.entry, color: "#00D4FF" },
              { label: "TP1", value: signal.tp1, color: "#00FF88" },
              { label: "TP2", value: signal.tp2, color: "#00FF88" },
              { label: "TP3", value: signal.tp3, color: "#FFD700" },
              { label: "SL", value: signal.sl, color: "#FF3B5C" },
            ].map(({ label, value, color: c }) => (
              <div
                key={label}
                className="bg-[#080B14] rounded-lg p-1.5 text-center border border-[#1C2333]"
              >
                <p className="text-[9px] text-gray-600 mb-0.5">{label}</p>
                <p
                  className="text-[10px] font-mono font-bold overflow-hidden text-ellipsis"
                  style={{ color: c }}
                  title={String(value)}
                >
                  ${fmt(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Share button (pro signals) */}
          {isPro && (
            <div className="flex justify-end mt-2">
              <ShareMyWin signal={signal}>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#D4AF37] transition-colors font-mono"
                >
                  <Share2 size={10} />
                  Share Win
                </button>
              </ShareMyWin>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlphaSection({
  signals,
  isPro,
  onUnlock,
  scanningForGoldenSniper,
  goldenHistoryEntry,
}: Props) {
  const goldenSniperSignal =
    signals.find((s) => s.isGoldenSniperEligible) ?? null;
  const lockedCount = isPro ? 0 : Math.max(0, signals.length - 1);

  return (
    <section>
      {/* Golden Sniper */}
      <GoldenSniper
        signal={goldenSniperSignal}
        isPro={isPro}
        onUnlock={onUnlock}
        scanningForGoldenSniper={scanningForGoldenSniper}
        historyEntry={goldenHistoryEntry}
      />

      {/* Active Signals Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-mono font-bold text-sm">
          ACTIVE SIGNALS
          <span className="text-gray-500 font-normal ml-2">
            ({isPro ? signals.length : 1} shown
            {!isPro && lockedCount > 0 && (
              <span className="text-[#D4AF37]"> · {lockedCount} locked</span>
            )}
            )
          </span>
        </h2>
        {!isPro && (
          <button
            type="button"
            data-ocid="signals.unlock_pro_button"
            onClick={onUnlock}
            className="text-[10px] font-mono text-[#D4AF37] border border-[#D4AF37]/40 px-3 py-1 rounded-full hover:bg-[#D4AF37]/10 transition-colors"
          >
            Unlock {lockedCount} more →
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {signals.map((s, i) => (
          <SignalCard
            key={s.id}
            signal={s}
            index={i}
            isPro={isPro}
            onUnlock={onUnlock}
          />
        ))}
      </div>
    </section>
  );
}
