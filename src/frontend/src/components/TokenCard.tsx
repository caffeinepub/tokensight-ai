import { useLocalWatchlist } from "@/hooks/useLocalWatchlist";
import type { TokenData } from "@/hooks/useTokenData";
import { cn } from "@/lib/utils";
import { Star, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

interface TokenCardProps {
  token: TokenData;
  index: number;
  showWatchlist?: boolean;
}

export function TokenCard({
  token,
  index,
  showWatchlist = true,
}: TokenCardProps) {
  const { isWatched, addToWatchlist, removeFromWatchlist } =
    useLocalWatchlist();

  const watched = isWatched(token.symbol);
  const isPositive = token.price_change_percentage_24h >= 0;
  const predictionIsUp = token.prediction24h >= token.current_price;

  const toggleWatchlist = () => {
    if (watched) {
      removeFromWatchlist(token.symbol);
    } else {
      addToWatchlist(token.symbol);
    }
  };

  return (
    <motion.div
      data-ocid={`token.item.${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.6) }}
      className="glass p-4 flex flex-col gap-3 hover:border-white/20 transition-all duration-300 group relative"
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(139,92,246,0.2))",
              border: "1px solid rgba(0,212,255,0.3)",
              color: "#00D4FF",
            }}
          >
            {token.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{token.symbol}</div>
            <div className="text-xs text-white/40 truncate max-w-[80px]">
              {token.name}
            </div>
          </div>
        </div>

        {showWatchlist && (
          <button
            type="button"
            data-ocid={`token.toggle.${index}`}
            onClick={toggleWatchlist}
            title={watched ? "Remove from watchlist" : "Add to watchlist"}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center",
              watched ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <Star
              className="h-4 w-4"
              style={{
                fill: watched ? "#FFD700" : "transparent",
                color: watched ? "#FFD700" : "rgba(255,255,255,0.4)",
                stroke: watched ? "#FFD700" : "rgba(255,255,255,0.4)",
              }}
            />
          </button>
        )}
      </div>

      {/* Price */}
      <div>
        <div className="text-xl font-bold text-white">
          {formatPrice(token.current_price)}
        </div>
        <div
          className={cn(
            "text-sm font-medium flex items-center gap-1",
            isPositive ? "text-green-400" : "text-red-400",
          )}
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

      {/* AI Sentiment */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">AI Sentiment</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            color: token.sentiment.color,
            background: `${token.sentiment.color}18`,
            border: `1px solid ${token.sentiment.color}30`,
          }}
        >
          {token.sentiment.label} {token.sentiment.score}
        </span>
      </div>

      {/* 24H Prediction */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">24H Forecast</span>
        <span
          className={cn(
            "text-xs font-mono font-medium flex items-center gap-1",
            predictionIsUp ? "text-green-400" : "text-red-400",
          )}
        >
          {predictionIsUp ? "▲" : "▼"} {formatPrice(token.prediction24h)}
        </span>
      </div>
    </motion.div>
  );
}
