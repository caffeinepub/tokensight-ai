import { Share2, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SentimentGauge } from "./SentimentGauge";
import { WhaleTicker } from "./WhaleTicker";

interface Props {
  isPro: boolean;
  onUnlock: () => void;
}

const ALPHA_CALLERS = [
  {
    handle: "@Pentoshi",
    name: "Pentoshi",
    followers: "650K",
    isVerified: true,
  },
  { handle: "@Cobie", name: "Cobie", followers: "780K", isVerified: true },
  {
    handle: "@CryptoCobain",
    name: "CryptoCobain",
    followers: "420K",
    isVerified: true,
  },
  {
    handle: "@lookonchain",
    name: "LookOnChain",
    followers: "510K",
    isVerified: true,
  },
  {
    handle: "@HsakaTrades",
    name: "Hsaka",
    followers: "390K",
    isVerified: true,
  },
  {
    handle: "@AltcoinGordon",
    name: "Gordon",
    followers: "320K",
    isVerified: false,
  },
  {
    handle: "@CryptoKaleo",
    name: "Kaleo",
    followers: "560K",
    isVerified: true,
  },
  {
    handle: "@Trader_XO",
    name: "Trader XO",
    followers: "280K",
    isVerified: false,
  },
  {
    handle: "@CredibleCrypto",
    name: "CredibleCrypto",
    followers: "345K",
    isVerified: true,
  },
  { handle: "@DonAlt", name: "DonAlt", followers: "450K", isVerified: true },
];

const TWEET_TEMPLATES = [
  (coin: string, price: string) =>
    `${coin} is breaking out of a key OB right now. Entry confirmed. $${price} — this is the setup I've been watching. 🔥`,
  (coin: string) =>
    `Major liquidity sweep below ${coin} equal lows. Smart money accumulating. Don't get shaken out.`,
  (coin: string, price: string) =>
    `${coin} FVG fill complete at $${price}. 4H structure intact. Watching for MSB to confirm long. 👀`,
  (coin: string) =>
    `${coin} is showing EXACTLY what I described last week. OB holding as support. Still Bullish until it doesn't.`,
  (coin: string, price: string) =>
    `Whale wallet moved 50K ${coin} to exchange cold storage at $${price}. Accumulation pattern recognized. 🐋`,
  (coin: string) =>
    `${coin} sentiment is turning. Fear is at extreme levels — historically a great time to be long. DCA zone active. Bullish bias.`,
];

const COINS = [
  "BTC",
  "ETH",
  "SOL",
  "ICP",
  "ARB",
  "OP",
  "PEPE",
  "BNB",
  "XRP",
  "AVAX",
];
const PRICES: Record<string, string> = {
  BTC: "88,500",
  ETH: "3,200",
  SOL: "148",
  ICP: "12.4",
  ARB: "1.28",
  OP: "2.18",
  PEPE: "0.0000149",
  BNB: "615",
  XRP: "0.55",
  AVAX: "39.2",
};

interface Tweet {
  id: number;
  caller: (typeof ALPHA_CALLERS)[0];
  coin: string;
  text: string;
  likes: number;
  retweets: number;
  timeAgo: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  tweetUrl: string;
}

function generateTweet(id: number): Tweet {
  const caller = ALPHA_CALLERS[id % ALPHA_CALLERS.length];
  const coin = COINS[Math.floor(Math.random() * COINS.length)];
  const price = PRICES[coin] ?? "—";
  const templateFn =
    TWEET_TEMPLATES[Math.floor(Math.random() * TWEET_TEMPLATES.length)];
  const text = templateFn(coin, price);
  const mins = Math.floor(Math.random() * 55) + 1;
  const lowerText = text.toLowerCase();
  const sentiment: Tweet["sentiment"] =
    lowerText.includes("bullish") ||
    lowerText.includes("long") ||
    lowerText.includes("ob")
      ? "Bullish"
      : lowerText.includes("bearish") || lowerText.includes("short")
        ? "Bearish"
        : "Neutral";
  return {
    id,
    caller,
    coin,
    text,
    likes: Math.floor(Math.random() * 2400) + 100,
    retweets: Math.floor(Math.random() * 800) + 20,
    timeAgo: `${mins}m ago`,
    sentiment,
    tweetUrl: `https://twitter.com/${caller.handle.replace("@", "")}`,
  };
}

