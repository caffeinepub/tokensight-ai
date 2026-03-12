import { useEffect, useMemo, useRef, useState } from "react";

export interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  image?: string;
  total_volume: number;
  circulating_supply: number;
}

export interface Sentiment {
  label: "Bullish" | "Neutral" | "Bearish";
  score: number;
  color: string;
}

export interface TokenData extends CoinGeckoToken {
  sentiment: Sentiment;
  prediction24h: number;
  growthPotential: number;
}

export type PriceFlash = "up" | "down" | null;

const TOP_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "avalanche-2",
  "cardano",
  "polkadot",
  "chainlink",
  "matic-network",
  "uniswap",
  "cosmos",
  "near",
  "fantom",
  "arbitrum",
  "optimism",
  "injective-protocol",
  "celestia",
  "sei-network",
  "dogwifhat",
  "pepe",
];

const LOW_CAP_IDS = ["bonk", "floki", "shiba-inu", "dogecoin", "book-of-meme"];

const ALL_IDS = [...TOP_IDS, ...LOW_CAP_IDS];

const FALLBACK_TOKENS: CoinGeckoToken[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    current_price: 67432,
    price_change_percentage_24h: 2.4,
    market_cap: 1_326_000_000_000,
    market_cap_rank: 1,
    total_volume: 32_400_000_000,
    circulating_supply: 19_672_000,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    current_price: 3521,
    price_change_percentage_24h: 1.8,
    market_cap: 422_000_000_000,
    market_cap_rank: 2,
    total_volume: 18_700_000_000,
    circulating_supply: 120_210_000,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    current_price: 185,
    price_change_percentage_24h: 5.2,
    market_cap: 86_000_000_000,
    market_cap_rank: 3,
    total_volume: 4_800_000_000,
    circulating_supply: 464_865_000,
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    current_price: 412,
    price_change_percentage_24h: -0.8,
    market_cap: 60_000_000_000,
    market_cap_rank: 4,
    total_volume: 1_900_000_000,
    circulating_supply: 145_887_575,
  },
  {
    id: "avalanche-2",
    symbol: "AVAX",
    name: "Avalanche",
    current_price: 38.5,
    price_change_percentage_24h: 3.7,
    market_cap: 15_600_000_000,
    market_cap_rank: 5,
    total_volume: 620_000_000,
    circulating_supply: 405_220_000,
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    current_price: 0.58,
    price_change_percentage_24h: -1.2,
    market_cap: 20_400_000_000,
    market_cap_rank: 6,
    total_volume: 540_000_000,
    circulating_supply: 35_179_000_000,
  },
  {
    id: "polkadot",
    symbol: "DOT",
    name: "Polkadot",
    current_price: 8.2,
    price_change_percentage_24h: 0.5,
    market_cap: 11_200_000_000,
    market_cap_rank: 7,
    total_volume: 310_000_000,
    circulating_supply: 1_365_000_000,
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    current_price: 18.5,
    price_change_percentage_24h: 4.1,
    market_cap: 10_800_000_000,
    market_cap_rank: 8,
    total_volume: 580_000_000,
    circulating_supply: 587_100_000,
  },
  {
    id: "matic-network",
    symbol: "MATIC",
    name: "Polygon",
    current_price: 0.92,
    price_change_percentage_24h: -2.3,
    market_cap: 9_200_000_000,
    market_cap_rank: 9,
    total_volume: 420_000_000,
    circulating_supply: 10_000_000_000,
  },
  {
    id: "uniswap",
    symbol: "UNI",
    name: "Uniswap",
    current_price: 12.3,
    price_change_percentage_24h: 1.5,
    market_cap: 7_400_000_000,
    market_cap_rank: 10,
    total_volume: 210_000_000,
    circulating_supply: 601_490_000,
  },
  {
    id: "cosmos",
    symbol: "ATOM",
    name: "Cosmos",
    current_price: 9.1,
    price_change_percentage_24h: 0.8,
    market_cap: 3_500_000_000,
    market_cap_rank: 11,
    total_volume: 120_000_000,
    circulating_supply: 384_740_000,
  },
  {
    id: "near",
    symbol: "NEAR",
    name: "NEAR Protocol",
    current_price: 5.8,
    price_change_percentage_24h: 6.2,
    market_cap: 6_200_000_000,
    market_cap_rank: 12,
    total_volume: 340_000_000,
    circulating_supply: 1_069_200_000,
  },
  {
    id: "fantom",
    symbol: "FTM",
    name: "Fantom",
    current_price: 0.72,
    price_change_percentage_24h: 3.9,
    market_cap: 2_000_000_000,
    market_cap_rank: 13,
    total_volume: 95_000_000,
    circulating_supply: 2_780_000_000,
  },
  {
    id: "arbitrum",
    symbol: "ARB",
    name: "Arbitrum",
    current_price: 1.12,
    price_change_percentage_24h: -0.4,
    market_cap: 4_500_000_000,
    market_cap_rank: 14,
    total_volume: 175_000_000,
    circulating_supply: 4_017_000_000,
  },
  {
    id: "optimism",
    symbol: "OP",
    name: "Optimism",
    current_price: 2.45,
    price_change_percentage_24h: 2.1,
    market_cap: 3_200_000_000,
    market_cap_rank: 15,
    total_volume: 145_000_000,
    circulating_supply: 1_306_000_000,
  },
  {
    id: "injective-protocol",
    symbol: "INJ",
    name: "Injective",
    current_price: 28.4,
    price_change_percentage_24h: 7.8,
    market_cap: 2_600_000_000,
    market_cap_rank: 16,
    total_volume: 260_000_000,
    circulating_supply: 91_550_000,
  },
  {
    id: "celestia",
    symbol: "TIA",
    name: "Celestia",
    current_price: 8.9,
    price_change_percentage_24h: 4.3,
    market_cap: 1_800_000_000,
    market_cap_rank: 17,
    total_volume: 88_000_000,
    circulating_supply: 202_250_000,
  },
  {
    id: "sei-network",
    symbol: "SEI",
    name: "Sei",
    current_price: 0.65,
    price_change_percentage_24h: 5.9,
    market_cap: 1_600_000_000,
    market_cap_rank: 18,
    total_volume: 72_000_000,
    circulating_supply: 2_462_000_000,
  },
  {
    id: "dogwifhat",
    symbol: "WIF",
    name: "dogwifhat",
    current_price: 2.8,
    price_change_percentage_24h: 12.4,
    market_cap: 2_800_000_000,
    market_cap_rank: 19,
    total_volume: 560_000_000,
    circulating_supply: 998_900_000,
  },
  {
    id: "pepe",
    symbol: "PEPE",
    name: "Pepe",
    current_price: 0.0000123,
    price_change_percentage_24h: 8.7,
    market_cap: 5_200_000_000,
    market_cap_rank: 20,
    total_volume: 1_200_000_000,
    circulating_supply: 420_690_000_000_000,
  },
  {
    id: "bonk",
    symbol: "BONK",
    name: "Bonk",
    current_price: 0.0000285,
    price_change_percentage_24h: 15.4,
    market_cap: 1_900_000_000,
    market_cap_rank: 45,
    total_volume: 380_000_000,
    circulating_supply: 66_700_000_000_000,
  },
  {
    id: "floki",
    symbol: "FLOKI",
    name: "FLOKI",
    current_price: 0.000198,
    price_change_percentage_24h: 9.2,
    market_cap: 1_800_000_000,
    market_cap_rank: 46,
    total_volume: 145_000_000,
    circulating_supply: 9_090_000_000_000,
  },
  {
    id: "shiba-inu",
    symbol: "SHIB",
    name: "Shiba Inu",
    current_price: 0.0000275,
    price_change_percentage_24h: 6.8,
    market_cap: 16_200_000_000,
    market_cap_rank: 47,
    total_volume: 640_000_000,
    circulating_supply: 589_254_000_000_000,
  },
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    current_price: 0.178,
    price_change_percentage_24h: 11.3,
    market_cap: 25_700_000_000,
    market_cap_rank: 48,
    total_volume: 2_300_000_000,
    circulating_supply: 144_360_000_000,
  },
  {
    id: "book-of-meme",
    symbol: "BOME",
    name: "Book of Meme",
    current_price: 0.0112,
    price_change_percentage_24h: 22.6,
    market_cap: 780_000_000,
    market_cap_rank: 49,
    total_volume: 195_000_000,
    circulating_supply: 69_650_000_000,
  },
];

