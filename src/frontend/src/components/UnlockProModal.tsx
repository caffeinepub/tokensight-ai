import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  Copy,
  Loader2,
  Search,
  Star,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type WalletType, useICPWallet } from "../hooks/useICPWallet";
import type { ProTier } from "../hooks/usePremium";

const RECIPIENT_ACCOUNT_ID =
  "255275225e5f08f8c2ae0f0873dc36063f6fe23be44299a37896054a4f40351d";

// Treasury Principal ID for one-click payments and display
const TREASURY_PRINCIPAL =
  "sg5zb-fsg2l-xim4d-64w2p-lsqq3-6awgd-r7pzw-lekky-wzoyu-367qv-vae";

// Dynamic 5 USDT pricing
const USDT_TARGET = 5;

const BENEFITS = [
  { feature: "Active Signals", free: "1", pro: "15+" },
  { feature: "The Golden Sniper", free: false, pro: true },
  { feature: "Hidden Gems", free: false, pro: true },
  { feature: "Full TP Targets", free: false, pro: true },
  { feature: "Signal History", free: false, pro: true },
  { feature: "Social Intelligence", free: false, pro: true },
  { feature: "Whale Watcher", free: false, pro: true },
  { feature: "R:R Analysis", free: false, pro: true },
];

const DIRECT_PAY_WALLETS: WalletType[] = ["plug", "bitfinity"];

const WALLET_CONNECT_OPTIONS: {
  type: WalletType;
  label: string;
  icon: string;
  installUrl: string;
}[] = [
  {
    type: "nns",
    label: "Internet Identity",
    icon: "\uD83C\uDF10",
    installUrl: "https://nns.ic0.app/",
  },
  {
    type: "nfid",
    label: "NFID (Google Login)",
    icon: "\uD83D\uDD11",
    installUrl: "https://nfid.one/authenticate",
  },
  {
    type: "plug",
    label: "Plug",
    icon: "\uD83D\uDD0C",
    installUrl: "https://plugwallet.ooo/",
  },
  {
    type: "bitfinity",
    label: "Bitfinity",
    icon: "\u267E\uFE0F",
    installUrl: "https://wallet.bitfinity.network/",
  },
  {
    type: "stoic",
    label: "Stoic",
    icon: "\uD83E\uDDD8",
    installUrl: "https://www.stoicwallet.com/",
  },
];

type PayStep = "pay" | "paying" | "verifying" | "success";

interface Props {
  open: boolean;
  onClose: () => void;
  onUnlock: (tier: ProTier) => void;
}

