import type { TokenData } from "@/hooks/useTokenData";
import { TrendingDown, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

interface AlphaSectionProps {
  tokens: TokenData[];
}

export function AlphaSection({ tokens }: AlphaSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5" style={{ color: "#FFD700" }} />
        <h2
          className="text-lg font-bold"
          style={{
            color: "#FFD700",
            textShadow:
              "0 0 10px rgba(255,215,0,0.8), 0 0 25px rgba(255,215,0,0.5), 0 0 50px rgba(255,215,0,0.3)",
          }}
        >
          AI Alpha — Top 5 Growth Opportunities Today
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {tokens.map((token, i) => {
          const isPositive = token.price_change_percentage_24h >= 0;
          return (
            <motion.div
              key={token.id}
              data-ocid={`alpha.item.${i + 1}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex-shrink-0 w-48 p-4 rounded-xl relative overflow-hidden alpha-card-glow"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(255,215,0,0.1))",
                border: "1px solid rgba(255,215,0,0.5)",
              }}
            >
              {/* Rank badge */}
              <div
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(255,215,0,0.25)", color: "#FFD700" }}
              >
                #{i + 1}
              </div>

              {/* Token info */}
              <div className="mb-3">
                <div className="font-bold text-lg text-white">
                  {token.symbol}
                </div>
                <div className="text-xs text-white/40">{token.name}</div>
              </div>

              <div className="font-mono font-bold text-white mb-1">
                {formatPrice(token.current_price)}
              </div>

              <div
                className={`text-sm font-medium flex items-center gap-1 mb-2 ${
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

              <div className="flex items-center justify-between">
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
                  className="text-xs font-bold"
                  style={{ color: "#FFD700" }}
                >
                  ⚡ {token.growthPotential.toFixed(0)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
