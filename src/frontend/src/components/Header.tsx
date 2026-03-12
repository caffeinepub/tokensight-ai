import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogOut, RefreshCw, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
    label: "Internet Identity (NNS)",
    icon: "\uD83C\uDF10",
    hint: "IC native \u2014 secure & anonymous",
  },
  {
    type: "nfid",
    label: "NFID (Google Login)",
    icon: "\uD83E\uDEAA",
    hint: "Sign in with Google via NFID",
  },
  {
    type: "plug",
    label: "Plug Wallet",
    icon: "\uD83D\uDD0C",
    hint: "Browser extension wallet",
  },
  {
    type: "stoic",
    label: "Stoic Wallet",
    icon: "\uD83E\uDDD8",
    hint: "Web-based ICP wallet",
  },
  {
    type: "bitfinity",
    label: "Bitfinity Wallet",
    icon: "\u267E\uFE0F",
    hint: "Browser extension wallet",
  },
];

export function Header({ onUnlockPro }: Props) {
  const { isPro, daysRemaining } = usePremium();
  const {
    walletState,
    connectWallet,
    connectManualPrincipal,
    forceLoginCheck,
    disconnect,
  } = useICPWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [manualPrincipal, setManualPrincipal] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [forceCheckLoading, setForceCheckLoading] = useState(false);

  const handleConnect = async (type: WalletType) => {
    setShowWalletModal(false);
    await connectWallet(type);
  };

  const handleManualSubmit = () => {
    if (manualPrincipal.trim()) {
      connectManualPrincipal(manualPrincipal.trim());
      setManualPrincipal("");
      setShowManualEntry(false);
      setShowWalletModal(false);
    }
  };

  const handleForceLogin = async () => {
    setForceCheckLoading(true);
    const success = await forceLoginCheck();
    setForceCheckLoading(false);
    if (success) {
      setShowWalletModal(false);
      toast.success("Login restored", {
        description: "Your wallet session has been recovered.",
        duration: 4000,
      });
    } else {
      toast.error("No active session found", {
        description: "Please select a wallet above to start the login flow.",
        duration: 4000,
      });
    }
  };

  const walletLabel =
    walletState.walletType === "nns"
      ? "Internet Identity"
      : walletState.walletType === "nfid"
        ? "NFID"
        : walletState.walletType === "plug"
          ? "Plug"
          : walletState.walletType === "stoic"
            ? "Stoic"
            : walletState.walletType === "bitfinity"
              ? "Bitfinity"
              : "Connected";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#1C2333] bg-[#080B14]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <TsBoltIcon />
            <div className="hidden sm:block">
              <span
                className="font-mono font-bold text-sm tracking-widest"
                style={{
                  background:
                    "linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)",
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
                PRO {daysRemaining && `\u2022 ${daysRemaining}d left`}
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
                \u26A1 Unlock Pro
              </button>
            )}

            {walletState.connected ? (
              <div className="flex items-center gap-1.5">
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1C2333] bg-[#0D1117] text-xs font-mono">
                  <Wallet size={11} className="text-[#D4AF37]" />
                  <span className="text-gray-300">
                    {walletState.balanceICP !== null
                      ? `${walletState.balanceICP.toFixed(3)} ICP`
                      : walletLabel}
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid="header.disconnect_wallet_button"
                  onClick={() => void disconnect()}
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
              <button
                type="button"
                data-ocid="header.connect_wallet_button"
                onClick={() => setShowWalletModal(true)}
                disabled={walletState.connecting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1C2333] bg-[#0D1117] text-xs font-mono hover:border-[#D4AF37]/40 transition-colors disabled:opacity-60"
              >
                <Wallet size={11} className="text-[#D4AF37]" />
                <span className="text-gray-300 hidden sm:inline">
                  {walletState.connecting ? "Connecting..." : "Connect Wallet"}
                </span>
              </button>
            )}
          </div>
        </div>

        {walletState.error &&
          !walletState.connected &&
          !walletState.popupBlocked && (
            <div className="bg-[#0D1117] border-t border-[#FF3B5C]/20 px-4 py-1.5">
              <p className="text-[#FF3B5C] text-[11px] font-mono text-center">
                {walletState.error}
              </p>
            </div>
          )}
      </header>

      {/* Wallet Selection Modal */}
      <Dialog
        open={showWalletModal}
        onOpenChange={(o) => {
          setShowWalletModal(o);
          if (!o) setShowManualEntry(false);
        }}
      >
        <DialogContent
          data-ocid="wallet_modal.dialog"
          className="max-w-sm border-[#1C2333] bg-[#0D1117] text-white p-0"
        >
          <div
            className="h-0.5 w-full shrink-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, #D4AF37, #FFD700, #D4AF37, transparent)",
            }}
          />
          <div className="p-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[#D4AF37] font-mono text-base flex items-center gap-2">
                <Wallet size={16} className="text-[#FFD700]" />
                Connect Wallet
              </DialogTitle>
              <p className="text-gray-500 text-xs font-mono">
                Choose your wallet to connect to TokenSight AI
              </p>
            </DialogHeader>

            {showManualEntry ? (
              <div>
                <p className="text-gray-400 text-xs font-mono mb-1">
                  Enter your Principal ID manually:
                </p>
                <p className="text-gray-600 text-[10px] font-mono mb-3">
                  For admin or pro users who cannot use the redirect flow.
                </p>
                <input
                  data-ocid="wallet_modal.manual_principal_input"
                  type="text"
                  value={manualPrincipal}
                  onChange={(e) => setManualPrincipal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                  className="w-full bg-[#080B14] border border-[#1C2333] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/60 mb-3"
                />
                <button
                  type="button"
                  data-ocid="wallet_modal.submit_principal_button"
                  onClick={handleManualSubmit}
                  disabled={!manualPrincipal.trim()}
                  className="w-full py-2.5 rounded-xl font-mono font-bold text-sm transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #FFD700)",
                    color: "#080B14",
                  }}
                >
                  Connect with Principal ID
                </button>
                <button
                  type="button"
                  className="w-full mt-2 text-xs text-gray-500 font-mono hover:text-gray-300 transition-colors"
                  onClick={() => setShowManualEntry(false)}
                >
                  \u2190 Back to wallet options
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {WALLET_OPTIONS.map((w) => (
                    <button
                      type="button"
                      key={w.type}
                      data-ocid={`wallet_modal.${w.type}_button`}
                      onClick={() => void handleConnect(w.type)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#1C2333] bg-[#080B14] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all text-left group"
                    >
                      <span className="text-2xl">{w.icon}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-mono font-medium group-hover:text-[#FFD700] transition-colors">
                          {w.label}
                        </p>
                        <p className="text-gray-600 text-[11px] font-mono mt-0.5">
                          {w.hint}
                        </p>
                      </div>
                      <span className="text-gray-600 group-hover:text-[#D4AF37] transition-colors text-sm">
                        \u2192
                      </span>
                    </button>
                  ))}
                </div>

                {/* Force Login — backup for when automatic return doesn't trigger */}
                <div className="mt-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2.5">
                  <p className="text-[#D4AF37] text-[10px] font-mono mb-2">
                    Already logged in on the provider site but not redirected
                    back?
                  </p>
                  <button
                    type="button"
                    data-ocid="wallet_modal.force_login_button"
                    onClick={() => void handleForceLogin()}
                    disabled={forceCheckLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] font-mono font-bold text-xs hover:bg-[#D4AF37]/10 transition-all disabled:opacity-60"
                  >
                    {forceCheckLoading ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
                        Checking session...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={11} />
                        Refresh & Sync Identity
                      </>
                    )}
                  </button>
                </div>

                {/* Trouble connecting hint */}
                <div className="mt-3 rounded-xl border border-[#FF9500]/20 bg-[#FF9500]/5 px-3 py-2.5">
                  <p className="text-[#FF9500] text-[11px] font-mono">
                    <strong>Trouble connecting?</strong> Try NFID (Google Login)
                    or disable popup blockers in your browser settings.
                  </p>
                </div>

                {/* Manual entry + Telegram */}
                <div className="flex items-center justify-between mt-3 gap-2">
                  <button
                    type="button"
                    data-ocid="wallet_modal.manual_entry_button"
                    onClick={() => setShowManualEntry(true)}
                    className="text-[10px] text-gray-600 font-mono hover:text-gray-400 transition-colors underline"
                  >
                    Enter Principal ID manually
                  </button>
                  <a
                    data-ocid="wallet_modal.telegram_support_link"
                    href="https://t.me/TokenSightAI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#00D4FF] text-[11px] font-mono font-bold hover:text-[#00AAFF] transition-colors"
                  >
                    <span>\u2708\uFE0F</span> Telegram Support
                  </a>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
