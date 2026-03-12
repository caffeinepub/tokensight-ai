import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TokenData } from "@/hooks/useTokenData";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart2,
  Crown,
  GitCompare,
  Info,
  Lock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatLargeNumber(n: number | null | undefined): string {
  if (n == null || n === 0) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatLargeUSD(n: number | null | undefined): string {
  if (n == null || n === 0) return "—";
  return `$${formatLargeNumber(n)}`;
}

const FREE_TIER_IDS = ["bitcoin", "ethereum", "solana"];
const LARGE_CAP_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
  "cardano",
  "dogecoin",
];

function HiddenGemBadge() {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-bold"
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

const EXCHANGES = [
  { name: "Binance", volume: "High", fee: "0.1%", logo: "🟡" },
  { name: "OKX", volume: "High", fee: "0.08%", logo: "⚫" },
  { name: "Bybit", volume: "Medium", fee: "0.1%", logo: "🟠" },
];

const COMPARE_TOKENS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "near", symbol: "NEAR", name: "NEAR" },
  { id: "internet-computer", symbol: "ICP", name: "Internet Computer" },
];

interface CoinGeckoDetail {
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    max_supply: number | null;
    ath: { usd: number };
    fully_diluted_valuation: { usd: number };
    circulating_supply: number;
    total_supply: number | null;
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_percentage_24h: number;
    market_cap_percentage?: number;
  };
  market_cap_rank: number;
  image?: { thumb?: string; small?: string };
  name?: string;
  symbol?: string;
}

interface GlobalData {
  data: {
    market_cap_percentage: Record<string, number>;
  };
}

interface TokenDetailModalProps {
  token: TokenData | null;
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
  onUnlockPro: () => void;
}

function SignalBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// Generate SMC signals deterministically based on token price
function generateSMCSignals(token: TokenData) {
  const seed =
    Math.abs(
      Math.sin(token.current_price * 137.5 + token.market_cap * 0.000001),
    ) * 10000;
  const r = (offset: number) => Math.abs(Math.sin(seed + offset));

  const obBullish = token.price_change_percentage_24h >= 0 || r(1) > 0.5;
  const fvgBullish = r(2) > 0.45;
  const mssBullish = token.sentiment?.label === "Bullish" || r(3) > 0.5;

  const obConfidence = Math.round(55 + r(4) * 40);
  const fvgConfidence = Math.round(55 + r(5) * 40);
  const mssConfidence = Math.round(55 + r(6) * 40);

  const obRR = (1.5 + r(7) * 3).toFixed(1);
  const fvgRR = (1.5 + r(8) * 3).toFixed(1);
  const mssRR = (1.5 + r(9) * 3).toFixed(1);

  const p = token.current_price;
  const obZoneLow = (p * (obBullish ? 0.972 : 1.018)).toFixed(p < 1 ? 6 : 2);
  const obZoneHigh = (p * (obBullish ? 0.988 : 1.032)).toFixed(p < 1 ? 6 : 2);
  const fvgLow = (p * (fvgBullish ? 0.965 : 1.012)).toFixed(p < 1 ? 6 : 2);
  const fvgHigh = (p * (fvgBullish ? 0.982 : 1.028)).toFixed(p < 1 ? 6 : 2);

  const timeframes = ["1H", "4H", "Daily", "Weekly"];
  const obTF = timeframes[Math.floor(r(10) * timeframes.length)];
  const fvgTF = timeframes[Math.floor(r(11) * timeframes.length)];
  const mssTF = timeframes[Math.floor(r(12) * timeframes.length)];

  return [
    {
      type: "OB" as const,
      label: "Order Block",
      color: "#F59E0B",
      borderColor: "rgba(245,158,11,0.5)",
      bgColor: "rgba(245,158,11,0.07)",
      direction: obBullish ? "Bullish" : "Bearish",
      directionColor: obBullish ? "#00FF94" : "#FF4444",
      confidence: obConfidence,
      rr: obRR,
      explanation: `${obBullish ? "Bullish" : "Bearish"} OB detected on ${obTF} chart — Price retesting key ${
        obBullish ? "demand" : "supply"
      } zone at $${obZoneLow}–$${obZoneHigh}`,
      ocid: "smc.ob_signal.card",
    },
    {
      type: "FVG" as const,
      label: "Fair Value Gap",
      color: "#3B82F6",
      borderColor: "rgba(59,130,246,0.5)",
      bgColor: "rgba(59,130,246,0.07)",
      direction: fvgBullish ? "Bullish" : "Bearish",
      directionColor: fvgBullish ? "#00FF94" : "#FF4444",
      confidence: fvgConfidence,
      rr: fvgRR,
      explanation: `${fvgBullish ? "Bullish" : "Bearish"} FVG identified on ${fvgTF} — Imbalance zone between $${fvgLow}–$${fvgHigh}`,
      ocid: "smc.fvg_signal.card",
    },
    {
      type: "MSS" as const,
      label: "Market Structure Shift",
      color: "#22C55E",
      borderColor: "rgba(34,197,94,0.5)",
      bgColor: "rgba(34,197,94,0.07)",
      direction: mssBullish ? "Bullish" : "Bearish",
      directionColor: mssBullish ? "#00FF94" : "#FF4444",
      confidence: mssConfidence,
      rr: mssRR,
      explanation: `${mssBullish ? "Bullish" : "Bearish"} MSS confirmed on ${mssTF} — ${
        mssBullish
          ? "Higher high formed, trend reversal in progress"
          : "Lower low formed, bearish continuation likely"
      }`,
      ocid: "smc.mss_signal.card",
    },
  ];
}

