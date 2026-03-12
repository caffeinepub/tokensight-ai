import { useEffect, useRef, useState } from "react";

interface WhaleAlert {
  id: number;
  chain: string;
  amount: string;
  usdValue: string;
  from: string;
  to: string;
  type: "transfer" | "exchange_in" | "exchange_out";
  time: string;
}

const CHAINS = ["BTC", "ETH", "SOL", "BNB", "XRP"];
const EXCHANGE_LABELS = [
  "Binance",
  "Coinbase",
  "Kraken",
  "OKX",
  "Bybit",
  "Unknown Wallet",
];

function shortAddr() {
  const chars = "0123456789abcdef";
  return `0x${Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}...`;
}

function generateWhaleAlert(id: number): WhaleAlert {
  const chain = CHAINS[Math.floor(Math.random() * CHAINS.length)];
  const usdVal = (Math.random() * 90 + 10).toFixed(1);
  const types = ["transfer", "exchange_in", "exchange_out"] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  const fromLabel =
    type === "exchange_out"
      ? EXCHANGE_LABELS[Math.floor(Math.random() * EXCHANGE_LABELS.length)]
      : shortAddr();
  const toLabel =
    type === "exchange_in"
      ? EXCHANGE_LABELS[Math.floor(Math.random() * EXCHANGE_LABELS.length)]
      : shortAddr();
  const mins = Math.floor(Math.random() * 8) + 1;
  const amounts: Record<string, string> = {
    BTC: `${(Number(usdVal) / 88).toFixed(1)} BTC`,
    ETH: `${(Number(usdVal) / 3.2).toFixed(0)} ETH`,
    SOL: `${(Number(usdVal) / 0.148).toFixed(0)} SOL`,
    BNB: `${(Number(usdVal) / 0.615).toFixed(0)} BNB`,
    XRP: `${(Number(usdVal) / 0.00055).toFixed(0)} XRP`,
  };
  return {
    id,
    chain,
    amount: amounts[chain] ?? "—",
    usdValue: `$${usdVal}M`,
    from: fromLabel,
    to: toLabel,
    type,
    time: `${mins}m ago`,
  };
}

interface Props {
  compact?: boolean;
}

export function WhaleTicker({ compact = false }: Props) {
  const [alerts, setAlerts] = useState<WhaleAlert[]>(() =>
    Array.from({ length: compact ? 5 : 15 }, (_, i) => generateWhaleAlert(i)),
  );
  const counterRef = useRef(100);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setAlerts((prev) => {
          const newAlert = generateWhaleAlert(counterRef.current++);
          return [newAlert, ...prev.slice(0, compact ? 4 : 14)];
        });
      },
      compact ? 6000 : 8000,
    );
    return () => clearInterval(interval);
  }, [compact]);

  const TYPE_CONFIG = {
    transfer: { label: "TRANSFER", color: "#D4AF37", icon: "↔" },
    exchange_in: { label: "→ EXCHANGE", color: "#FF3B5C", icon: "⬇" },
    exchange_out: { label: "← EXCHANGE", color: "#00FF88", icon: "⬆" },
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {alerts.map((alert, i) => {
          const cfg = TYPE_CONFIG[alert.type];
          return (
            <div
              key={alert.id}
              data-ocid={`whale.item.${i + 1}`}
              className="flex items-center gap-2 text-[10px] font-mono"
            >
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              <span className="text-white font-bold">{alert.chain}</span>
              <span className="text-[#D4AF37]">{alert.usdValue}</span>
              <span className="text-gray-500 truncate">
                {alert.type === "exchange_in"
                  ? `→ ${alert.to}`
                  : alert.type === "exchange_out"
                    ? `← ${alert.from}`
                    : `${alert.from.slice(0, 8)}…`}
              </span>
              <span className="text-gray-600 ml-auto">{alert.time}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full ticker bar
  return (
    <div className="bg-[#050810] border-b border-[#1C2333] overflow-hidden relative h-8 flex items-center">
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 flex items-center px-3 bg-[#050810] border-r border-[#1C2333]">
        <span className="text-[#D4AF37] text-[10px] font-mono font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
          WHALE
        </span>
      </div>
      <div className="ml-20 overflow-hidden flex-1">
        <div className="flex items-center gap-6 animate-marquee whitespace-nowrap px-4">
          {[...alerts, ...alerts].map((alert, i) => {
            const cfg = TYPE_CONFIG[alert.type];
            return (
              <span
                key={`${alert.id}-${i}`}
                className="text-[10px] font-mono flex items-center gap-1.5"
              >
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <span className="text-white font-bold">{alert.chain}</span>
                <span style={{ color: cfg.color }}>{alert.usdValue}</span>
                <span className="text-gray-500">{cfg.label}</span>
                <span className="text-gray-600">{alert.time}</span>
                <span className="text-gray-700 mx-2">|</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