function seededRandom(seed: string, offset = 0): number {
  let hash = offset * 2654435761;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 2654435761);
  }
  return (Math.abs(hash) >>> 0) / 4294967296;
}

export function computeSentiment(symbol: string, change24h: number): Sentiment {
  const r = seededRandom(symbol);
  if (change24h > 3) {
    const score = Math.round(60 + r * 30);
    return { label: "Bullish", score, color: "#00FF94" };
  }
  if (change24h > 0) {
    const score = Math.round(45 + r * 15);
    return { label: "Neutral", score, color: "#FFD700" };
  }
  const score = Math.round(10 + r * 30);
  return { label: "Bearish", score, color: "#FF4444" };
}

export function computePrediction(
  currentPrice: number,
  sentimentScore: number,
): number {
  const r = seededRandom(String(sentimentScore));
  return (
    currentPrice * (1 + (sentimentScore / 100 - 0.5) * 0.05 + r * 0.01 - 0.005)
  );
}

export function computeGrowthPotential(
  sentimentScore: number,
  change24h: number,
): number {
  return sentimentScore * (1 + change24h / 100);
}

function enrichToken(token: CoinGeckoToken): TokenData {
  const sentiment = computeSentiment(
    token.symbol,
    token.price_change_percentage_24h,
  );
  const prediction24h = computePrediction(token.current_price, sentiment.score);
  const growthPotential = computeGrowthPotential(
    sentiment.score,
    token.price_change_percentage_24h,
  );
  return { ...token, sentiment, prediction24h, growthPotential };
}

