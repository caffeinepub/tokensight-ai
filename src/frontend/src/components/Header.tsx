import { ChevronDown, LogOut, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type WalletType, useICPWallet } from "../hooks/useICPWallet";
import { usePremium } from "../hooks/usePremium";

interface Props {
  onUnlockPro: () => void;
}

function TsBoltIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-label="TokenSight AI logo"
    >
      <rect width="28" height="28" rx="6" fill="#D4AF37" />
      <text
        x="14"
        y="19"
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight="bold"
        fontSize="13"
        fill="#080B14"
      >
        TS
      </text>
      <polygon
        points="17,4 11,14 15,14 11,24 18,12 14,12"
        fill="#080B14"
        opacity="0.6"
      />
    </svg>
  );
}

const WALLET_OPTIONS: {
  type: WalletType;
  label: string;
  icon: string;
  hint: string;
}[] = [
  {
    type: "nns",
    label: "Internet Identity",
    icon: "🌐",
    hint: "NNS / IC native",
  },
  { type: "plug", label: "Plug", icon: "🔌", hint: "Browser extension" },
  {
    type: "bitfinity",
    label: "Bitfinity",
    icon: "♾️",
    hint: "Browser extension",
  },
  { type: "stoic", label: "Stoic", icon: "🧘", hint: "Web wallet" },
  { type: "nfid", label: "NFID", icon: "🪪", hint: "Internet Identity" },
];

export function Header({ onUnlockPro }: Props) {
  const { isPro, daysRemaining } = usePremium();
  const { walletState, connectWallet, disconnect } = useICPWallet();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showWalletMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowWalletMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showWalletMenu]);

  const handleConnect = async (type: WalletType) => {
    setShowWalletMenu(false);
    await connectWallet(type);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#1C2333] bg-[#080B14]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 md:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <TsBoltIcon />
          <div className="hidden sm:block">
            <span
              className="font-mono font-bold text-sm tracking-widest"
              style={{
                background: "linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              TokenSight AI
            </span>
            <span className="text-[#00D4FF] text-[9px] font-mono ml-2 hidden md:inline">
              PRO EDITION
            </span>
          </div>
          <span className="sm:hidden font-mono font-bold text-xs text-[#D4AF37]">
            TokenSight AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPro && (
            <div
              data-ocid="header.pro_badge"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold"
              style={{
                background: "#00FF8820",
                border: "1px solid #00FF8860",
                color: "#00FF88",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              PRO {daysRemaining && `• ${daysRemaining}d left`}
            </div>
          )}
          {!isPro && (
            <button
              type="button"
              data-ocid="header.unlock_pro_button"
              onClick={onUnlockPro}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #FFD700)",
                color: "#080B14",
              }}
            >
              ⚡ Unlock Pro
            </button>
          )}

          <div className="relative" ref={menuRef}>
            {walletState.connected ? (
              <div className="flex items-center gap-1.5">
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1C2333] bg-[#0D1117] text-xs font-mono">
                  <Wallet size={11} className="text-[#D4AF37]" />
                  <span className="text-gray-300">
                    {walletState.balanceICP !== null
                      ? `${walletState.balanceICP.toFixed(3)} ICP`
                      : "Connected"}
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid="header.disconnect_wallet_button"
                  onClick={disconnect}
                  className="p-1.5 rounded-lg border border-[#1C2333] bg-[#0D1117] hover:border-[#FF3B5C]/40 transition-colors"
                  title="Disconnect wallet"
                >
                  <LogOut
                    size={12}
                    className="text-gray-400 hover:text-[#FF3B5C]"
                  />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  data-ocid="header.connect_wallet_button"
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1C2333] bg-[#0D1117] text-xs font-mono hover:border-[#D4AF37]/40 transition-colors"
                >
                  <Wallet size={11} className="text-[#D4AF37]" />
                  <span className="text-gray-300 hidden sm:inline">
                    Connect
                  </span>
                  <ChevronDown size={10} className="text-gray-500" />
                </button>
                {showWalletMenu && (
                  <div
                    data-ocid="header.wallet_dropdown_menu"
                    className="absolute right-0 top-full mt-1 bg-[#0D1117] border border-[#1C2333] rounded-lg shadow-xl z-50 min-w-[200px]"
                  >
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-mono text-gray-600 uppercase tracking-wider border-b border-[#1C2333]">
                      Select Wallet
                    </p>
                    {WALLET_OPTIONS.map((w, idx) => (
                      <button
                        type="button"
                        key={w.type}
                        data-ocid={`header.${w.type}_wallet_button`}
                        onClick={() => handleConnect(w.type)}
                        className={`w-full text-left px-3 py-2.5 text-xs font-mono text-gray-300 hover:bg-[#1C2333] hover:text-white transition-colors flex items-center gap-2.5 ${
                          idx === WALLET_OPTIONS.length - 1
                            ? "rounded-b-lg"
                            : ""
                        }`}
                      >
                        <span className="text-base">{w.icon}</span>
                        <div className="flex-1">
                          <p className="text-white text-xs font-medium">
                            {w.label}
                          </p>
                          <p className="text-gray-600 text-[10px]">{w.hint}</p>
                        </div>
                        <span className="text-[10px] text-gray-600">→</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {walletState.error && !walletState.connected && (
        <div className="bg-[#0D1117] border-t border-[#FF3B5C]/20 px-4 py-1.5">
          <p className="text-[#FF3B5C] text-[11px] font-mono text-center">
            {walletState.error}
          </p>
        </div>
      )}
    </header>
  );
}
