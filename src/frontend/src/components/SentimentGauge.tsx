import { useEffect, useState } from "react";

interface Props {
  value?: number;
  showSubScores?: boolean;
}

function getLabel(v: number): { label: string; color: string } {
  if (v < 34) return { label: "Extreme Fear", color: "#FF3B5C" };
  if (v < 50) return { label: "Fear", color: "#FF8C42" };
  if (v < 67) return { label: "Neutral", color: "#FFD700" };
  if (v < 84) return { label: "Greed", color: "#7FFF00" };
  return { label: "Extreme Greed", color: "#00FF88" };
}

export function SentimentGauge({ value, showSubScores = false }: Props) {
  const [current, setCurrent] = useState(value ?? 68);

  useEffect(() => {
    if (value !== undefined) {
      setCurrent(value);
      return;
    }
    const t = setInterval(() => {
      setCurrent(55 + Math.floor(Math.random() * 30));
    }, 15000);
    return () => clearInterval(t);
  }, [value]);

  const { label, color } = getLabel(current);
  const angle = 180 - (current / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const nx = 100 + 80 * Math.cos(rad);
  const ny = 100 - 80 * Math.sin(rad);

  return (
    <div
      data-ocid="social.sentiment_gauge"
      className="flex flex-col items-center"
    >
      <svg
        viewBox="0 0 200 110"
        className="w-full max-w-[280px]"
        role="img"
        aria-label="Market sentiment gauge"
      >
        <title>Market Sentiment Gauge</title>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#1C2333"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 60 32"
          fill="none"
          stroke="#FF3B5C"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M 60 32 A 80 80 0 0 1 140 32"
          fill="none"
          stroke="#FFD700"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M 140 32 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#00FF88"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.7"
        />
        <line
          x1="100"
          y1="100"
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: "all 1s ease-out" }}
        />
        <circle cx="100" cy="100" r="5" fill={color} />
        <text
          x="100"
          y="88"
          textAnchor="middle"
          fill={color}
          fontSize="22"
          fontWeight="700"
          fontFamily="monospace"
        >
          {current}
        </text>
        <text
          x="100"
          y="102"
          textAnchor="middle"
          fill={color}
          fontSize="9"
          fontFamily="monospace"
        >
          {label.toUpperCase()}
        </text>
        <text x="14" y="112" fill="#FF3B5C" fontSize="7" fontFamily="monospace">
          FEAR
        </text>
        <text
          x="160"
          y="112"
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
            <p className="text-sm font-mono font-bold text-[#00D4FF]">
              {Math.min(99, current + 5)}
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-lg p-2 text-center border border-[#1C2333]">
            <p className="text-[10px] text-gray-500 mb-0.5">Social Sentiment</p>
            <p className="text-sm font-mono font-bold text-[#FFD700]">
              {Math.max(1, current - 7)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
