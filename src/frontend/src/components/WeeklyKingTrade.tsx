import { Crown, Lock } from "lucide-react";
import type { Signal } from "../hooks/useTokenData";

interface Props {
  signal: Signal | null;
  isPro: boolean;
  onUnlock: () => void;
}

function fmt(n: number): string {
  if (n < 0.0001) return n.toFixed(8);
  if (n < 1) return n.toFixed(6);
  if (n < 100) return n.toFixed(4);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function WeeklyKingTrade({ signal, isPro, onUnlock }: Props) {
  const s = signal;

  return (
    <div
      data-ocid="signals.weekly_king_card"
      className="relative rounded-xl overflow-hidden border mb-6"
      style={{
        borderColor: "#D4AF37",
        boxShadow:
          "0 0 24px rgba(212,175,55,0.3), 0 0 48px rgba(212,175,55,0.1)",
        background:
          "linear-gradient(135deg, #0D1117 0%, #12100A 50%, #0D1117 100%)",
      }}
    >
      {/* Gold shimmer top border */}
      <div
        className="h-0.5 w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, #D4AF37, #FFD700, #D4AF37, transparent)",
        }}
      />

      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="text-[#FFD700]" size={20} />
            <span className="text-[#FFD700] font-mono font-bold text-sm tracking-widest">
              WEEKLY KING TRADE
            </span>
            <span className="bg-[#D4AF37]/20 text-[#FFD700] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#D4AF37]/40">
              Triple Confirmation
            </span>
          </div>
          <span className="bg-[#00FF88]/20 text-[#00FF88] text-xs font-mono px-2 py-1 rounded-full border border-[#00FF88]/40 font-bold">
            99% CONFIDENCE
          </span>
        </div>

        {/* Confirmation pills */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["SMC ✓", "Vol Spike ✓", "X Sentiment ✓"].map((p) => (
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
          ))}
        </div>

        {!isPro ? (
          <div className="relative">
            {/* Blurred content */}
            <div className="blur-sm select-none pointer-events-none">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#F7931A]/20 border border-[#F7931A]/40 flex items-center justify-center text-sm font-bold text-[#F7931A]">
                  BTC
                </div>
                <div>
                  <p className="text-white font-bold text-lg font-mono">
                    Bitcoin
                  </p>
                  <p className="text-gray-400 text-xs">Entry: $92,450.00</p>
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
            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080B14]/60 rounded-lg">
              <Lock className="text-[#D4AF37] mb-2" size={28} />
              <p className="text-[#FFD700] font-bold text-sm mb-3">
                Pro Only — Unlock Weekly King
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
          s && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold"
                  style={{
                    background: `${coinColor(s.symbol)}20`,
                    borderColor: `${coinColor(s.symbol)}60`,
                    color: coinColor(s.symbol),
                  }}
                >
                  {s.symbol.replace("USDT", "").slice(0, 3)}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{s.coin}</p>
                  <p className="text-gray-400 text-xs italic">{s.rationale}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[#D4AF37] text-xs font-mono">R:R</p>
                  <p className="text-[#FFD700] font-bold font-mono">
                    {s.rrRatio}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { label: "ENTRY", value: s.entry, color: "#00D4FF" },
                  { label: "TP1", value: s.tp1, color: "#00FF88" },
                  { label: "TP2", value: s.tp2, color: "#00FF88" },
                  { label: "TP3", value: s.tp3, color: "#FFD700" },
                  { label: "SL", value: s.sl, color: "#FF3B5C" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="bg-[#080B14] rounded-lg p-2 text-center border border-[#1C2333]"
                  >
                    <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
                    <p
                      className="text-xs font-mono font-bold overflow-hidden text-ellipsis"
                      style={{ color }}
                      title={String(value)}
                    >
                      ${fmt(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function coinColor(symbol: string): string {
  const colors: Record<string, string> = {
    BTCUSDT: "#F7931A",
    ETHUSDT: "#627EEA",
    SOLUSDT: "#9945FF",
    BNBUSDT: "#F3BA2F",
    XRPUSDT: "#00AAE4",
  };
  return colors[symbol] ?? "#D4AF37";
}
