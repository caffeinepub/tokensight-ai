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
  isAdmin?: boolean;
  goldenHistoryEntry?: HistoryEntry | null;
}

function fmt(n: number): string {
  if (!n || Number.isNaN(n)) return "—";
  if (n >= 1) {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (n >= 0.0001) {
    return n
      .toFixed(6)
      .replace(/(\.\d*?[1-9])0+$/, "$1")
      .replace(/\.0+$/, ".000001");
  }
  return n.toPrecision(4);
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
  isAdmin,
  onUnlock,
}: {
  signal: Signal;
  index: number;
  isPro: boolean;
  isAdmin?: boolean;
  onUnlock: () => void;
}) {
  const color = COIN_COLORS[signal.symbol] ?? "#D4AF37";
  // Index 0 is always FREE for everyone; all others require wallet/payment
  const isFreeSignal = index === 0;
  const locked = !isFreeSignal && !isPro && !isAdmin;

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
            backdropFilter: "blur(6px)",
          }}
        >
          <Lock className="text-[#D4AF37] mb-2" size={22} />
          <p className="text-white font-bold text-xs mb-0.5">Pro Signal</p>
          <p className="text-gray-500 text-[10px] font-mono mb-2">
            Connect wallet to unlock
          </p>
          <button
            type="button"
            data-ocid="signals.unlock_pro_button"
            onClick={onUnlock}
            className="px-4 py-1.5 rounded-full font-mono font-bold text-xs transition-all hover:scale-105"
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

                {/* First signal: FREE COMMUNITY ALPHA badge */}
                {isFreeSignal && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border"
                    style={{
                      color: "#00FF88",
                      borderColor: "#00FF88",
                      background: "rgba(0,255,136,0.1)",
                      animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                    }}
                  >
                    🎁 FREE COMMUNITY ALPHA
                  </span>
                )}

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
                🕒 {relativeTime(signal.createdAt)}
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

          <p className="text-gray-500 text-[10px] italic mb-3">
            {signal.rationale}
          </p>

          {/* Price grid \u2014 static values locked at signal creation */}
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

          {(isPro || isAdmin) && (
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
  isAdmin,
}: Props) {
  const goldenSniperSignal =
    signals.find((s) => s.isGoldenSniperEligible) ?? null;
  // Locked count: everything except the first free signal
  const lockedCount = isPro || isAdmin ? 0 : Math.max(0, signals.length - 1);

  return (
    <section>
      <GoldenSniper
        signal={goldenSniperSignal}
        isPro={isPro}
        onUnlock={onUnlock}
        scanningForGoldenSniper={scanningForGoldenSniper}
        historyEntry={goldenHistoryEntry}
        isAdmin={isAdmin}
      />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-mono font-bold text-sm">
          ACTIVE SIGNALS
          <span className="text-gray-500 font-normal ml-2">
            ({isPro || isAdmin ? signals.length : signals.length} total
            {!isPro && !isAdmin && lockedCount > 0 && (
              <span className="text-[#D4AF37]"> · {lockedCount} locked</span>
            )}
            )
          </span>
        </h2>
        {!isPro && !isAdmin && lockedCount > 0 && (
          <button
            type="button"
            data-ocid="signals.unlock_more_button"
            onClick={onUnlock}
            className="text-[10px] font-mono text-[#D4AF37] border border-[#D4AF37]/40 px-3 py-1 rounded-full hover:bg-[#D4AF37]/10 transition-colors"
          >
            Unlock {lockedCount} more →
          </button>
        )}
      </div>

      {/* Render ALL signals — 1st is always free, rest are locked for non-Pro */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {signals.map((s, i) => (
          <SignalCard
            key={s.id}
            signal={s}
            index={i}
            isPro={isPro}
            isAdmin={isAdmin}
            onUnlock={onUnlock}
          />
        ))}
      </div>

      {!isPro && !isAdmin && lockedCount > 0 && (
        <div className="mt-4 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3 text-center">
          <p className="text-gray-400 text-xs font-mono">
            🔒 {lockedCount} Pro signals are locked. Connect your wallet and
            upgrade to access all signals + the Golden Sniper.
          </p>
          <button
            type="button"
            data-ocid="signals.upgrade_banner_button"
            onClick={onUnlock}
            className="mt-2 px-5 py-1.5 rounded-full font-mono font-bold text-xs transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #FFD700)",
              color: "#080B14",
            }}
          >
            Unlock Pro Access
          </button>
        </div>
      )}
    </section>
  );
}