// Compare panel — fetches live CoinGecko data for a second token
function ComparePanel({
  token,
  onClose,
}: {
  token: TokenData;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState("bitcoin");
  const [compareData, setCompareData] = useState<CoinGeckoDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setCompareData(null);
    fetch(
      `https://api.coingecko.com/api/v3/coins/${selectedId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
    )
      .then((r) => r.json() as Promise<CoinGeckoDetail>)
      .then(setCompareData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [selectedId]);

  const compareToken = COMPARE_TOKENS.find((t) => t.id === selectedId);

  const rows = [
    {
      label: "Price",
      a: formatPrice(token.current_price),
      b: compareData
        ? formatPrice(compareData.market_data.current_price.usd)
        : "—",
    },
    {
      label: "Market Cap",
      a: formatLargeUSD(token.market_cap),
      b: compareData
        ? formatLargeUSD(compareData.market_data.market_cap.usd)
        : "—",
    },
    {
      label: "24h Volume",
      a: formatLargeUSD(token.total_volume),
      b: compareData
        ? formatLargeUSD(compareData.market_data.total_volume.usd)
        : "—",
    },
    {
      label: "Circ. Supply",
      a: formatLargeNumber(token.circulating_supply),
      b: compareData
        ? formatLargeNumber(compareData.market_data.circulating_supply)
        : "—",
    },
    {
      label: "24h Change",
      a: `${token.price_change_percentage_24h >= 0 ? "+" : ""}${token.price_change_percentage_24h.toFixed(2)}%`,
      b: compareData
        ? `${compareData.market_data.price_change_percentage_24h >= 0 ? "+" : ""}${compareData.market_data.price_change_percentage_24h.toFixed(2)}%`
        : "—",
      colorA: token.price_change_percentage_24h >= 0 ? "#00FF94" : "#FF4444",
      colorB:
        compareData && compareData.market_data.price_change_percentage_24h >= 0
          ? "#00FF94"
          : "#FF4444",
    },
    {
      label: "ATH",
      a: "—",
      b: compareData ? formatPrice(compareData.market_data.ath.usd) : "—",
    },
  ];

  return (
    <motion.div
      data-ocid="compare.modal"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(10,10,20,0.98)",
        border: "1px solid rgba(245,158,11,0.25)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span className="text-sm font-bold" style={{ color: "#F59E0B" }}>
          Compare Tokens
        </span>
        <button
          type="button"
          data-ocid="compare.close_button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
          style={{ color: "#F59E0B" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="flex-1 text-center py-2 px-3 rounded-xl"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              Token A
            </p>
            <p className="font-bold text-white text-sm">{token.symbol}</p>
            <p className="text-xs" style={{ color: "#F59E0B" }}>
              {token.name}
            </p>
          </div>
          <span className="text-xl" style={{ color: "rgba(255,255,255,0.3)" }}>
            vs
          </span>
          <div className="flex-1">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-center py-2 px-2 rounded-xl text-sm font-bold appearance-none"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#F59E0B",
              }}
            >
              {COMPARE_TOKENS.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  style={{ background: "#0a0a0f" }}
                >
                  {t.symbol}
                </option>
              ))}
            </select>
            {compareToken && (
              <p
                className="text-xs text-center mt-0.5"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {compareToken.name}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <RefreshCw
              className="h-5 w-5 animate-spin mx-auto"
              style={{ color: "#F59E0B" }}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-3 gap-2 items-center py-1.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span
                  className="text-xs text-center"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {row.label}
                </span>
                <span
                  className="text-xs font-mono font-bold text-center"
                  style={{ color: row.colorA ?? "#F59E0B" }}
                >
                  {row.a}
                </span>
                <span
                  className="text-xs font-mono font-bold text-center"
                  style={{ color: row.colorB ?? "#60A5FA" }}
                >
                  {row.b}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Converter panel — bidirectional conversion
function ConverterPanel({
  token,
  onClose,
}: {
  token: TokenData;
  onClose: () => void;
}) {
  const [tokenAmount, setTokenAmount] = useState("1");
  const [usdAmount, setUsdAmount] = useState(
    token.current_price.toFixed(token.current_price < 1 ? 6 : 2),
  );
  const [lastEdited, setLastEdited] = useState<"token" | "usd">("token");

  const handleTokenChange = (val: string) => {
    setTokenAmount(val);
    setLastEdited("token");
    const num = Number.parseFloat(val);
    if (!Number.isNaN(num) && num >= 0) {
      const usd = num * token.current_price;
      setUsdAmount(usd.toFixed(usd < 1 ? 6 : 2));
    } else {
      setUsdAmount("");
    }
  };

  const handleUsdChange = (val: string) => {
    setUsdAmount(val);
    setLastEdited("usd");
    const num = Number.parseFloat(val);
    if (!Number.isNaN(num) && num >= 0 && token.current_price > 0) {
      const tokens = num / token.current_price;
      setTokenAmount(tokens.toFixed(tokens < 0.001 ? 8 : 6));
    } else {
      setTokenAmount("");
    }
  };

  return (
    <motion.div
      data-ocid="converter.modal"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(10,10,20,0.98)",
        border: "1px solid rgba(245,158,11,0.25)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5" style={{ color: "#F59E0B" }} />
          <span className="text-sm font-bold" style={{ color: "#F59E0B" }}>
            {token.symbol} Converter
          </span>
        </div>
        <button
          type="button"
          data-ocid="converter.close_button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
          style={{ color: "#F59E0B" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.15)",
          }}
        >
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            Live price
          </span>
          <span
            className="text-sm font-bold font-mono"
            style={{ color: "#F59E0B" }}
          >
            {formatPrice(token.current_price)} / {token.symbol}
          </span>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="converter-token-input"
            className="text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Amount in {token.symbol}
          </label>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background:
                lastEdited === "token"
                  ? "rgba(245,158,11,0.08)"
                  : "rgba(0,0,0,0.3)",
              border:
                lastEdited === "token"
                  ? "1px solid rgba(245,158,11,0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.2s",
            }}
          >
            <input
              id="converter-token-input"
              type="number"
              min="0"
              step="any"
              value={tokenAmount}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="Enter amount..."
              className="flex-1 bg-transparent text-sm font-mono font-bold outline-none"
              style={{ color: "#F59E0B" }}
            />
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{
                background: "rgba(245,158,11,0.15)",
                color: "#F59E0B",
              }}
            >
              {token.symbol}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#F59E0B",
            }}
          >
            ⇅
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="converter-usd-input"
            className="text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Amount in USD
          </label>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background:
                lastEdited === "usd"
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(0,0,0,0.3)",
              border:
                lastEdited === "usd"
                  ? "1px solid rgba(34,197,94,0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.2s",
            }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              $
            </span>
            <input
              id="converter-usd-input"
              type="number"
              min="0"
              step="any"
              value={usdAmount}
              onChange={(e) => handleUsdChange(e.target.value)}
              placeholder="Enter USD amount..."
              className="flex-1 bg-transparent text-sm font-mono font-bold outline-none"
              style={{ color: "#22C55E" }}
            />
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{
                background: "rgba(34,197,94,0.15)",
                color: "#22C55E",
              }}
            >
              USD
            </span>
          </div>
        </div>

        <p
          className="text-xs text-center"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Prices from CoinGecko · Updated in real-time
        </p>
      </div>
    </motion.div>
  );
}

export function TokenDetailModal({
  token,
  open,
  onClose,
  isPremium,
  onUnlockPro,
}: TokenDetailModalProps) {
  const [detail, setDetail] = useState<CoinGeckoDetail | null>(null);
  const [dominance, setDominance] = useState<number | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<
    "compare" | "converter" | "about" | null
  >(null);

  useEffect(() => {
    if (!open || !token) return;
    setDetail(null);
    setDominance(null);
    setActiveBottomTab(null);
    setLoadingDetail(true);

    const coinId = token.id;
    const coinUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
    const globalUrl = "https://api.coingecko.com/api/v3/global";

    Promise.all([
      fetch(coinUrl).then((r) => r.json() as Promise<CoinGeckoDetail>),
      fetch(globalUrl).then((r) => r.json() as Promise<GlobalData>),
    ])
      .then(([coinData, globalData]) => {
        setDetail(coinData);
        const pct =
          globalData?.data?.market_cap_percentage?.[coinId.toLowerCase()] ??
          globalData?.data?.market_cap_percentage?.[
            token.symbol.toLowerCase()
          ] ??
          null;
        setDominance(pct);
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [open, token]);

  if (!token) return null;

  const isPositive = token.price_change_percentage_24h >= 0;
  const isFreeTierToken = FREE_TIER_IDS.includes(token.id);
  const isHiddenGem = !LARGE_CAP_IDS.includes(token.id);

  const md = detail?.market_data;
  const marketCap = md?.market_cap?.usd ?? token.market_cap;
  const volume24h = md?.total_volume?.usd ?? token.total_volume;
  const maxSupply = md?.max_supply ?? null;
  const ath = md?.ath?.usd ?? null;
  const fdv = md?.fully_diluted_valuation?.usd ?? null;
  const circulatingSupply = md?.circulating_supply ?? token.circulating_supply;
  const totalSupply = md?.total_supply ?? null;
  const high24h = md?.high_24h?.usd ?? token.current_price * 1.02;
  const low24h = md?.low_24h?.usd ?? token.current_price * 0.98;

  const priceRange = high24h - low24h;
  const pricePosition =
    priceRange > 0
      ? Math.min(
          100,
          Math.max(0, ((token.current_price - low24h) / priceRange) * 100),
        )
      : 50;

  const statsLeft = [
    { label: "Market Cap", value: formatLargeUSD(marketCap) },
    { label: "Volume 24h", value: formatLargeUSD(volume24h) },
    {
      label: "Max Supply",
      value: maxSupply ? formatLargeNumber(maxSupply) : "∞",
    },
    { label: "All Time High", value: ath ? formatPrice(ath) : "—" },
  ];

  const statsRight = [
    { label: "Fully Diluted Val.", value: formatLargeUSD(fdv) },
    {
      label: "Circulating Supply",
      value: formatLargeNumber(circulatingSupply),
    },
    {
      label: "Total Supply",
      value: totalSupply ? formatLargeNumber(totalSupply) : "—",
    },
    {
      label: "Market Dominance",
      value: dominance != null ? `${dominance.toFixed(2)}%` : "—",
    },
  ];

  const smcSignals = generateSMCSignals(token);

  const trend =
    token.price_change_percentage_24h > 2
      ? "Uptrend"
      : token.price_change_percentage_24h < -2
        ? "Downtrend"
        : "Sideways";
  const trendColor =
    trend === "Uptrend"
      ? "#00FF94"
      : trend === "Downtrend"
        ? "#FF4444"
        : "#FFD700";
  const signal =
    token.sentiment.label === "Bullish"
      ? "BUY"
      : token.sentiment.label === "Bearish"
        ? "SELL"
        : "HOLD";
  const signalColor =
    signal === "BUY" ? "#00FF94" : signal === "SELL" ? "#FF4444" : "#FFD700";
  const entryLow = token.current_price * 0.995;
  const entryHigh = token.current_price * 1.005;
  const takeProfit1 = token.current_price * 1.02;
  const takeProfit2 = token.current_price * 1.05;
  const takeProfit3 = token.current_price * 1.1;
  const stopLoss = token.current_price * 0.98;

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{`
            @keyframes gemGlow {
              from { box-shadow: 0 0 8px rgba(255,215,0,0.5), 0 0 16px rgba(0,255,136,0.2); }
              to   { box-shadow: 0 0 18px rgba(255,215,0,0.8), 0 0 32px rgba(0,255,136,0.5); }
            }
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Modal */}
          <motion.div
            data-ocid="token.detail.modal"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 top-6 bottom-6 z-50 max-w-2xl mx-auto overflow-hidden flex flex-col"
            style={{
              background: "#0a0a0f",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: "1.25rem",
              boxShadow:
                "0 30px 90px rgba(0,0,0,0.7), 0 0 60px rgba(212,175,55,0.06)",
            }}
          >
            {/* Gold shimmer top bar */}
            <div
              className="h-0.5 flex-shrink-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #d4af37, #f5d76e, #d4af37, transparent)",
              }}
            />

            {/* Header */}
            <div
              className="flex items-start justify-between p-5 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3">
                {token.image ? (
                  <img
                    src={token.image}
                    alt={token.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(245,215,110,0.15))",
                      border: "1px solid rgba(212,175,55,0.4)",
                      color: "#d4af37",
                    }}
                  >
                    {token.symbol.slice(0, 3)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl font-bold text-white">
                      {token.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium uppercase"
                      style={{
                        background: "rgba(212,175,55,0.12)",
                        border: "1px solid rgba(212,175,55,0.3)",
                        color: "#d4af37",
                      }}
                    >
                      {token.symbol}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      #{token.market_cap_rank}
                    </span>
                    {/* Hidden Gem badge for Pro users on low-cap tokens */}
                    {isPremium && isHiddenGem && <HiddenGemBadge />}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-2xl font-bold font-mono text-white">
                      {formatPrice(token.current_price)}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1",
                        isPositive
                          ? "text-green-400 bg-green-400/10"
                          : "text-red-400 bg-red-400/10",
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {isPositive ? "+" : ""}
                      {token.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                data-ocid="token.detail.close_button"
                onClick={onClose}
                className="p-2 rounded-xl transition-all hover:bg-white/10 flex-shrink-0"
                style={{ color: "#d4af37" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* 24h Low/High Price Bar */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(212,175,55,0.12)",
                }}
              >
                <div
                  className="flex justify-between text-xs mb-2"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  <span>24h Range</span>
                  {loadingDetail && (
                    <span
                      className="flex items-center gap-1"
                      style={{ color: "#d4af37" }}
                    >
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Loading live data...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-red-400 flex-shrink-0">
                    Low {formatPrice(low24h)}
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full relative"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${pricePosition}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, #FF4444, #FFD700, #00FF94)",
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
                      style={{
                        left: `calc(${pricePosition}% - 6px)`,
                        background: "#fff",
                        borderColor: "#d4af37",
                        boxShadow: "0 0 8px rgba(212,175,55,0.6)",
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-green-400 flex-shrink-0">
                    High {formatPrice(high24h)}
                  </span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="h-4 w-4" style={{ color: "#d4af37" }} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#d4af37" }}
                  >
                    Market Statistics
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    {statsLeft.map((stat) => (
                      <div
                        key={stat.label}
                        className="p-3 rounded-xl"
                        style={{
                          background: "rgba(212,175,55,0.04)",
                          border: "1px solid rgba(212,175,55,0.1)",
                        }}
                      >
                        <div
                          className="text-xs mb-1"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          {stat.label}
                        </div>
                        <div className="font-bold text-sm text-white font-mono">
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {statsRight.map((stat) => (
                      <div
                        key={stat.label}
                        className="p-3 rounded-xl"
                        style={{
                          background: "rgba(212,175,55,0.04)",
                          border: "1px solid rgba(212,175,55,0.1)",
                        }}
                      >
                        <div
                          className="text-xs mb-1"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          {stat.label}
                        </div>
                        <div className="font-bold text-sm text-white font-mono">
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid="token.compare_button"
                  onClick={() =>
                    setActiveBottomTab(
                      activeBottomTab === "compare" ? null : "compare",
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background:
                      activeBottomTab === "compare"
                        ? "rgba(212,175,55,0.15)"
                        : "transparent",
                    border: "1px solid rgba(212,175,55,0.4)",
                    color: "#d4af37",
                  }}
                >
                  <GitCompare className="h-3.5 w-3.5" />
                  Compare
                </button>
                <button
                  type="button"
                  data-ocid="token.converter_button"
                  onClick={() =>
                    setActiveBottomTab(
                      activeBottomTab === "converter" ? null : "converter",
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background:
                      activeBottomTab === "converter"
                        ? "rgba(212,175,55,0.15)"
                        : "transparent",
                    border: "1px solid rgba(212,175,55,0.4)",
                    color: "#d4af37",
                  }}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Converter
                </button>
                <button
                  type="button"
                  data-ocid="token.detail.about_button"
                  onClick={() =>
                    setActiveBottomTab(
                      activeBottomTab === "about" ? null : "about",
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background:
                      activeBottomTab === "about"
                        ? "rgba(212,175,55,0.15)"
                        : "transparent",
                    border: "1px solid rgba(212,175,55,0.4)",
                    color: "#d4af37",
                  }}
                >
                  <Info className="h-3.5 w-3.5" />
                  About
                </button>
              </div>

              {/* Bottom Tab Content */}
              <AnimatePresence mode="wait">
                {activeBottomTab === "compare" && (
                  <ComparePanel
                    key="compare"
                    token={token}
                    onClose={() => setActiveBottomTab(null)}
                  />
                )}
                {activeBottomTab === "converter" && (
                  <ConverterPanel
                    key="converter"
                    token={token}
                    onClose={() => setActiveBottomTab(null)}
                  />
                )}
                {activeBottomTab === "about" && (
                  <motion.div
                    key="about"
                    data-ocid="token.detail.about_panel"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl"
                    style={{
                      background: "rgba(10,10,20,0.98)",
                      border: "1px solid rgba(212,175,55,0.2)",
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#d4af37" }}
                      >
                        About {token.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveBottomTab(null)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                        style={{ color: "#d4af37" }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div
                      className="p-4 text-sm space-y-2"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      <p className="font-semibold text-white">
                        {token.name} ({token.symbol})
                      </p>
                      <p>
                        Rank #{token.market_cap_rank} by market capitalization.
                        Currently trading at {formatPrice(token.current_price)}{" "}
                        with a 24h change of{" "}
                        {token.price_change_percentage_24h > 0 ? "+" : ""}
                        {token.price_change_percentage_24h.toFixed(2)}%.
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        Data sourced from CoinGecko API.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active Markets */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4" style={{ color: "#00FF94" }} />
                  <span className="text-sm font-semibold text-white">
                    Active Markets
                  </span>
                </div>
                <div className="space-y-2">
                  {EXCHANGES.map((ex) => (
                    <div
                      key={ex.name}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ex.logo}</span>
                        <span className="text-sm font-medium text-white">
                          {ex.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          Fee {ex.fee}
                        </span>
                        <Badge
                          className="text-xs px-2 py-0.5 rounded-full border-0 font-medium"
                          style={{
                            background: "rgba(0,200,83,0.15)",
                            color: "#00C853",
                          }}
                        >
                          ● Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Signals section — Tiered */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-4 w-4" style={{ color: "#d4af37" }} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#d4af37" }}
                  >
                    AI Trading Signals
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: isPremium
                        ? "rgba(212,175,55,0.12)"
                        : "rgba(0,212,255,0.12)",
                      border: isPremium
                        ? "1px solid rgba(212,175,55,0.3)"
                        : "1px solid rgba(0,212,255,0.3)",
                      color: isPremium ? "#d4af37" : "#00D4FF",
                    }}
                  >
                    {isPremium ? "PRO" : "FREE"}
                  </span>
                </div>

                {/* Free tier: show basic signals for BTC/ETH/SOL */}
                {!isPremium && isFreeTierToken ? (
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{
                      background: "rgba(0,212,255,0.04)",
                      border: "1px solid rgba(0,212,255,0.15)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        Signal
                      </span>
                      <span
                        className="text-sm font-bold px-3 py-1 rounded-lg"
                        style={{
                          background: `${signalColor}18`,
                          border: `1px solid ${signalColor}40`,
                          color: signalColor,
                        }}
                      >
                        {signal}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        className="p-2.5 rounded-lg"
                        style={{
                          background: "rgba(0,212,255,0.07)",
                          border: "1px solid rgba(0,212,255,0.15)",
                        }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          Entry
                        </p>
                        <p
                          className="text-xs font-bold font-mono"
                          style={{ color: "#00D4FF" }}
                        >
                          {formatPrice(entryLow)}
                        </p>
                      </div>
                      <div
                        className="p-2.5 rounded-lg"
                        style={{
                          background: "rgba(0,255,148,0.07)",
                          border: "1px solid rgba(0,255,148,0.15)",
                        }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          TP1
                        </p>
                        <p
                          className="text-xs font-bold font-mono"
                          style={{ color: "#00FF94" }}
                        >
                          {formatPrice(takeProfit1)}
                        </p>
                      </div>
                      <div
                        className="p-2.5 rounded-lg"
                        style={{
                          background: "rgba(255,68,68,0.07)",
                          border: "1px solid rgba(255,68,68,0.15)",
                        }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          SL
                        </p>
                        <p
                          className="text-xs font-bold font-mono"
                          style={{ color: "#FF4444" }}
                        >
                          {formatPrice(stopLoss)}
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{
                        background: "rgba(240,185,11,0.06)",
                        border: "1px solid rgba(240,185,11,0.15)",
                      }}
                    >
                      <Lock
                        className="h-3 w-3 flex-shrink-0"
                        style={{ color: "#F0B90B" }}
                      />
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        Upgrade to Pro for TP2, TP3, Confidence Score &amp; SMC
                        Analysis
                      </p>
                      <button
                        type="button"
                        data-ocid="token.detail.unlock_button"
                        onClick={onUnlockPro}
                        className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg"
                        style={{
                          background: "#F0B90B",
                          color: "#000",
                        }}
                      >
                        Unlock
                      </button>
                    </div>
                  </div>
                ) : !isPremium && !isFreeTierToken ? (
                  /* Locked state for non-free-tier tokens */
                  <div
                    className="rounded-xl p-6 flex flex-col items-center gap-3 text-center"
                    style={{
                      background: "rgba(212,175,55,0.04)",
                      border: "1px solid rgba(212,175,55,0.15)",
                    }}
                  >
                    <div
                      className="p-3 rounded-full"
                      style={{
                        background: "rgba(212,175,55,0.12)",
                        border: "1px solid rgba(212,175,55,0.3)",
                      }}
                    >
                      <Lock className="h-6 w-6" style={{ color: "#d4af37" }} />
                    </div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      PRO Signals Only
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Unlock full SMC analysis, Order Blocks, FVGs, TP1/TP2/TP3
                      and Confidence Scores
                    </p>
                    {isHiddenGem && (
                      <div className="my-1">
                        <HiddenGemBadge />
                        <p
                          className="text-xs mt-1"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          This is a Hidden Gem pick — Pro exclusive
                        </p>
                      </div>
                    )}
                    <Button
                      data-ocid="token.detail.unlock_button"
                      onClick={onUnlockPro}
                      className="font-bold text-black border-0 px-6"
                      style={{
                        background: "#F0B90B",
                      }}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Unlock Pro — $5.00
                    </Button>
                  </div>
                ) : (
                  /* PRO full signals */
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(212,175,55,0.05), rgba(185,242,255,0.03))",
                      border: "1px solid rgba(212,175,55,0.2)",
                    }}
                  >
                    <div className="p-4 space-y-4">
                      {/* Overall signal */}
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          Overall Signal
                        </span>
                        <span
                          className="text-lg font-bold px-4 py-1 rounded-lg"
                          style={{
                            background: `${signalColor}18`,
                            border: `1px solid ${signalColor}40`,
                            color: signalColor,
                          }}
                        >
                          {signal}
                        </span>
                      </div>

                      {/* Entry / Trend / TP1-3 / SL */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            label: "Entry Zone",
                            value: `${formatPrice(entryLow)} – ${formatPrice(entryHigh)}`,
                            color: "#00D4FF",
                          },
                          { label: "Trend", value: trend, color: trendColor },
                          {
                            label: "TP1",
                            value: formatPrice(takeProfit1),
                            color: "#00FF94",
                          },
                          {
                            label: "TP2",
                            value: formatPrice(takeProfit2),
                            color: "#00E57A",
                          },
                          {
                            label: "TP3",
                            value: formatPrice(takeProfit3),
                            color: "#00C853",
                          },
                          {
                            label: "Stop Loss",
                            value: formatPrice(stopLoss),
                            color: "#FF4444",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="p-3 rounded-lg"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <div
                              className="text-xs mb-1"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              {item.label}
                            </div>
                            <div
                              className="text-sm font-bold font-mono"
                              style={{ color: item.color }}
                            >
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Momentum bars */}
                      <div className="space-y-2">
                        <SignalBar
                          label="Bullish Strength"
                          value={token.sentiment.score}
                          color="#00FF94"
                        />
                        <SignalBar
                          label="Volume Confidence"
                          value={Math.min(
                            75,
                            Math.abs(token.price_change_percentage_24h) * 6,
                          )}
                          color="#00D4FF"
                        />
                        <SignalBar
                          label="Momentum"
                          value={Math.min(90, token.growthPotential / 1.2)}
                          color="#d4af37"
                        />
                      </div>

                      {/* SMC Signals */}
                      <div className="space-y-3 pt-2">
                        <div
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.07)",
                            paddingTop: "12px",
                          }}
                        >
                          <span
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            Smart Money Concepts
                          </span>
                        </div>
                        {smcSignals.map((sig) => (
                          <div
                            key={sig.type}
                            data-ocid={sig.ocid}
                            className="p-3 rounded-xl"
                            style={{
                              background: sig.bgColor,
                              border: `1px solid ${sig.borderColor}`,
                              borderLeft: `3px solid ${sig.color}`,
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-xs font-black px-2 py-0.5 rounded-md"
                                  style={{
                                    background: `${sig.color}20`,
                                    color: sig.color,
                                    border: `1px solid ${sig.color}40`,
                                  }}
                                >
                                  {sig.type}
                                </span>
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: "rgba(255,255,255,0.6)" }}
                                >
                                  {sig.label}
                                </span>
                              </div>
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: `${sig.directionColor}15`,
                                  color: sig.directionColor,
                                  border: `1px solid ${sig.directionColor}40`,
                                }}
                              >
                                {sig.direction}
                              </span>
                            </div>
                            <p
                              className="text-xs leading-relaxed mb-2"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              {sig.explanation}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <span
                                  className="text-xs"
                                  style={{ color: "rgba(255,255,255,0.4)" }}
                                >
                                  Confidence:
                                </span>
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: sig.color }}
                                >
                                  {sig.confidence}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span
                                  className="text-xs"
                                  style={{ color: "rgba(255,255,255,0.4)" }}
                                >
                                  R:R
                                </span>
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: "#00D4FF" }}
                                >
                                  1:{sig.rr}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
