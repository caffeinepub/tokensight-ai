import { Lock, Shield, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { ADMIN_PRINCIPAL } from "../App";
import { useICPWallet } from "../hooks/useICPWallet";
import type { HistoryEntry } from "../hooks/useSignalHistory";

interface AdminStats {
  totalSessions: number;
  uniqueUsers: number;
  lastVisit: string;
  proUsers: number;
}

function getStats(): AdminStats {
  const totalSessions = Number.parseInt(
    localStorage.getItem("ts_visit_count") ?? "0",
    10,
  );
  const uniqueUsers = Number.parseInt(
    localStorage.getItem("ts_unique_users") ?? "0",
    10,
  );
  const lastVisit = localStorage.getItem("ts_last_visit") ?? "—";
  const proUsers = Number.parseInt(
    localStorage.getItem("ts_pro_user_count") ?? "0",
    10,
  );
  return { totalSessions, uniqueUsers, lastVisit, proUsers };
}

function fmt(n: number): string {
  if (n < 0.00001) return n.toFixed(8);
  if (n < 0.001) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  if (n < 100) return n.toFixed(2);
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

interface Props {
  connectedPrincipal?: string | null;
  activeSignals?: HistoryEntry[];
  onManualClose?: (id: string) => void;
}

export function AdminPanel({
  connectedPrincipal,
  activeSignals = [],
  onManualClose,
}: Props) {
  const { walletState, connectWallet, disconnect } = useICPWallet();
  const [stats] = useState<AdminStats>(getStats);

  // Determine effective principal: prop takes priority (from App), then wallet state
  const effectivePrincipal = connectedPrincipal ?? walletState.principal;
  const isAuthenticated = effectivePrincipal === ADMIN_PRINCIPAL;

  const walletButtons: {
    type: "plug" | "bitfinity" | "nns";
    label: string;
    icon: string;
  }[] = [
    { type: "plug", label: "Connect Plug", icon: "🔌" },
    { type: "bitfinity", label: "Connect Bitfinity", icon: "♾️" },
    { type: "nns", label: "Connect Internet Identity (NNS)", icon: "🔑" },
  ];

  return (
    <div className="min-h-screen bg-[#080B14] flex items-center justify-center p-4">
      {!isAuthenticated ? (
        <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} className="text-[#D4AF37]" />
            <h1 className="text-white font-mono font-bold">
              Admin Access Required
            </h1>
          </div>
          <p className="text-gray-500 text-xs font-mono mb-6">
            Connect the Admin Principal ID wallet to access analytics.
          </p>

          {walletState.error && (
            <div
              data-ocid="admin.error_state"
              className="bg-[#FF3B5C]/10 border border-[#FF3B5C]/40 rounded-lg p-3 mb-4 text-[#FF3B5C] text-xs font-mono"
            >
              {walletState.error}
            </div>
          )}

          {effectivePrincipal && effectivePrincipal !== ADMIN_PRINCIPAL && (
            <div
              data-ocid="admin.error_state"
              className="bg-[#FF3B5C]/10 border border-[#FF3B5C]/40 rounded-lg p-3 mb-4"
            >
              <p className="text-[#FF3B5C] font-mono text-xs font-bold">
                ⛔ Access Denied
              </p>
              <p className="text-[#FF3B5C]/70 font-mono text-[10px] mt-1">
                Connected: {effectivePrincipal.slice(0, 20)}…
              </p>
              <p className="text-[#FF3B5C]/70 font-mono text-[10px]">
                This is not the admin principal.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {walletButtons.map(({ type, label, icon }) => (
              <button
                type="button"
                key={type}
                data-ocid={`admin.${type}_wallet_button`}
                onClick={() => connectWallet(type)}
                disabled={walletState.connecting}
                className="w-full py-2.5 rounded-lg font-mono font-bold text-sm border border-[#1C2333] text-gray-300 hover:border-[#D4AF37]/40 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                {walletState.connecting && walletState.walletType === type ? (
                  <span className="inline-block w-3 h-3 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                ) : (
                  icon
                )}{" "}
                {label}
              </button>
            ))}
          </div>

          <p className="text-gray-700 text-[10px] font-mono mt-4 text-center">
            Access requires Admin Principal ID
          </p>
        </div>
      ) : (
        <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-8 w-full max-w-lg">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-[#00FF88]" />
            <h1 className="text-white font-mono font-bold">Admin Analytics</h1>
            <span className="text-[#00FF88] text-[10px] font-mono ml-auto bg-[#00FF88]/10 px-2 py-0.5 rounded border border-[#00FF88]/30">
              ✓ ADMIN
            </span>
          </div>
          <p className="text-gray-600 text-[10px] font-mono mb-6">
            Principal: {effectivePrincipal?.slice(0, 30)}…
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              {
                label: "Live Visitor Count",
                value: stats.totalSessions,
                color: "#00D4FF",
                icon: "👁️",
              },
              {
                label: "Unique Users",
                value: stats.uniqueUsers,
                color: "#00FF88",
                icon: "👤",
              },
              {
                label: "Pro Users",
                value: stats.proUsers,
                color: "#D4AF37",
                icon: "⭐",
              },
              {
                label: "Last Visit",
                value: stats.lastVisit
                  ? new Date(stats.lastVisit).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—",
                color: "#9945FF",
                icon: "📅",
              },
            ].map(({ label, value, color, icon }) => (
              <div
                key={label}
                className="bg-[#080B14] rounded-lg border border-[#1C2333] p-4"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{icon}</span>
                  <p className="text-gray-500 text-[10px] font-mono">{label}</p>
                </div>
                <p className="font-mono font-bold text-2xl" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Active Signals with Manual Close */}
          <div className="bg-[#080B14] rounded-lg border border-[#1C2333] p-3 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">⚡</span>
              <p className="text-gray-400 text-xs font-mono uppercase tracking-wider">
                Active Signals
              </p>
              <span
                className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full border"
                style={{
                  color: "#D4AF37",
                  borderColor: "rgba(212,175,55,0.3)",
                  background: "rgba(212,175,55,0.1)",
                }}
              >
                {activeSignals.length} open
              </span>
            </div>

            {activeSignals.length === 0 ? (
              <p className="text-gray-600 font-mono text-xs text-center py-3">
                No active signals
              </p>
            ) : (
              <div className="space-y-2">
                {activeSignals.map((signal, i) => (
                  <div
                    key={signal.id}
                    data-ocid={`admin.signal.item.${i + 1}`}
                    className="flex items-center gap-2 p-2 rounded-lg border border-[#1C2333] bg-[#0D1117]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-white font-mono font-bold text-xs">
                          {signal.coin}
                        </span>
                        <span className="text-gray-500 font-mono text-[10px]">
                          {signal.symbol}
                        </span>
                        {signal.isGoldenSniper && (
                          <span
                            className="text-[9px] font-mono font-bold px-1 py-0.5 rounded"
                            style={{ background: "#D4AF37", color: "#080B14" }}
                          >
                            GOLDEN
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        <span className="text-gray-400 font-mono text-[10px]">
                          E: ${fmt(signal.entry)}
                        </span>
                        <span className="text-[#00FF88] font-mono text-[10px]">
                          TP1: ${fmt(signal.tp1)}
                        </span>
                        <span className="text-[#00D4FF] font-mono text-[10px]">
                          TP2: ${fmt(signal.tp2)}
                        </span>
                        <span className="text-[#9945FF] font-mono text-[10px]">
                          TP3: ${fmt(signal.tp3)}
                        </span>
                        <span className="text-[#FF3B5C] font-mono text-[10px]">
                          SL: ${fmt(signal.sl)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-ocid={`admin.manual_close_button.${i + 1}`}
                      onClick={() => onManualClose?.(signal.id)}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] font-bold transition-colors"
                      style={{
                        background: "rgba(255,59,92,0.15)",
                        color: "#FF3B5C",
                        border: "1px solid rgba(255,59,92,0.3)",
                      }}
                    >
                      <XCircle size={10} />
                      Close
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#080B14] rounded-lg border border-[#1C2333] p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} className="text-gray-500" />
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider">
                Session Details
              </p>
            </div>
            <p className="text-gray-400 text-xs font-mono">
              Stats are session-local (localStorage). For full server-side
              analytics, backend integration is required.
            </p>
          </div>

          <button
            type="button"
            onClick={disconnect}
            data-ocid="admin.logout_button"
            className="w-full mt-2 py-2 rounded-lg font-mono text-xs text-gray-500 border border-[#1C2333] hover:border-[#FF3B5C]/40 transition-colors flex items-center justify-center gap-2"
          >
            <Lock size={11} /> Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
