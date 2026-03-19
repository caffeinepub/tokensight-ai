import { Toaster } from "@/components/ui/sonner";
import { BarChart2, History, LayoutDashboard, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminPanel } from "./components/AdminPanel";
import { AlphaSection } from "./components/AlphaSection";
import { DashboardTab } from "./components/DashboardTab";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { SignalHistoryTab } from "./components/SignalHistoryTab";
import { SocialSection } from "./components/SocialSection";
import { WhaleTicker } from "./components/WhaleTicker";
import { useTokenData } from "./hooks/useTokenData";
import type { SwingHistoryEntry, SwingSignal } from "./lib/swingEngine";
import {
  getActiveSignals,
  getHistory,
  getWeeklyGoldenSniper,
  initSwingEngine,
  registerUpdateCallback,
  syncFromCanister,
} from "./lib/swingEngine";
import { getWsStatus, initLiveFeed } from "./lib/wsLiveFeed";

type TabId = "dashboard" | "signals" | "social" | "history";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "signals", label: "Signals", icon: BarChart2 },
  { id: "social", label: "Social", icon: Radio },
  { id: "history", label: "History", icon: History },
];

export const ADMIN_PRINCIPAL =
  "sg5zb-fsg2l-xim4d-64w2p-lsqq3-6awgd-r7pzw-lekky-wzoyu-367qv-vae";

const IS_ADMIN =
  window.location.pathname === "/admin" ||
  window.location.pathname === "/tokensight-admin";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [signals, setSignals] = useState<SwingSignal[]>([]);
  const [history, setHistory] = useState<SwingHistoryEntry[]>([]);
  const [wsStatus, setWsStatus] = useState<
    "connecting" | "live" | "disconnected"
  >("connecting");
  const [lastTickAt, setLastTickAt] = useState<number>(0);
  const [proUserCount, setProUserCount] = useState(0);
  const { prices, connected } = useTokenData();

  // Init swing engine — pulls from canister first, then starts local scanner
  useEffect(() => {
    void initSwingEngine().then(() => {
      setSignals([...getActiveSignals()]);
      setHistory([...getHistory()]);
    });

    initLiveFeed((_symbol, _price, _changePct) => {
      setLastTickAt(Date.now());
    });

    const unregister = registerUpdateCallback(() => {
      setSignals([...getActiveSignals()]);
      setHistory([...getHistory()]);
    });
    return () => unregister();
  }, []);

  // Poll local state every 1 second (fast UI update)
  useEffect(() => {
    const id = setInterval(() => {
      setSignals([...getActiveSignals()]);
      setHistory([...getHistory()]);
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  // ---- UNIFIED BRAIN SYNC ----
  // Every 1 second, pull the canonical signal list from the canister.
  // This ensures all instances (Web, PWA, draft) stay synchronized.
  // Canister is the Master Instance — its data overrides local cache.
  useEffect(() => {
    const syncId = setInterval(async () => {
      const changed = await syncFromCanister();
      if (changed) {
        setSignals([...getActiveSignals()]);
        setHistory([...getHistory()]);
      }
    }, 1_000); // 1-second cross-device sync for maximum consistency
    return () => clearInterval(syncId);
  }, []);

  // Poll WS status every second
  useEffect(() => {
    const id = setInterval(() => {
      setWsStatus(getWsStatus());
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  // Simulate live on-chain pro user sessions
  useEffect(() => {
    const base = Number.parseInt(
      localStorage.getItem("ts_unique_users") ?? "12",
      10,
    );
    const seed = Math.max(8, Math.min(base, 50));
    setProUserCount(seed + Math.floor(Math.random() * 5));
    const iv = setInterval(() => {
      setProUserCount((prev) => {
        const delta = Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : -1) : 0;
        return Math.max(5, prev + delta);
      });
    }, 8_000);
    return () => clearInterval(iv);
  }, []);

  // Track visits
  useEffect(() => {
    try {
      const visitKey = "ts_visit_count";
      const visits =
        Number.parseInt(localStorage.getItem(visitKey) ?? "0", 10) + 1;
      localStorage.setItem(visitKey, String(visits));
      localStorage.setItem("ts_last_visit", new Date().toISOString());
      const fpKey = "ts_user_fp";
      if (!localStorage.getItem(fpKey)) {
        const fp = Math.random().toString(36).slice(2);
        localStorage.setItem(fpKey, fp);
        const uniqueCount =
          Number.parseInt(localStorage.getItem("ts_unique_users") ?? "0", 10) +
          1;
        localStorage.setItem("ts_unique_users", String(uniqueCount));
      }
    } catch {}
  }, []);

  if (IS_ADMIN)
    return (
      <AdminPanel
        connectedPrincipal={null}
        activeSignals={[]}
        onManualClose={() => {}}
      />
    );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#080B14] text-white">
        <Header wsStatus={wsStatus} lastTickAt={lastTickAt} />
        <WhaleTicker />

        <div className="sticky top-14 z-30 bg-[#080B14]/95 backdrop-blur-md border-b border-[#1C2333]">
          <div className="max-w-7xl mx-auto px-3 md:px-6">
            <div className="flex overflow-x-auto scrollbar-hide">
              {TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    type="button"
                    key={id}
                    data-ocid={`nav.${id}.tab`}
                    onClick={() => setActiveTab(id)}
                    className="flex items-center gap-1.5 px-4 py-3 text-xs font-mono font-semibold whitespace-nowrap border-b-2 transition-all"
                    style={{
                      borderColor: isActive ? "#D4AF37" : "transparent",
                      color: isActive ? "#D4AF37" : "#6B7280",
                    }}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-3 md:px-6 py-5">
          {activeTab === "dashboard" && (
            <DashboardTab
              prices={prices}
              connected={connected}
              swingHistory={history}
              proUserCount={proUserCount}
              signalCount={signals.length}
              activeSignalsCount={signals.length}
              topSignal={
                getWeeklyGoldenSniper() ??
                signals.find((s) => s.isGolden) ??
                signals[0] ??
                null
              }
            />
          )}
          {activeTab === "signals" && <AlphaSection signals={signals} />}
          {activeTab === "social" && (
            <SocialSection isPro={true} onUnlock={() => {}} />
          )}
          {activeTab === "history" && (
            <SignalHistoryTab
              history={history}
              activeSignalsCount={signals.length}
            />
          )}
        </main>

        <footer className="border-t border-[#1C2333] mt-8 py-5 text-center">
          <p className="text-gray-600 text-xs font-mono">
            &copy; {new Date().getFullYear()} TokenSight AI &mdash; Built with
            &hearts; using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4AF37] hover:text-[#FFD700] transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
