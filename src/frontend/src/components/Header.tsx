import { AlertTriangle, Crown, Zap } from "lucide-react";
import { motion } from "motion/react";

interface HeaderProps {
  isPremium?: boolean;
  onUnlockPro?: () => void;
}

export function Header({ isPremium = false, onUnlockPro }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-2xl"
      style={{ background: "rgba(10,10,26,0.85)" }}
    >
      {/* Disclaimer Banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-center gap-2 text-xs text-yellow-300/80">
        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
        <span>
          AI predictions are for information only, not financial advice. DYOR.
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2">
            <Zap
              className="h-5 w-5 animate-pulse"
              style={{ color: "#00D4FF" }}
            />
            <span
              className="text-lg sm:text-xl font-bold tracking-tight neon-blue-glow"
              style={{ color: "#00D4FF" }}
            >
              Tokensight AI
            </span>
          </div>
          <span className="text-xs text-white/40 ml-7">
            Your AI Lens into the Crypto Future
          </span>
        </motion.div>

        {/* Pro button / badge */}
        {isPremium ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(185,242,255,0.1))",
              border: "1px solid rgba(255,215,0,0.4)",
              color: "#FFD700",
            }}
          >
            <Crown className="h-3.5 w-3.5" />
            PRO
          </motion.div>
        ) : (
          <motion.button
            type="button"
            data-ocid="header.unlock_button"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onUnlockPro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-black transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #FFD700, #FFA500)",
              boxShadow: "0 0 15px rgba(255,215,0,0.3)",
            }}
          >
            <Crown className="h-3.5 w-3.5" />
            Unlock Pro
          </motion.button>
        )}
      </div>
    </header>
  );
}
