import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Crown,
  Loader2,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const RECIPIENT_ADDRESS =
  "255275225e5f08f8c2ae0f0873dc36063f6fe23be44299a37896054a4f40351d";
const USDT_PRICE = 5;

interface UnlockProModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  icpPrice: number;
  unlockNow: () => void;
}

export function UnlockProModal({
  open,
  onClose,
  onSuccess,
  icpPrice: icpPriceProp,
  unlockNow,
}: UnlockProModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [liveIcpPrice, setLiveIcpPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const icpPrice = liveIcpPrice ?? icpPriceProp;
  const icpAmount = (USDT_PRICE / icpPrice).toFixed(4);

  useEffect(() => {
    if (!open) return;
    setFetchingPrice(true);
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd",
    )
      .then((r) => r.json())
      .then((data) => {
        const price = data?.["internet-computer"]?.usd;
        if (price && typeof price === "number") setLiveIcpPrice(price);
      })
      .catch(() => {})
      .finally(() => setFetchingPrice(false));
  }, [open]);

  const handleClose = () => {
    if (confirming) return; // prevent close during spinner
    onClose();
    setTimeout(() => {
      setConfirming(false);
      setUnlocked(false);
      setCopied(false);
      setCountdown(5);
    }, 300);
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(RECIPIENT_ADDRESS)
      .then(() => {
        setCopied(true);
        toast.success("Address copied!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Copy failed — please copy manually"));
  };

  const handlePaymentSent = () => {
    setConfirming(true);
    setCountdown(5);

    let remaining = 5;
    const timer = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        unlockNow();
        setConfirming(false);
        setUnlocked(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2200);
      }
    }, 1000);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[60]"
            style={{
              background: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(10px)",
            }}
          />

          {/* Modal */}
          <motion.div
            data-ocid="unlock-pro.modal"
            initial={{ opacity: 0, scale: 0.94, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 28 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="fixed inset-x-4 top-8 bottom-8 z-[61] max-w-md mx-auto overflow-hidden flex flex-col"
            style={{
              background: "#0B0E11",
              border: "1px solid rgba(24,144,255,0.25)",
              borderRadius: "1rem",
              boxShadow:
                "0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(24,144,255,0.08)",
            }}
          >
            {/* Top accent bar */}
            <div
              className="h-0.5 flex-shrink-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #1890FF, #F0B90B, #1890FF, transparent)",
              }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(240,185,11,0.15)",
                    border: "1px solid rgba(240,185,11,0.35)",
                  }}
                >
                  <Crown className="h-4 w-4" style={{ color: "#F0B90B" }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Checkout</p>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Secure ICP Payment
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-ocid="unlock-pro.close_button"
                onClick={handleClose}
                disabled={confirming}
                className="p-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-40"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
              {unlocked ? (
                /* Success State */
                <motion.div
                  data-ocid="unlock-pro.success_state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(0,200,83,0.15)",
                      border: "2px solid #00C853",
                      boxShadow: "0 0 30px rgba(0,200,83,0.35)",
                    }}
                  >
                    <CheckCircle
                      className="h-10 w-10"
                      style={{ color: "#00C853" }}
                    />
                  </motion.div>
                  <div>
                    <p className="text-xl font-bold text-white">
                      Pro Access Unlocked!
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      Welcome to Tokensight AI Pro
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full"
                    style={{
                      background: "rgba(240,185,11,0.12)",
                      border: "1px solid rgba(240,185,11,0.3)",
                    }}
                  >
                    <Crown
                      className="h-3.5 w-3.5"
                      style={{ color: "#F0B90B" }}
                    />
                    <span
                      className="text-xs font-bold"
                      style={{ color: "#F0B90B" }}
                    >
                      Lifetime Pro Access
                    </span>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* ── ORDER SUMMARY ── */}
                  <section
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#1E2026",
                    }}
                  >
                    <div
                      className="px-4 py-3"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <p className="text-sm font-bold text-white">
                        Order Summary
                      </p>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown
                            className="h-3.5 w-3.5"
                            style={{ color: "#F0B90B" }}
                          />
                          <span className="text-sm font-semibold text-white">
                            Tokensight AI Pro
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: "#F0B90B" }}
                        >
                          $5.00
                        </span>
                      </div>
                      <div
                        style={{
                          height: "1px",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                          >
                            Access Type
                          </span>
                          <span className="text-xs font-medium text-white">
                            Lifetime Pro
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                          >
                            Network
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-white">
                              Internet Computer (ICP)
                            </span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-bold"
                              style={{
                                background: "rgba(24,144,255,0.2)",
                                color: "#1890FF",
                                border: "1px solid rgba(24,144,255,0.4)",
                              }}
                            >
                              ✓ Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── WALLET BOX ── */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap
                        className="h-3.5 w-3.5"
                        style={{ color: "#1890FF" }}
                      />
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#1890FF" }}
                      >
                        Pay with Internet Computer (ICP)
                      </p>
                    </div>

                    {/* Address box */}
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: "#1E2026",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <div
                        className="px-3 py-2 flex items-center justify-between gap-2"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <span
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          Recipient Account ID
                        </span>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "#00C853" }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                          >
                            ICP Mainnet
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-3 flex items-start gap-2">
                        <p
                          className="flex-1 font-mono text-xs leading-relaxed break-all"
                          style={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          {RECIPIENT_ADDRESS}
                        </p>
                        <button
                          type="button"
                          data-ocid="unlock-pro.copy_button"
                          onClick={handleCopy}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: copied ? "#00C853" : "#F0B90B",
                            color: copied ? "#fff" : "#000",
                            border: "none",
                            minWidth: "72px",
                            justifyContent: "center",
                          }}
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="h-3 w-3" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> COPY
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ICP Amount */}
                    <div
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{
                        background: "rgba(24,144,255,0.07)",
                        border: "1px solid rgba(24,144,255,0.2)",
                      }}
                    >
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.45)" }}
                        >
                          Send exactly
                        </p>
                        <p
                          className="text-xl font-bold font-mono"
                          style={{ color: "#F0B90B" }}
                        >
                          {icpAmount} <span className="text-sm">ICP</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {fetchingPrice ? (
                            <Loader2
                              className="h-3 w-3 animate-spin"
                              style={{ color: "#1890FF" }}
                            />
                          ) : (
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{
                                background: liveIcpPrice
                                  ? "#00C853"
                                  : "#FFD700",
                              }}
                            />
                          )}
                          <span
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                          >
                            {liveIcpPrice ? "Live" : "Est."}
                          </span>
                        </div>
                        <p
                          className="text-sm font-mono"
                          style={{ color: "rgba(255,255,255,0.55)" }}
                        >
                          ICP ≈ ${icpPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Network warning */}
                    <div
                      className="flex items-start gap-2.5 px-3 py-3 rounded-xl"
                      style={{
                        background: "rgba(255,60,60,0.08)",
                        border: "1px solid rgba(255,60,60,0.25)",
                      }}
                    >
                      <AlertTriangle
                        className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"
                        style={{ color: "#FF6B6B" }}
                      />
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "rgba(255,180,100,0.9)" }}
                      >
                        <strong>Only send ICP</strong> on the Internet Computer
                        network. Do <strong>NOT</strong> use ERC-20 or BEP-20 —
                        funds will be lost.
                      </p>
                    </div>
                  </section>

                  {/* ── I HAVE SENT THE PAYMENT BUTTON ── */}
                  <button
                    type="button"
                    data-ocid="unlock-pro.payment_sent.primary_button"
                    onClick={handlePaymentSent}
                    disabled={confirming}
                    className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2.5"
                    style={{
                      background: confirming
                        ? "rgba(240,185,11,0.6)"
                        : "#F0B90B",
                      color: "#000",
                      border: "none",
                      cursor: confirming ? "not-allowed" : "pointer",
                      boxShadow: confirming
                        ? "none"
                        : "0 4px 20px rgba(240,185,11,0.4)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {confirming ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Verifying on Blockchain... ({countdown}s)</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-5 w-5" />
                        <span>I HAVE SENT THE PAYMENT</span>
                      </>
                    )}
                  </button>

                  {/* How-to guide */}
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div
                      className="px-4 py-2.5"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        How to pay
                      </p>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {[
                        "Copy the Account ID above",
                        "Open your ICP wallet (NFID, Plug, Bitfinity, any exchange)",
                        `Send exactly ${icpAmount} ICP to that address`,
                        "Once sent, click the button above to unlock Pro instantly",
                      ].map((step, i) => (
                        <div key={step} className="flex items-start gap-2.5">
                          <span
                            className="flex-shrink-0 w-4 h-4 rounded-full text-center text-xs font-bold leading-4"
                            style={{
                              background: "rgba(24,144,255,0.2)",
                              color: "#1890FF",
                            }}
                          >
                            {i + 1}
                          </span>
                          <p
                            className="text-xs leading-relaxed"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