export function SocialSection({ isPro, onUnlock }: Props) {
  const [tweets, setTweets] = useState<Tweet[]>(() =>
    Array.from({ length: 12 }, (_, i) => generateTweet(i)),
  );
  const counterRef = useRef(100);

  // Rotate tweets every 15 seconds to simulate live feed
  useEffect(() => {
    const interval = setInterval(() => {
      setTweets((prev) => {
        const newTweet = generateTweet(counterRef.current++);
        return [newTweet, ...prev.slice(0, 11)];
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const COIN_MENTION_COUNTS: Record<string, number> = {};
  for (const t of tweets) {
    COIN_MENTION_COUNTS[t.coin] = (COIN_MENTION_COUNTS[t.coin] ?? 0) + 1;
  }
  const topMentions = Object.entries(COIN_MENTION_COUNTS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Top Mentions Bar */}
      <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-[#D4AF37]" />
          <h3 className="text-white font-mono font-bold text-xs">
            TRENDING COINS ON X
          </h3>
          <span className="text-[10px] font-mono text-gray-600 ml-auto">
            Updates every 15s
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {topMentions.map(([coin, count], i) => (
            <div
              key={coin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1C2333] bg-[#080B14]"
            >
              <span className="text-gray-600 text-[10px] font-mono">
                #{i + 1}
              </span>
              <span className="text-white font-mono font-bold text-xs">
                {coin}
              </span>
              <span className="text-[#D4AF37] text-[10px] font-mono">
                {count} mentions
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* X Sentinel Feed */}
        <div className="md:col-span-2 bg-[#0D1117] rounded-xl border border-[#1C2333] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1C2333]">
            <div>
              <h3 className="text-white font-mono font-bold text-xs">
                X SENTINEL
              </h3>
              <p className="text-gray-500 text-[10px]">
                Top 50 Alpha Caller Feed
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              <span className="text-[#00FF88] text-[10px] font-mono">
                LIVE FEED
              </span>
            </div>
          </div>
          <div className="divide-y divide-[#1C2333] max-h-[500px] overflow-y-auto">
            {tweets.map((tweet, i) => (
              <div
                key={tweet.id}
                data-ocid={`social.tweet.item.${i + 1}`}
                className="p-3 hover:bg-[#1C2333]/20 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1C2333] border border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-[10px] font-bold text-[#D4AF37]">
                    {tweet.caller.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-white font-bold text-xs">
                        {tweet.caller.handle}
                      </span>
                      {tweet.caller.isVerified && (
                        <span
                          className="text-[10px] font-bold rounded-full px-1"
                          style={{ color: "#1DA1F2" }}
                          title="Verified Account"
                        >
                          ✓
                        </span>
                      )}
                      <span className="text-gray-600 text-[10px]">
                        {tweet.caller.followers} followers
                      </span>
                      <span className="text-gray-600 text-[10px] ml-auto">
                        {tweet.timeAgo}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {tweet.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-gray-600 text-[10px] font-mono">
                        ❤ {tweet.likes.toLocaleString()}
                      </span>
                      <span className="text-gray-600 text-[10px] font-mono">
                        🔁 {tweet.retweets.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          tweet.sentiment === "Bullish"
                            ? "bg-[#00FF88]/10 text-[#00FF88]"
                            : tweet.sentiment === "Bearish"
                              ? "bg-[#FF3B5C]/10 text-[#FF3B5C]"
                              : "bg-[#1C2333] text-gray-500"
                        }`}
                      >
                        {tweet.sentiment}
                      </span>
                      <a
                        href={tweet.tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-gray-500 hover:text-[#1DA1F2] transition-colors font-mono ml-auto"
                      >
                        View Original Tweet →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment + Share My Win */}
        <div className="space-y-4">
          <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-4">
            <h3 className="text-white font-mono font-bold text-xs mb-3">
              MARKET SENTIMENT
            </h3>
            <SentimentGauge />
          </div>

          <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-4">
            <h3 className="text-white font-mono font-bold text-xs mb-1 flex items-center gap-2">
              <Share2 size={12} className="text-[#D4AF37]" />
              SHARE MY WIN
            </h3>
            <p className="text-gray-500 text-[10px] mb-3">
              Generate branded profit cards for social media
            </p>
            {isPro ? (
              <div className="space-y-2">
                <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#080B14] rounded-lg border border-[#D4AF37]/40 p-3 text-center">
                  <p className="text-[#FFD700] font-mono font-bold text-sm">
                    +12.4% 🚀
                  </p>
                  <p className="text-gray-400 text-xs mt-1">BTC · TP3 Hit</p>
                  <p className="text-gray-600 text-[10px] font-mono">
                    TokenSight AI Pro Signal
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="social.share_win_button"
                  className="w-full py-2 rounded-lg text-xs font-mono font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #FFD700)",
                    color: "#080B14",
                  }}
                >
                  Generate & Share
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="social.unlock_pro_button"
                onClick={onUnlock}
                className="w-full py-2 rounded-lg text-xs font-mono font-bold border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
              >
                🔒 Pro Only — Unlock
              </button>
            )}
          </div>

          <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-4">
            <h3 className="text-white font-mono font-bold text-xs mb-2">
              WHALE TRACKER
            </h3>
            <WhaleTicker compact />
          </div>
        </div>
      </div>
    </div>
  );
}
