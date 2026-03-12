import { Skeleton } from "@/components/ui/skeleton";
import { useTokenData } from "@/hooks/useTokenData";
import { motion } from "motion/react";
import { AlphaSection } from "./AlphaSection";
import { TokenCard } from "./TokenCard";

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

export function DashboardTab() {
  const { tokens, alphaTokens, lowCapGems, isLoading } = useTokenData();

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

  return (
    <div className="space-y-10">
      {/* AI Alpha Section */}
      <AlphaSection tokens={alphaTokens} />

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
            <TokenCard key={token.id} token={token} index={i + 1} />
          ))}
        </div>
      </section>

      {/* Low-cap Gems — always visible */}
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
                <TokenCard key={token.id} token={token} index={i + 21} />
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