async function fetchLiveTokens(): Promise<CoinGeckoToken[]> {
  const ids = ALL_IDS.join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=${ALL_IDS.length}&page=1&sparkline=false&price_change_percentage=24h`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as CoinGeckoToken[];
  if (!Array.isArray(data) || data.length === 0)
    throw new Error("Empty response");
  return data;
}

const LOW_CAP_IDS_SET = new Set(LOW_CAP_IDS);

export function useTokenData() {
  const [rawTokens, setRawTokens] = useState<CoinGeckoToken[]>(FALLBACK_TOKENS);
  const [isLoading, setIsLoading] = useState(true);
  const [flashMap, setFlashMap] = useState<Record<string, PriceFlash>>({});
  const prevPricesRef = useRef<Record<string, number>>({});
  const flashTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  useEffect(() => {
    const flashTimers = flashTimersRef.current;
    const runUpdate = async (isInitial: boolean) => {
      try {
        const data = await fetchLiveTokens();
        setRawTokens(data);

        if (!isInitial) {
          const newFlash: Record<string, PriceFlash> = {};
          const prev = prevPricesRef.current;
          for (const token of data) {
            const oldPrice = prev[token.id];
            if (oldPrice !== undefined && oldPrice !== token.current_price) {
              newFlash[token.id] =
                token.current_price > oldPrice ? "up" : "down";
              if (flashTimers[token.id]) clearTimeout(flashTimers[token.id]);
              flashTimers[token.id] = setTimeout(() => {
                setFlashMap((p) => ({ ...p, [token.id]: null }));
              }, 1500);
            }
            prev[token.id] = token.current_price;
          }
          if (Object.keys(newFlash).length > 0) {
            setFlashMap((p) => ({ ...p, ...newFlash }));
          }
        } else {
          for (const token of data) {
            prevPricesRef.current[token.id] = token.current_price;
          }
        }
      } catch {
        // keep existing data
      } finally {
        if (isInitial) setIsLoading(false);
      }
    };

    runUpdate(true);
    const interval = setInterval(() => runUpdate(false), 3000);
    return () => {
      clearInterval(interval);
      for (const t of Object.values(flashTimers)) clearTimeout(t);
    };
  }, []);

  const tokens = useMemo<TokenData[]>(
    () => rawTokens.filter((t) => !LOW_CAP_IDS_SET.has(t.id)).map(enrichToken),
    [rawTokens],
  );

  const lowCapGems = useMemo<TokenData[]>(
    () => rawTokens.filter((t) => LOW_CAP_IDS_SET.has(t.id)).map(enrichToken),
    [rawTokens],
  );

  const alphaTokens = useMemo<TokenData[]>(
    () =>
      [...tokens]
        .sort((a, b) => b.growthPotential - a.growthPotential)
        .slice(0, 5),
    [tokens],
  );

  const icpPrice = useMemo<number>(() => {
    const icp = rawTokens.find(
      (t) => t.id === "internet-computer" || t.symbol === "ICP",
    );
    return icp ? icp.current_price : 12.5;
  }, [rawTokens]);

  return { tokens, alphaTokens, lowCapGems, isLoading, icpPrice, flashMap };
}
