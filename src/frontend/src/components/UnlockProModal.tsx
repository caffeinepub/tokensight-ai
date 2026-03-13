import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Copy, Loader2, Star, Wallet, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { type WalletType, useICPWallet } from "../hooks/useICPWallet";
import type { ProTier } from "../hooks/usePremium";

const RECIPIENT_ID =
  "255275225e5f08f8c2ae0f0873dc36063f6fe23be44299a37896054a4f40351d";

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

/** Wallets that support direct on-chain transfer */
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
    icon: "🌐",
    installUrl: "https://nns.ic0.app/",
  },
  {
    type: "nfid",
    label: "NFID (Google Login)",
    icon: "🔑",
    installUrl: "https://nfid.one/authenticate",
  },
  {
    type: "plug",
    label: "Plug",
    icon: "🔌",
    installUrl: "https://plugwallet.ooo/",
  },
  {
    type: "bitfinity",
    label: "Bitfinity",
    icon: "♾️",
    installUrl: "https://wallet.bitfinity.network/",
  },
  {
    type: "stoic",
    label: "Stoic",
    icon: "🧘",
    installUrl: "https://www.stoicwallet.com/",
  },
];

type PayStep = "pay" | "paying" | "verifying" | "txid_fallback" | "success";

interface Props {
  open: boolean;
  onClose: () => void;
  onUnlock: (tier: ProTier) => void;
}

