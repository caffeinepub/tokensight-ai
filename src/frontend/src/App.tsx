import { Toaster } from "@/components/ui/sonner";
import { BarChart2, History, LayoutDashboard, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminPanel } from "./components/AdminPanel";
import { AlphaSection } from "./components/AlphaSection";
import { DashboardTab } from "./components/DashboardTab";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { SignalHistoryTab } from "./components/SignalHistoryTab";
import { SocialSection } from "./components/SocialSection";
import { SuccessBadge } from "./components/SuccessBadge";
import { UnlockProModal } from "./components/UnlockProModal";
import { WhaleTicker } from "./components/WhaleTicker";
import { useICPWallet } from "./hooks/useICPWallet";
import { usePremium } from "./hooks/usePremium";
import { useSignalHistory } from "./hooks/useSignalHistory";
import { useTokenData } from "./hooks/useTokenData";

export const ADMIN_PRINCIPAL =
  "sg5zb-fsg2l-xim4d-64w2p-lsqq3-6awgd-r7pzw-lekky-wzoyu-367qv-vae";

type TabId = "dashboard" | "signals" | "social" | "history";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "signals", label: "Signals", icon: BarChart2 },
  { id: "social", label: "Social", icon: Radio },
  { id: "history", label: "History", icon: History },
];

const IS_ADMIN =
  window.location.pathname === "/admin" ||
  window.location.pathname === "/tokensight-admin";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showModal, setShowModal] = useState(false);
  const { isPro, isAdminAccess, unlockPro, grantAdminAccess } = usePremium();
  const { prices, signals, connected, scanningForGoldenSniper } =
    useTokenData();
  const { history, recordSignals, manualClose, updateSignalPrices } =
    useSignalHistory();
  const { walletState } = useICPWallet();
  const recordedRef = useRef(false);
  const adminGrantedRef = useRef(false);

  useEffect(() => {
    if (signals.length > 0 && !recordedRef.current) {
      recordedRef.current = true;
      recordSignals(signals);
    }
  }, [signals, recordSignals]);

  // Wire live prices to signal history for Golden Sniper monitoring
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      const priceMap: Record<string, number> = {};
      for (const [sym, data] of Object.entries(prices)) {
        priceMap[sym] = data.price;
      }
      updateSignalPrices(priceMap);
    }
  }, [prices, updateSignalPrices]);

  // Super Admin Bypass: grant pro access when admin principal connects
  useEffect(() => {
    if (
      walletState.principal &&
      walletState.principal === ADMIN_PRINCIPAL &&
      !adminGrantedRef.current
    ) {
      adminGrantedRef.current = true;
      grantAdminAccess();
      toast.success("⚡ Admin Access Granted", {
        description: "Full Pro access enabled for admin principal.",
        duration: 5000,
      });
    }
  }, [walletState.principal, grantAdminAccess]);

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

  useEffect(() => {
    try {
      if (isPro) localStorage.setItem("ts_pro_user_count", "1");
    } catch {}
  }, [isPro]);

  const activeSignals = history.filter((e) => e.outcome === "active");

  if (IS_ADMIN)
    return (
      <AdminPanel
        connectedPrincipal={walletState.principal}
        activeSignals={activeSignals}
        onManualClose={manualClose}
      />
    );

  const proUserCount = isPro ? 1 : 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#080B14] text-white">
        <Header onUnlockPro={() => setShowModal(true)} />
        <WhaleTicker />

        {isAdminAccess && (
          <div
            data-ocid="app.admin_access_banner"
            className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/30 py-1.5 px-4 text-center"
          >
            <span className="text-[#FFD700] font-mono text-xs font-bold">
              ⚡ ADMIN ACCESS ACTIVE — Full Pro enabled for principal{" "}
              <span className="text-[#D4AF37]/70">
                {ADMIN_PRINCIPAL.slice(0, 20)}…
              </span>
            </span>
          </div>
        )}

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
              history={history}
              proUserCount={proUserCount}
              signalCount={signals.length}
            />
          )}
          {activeTab === "signals" && (
            <AlphaSection
              signals={signals}
              isPro={isPro}
              onUnlock={() => setShowModal(true)}
              scanningForGoldenSniper={scanningForGoldenSniper}
            />
          )}
          {activeTab === "social" && (
            <SocialSection isPro={isPro} onUnlock={() => setShowModal(true)} />
          )}
          {activeTab === "history" && (
            <SignalHistoryTab
              isPro={isPro}
              onUnlock={() => setShowModal(true)}
              history={history}
            />
          )}
        </main>

        <footer className="border-t border-[#1C2333] mt-8 py-5 text-center">
          <p className="text-gray-600 text-xs font-mono">
            © {new Date().getFullYear()} TokenSight AI &mdash; Built with ❤️
            using{" "}
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

        <UnlockProModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onUnlock={unlockPro}
        />
        <SuccessBadge />
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
