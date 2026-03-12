import { Skeleton } from "@/components/ui/skeleton";
import { useLocalWatchlist } from "@/hooks/useLocalWatchlist";
import { useTokenData } from "@/hooks/useTokenData";
import type { TokenData } from "@/hooks/useTokenData";
import { Star, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { GlassCard } from "./GlassCard";

const WL_SKELETON_KEYS = ["wl-a", "wl-b", "wl-c"];

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function WatchlistTab() {
  const { watchlist, removeFromWatchlist } = useLocalWatchlist();
  const watchlistLoading = false;
  const { tokens, lowCapGems } = useTokenData();

  if (watchlistLoading) {
    return (
      <div data-ocid="watchlist.loading_state" className="space-y-3">
        {WL_SKELETON_KEYS.map((k) => (
          <Skeleton
            key={k}
            className="h-20 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        ))}
      </div>
    );
  }

  const allTokens: TokenData[] = [...tokens, ...lowCapGems];
  const watchedTokens = watchlist
    .map((sym) => allTokens.find((t) => t.symbol === sym))
    .filter((t): t is TokenData => !!t);

  if (watchedTokens.length === 0) {
    return (
      <div
        data-ocid="watchlist.empty_state"
        className="flex flex-col items-center justify-center py-24 gap-4"
      >
        <Star className="h-14 w-14 text-white/20" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Your Watchlist is Empty
          </h3>
          <p className="text-white/50 text-sm">
            Star tokens on the Dashboard to track them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-6">
        <Star
          className="h-5 w-5"
          style={{ fill: "#FFD700", color: "#FFD700" }}
        />
        <h2 className="text-lg font-bold text-white">Your Watchlist</h2>
        <span className="text-sm text-white/40">
          ({watchedTokens.length} tokens)
        </span>
      </div>

      <AnimatePresence>
        {watchedTokens.map((token, i) => {
          const isPositive = token.price_change_percentage_24h >= 0;
          const predictionIsUp = token.prediction24h >= token.current_price;
          return (
            <motion.div
              key={token.symbol}
              data-ocid={`watchlist.item.${i + 1}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Token identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(139,92,246,0.2))",
                        border: "1px solid rgba(0,212,255,0.3)",
                        color: "#00D4FF",
                      }}
                    >
                      {token.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white">{token.symbol}</div>
                      <div className="text-xs text-white/40 truncate">
                        {token.name}
                      </div>
                    </div>
                  </div>

                  {/* Price + change */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-white">
                      {formatPrice(token.current_price)}
                    </div>
                    <div
                      className={`text-sm flex items-center gap-1 justify-end ${
                        isPositive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {token.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </div>

                  {/* AI sentiment */}
                  <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: token.sentiment.color,
                        background: `${token.sentiment.color}18`,
                        border: `1px solid ${token.sentiment.color}30`,
                      }}
                    >
                      {token.sentiment.label}
                    </span>
                    <span
                      className={`text-xs ${
                        predictionIsUp ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {predictionIsUp ? "▲" : "▼"}{" "}
                      {formatPrice(token.prediction24h)}
                    </span>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    data-ocid={`watchlist.delete_button.${i + 1}`}
                    onClick={() => removeFromWatchlist(token.symbol)}
                    className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
