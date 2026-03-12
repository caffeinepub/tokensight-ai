import { AlertTriangle, Zap } from "lucide-react";
import { motion } from "motion/react";

export function Header() {
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

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
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
      </div>
    </header>
  );
}
