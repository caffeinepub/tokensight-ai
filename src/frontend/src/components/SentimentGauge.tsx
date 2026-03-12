import { useEffect, useState } from "react";

interface Props {
  value?: number;
  showSubScores?: boolean;
  fearGreedValue?: number | null;
  prices?: Record<
    string,
    { price: number; change24h: number; volume24h: number; marketCap: number }
  >;
}

function getLabel(v: number): { label: string; color: string } {
  if (v < 20) return { label: "Extreme Fear", color: "#FF3B5C" };
  if (v < 40) return { label: "Fear", color: "#FF8C42" };
  if (v < 60) return { label: "Neutral", color: "#FFD700" };
  if (v < 80) return { label: "Greed", color: "#7FFF00" };
  return { label: "Extreme Greed", color: "#00FF88" };
}

/**
 * Compute a live market momentum score (0-100) from real Binance price data.
 * Combines: % gainers ratio, average 24h change, and volume activity.
 */
function computeMarketMomentum(
  prices: Record<
    string,
    { price: number; change24h: number; volume24h: number; marketCap: number }
  >,
): number {
  const values = Object.values(prices);
  if (values.length === 0) return 50;

  const gainers = values.filter((p) => p.change24h > 0).length;
  const gainerRatio = gainers / values.length; // 0..1

  const avgChange =
    values.reduce((sum, p) => sum + p.change24h, 0) / values.length;
  // Normalize avg change: -10% = 0, 0% = 50, +10% = 100
  const changeSentiment = Math.max(0, Math.min(100, (avgChange + 10) * 5));

  const avgVolRatio =
    values
      .filter((p) => p.marketCap > 0)
      .reduce((s, p) => s + p.volume24h / p.marketCap, 0) /
    Math.max(1, values.filter((p) => p.marketCap > 0).length);
  // High vol = bullish signal; normalize 0..0.3 -> 0..100
  const volSentiment = Math.min(100, (avgVolRatio / 0.3) * 100);

  const score = gainerRatio * 40 + changeSentiment * 0.4 + volSentiment * 0.2;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function SentimentGauge({
  value,
  showSubScores = false,
  fearGreedValue,
  prices,
}: Props) {
  const [momentum, setMomentum] = useState(55);

  // Recompute momentum whenever live prices update
  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      setMomentum(computeMarketMomentum(prices));
    }
  }, [prices]);

  // Combined SMC + Social score:
  // 60% weight on Fear/Greed (Alternative.me), 40% weight on market momentum (live prices)
  const fgScore = fearGreedValue ?? 50;
  const combined =
    value !== undefined ? value : Math.round(fgScore * 0.6 + momentum * 0.4);

  const { label, color } = getLabel(combined);

  // Needle angle: 0 -> left (180deg), 100 -> right (0deg)
  // Using semicircle: angle from left (π) to right (0)
  const angle = 180 - (combined / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const nx = 100 + 80 * Math.cos(rad);
  const ny = 100 - 80 * Math.sin(rad);

  return (
    <div
      data-ocid="social.sentiment_gauge"
      className="flex flex-col items-center"
    >
      <svg
        viewBox="0 0 200 115"
        className="w-full max-w-[280px]"
        role="img"
        aria-label="Market sentiment gauge"
      >
        <title>Market Sentiment Gauge</title>
        {/* Background track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#1C2333"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Colored zones */}
        <path
          d="M 20 100 A 80 80 0 0 1 50 36"
          fill="none"
          stroke="#FF3B5C"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path
          d="M 50 36 A 80 80 0 0 1 100 20"
          fill="none"
          stroke="#FF8C42"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path
          d="M 100 20 A 80 80 0 0 1 150 36"
          fill="none"
          stroke="#FFD700"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path
          d="M 150 36 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#00FF88"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.65"
        />
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: "all 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Center dot */}
        <circle cx="100" cy="100" r="6" fill={color} />
        <circle cx="100" cy="100" r="3" fill="#080B14" />
        {/* Score */}
        <text
          x="100"
          y="86"
          textAnchor="middle"
          fill={color}
          fontSize="22"
          fontWeight="700"
          fontFamily="monospace"
        >
          {combined}
        </text>
        <text
          x="100"
          y="100"
          textAnchor="middle"
          fill={color}
          fontSize="8"
          fontFamily="monospace"
        >
          {label.toUpperCase()}
        </text>
        {/* Labels */}
        <text x="12" y="114" fill="#FF3B5C" fontSize="7" fontFamily="monospace">
          FEAR
        </text>
        <text
          x="158"
          y="114"
          fill="#00FF88"
          fontSize="7"
          fontFamily="monospace"
        >
          GREED
        </text>
      </svg>

      {showSubScores && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-1">
          <div className="bg-[#0D1117] rounded-lg p-2 text-center border border-[#1C2333]">
            <p className="text-[10px] text-gray-500 mb-0.5">Market Momentum</p>
            <p
              className="text-sm font-mono font-bold"
              style={{ color: getLabel(momentum).color }}
            >
              {momentum}
            </p>
            <p className="text-[9px] text-gray-600 font-mono">
              Live price action
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-lg p-2 text-center border border-[#1C2333]">
            <p className="text-[10px] text-gray-500 mb-0.5">Social Sentiment</p>
            <p
              className="text-sm font-mono font-bold"
              style={{ color: getLabel(fgScore).color }}
            >
              {fgScore}
            </p>
            <p className="text-[9px] text-gray-600 font-mono">
              Fear & Greed Index
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
