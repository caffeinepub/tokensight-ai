import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Star, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AccuracyTab } from "./components/AccuracyTab";
import { DashboardTab } from "./components/DashboardTab";
import { Header } from "./components/Header";
import { WatchlistTab } from "./components/WatchlistTab";

type Tab = "dashboard" | "watchlist" | "accuracy";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "watchlist", label: "Watchlist", icon: Star },
  { id: "accuracy", label: "Accuracy", icon: TrendingUp },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen" style={{ background: "#0A0A1A" }}>
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #00D4FF 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <Header />

      {/* Tab navigation */}
      <nav
        className="sticky top-[72px] z-40 border-b border-white/8"
        style={{
          background: "rgba(10,10,26,0.9)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                data-ocid={`nav.${id}.tab`}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px",
                  activeTab === id
                    ? "border-neon-blue text-white"
                    : "border-transparent text-white/40 hover:text-white/70",
                )}
                style={
                  activeTab === id
                    ? { borderColor: "#00D4FF", color: "#fff" }
                    : {}
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "dashboard" && <DashboardTab />}
            {activeTab === "watchlist" && <WatchlistTab />}
            {activeTab === "accuracy" && <AccuracyTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="border-t border-white/8 mt-16 py-8 text-center"
        style={{ background: "rgba(10,10,26,0.8)" }}
      >
        <p className="text-xs text-white/30">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/60 transition-colors"
            style={{ color: "#00D4FF" }}
          >
            caffeine.ai
          </a>
        </p>
        <p className="text-xs text-white/20 mt-1">
          Powered by the Internet Computer Protocol
        </p>
      </footer>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(10,10,26,0.95)",
            border: "1px solid rgba(0,212,255,0.2)",
            color: "#fff",
          },
        }}
      />
    </div>
  );
}
