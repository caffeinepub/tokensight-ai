import { Skeleton } from "@/components/ui/skeleton";
import { useTokenData } from "@/hooks/useTokenData";
import type { TokenData } from "@/hooks/useTokenData";
import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AlphaSection } from "./AlphaSection";
import { TokenCard } from "./TokenCard";
import { TokenDetailModal } from "./TokenDetailModal";
import { UnlockProModal } from "./UnlockProModal";

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

// Coins that are considered "free tier" for AI signals
const FREE_TIER_IDS = ["bitcoin", "ethereum", "solana"];

// Coins that are NOT in the top-cap group get "Hidden Gem" badge
const LARGE_CAP_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
  "cardano",
  "dogecoin",
];

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function HiddenGemBadge() {
  return (
    <span
      className="hidden-gem-badge text-xs px-2 py-0.5 rounded-full font-bold"
      style={{
        background: "linear-gradient(135deg, #FFD700, #00FF88)",
        color: "#000",
        boxShadow: "0 0 12px rgba(255,215,0,0.6), 0 0 24px rgba(0,255,136,0.3)",
        animation: "gemGlow 2s ease-in-out infinite alternate",
      }}
    >
      💎 Hidden Gem
    </span>
  );
}

function SignalRow({
  token,
  index,
  isPremium,
  onUnlockPro,
  onOpenDetail,
}: {
  token: TokenData;
  index: number;
  isPremium: boolean;
  onUnlockPro: () => void;
  onOpenDetail: (t: TokenData) => void;
}) {
  const isFreeTier = FREE_TIER_IDS.includes(token.id);
  const isHiddenGem = !LARGE_CAP_IDS.includes(token.id);
  const canView = isPremium || isFreeTier;

  const signal =
    token.sentiment.label === "Bullish"
      ? "BUY"
      : token.sentiment.label === "Bearish"
        ? "SELL"
        : "HOLD";
  const signalColor =
    signal === "BUY" ? "#00FF94" : signal === "SELL" ? "#FF4444" : "#FFD700";

  const entry = token.current_price;
  const tp1 = token.current_price * 1.02;
  const tp2 = token.current_price * 1.05;
  const tp3 = token.current_price * 1.1;
  const sl = token.current_price * 0.98;

  const seed = Math.abs(Math.sin(token.current_price * 137.5)) * 10000;
  const confidence = Math.round(58 + Math.abs(Math.sin(seed + 4)) * 37);

  if (!canView) {
    return (
      <div
        data-ocid={`signals.item.${index}`}
        className="relative rounded-xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Blurred preview */}
        <div className="p-4 flex items-center gap-3 blur-sm select-none">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37" }}
          >
            {token.symbol.slice(0, 3)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{token.name}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Entry • TP1 • TP2 • TP3 • SL
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-lg text-xs font-bold"
            style={{ background: `${signalColor}18`, color: signalColor }}
          >
            {signal}
          </div>
        </div>
        {/* Lock overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{
            background: "rgba(11,14,17,0.82)",
            backdropFilter: "blur(2px)",
          }}
        >
          <Lock
            className="h-4 w-4"
            style={{ color: "rgba(255,255,255,0.4)" }}
          />
          {isHiddenGem && <HiddenGemBadge />}
          <button
            type="button"
            onClick={onUnlockPro}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "rgba(240,185,11,0.15)",
              color: "#F0B90B",
              border: "1px solid rgba(240,185,11,0.3)",
            }}
          >
            Unlock Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      data-ocid={`signals.item.${index}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onOpenDetail(token)}
      className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${isHiddenGem && isPremium ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.07)"}`,
        boxShadow:
          isHiddenGem && isPremium ? "0 0 16px rgba(255,215,0,0.12)" : "none",
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {token.image ? (
              <img
                src={token.image}
                alt={token.symbol}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "rgba(212,175,55,0.15)",
                  color: "#d4af37",
                }}
              >
                {token.symbol.slice(0, 3)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-white">{token.symbol}</p>
                {isHiddenGem && isPremium && <HiddenGemBadge />}
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {token.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPremium && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {confidence}% conf.
              </span>
            )}
            <span
              className="text-sm font-bold px-3 py-1 rounded-lg"
              style={{
                background: `${signalColor}18`,
                color: signalColor,
                border: `1px solid ${signalColor}30`,
              }}
            >
              {signal}
            </span>
          </div>
        </div>

        <div
          className={`grid gap-2 ${isPremium ? "grid-cols-5" : "grid-cols-3"}`}
        >
          <div
            className="p-2 rounded-lg"
            style={{
              background: "rgba(0,212,255,0.07)",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
          >
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Entry
            </p>
            <p
              className="text-xs font-bold font-mono"
              style={{ color: "#00D4FF" }}
            >
              {formatPrice(entry)}
            </p>
          </div>
          <div
            className="p-2 rounded-lg"
            style={{
              background: "rgba(0,255,148,0.07)",
              border: "1px solid rgba(0,255,148,0.15)",
            }}
          >
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              TP1
            </p>
            <p
              className="text-xs font-bold font-mono"
              style={{ color: "#00FF94" }}
            >
              {formatPrice(tp1)}
            </p>
          </div>
          <div
            className="p-2 rounded-lg"
            style={{
              background: "rgba(255,68,68,0.07)",
              border: "1px solid rgba(255,68,68,0.15)",
            }}
          >
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              SL
            </p>
            <p
              className="text-xs font-bold font-mono"
              style={{ color: "#FF4444" }}
            >
              {formatPrice(sl)}
            </p>
          </div>
          {isPremium && (
            <>
              <div
                className="p-2 rounded-lg"
                style={{
                  background: "rgba(0,255,148,0.05)",
                  border: "1px solid rgba(0,255,148,0.1)",
                }}
              >
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  TP2
                </p>
                <p
                  className="text-xs font-bold font-mono"
                  style={{ color: "#00FF94" }}
                >
                  {formatPrice(tp2)}
                </p>
              </div>
              <div
                className="p-2 rounded-lg"
                style={{
                  background: "rgba(0,255,148,0.04)",
                  border: "1px solid rgba(0,255,148,0.08)",
                }}
              >
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  TP3
                </p>
                <p
                  className="text-xs font-bold font-mono"
                  style={{ color: "#00FF94" }}
                >
                  {formatPrice(tp3)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface DashboardTabProps {
  isPremium: boolean;
  onUnlockPro: () => void;
  unlockNow: () => void;
  unlockWithTxid: (txid: string) => Promise<true | string>;
  icpPrice: number;
}

export function DashboardTab({
  isPremium,
  unlockNow,
  icpPrice,
}: DashboardTabProps) {
  const { tokens, alphaTokens, lowCapGems, isLoading, flashMap } =
    useTokenData();
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  const handleOpenDetail = (token: TokenData) => {
    setSelectedToken(token);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
  };

  const handleUnlockFromDetail = () => {
    setDetailOpen(false);
    setUnlockModalOpen(true);
  };

  const handleOpenUnlock = () => {
    setUnlockModalOpen(true);
  };

  if (isLoading) {
    return (
      <div data-ocid="dashboard.loading_state" className="space-y-4">
        {SKELETON_KEYS.map((k) => (
          <Skeleton
            key={k}
            className="h-36 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        ))}
      </div>
    );
  }

  // Combine tokens for the signals section: free tier shows 3, pro shows all
  const freeSignalTokens = tokens
    .filter((t) => FREE_TIER_IDS.includes(t.id))
    .slice(0, 3);
  const proOnlySignalTokens = isPremium
    ? [
        ...tokens.filter((t) => !FREE_TIER_IDS.includes(t.id)).slice(0, 4),
        ...lowCapGems.slice(0, 3),
      ]
    : [];
  const lockedPreviewTokens = !isPremium
    ? [
        ...tokens.filter((t) => !FREE_TIER_IDS.includes(t.id)).slice(0, 4),
        ...lowCapGems.slice(0, 3),
      ]
    : [];

  return (
    <>
      <style>{`
        @keyframes gemGlow {
          from { box-shadow: 0 0 8px rgba(255,215,0,0.5), 0 0 16px rgba(0,255,136,0.2); }
          to   { box-shadow: 0 0 18px rgba(255,215,0,0.8), 0 0 32px rgba(0,255,136,0.5); }
        }
      `}</style>

      <div className="space-y-10">
        {/* AI Alpha Section */}
        <AlphaSection tokens={alphaTokens} onOpenDetail={handleOpenDetail} />

        {/* ── AI SIGNALS ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                AI Trading Signals
              </h2>
              {isPremium ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: "rgba(240,185,11,0.15)",
                    color: "#F0B90B",
                    border: "1px solid rgba(240,185,11,0.3)",
                  }}
                >
                  👑 PRO
                </span>
              ) : (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0,212,255,0.15)",
                    color: "#00D4FF",
                    border: "1px solid rgba(0,212,255,0.3)",
                  }}
                >
                  Free (3/10+)
                </span>
              )}
            </div>
            {!isPremium && (
              <button
                type="button"
                data-ocid="signals.unlock.open_modal_button"
                onClick={handleOpenUnlock}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: "linear-gradient(135deg, #F0B90B, #d4af37)",
                  color: "#000",
                }}
              >
                Unlock 10+ Signals
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {/* Free tier signals (always visible) */}
            {freeSignalTokens.map((token, i) => (
              <SignalRow
                key={token.id}
                token={token}
                index={i + 1}
                isPremium={isPremium}
                onUnlockPro={handleOpenUnlock}
                onOpenDetail={handleOpenDetail}
              />
            ))}

            {/* Pro signals or locked previews */}
            {isPremium
              ? proOnlySignalTokens.map((token, i) => (
                  <SignalRow
                    key={token.id}
                    token={token}
                    index={freeSignalTokens.length + i + 1}
                    isPremium={isPremium}
                    onUnlockPro={handleOpenUnlock}
                    onOpenDetail={handleOpenDetail}
                  />
                ))
              : lockedPreviewTokens.map((token, i) => (
                  <SignalRow
                    key={token.id}
                    token={token}
                    index={freeSignalTokens.length + i + 1}
                    isPremium={false}
                    onUnlockPro={handleOpenUnlock}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}
          </div>

          {/* Bottom upsell banner for free users */}
          {!isPremium && (
            <motion.div
              data-ocid="signals.upgrade.card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 rounded-xl p-4 flex items-center justify-between gap-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(240,185,11,0.08), rgba(24,144,255,0.06))",
                border: "1px solid rgba(240,185,11,0.2)",
              }}
            >
              <div>
                <p className="text-sm font-bold text-white">
                  Unlock 10+ Signals
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Including 💎 Hidden Gems with full SMC analysis
                </p>
              </div>
              <button
                type="button"
                data-ocid="signals.upgrade.primary_button"
                onClick={handleOpenUnlock}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: "#F0B90B",
                  color: "#000",
                  boxShadow: "0 2px 12px rgba(240,185,11,0.35)",
                }}
              >
                $5 / Lifetime
              </button>
            </motion.div>
          )}
        </section>

        {/* Top 20 Tokens */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-white">Top 20 Tokens</h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0,212,255,0.15)",
                color: "#00D4FF",
                border: "1px solid rgba(0,212,255,0.3)",
              }}
            >
              Free
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tokens.map((token, i) => (
              <TokenCard
                key={token.id}
                token={token}
                index={i + 1}
                onOpenDetail={handleOpenDetail}
                flash={flashMap[token.id]}
              />
            ))}
          </div>
        </section>

        {/* Low-cap Gems */}
        <section>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-white">Low-cap Gems</h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(0,255,148,0.12)",
                  color: "#00FF94",
                  border: "1px solid rgba(0,255,148,0.3)",
                }}
              >
                💎 Gems
              </span>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-3">
                High-risk, high-reward AI picks
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lowCapGems.map((token, i) => (
                  <TokenCard
                    key={token.id}
                    token={token}
                    index={i + 21}
                    onOpenDetail={handleOpenDetail}
                    flash={flashMap[token.id]}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Token Detail Modal */}
      <TokenDetailModal
        token={selectedToken}
        open={detailOpen}
        onClose={handleCloseDetail}
        isPremium={isPremium}
        onUnlockPro={handleUnlockFromDetail}
      />

      {/* Unlock Pro Modal */}
      <UnlockProModal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        onSuccess={() => setUnlockModalOpen(false)}
        icpPrice={icpPrice}
        unlockNow={unlockNow}
      />
    </>
  );
}