export function UnlockProModal({ open, onClose, onUnlock }: Props) {
  const [icpUsd, setIcpUsd] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);
  const [step, setStep] = useState<PayStep>("pay");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { walletState, connectWallet, payWithWallet } = useICPWallet();

  // Dynamic ICP amount from live price
  const icpAmount = icpUsd ? USDT_TARGET / icpUsd : null;
  const getIcpE8s = (price: number | null) =>
    price ? Math.round((USDT_TARGET / price) * 1e8) : 50_000_000; // fallback ~0.5 ICP

  useEffect(() => {
    if (!open) return;
    setStep("pay");
    setErrorMsg(null);
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd",
    )
      .then((r) => r.json())
      .then((d) => setIcpUsd(d?.["internet-computer"]?.usd ?? null))
      .catch(() => setIcpUsd(null));
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(RECIPIENT_ACCOUNT_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(TREASURY_PRINCIPAL);
    setCopiedPrincipal(true);
    setTimeout(() => setCopiedPrincipal(false), 2000);
  };

  const canDirectPay =
    walletState.connected &&
    walletState.walletType !== null &&
    DIRECT_PAY_WALLETS.includes(walletState.walletType);

  const handleSubscribeNow = async () => {
    setStep("paying");
    setErrorMsg(null);
    try {
      await payWithWallet(TREASURY_PRINCIPAL, getIcpE8s(icpUsd));
      setStep("verifying");
      await new Promise((r) => setTimeout(r, 6000));
      onUnlock("monthly");
      setStep("success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      setStep("pay");
      setErrorMsg(msg);
    }
  };

  const handleCheckPayment = async () => {
    setStep("verifying");
    setErrorMsg(null);
    try {
      const response = await fetch(
        "https://rosetta-api.internetcomputer.org/search/transactions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            network_identifier: {
              blockchain: "Internet Computer",
              network: "00000000000000020101",
            },
            account_identifier: { address: RECIPIENT_ACCOUNT_ID },
            limit: 50,
          }),
        },
      );
      if (!response.ok) throw new Error("Ledger query failed");
      const data = (await response.json()) as {
        transactions?: Array<{
          transaction: {
            operations: Array<{
              account: { address: string };
              amount: { value: string };
            }>;
          };
        }>;
      };
      const minE8s = icpAmount
        ? Math.floor((icpAmount - 0.015) * 1e8)
        : 40_000_000;
      const found = data.transactions?.some((t) =>
        t.transaction.operations?.some(
          (op) =>
            op.amount?.value && Math.abs(Number(op.amount.value)) >= minE8s,
        ),
      );
      if (found) {
        onUnlock("monthly");
        setStep("success");
      } else {
        setStep("pay");
        setErrorMsg(
          "No matching payment found on the ICP Ledger. Please ensure you sent the exact amount to the Account ID shown, then try verifying again. For help, contact Telegram Support.",
        );
      }
    } catch {
      setStep("pay");
      setErrorMsg(
        "Could not reach the ICP Ledger. Please check your connection and try again.",
      );
    }
  };

  const handleClose = () => {
    if (step === "paying" || step === "verifying") return;
    onClose();
  };

  // QR code via free public API (no dependencies)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${RECIPIENT_ACCOUNT_ID}&color=D4AF37&bgcolor=0D1117`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-ocid="unlock_modal.dialog"
        className="max-w-lg border-[#1C2333] bg-[#0D1117] text-white max-h-[90vh] overflow-y-auto p-0"
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
            <DialogTitle className="text-[#D4AF37] font-mono text-lg flex items-center gap-2">
              <Star size={18} className="text-[#FFD700]" fill="#FFD700" />
              Unlock Pro Access
            </DialogTitle>
            <p className="text-gray-400 text-sm">
              Get full SMC signals, hidden gems, and social intelligence.
            </p>
          </DialogHeader>

          {step === "success" ? (
            <div
              data-ocid="unlock_modal.success_state"
              className="flex flex-col items-center justify-center gap-3 py-12"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#00FF8820", border: "2px solid #00FF88" }}
              >
                <Check size={28} className="text-[#00FF88]" />
              </div>
              <p className="text-[#00FF88] font-mono font-bold text-lg">
                PRO_MEMBER Access Activated!
              </p>
              <p className="text-gray-400 text-sm text-center">
                Welcome to TokenSight AI Pro. All signals and features are now
                fully unlocked.
              </p>
              <Button
                data-ocid="unlock_modal.close_button"
                onClick={onClose}
                className="mt-4 font-mono font-bold text-[#080B14] px-8"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #FFD700)",
                }}
              >
                Enter Dashboard
              </Button>
            </div>
          ) : step === "paying" || step === "verifying" ? (
            <div
              data-ocid="unlock_modal.loading_state"
              className="flex flex-col items-center justify-center gap-4 py-10 rounded-xl border my-4"
              style={{
                borderColor: "#D4AF37",
                background: "rgba(212,175,55,0.05)",
                boxShadow: "0 0 20px rgba(212,175,55,0.1)",
              }}
            >
              <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
              <div className="text-center">
                <p className="text-[#FFD700] font-mono text-base font-bold">
                  {step === "paying"
                    ? "Initiating Transfer..."
                    : "Confirming on ICP Ledger..."}
                </p>
                <p className="text-[#D4AF37]/60 font-mono text-xs mt-1">
                  {step === "paying"
                    ? "Approve the transaction in your wallet"
                    : `Querying ICP ledger for your ${icpAmount?.toFixed(4) ?? "~0.5"} ICP transfer`}
                </p>
              </div>
              <p className="text-gray-500 font-mono text-[10px] text-center max-w-xs">
                Do not close this window.
              </p>
            </div>
          ) : (
            <>
              {/* Subscription — dynamic 5 USDT/month */}
              <div
                className="rounded-xl p-4 mb-5 border-2 flex items-center justify-between"
                style={{
                  borderColor: "#D4AF37",
                  background: "rgba(212,175,55,0.08)",
                  boxShadow: "0 0 16px rgba(212,175,55,0.2)",
                }}
              >
                <div>
                  <p className="text-gray-400 text-xs font-mono mb-0.5">
                    MONTHLY SUBSCRIPTION
                  </p>
                  <p className="text-white font-bold text-2xl font-mono">
                    {icpAmount ? icpAmount.toFixed(4) : "..."} ICP
                    <span className="text-gray-500 text-xs font-normal ml-1">
                      /month
                    </span>
                  </p>
                  <p className="text-[#D4AF37] text-xs font-mono mt-0.5">
                    &#8776; $5 USDT
                  </p>
                  {icpUsd && (
                    <p className="text-gray-500 text-[10px] font-mono mt-0.5">
                      1 ICP = ${icpUsd.toFixed(2)}
                    </p>
                  )}
                </div>
                <Check size={14} className="text-[#D4AF37]" />
              </div>

              {/* Wallet Connect */}
              <div className="bg-[#080B14] rounded-xl border border-[#D4AF37]/30 p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet size={14} className="text-[#D4AF37]" />
                  <p className="text-[#D4AF37] text-xs font-mono font-bold">
                    {walletState.connected
                      ? "WALLET CONNECTED"
                      : "CONNECT WALLET TO PAY"}
                  </p>
                </div>
                {walletState.connected ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#00FF88]/10 border border-[#00FF88]/30">
                      <Check size={14} className="text-[#00FF88]" />
                      <span className="text-[#00FF88] text-xs font-mono">
                        {walletState.walletType?.toUpperCase()} connected
                        {walletState.balanceICP !== null
                          ? ` \u00b7 ${walletState.balanceICP.toFixed(3)} ICP`
                          : ""}
                      </span>
                    </div>
                    {canDirectPay && (
                      <p className="text-gray-500 text-[10px] font-mono text-center">
                        Ready for one-click {icpAmount?.toFixed(4) ?? "~0.5"}{" "}
                        ICP payment
                      </p>
                    )}
                    {!canDirectPay && (
                      <p className="text-[#FF9500] text-[10px] font-mono">
                        NNS/NFID/Stoic: use the manual payment method below.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {WALLET_CONNECT_OPTIONS.map((w) => (
                      <button
                        type="button"
                        key={w.type}
                        data-ocid={`unlock_modal.${w.type}_wallet_button`}
                        onClick={() => connectWallet(w.type)}
                        disabled={walletState.connecting}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1C2333] bg-[#0D1117] text-xs font-mono text-gray-300 hover:border-[#D4AF37]/40 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <span>{w.icon}</span>
                        <span>{w.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {walletState.connecting && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2
                      size={12}
                      className="animate-spin text-[#D4AF37]"
                    />
                    <span className="text-[#D4AF37] text-[10px] font-mono">
                      Connecting wallet...
                    </span>
                  </div>
                )}
                {walletState.error && (
                  <p className="text-[#FF9500] text-[10px] font-mono mt-2">
                    {walletState.error}
                  </p>
                )}
              </div>

              {/* Benefits table */}
              <div className="bg-[#080B14] rounded-xl border border-[#1C2333] overflow-hidden mb-4">
                <div className="grid grid-cols-3 px-3 py-2 border-b border-[#1C2333]">
                  <span className="text-gray-500 text-xs font-mono">
                    FEATURE
                  </span>
                  <span className="text-gray-500 text-xs font-mono text-center">
                    FREE
                  </span>
                  <span className="text-[#D4AF37] text-xs font-mono text-center">
                    PRO
                  </span>
                </div>
                {BENEFITS.map(({ feature, free, pro }) => (
                  <div
                    key={feature}
                    className="grid grid-cols-3 px-3 py-2 border-b border-[#1C2333]/50 last:border-0"
                  >
                    <span className="text-gray-300 text-xs">{feature}</span>
                    <div className="flex justify-center">
                      {typeof free === "boolean" ? (
                        free ? (
                          <Check size={12} className="text-[#00FF88]" />
                        ) : (
                          <X size={12} className="text-[#FF3B5C]" />
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">{free}</span>
                      )}
                    </div>
                    <div className="flex justify-center">
                      {typeof pro === "boolean" ? (
                        pro ? (
                          <Check size={12} className="text-[#00FF88]" />
                        ) : (
                          <X size={12} className="text-[#FF3B5C]" />
                        )
                      ) : (
                        <span className="text-[#D4AF37] text-xs font-bold">
                          {pro}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Manual ICP Payment */}
              <div className="bg-[#080B14] rounded-xl border border-[#1C2333] p-4 mb-4">
                <p className="text-[#D4AF37] text-xs font-mono font-bold mb-3">
                  SEND EXACTLY {icpAmount?.toFixed(4) ?? "~0.5"} ICP (~$5 USDT)
                  TO:
                </p>

                {/* Treasury Principal ID */}
                <div className="mb-3">
                  <p className="text-gray-500 text-[10px] font-mono mb-1">
                    TREASURY PRINCIPAL ID:
                  </p>
                  <div className="flex items-center gap-2 bg-[#0D1117] rounded-lg border border-[#1C2333] p-2">
                    <span
                      className="text-gray-300 text-[9px] font-mono flex-1"
                      style={{ wordBreak: "break-all" }}
                    >
                      {TREASURY_PRINCIPAL}
                    </span>
                    <button
                      type="button"
                      data-ocid="unlock_modal.copy_principal_button"
                      onClick={handleCopyPrincipal}
                      className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all"
                      style={{
                        background: copiedPrincipal ? "#00FF8820" : "#1C2333",
                        color: copiedPrincipal ? "#00FF88" : "#D4AF37",
                        border: `1px solid ${copiedPrincipal ? "#00FF88" : "#D4AF37"}40`,
                      }}
                    >
                      {copiedPrincipal ? (
                        <Check size={11} />
                      ) : (
                        <Copy size={11} />
                      )}
                      {copiedPrincipal ? "Copied!" : "COPY"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  {/* QR Code */}
                  <div
                    className="shrink-0 rounded-lg overflow-hidden border border-[#D4AF37]/30 p-1"
                    style={{ background: "#0D1117" }}
                  >
                    <img
                      src={qrUrl}
                      alt="Payment QR Code"
                      width={80}
                      height={80}
                      className="block"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  {/* Account ID */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-[10px] font-mono mb-1">
                      ACCOUNT ID (ICP Ledger):
                    </p>
                    <div className="flex items-center gap-2 bg-[#0D1117] rounded-lg border border-[#1C2333] p-2 mb-2">
                      <span
                        className="text-gray-300 text-[9px] font-mono flex-1"
                        style={{ wordBreak: "break-all" }}
                      >
                        {RECIPIENT_ACCOUNT_ID}
                      </span>
                      <button
                        type="button"
                        data-ocid="unlock_modal.copy_address_button"
                        onClick={handleCopy}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all"
                        style={{
                          background: copied ? "#00FF8820" : "#1C2333",
                          color: copied ? "#00FF88" : "#D4AF37",
                          border: `1px solid ${copied ? "#00FF88" : "#D4AF37"}40`,
                        }}
                      >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? "Copied!" : "COPY"}
                      </button>
                    </div>
                    <p className="text-gray-600 text-[9px] font-mono">
                      Send from NNS, NFID, or Stoic Wallet. Then click Check
                      Payment to confirm on the ICP Ledger.
                    </p>
                  </div>
                </div>
              </div>

              {/* Check Payment button (for non-direct-pay wallets) */}
              {!canDirectPay && walletState.connected && (
                <Button
                  data-ocid="unlock_modal.check_payment_button"
                  onClick={handleCheckPayment}
                  className="w-full font-mono font-bold text-[#080B14] h-10 text-sm gap-2 mb-4"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #FFD700)",
                  }}
                >
                  <Search size={14} />
                  Check Payment
                </Button>
              )}

              {/* Error message */}
              {errorMsg && (
                <div
                  data-ocid="unlock_modal.error_state"
                  className="bg-[#FF3B5C]/10 border border-[#FF3B5C]/40 rounded-lg p-3 mb-4 text-[#FF3B5C] text-xs font-mono"
                >
                  {errorMsg}
                </div>
              )}

              {/* Primary CTA */}
              {canDirectPay ? (
                <Button
                  data-ocid="unlock_modal.subscribe_button"
                  onClick={handleSubscribeNow}
                  className="w-full font-mono font-bold text-[#080B14] h-12 text-sm gap-2"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #FFD700)",
                  }}
                >
                  <Zap size={16} />
                  Subscribe &mdash; {icpAmount?.toFixed(4) ?? "~0.5"} ICP (~$5
                  USDT)
                </Button>
              ) : walletState.connected ? (
                <p className="text-gray-500 text-xs font-mono text-center">
                  Send {icpAmount?.toFixed(4) ?? "~0.5"} ICP to the Account ID
                  above, then verify with the button above.
                </p>
              ) : (
                <p className="text-gray-500 text-xs font-mono text-center">
                  Connect a wallet above for one-click payment, or send{" "}
                  {icpAmount?.toFixed(4) ?? "~0.5"} ICP to the Account ID above.
                </p>
              )}

              {/* Troubleshooting */}
              <div className="mt-4 pt-3 border-t border-[#1C2333] text-center space-y-1">
                <p className="text-gray-600 text-[10px] font-mono">
                  Trouble connecting? Try NFID (Google Login) or Disable Popup
                  Blockers.
                </p>
                <a
                  href="https://t.me/tokensightai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#D4AF37] text-[10px] font-mono hover:text-[#FFD700] transition-colors"
                >
                  Telegram Support
                </a>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
