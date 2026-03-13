import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fmtPrice } from "../lib/format";
import type { SwingSignal } from "../lib/swingEngine";
import { GoldenSniper } from "./GoldenSniper";

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
};

/** Read live WS price from global state */
function getLivePrice(symbol: string): number | null {
  const p = (window as Window).TS_ULTRA_STATE?.livePrices?.[
    symbol.toUpperCase()
  ];
  return p && p > 0 ? p : null;
}

function SignalCard({ signal, index }: { signal: SwingSignal; index: number }) {
  const color = COIN_COLORS[signal.symbol] ?? "#D4AF37";
  const directionColor = signal.direction === "BUY" ? "#00FF88" : "#FF3B5C";
  const [livePrice, setLivePrice] = useState<number | null>(null);

  // Update live price every 500ms
  useEffect(() => {
    const iv = setInterval(() => {
      setLivePrice(getLivePrice(signal.symbol));
    }, 500);
    return () => clearInterval(iv);
  }, [signal.symbol]);

  const priceDeviation = livePrice
    ? ((livePrice - signal.entry) / signal.entry) * 100
    : null;

  return (
    <div
      data-ocid={`signal.item.${index + 1}`}
      className="relative bg-[#0D1117] rounded-xl border border-[#1C2333] overflow-hidden"
      style={{ borderLeft: `3px solid ${directionColor}` }}
    >
      <div className="p-3 md:p-4">
        {/* Header row */}
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
                {signal.direction === "BUY" ? "\u25b2 BUY" : "\u25bc SELL"}
              </span>
              {signal.isGolden ? (
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    color: "#D4AF37",
                    borderColor: "#D4AF37",
                    background: "rgba(212,175,55,0.12)",
                  }}
                >
                  \u2726 ACTIVE SWING
                </span>
              ) : (
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    color: "#00FF88",
                    borderColor: "#00FF88",
                    background: "rgba(0,255,136,0.10)",
                    animation: "pulse 1.8s ease-in-out infinite",
                  }}
                >
                  \u25cf LIVE
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
            </div>
          </div>

          <div className="text-right shrink-0">
            <div
              className="text-sm font-mono font-bold"
              style={{ color: signal.confidence >= 99 ? "#D4AF37" : "#00FF88" }}
            >
              {signal.confidence}%
            </div>
            <div className="text-gray-500 text-[9px] font-mono">confidence</div>
          </div>
        </div>

        {/* Price grid */}
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

        {/* Live current price vs entry */}
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

        <p className="text-gray-400 text-[10px] font-mono leading-relaxed mb-2 line-clamp-2">
          {signal.rationale}
        </p>

        <div className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
            <span>\uD83D\uDD50 Detected: {signal.displayTime}</span>
            <span className="text-gray-600">\u00b7</span>
            <span>{relativeTime(signal.createdAt)}</span>
            <span className="text-gray-600">\u00b7</span>
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
}

export function AlphaSection({ signals }: Props) {
  const goldenSignal = signals.find((s) => s.isGolden) ?? null;
  const regularSignals = signals.filter((s) => !s.isGolden);

  return (
    <section data-ocid="signals.section">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-mono font-bold text-base">
            Active Swing Signals
          </h2>
          <p className="text-gray-500 text-xs font-mono mt-0.5">
            4H + 1D SMC Analysis \u00b7 24-Hour Signal Lifecycle
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

      <div className="mb-6">
        <GoldenSniper
          signal={goldenSignal}
          scanningForGoldenSniper={!goldenSignal}
        />
      </div>

      {regularSignals.length === 0 ? (
        <div
          data-ocid="signals.empty_state"
          className="text-center py-16 text-gray-600 font-mono text-sm"
        >
          <div
            className="w-12 h-12 rounded-full border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-3"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          >
            <span className="text-[#D4AF37]/50 text-lg">\u25c9</span>
          </div>
          AI Scanner active \u2014 awaiting high-confidence setups (&gt;95%)
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {regularSignals.map((signal, i) => (
            <SignalCard key={signal.id} signal={signal} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
