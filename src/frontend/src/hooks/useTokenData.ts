import { useMemo } from "react";
import { useTokenCache } from "./useBackend";

export interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  image?: string;
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

const MOCK_TOKENS: CoinGeckoToken[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    current_price: 67432,
    price_change_percentage_24h: 2.4,
    market_cap: 1_326_000_000_000,
    market_cap_rank: 1,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    current_price: 3521,
    price_change_percentage_24h: 1.8,
    market_cap: 422_000_000_000,
    market_cap_rank: 2,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    current_price: 185,
    price_change_percentage_24h: 5.2,
    market_cap: 86_000_000_000,
    market_cap_rank: 3,
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    current_price: 412,
    price_change_percentage_24h: -0.8,
    market_cap: 60_000_000_000,
    market_cap_rank: 4,
  },
  {
    id: "avalanche-2",
    symbol: "AVAX",
    name: "Avalanche",
    current_price: 38.5,
    price_change_percentage_24h: 3.7,
    market_cap: 15_600_000_000,
    market_cap_rank: 5,
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    current_price: 0.58,
    price_change_percentage_24h: -1.2,
    market_cap: 20_400_000_000,
    market_cap_rank: 6,
  },
  {
    id: "polkadot",
    symbol: "DOT",
    name: "Polkadot",
    current_price: 8.2,
    price_change_percentage_24h: 0.5,
    market_cap: 11_200_000_000,
    market_cap_rank: 7,
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    current_price: 18.5,
    price_change_percentage_24h: 4.1,
    market_cap: 10_800_000_000,
    market_cap_rank: 8,
  },
  {
    id: "matic-network",
    symbol: "MATIC",
    name: "Polygon",
    current_price: 0.92,
    price_change_percentage_24h: -2.3,
    market_cap: 9_200_000_000,
    market_cap_rank: 9,
  },
  {
    id: "uniswap",
    symbol: "UNI",
    name: "Uniswap",
    current_price: 12.3,
    price_change_percentage_24h: 1.5,
    market_cap: 7_400_000_000,
    market_cap_rank: 10,
  },
  {
    id: "cosmos",
    symbol: "ATOM",
    name: "Cosmos",
    current_price: 9.1,
    price_change_percentage_24h: 0.8,
    market_cap: 3_500_000_000,
    market_cap_rank: 11,
  },
  {
    id: "near",
    symbol: "NEAR",
    name: "NEAR Protocol",
    current_price: 5.8,
    price_change_percentage_24h: 6.2,
    market_cap: 6_200_000_000,
    market_cap_rank: 12,
  },
  {
    id: "fantom",
    symbol: "FTM",
    name: "Fantom",
    current_price: 0.72,
    price_change_percentage_24h: 3.9,
    market_cap: 2_000_000_000,
    market_cap_rank: 13,
  },
  {
    id: "arbitrum",
    symbol: "ARB",
    name: "Arbitrum",
    current_price: 1.12,
    price_change_percentage_24h: -0.4,
    market_cap: 4_500_000_000,
    market_cap_rank: 14,
  },
  {
    id: "optimism",
    symbol: "OP",
    name: "Optimism",
    current_price: 2.45,
    price_change_percentage_24h: 2.1,
    market_cap: 3_200_000_000,
    market_cap_rank: 15,
  },
  {
    id: "injective-protocol",
    symbol: "INJ",
    name: "Injective",
    current_price: 28.4,
    price_change_percentage_24h: 7.8,
    market_cap: 2_600_000_000,
    market_cap_rank: 16,
  },
  {
    id: "celestia",
    symbol: "TIA",
    name: "Celestia",
    current_price: 8.9,
    price_change_percentage_24h: 4.3,
    market_cap: 1_800_000_000,
    market_cap_rank: 17,
  },
  {
    id: "sei-network",
    symbol: "SEI",
    name: "Sei",
    current_price: 0.65,
    price_change_percentage_24h: 5.9,
    market_cap: 1_600_000_000,
    market_cap_rank: 18,
  },
  {
    id: "dogwifhat",
    symbol: "WIF",
    name: "dogwifhat",
    current_price: 2.8,
    price_change_percentage_24h: 12.4,
    market_cap: 2_800_000_000,
    market_cap_rank: 19,
  },
  {
    id: "pepe",
    symbol: "PEPE",
    name: "Pepe",
    current_price: 0.0000123,
    price_change_percentage_24h: 8.7,
    market_cap: 5_200_000_000,
    market_cap_rank: 20,
  },
];

const LOW_CAP_GEMS: CoinGeckoToken[] = [
  {
    id: "bonk",
    symbol: "BONK",
    name: "Bonk",
    current_price: 0.0000285,
    price_change_percentage_24h: 15.4,
    market_cap: 1_900_000_000,
    market_cap_rank: 45,
  },
  {
    id: "floki",
    symbol: "FLOKI",
    name: "FLOKI",
    current_price: 0.000198,
    price_change_percentage_24h: 9.2,
    market_cap: 1_800_000_000,
    market_cap_rank: 46,
  },
  {
    id: "shiba-inu",
    symbol: "SHIB",
    name: "Shiba Inu",
    current_price: 0.0000275,
    price_change_percentage_24h: 6.8,
    market_cap: 16_200_000_000,
    market_cap_rank: 47,
  },
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    current_price: 0.178,
    price_change_percentage_24h: 11.3,
    market_cap: 25_700_000_000,
    market_cap_rank: 48,
  },
  {
    id: "book-of-meme",
    symbol: "BOME",
    name: "Book of Meme",
    current_price: 0.0112,
    price_change_percentage_24h: 22.6,
    market_cap: 780_000_000,
    market_cap_rank: 49,
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

export function useTokenData() {
  const { data: rawCache, isLoading } = useTokenCache();

  const tokens = useMemo<TokenData[]>(() => {
    if (rawCache && rawCache.trim().length > 2) {
      try {
        const parsed = JSON.parse(rawCache) as CoinGeckoToken[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 20).map(enrichToken);
        }
      } catch {
        // fall through to mock
      }
    }
    return MOCK_TOKENS.map(enrichToken);
  }, [rawCache]);

  const lowCapGems = useMemo<TokenData[]>(
    () => LOW_CAP_GEMS.map(enrichToken),
    [],
  );

  const alphaTokens = useMemo<TokenData[]>(
    () =>
      [...tokens]
        .sort((a, b) => b.growthPotential - a.growthPotential)
        .slice(0, 5),
    [tokens],
  );

  return { tokens, alphaTokens, lowCapGems, isLoading };
}