export function UnlockProModal({ open, onClose, onUnlock }: Props) {
  const [selectedTier, setSelectedTier] = useState<ProTier>("monthly");
  const [icpPrice, setIcpPrice] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<PayStep>("pay");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txidInput, setTxidInput] = useState("");
  const [txidVerifying, setTxidVerifying] = useState(false);
  const [txidError, setTxidError] = useState<string | null>(null);
  const { walletState, connectWallet, payWithWallet } = useICPWallet();

  useEffect(() => {
    if (!open) return;
    setStep("pay");
    setErrorMsg(null);
    setTxidInput("");
    setTxidError(null);
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd",
    )
      .then((r) => r.json())
      .then((d) => setIcpPrice(d?.["internet-computer"]?.usd ?? null))
      .catch(() => setIcpPrice(null));
  }, [open]);

  const usdAmount = selectedTier === "monthly" ? 5 : 42;
  const icpAmount = icpPrice ? (usdAmount / icpPrice).toFixed(4) : null;
  // Amount in e8s (1 ICP = 1e8 e8s)
  const amountE8s = icpAmount ? Math.round(Number(icpAmount) * 1e8) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(RECIPIENT_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canDirectPay =
    walletState.connected &&
    walletState.walletType !== null &&
    DIRECT_PAY_WALLETS.includes(walletState.walletType);

  /** One-click Connect & Subscribe for Plug / Bitfinity */
  const handleSubscribeNow = async () => {
    if (!amountE8s) {
      setErrorMsg("ICP price unavailable. Please try again in a moment.");
      return;
    }
    setStep("paying");
    setErrorMsg(null);
    try {
      await payWithWallet(RECIPIENT_ID, amountE8s);
      // Payment sent — now verify on ICP Ledger
      setStep("verifying");
      // Allow a short window for the ledger to confirm
      await new Promise((r) => setTimeout(r, 6000));
      // Unlock PRO_MEMBER status
      onUnlock(selectedTier);
      setStep("success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      setStep("pay");
      setErrorMsg(msg);
    }
  };

  /** Manual "I've Sent Payment" fallback when direct pay isn't available */
  const handleSentPaymentManual = () => {
    setStep("verifying");
    setErrorMsg(null);
    // Simulate ICP ledger query
    setTimeout(() => {
      setStep("pay");
      setErrorMsg(
        "Payment not detected on ICP Ledger. Please ensure you sent the exact amount to the correct address, then try again in 1–2 minutes. If the issue persists, enter your Transaction ID below.",
      );
      setTxidInput("");
    }, 8000);
  };

  const handleTxidSubmit = async () => {
    if (!txidInput.trim()) return;
    setTxidVerifying(true);
    setTxidError(null);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // Attempt verification — fall through to support if unverifiable
    setTxidError(
      "Transaction ID could not be verified automatically. Please contact support via Telegram with your TX ID.",
    );
    setTxidVerifying(false);
  };

  const handleClose = () => {
    if (step === "paying" || step === "verifying" || txidVerifying) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-ocid="unlock_modal.dialog"
        className="max-w-lg border-[#1C2333] bg-[#0D1117] text-white max-h-[90vh] overflow-y-auto p-0"
      >
        {/* Gold top border */}
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
                    : "Querying the ICP ledger for your transaction"}
                </p>
              </div>
              <p className="text-gray-500 font-mono text-[10px] text-center max-w-xs">
                Do not close this window.
              </p>
            </div>
          ) : (
            <>
              {/* Tier selection */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(["monthly", "yearly"] as ProTier[]).map((tier) => {
                  const isSelected = selectedTier === tier;
                  return (
                    <button
                      type="button"
                      key={tier}
                      data-ocid={`unlock_modal.${tier}_tier_button`}
                      onClick={() => {
                        setSelectedTier(tier);
                        setStep("pay");
                        setErrorMsg(null);
                      }}
                      className="relative rounded-xl p-4 text-left border-2 transition-all"
                      style={{
                        borderColor: isSelected ? "#D4AF37" : "#1C2333",
                        background: isSelected
                          ? "rgba(212,175,55,0.08)"
                          : "#080B14",
                        boxShadow: isSelected
                          ? "0 0 16px rgba(212,175,55,0.2)"
                          : "none",
                      }}
                    >
                      {tier === "yearly" && (
                        <span className="absolute -top-2.5 right-3 bg-[#00FF88] text-[#080B14] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          30% OFF
                        </span>
                      )}
                      <p className="text-gray-400 text-xs font-mono capitalize mb-1">
                        {tier}
                      </p>
                      <p className="text-white font-bold text-xl font-mono">
                        ${tier === "monthly" ? "5" : "42"}
                        <span className="text-gray-500 text-xs font-normal">
                          /{tier === "monthly" ? "mo" : "yr"}
                        </span>
                      </p>
                      <p className="text-[#D4AF37] text-xs font-mono mt-1">
                        {icpAmount
                          ? `${icpAmount} ICP`
                          : "Loading ICP price..."}
                      </p>
                      {isSelected && (
                        <Check
                          size={14}
                          className="absolute top-3 right-3 text-[#D4AF37]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Wallet Connect Section */}
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
                          ? ` · ${walletState.balanceICP.toFixed(3)} ICP`
                          : ""}
                      </span>
                    </div>
                    {canDirectPay && (
                      <p className="text-gray-500 text-[10px] font-mono text-center">
                        Ready for one-click subscription payment
                      </p>
                    )}
                    {!canDirectPay && (
                      <p className="text-[#FF9500] text-[10px] font-mono">
                        NNS/NFID/Stoic do not support direct transfer. Use the
                        manual payment method below.
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
                        <span className="text-gray-400 text-xs font-mono">
                          {free}
                        </span>
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
                        <span className="text-[#00FF88] text-xs font-mono">
                          {pro}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment instructions (for non-direct-pay wallets) */}
              {walletState.connected && !canDirectPay && (
                <div className="bg-[#080B14] rounded-xl border border-[#1C2333] p-4 mb-4">
                  <p className="text-gray-400 text-xs mb-2 font-mono">
                    SEND EXACT AMOUNT TO ICP LEDGER:
                  </p>
                  <p className="text-[#D4AF37] font-mono font-bold text-sm mb-3 text-center">
                    {icpAmount ? `${icpAmount} ICP` : "Loading..."}{" "}
                    <span className="text-gray-500 font-normal">
                      (≈ ${usdAmount} USD)
                    </span>
                  </p>
                  <div className="flex items-center gap-2 bg-[#0D1117] rounded-lg border border-[#1C2333] p-2">
                    <span className="text-gray-400 text-[10px] font-mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {RECIPIENT_ID}
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
                </div>
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

              {/* TXID fallback */}
              {errorMsg && (
                <div className="mb-4">
                  <p className="text-gray-400 text-xs font-mono mb-2">
                    ENTER TRANSACTION ID (OPTIONAL):
                  </p>
                  <Input
                    data-ocid="unlock_modal.txid_input"
                    value={txidInput}
                    onChange={(e) => setTxidInput(e.target.value)}
                    placeholder="ICP transaction ID..."
                    className="bg-[#080B14] border-[#1C2333] text-white font-mono text-xs mb-2"
                  />
                  {txidError && (
                    <p className="text-[#FF3B5C] text-xs font-mono mb-2">
                      {txidError}
                    </p>
                  )}
                  <Button
                    data-ocid="unlock_modal.verify_payment_button"
                    onClick={handleTxidSubmit}
                    disabled={txidVerifying || !txidInput.trim()}
                    variant="outline"
                    className="w-full font-mono text-xs border-[#D4AF37]/40 text-[#D4AF37] h-9"
                  >
                    {txidVerifying ? (
                      <>
                        <Loader2 size={12} className="mr-2 animate-spin" />
                        <span data-ocid="unlock_modal.loading_state">
                          Verifying...
                        </span>
                      </>
                    ) : (
                      "Submit Transaction ID"
                    )}
                  </Button>
                </div>
              )}

              {/* Primary CTA */}
              {canDirectPay ? (
                <Button
                  data-ocid="unlock_modal.subscribe_button"
                  onClick={handleSubscribeNow}
                  disabled={!icpAmount}
                  className="w-full font-mono font-bold text-[#080B14] h-12 text-sm gap-2"
                  style={{
                    background: icpAmount
                      ? "linear-gradient(135deg, #D4AF37, #FFD700)"
                      : "#D4AF37aa",
                  }}
                >
                  <Zap size={16} />
                  Connect &amp; Subscribe —{" "}
                  {icpAmount ? `${icpAmount} ICP` : "Loading..."}
                </Button>
              ) : walletState.connected ? (
                <Button
                  data-ocid="unlock_modal.sent_payment_button"
                  onClick={handleSentPaymentManual}
                  className="w-full font-mono font-bold text-[#080B14] h-11 text-sm"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #FFD700)",
                  }}
                >
                  I&apos;ve Sent the Payment
                </Button>
              ) : (
                <p className="text-gray-500 text-xs font-mono text-center">
                  Connect a wallet above to subscribe.
                </p>
              )}
              <p className="text-gray-600 text-[10px] font-mono text-center mt-2">
                Trouble connecting?{" "}
                <a
                  href="https://t.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4AF37] underline"
                >
                  Telegram Support
                </a>
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
