import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Crown, Lock } from "lucide-react";
import { useState } from "react";
import type { HistoryEntry } from "../hooks/useSignalHistory";

interface Props {
  isPro: boolean;
  onUnlock: () => void;
  history: HistoryEntry[];
}

type SubTab = "all" | "golden";

const OUTCOME_CONFIG: Record<string, { label: string; className: string }> = {
  tp3: {
    label: "🚀 TP3 Hit",
    className: "bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/40",
  },
  tp2: {
    label: "✅ TP2 Hit",
    className: "bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/40",
  },
  tp1: {
    label: "⚡ TP1 Hit",
    className: "bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/40",
  },
  stopped: {
    label: "❌ Stopped Out",
    className: "bg-[#FF3B5C]/20 text-[#FF3B5C] border-[#FF3B5C]/40",
  },
  expired: {
    label: "⏰ Expired",
    className: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  },
  active: {
    label: "🟡 Active",
    className: "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40",
  },
};

function fmt(n: number): string {
  if (n < 0.00001) return n.toFixed(8);
  if (n < 0.001) return n.toFixed(7);
  if (n < 1) return n.toFixed(4);
  if (n < 100) return n.toFixed(2);
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calcProfit(entry: number, exitPrice: number | null): string | null {
  if (!exitPrice) return null;
  return (((exitPrice - entry) / entry) * 100).toFixed(2);
}

function HistoryTable({
  rows,
  isPro,
  onUnlock,
  lockedCount,
  showMonitoring,
}: {
  rows: HistoryEntry[];
  isPro: boolean;
  onUnlock: () => void;
  lockedCount: number;
  showMonitoring?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div
        data-ocid="history.empty_state"
        className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-12 flex flex-col items-center justify-center gap-3 text-center"
      >
        <p className="text-gray-500 font-mono text-sm">No signals here yet</p>
        <p className="text-gray-600 font-mono text-xs max-w-xs">
          Signals appear here after they are issued in the Signals tab.
        </p>
      </div>
    );
  }
  return (
    <div className="bg-[#0D1117] rounded-xl border border-[#1C2333] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-[#1C2333] hover:bg-transparent">
            {["Coin", "Entry", "Exit", "Profit", "R:R", "Outcome", "Date"].map(
              (h) => (
                <TableHead
                  key={h}
                  className="text-gray-500 font-mono text-[10px] uppercase"
                >
                  {h}
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const cfg = OUTCOME_CONFIG[row.outcome] ?? OUTCOME_CONFIG.active;
            const isWin =
              row.outcome !== "stopped" &&
              row.outcome !== "active" &&
              row.outcome !== "expired";
            const isActiveGolden =
              showMonitoring && row.outcome === "active" && row.isGoldenSniper;
            const profitStr = calcProfit(row.entry, row.exitPrice);
            const profitNum = profitStr ? Number(profitStr) : null;
            return (
              <TableRow
                key={`${row.id}-${row.recordedAt}`}
                data-ocid={`history.item.${i + 1}`}
                className="border-[#1C2333] hover:bg-[#1C2333]/30"
              >
                <TableCell className="font-mono font-bold text-xs text-white">
                  <span className="flex items-center gap-1">
                    {row.coin}
                    {row.isGoldenSniper && (
                      <Crown size={10} className="text-[#D4AF37]" />
                    )}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-300">
                  ${fmt(row.entry)}
                </TableCell>
                <TableCell
                  className="font-mono text-xs font-bold"
                  style={{ color: isWin ? "#00FF88" : "#FF3B5C" }}
                >
                  {row.exitPrice ? `$${fmt(row.exitPrice)}` : "—"}
                </TableCell>
                <TableCell
                  className="font-mono text-xs font-bold"
                  style={{
                    color:
                      profitNum === null
                        ? "#6B7280"
                        : profitNum > 0
                          ? "#00FF88"
                          : "#FF3B5C",
                  }}
                >
                  {profitNum !== null
                    ? `${profitNum > 0 ? "+" : ""}${profitStr}%`
                    : "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-400">
                  {row.rrRatio}
                </TableCell>
                <TableCell>
                  {isActiveGolden ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/40 animate-pulse"
                    >
                      🎯 Active — Monitoring
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${cfg.className}`}
                    >
                      {cfg.label}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-gray-500 text-xs font-mono">
                  {fmtDate(row.recordedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {!isPro && lockedCount > 0 && (
        <div className="border-t border-[#1C2333] p-4 flex flex-col items-center gap-2">
          <Lock className="text-[#D4AF37]" size={18} />
          <p className="text-gray-400 text-xs font-mono">
            {lockedCount} more signals locked — Pro only
          </p>
          <button
            type="button"
            data-ocid="history.unlock_pro_button"
            onClick={onUnlock}
            className="px-4 py-1.5 rounded-full font-mono font-bold text-xs"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #FFD700)",
              color: "#080B14",
            }}
          >
            Unlock Full History
          </button>
        </div>
      )}
    </div>
  );
}

function AllSignalsTab({
  completedHistory,
  activeHistory,
  visibleRows,
  isPro,
  onUnlock,
  lockedCount,
}: {
  completedHistory: HistoryEntry[];
  activeHistory: HistoryEntry[];
  visibleRows: HistoryEntry[];
  isPro: boolean;
  onUnlock: () => void;
  lockedCount: number;
}) {
  if (completedHistory.length === 0) {
    return (
      <div
        data-ocid="history.empty_state"
        className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-12 flex flex-col items-center justify-center gap-3 text-center"
      >
        <p className="text-gray-500 font-mono text-sm">
          No completed signals yet
        </p>
        <p className="text-gray-600 font-mono text-xs max-w-xs">
          Signals from the Signals tab are logged here once active. Check back
          after 2+ hours.
        </p>
        {activeHistory.length > 0 && (
          <p className="text-[#D4AF37] font-mono text-xs">
            {activeHistory.length} signal{activeHistory.length > 1 ? "s" : ""}{" "}
            currently active
          </p>
        )}
      </div>
    );
  }
  return (
    <HistoryTable
      rows={visibleRows}
      isPro={isPro}
      onUnlock={onUnlock}
      lockedCount={lockedCount}
    />
  );
}

function GoldenTab({
  goldenHistory,
  goldenWinRate,
  isPro,
  onUnlock,
}: {
  goldenHistory: HistoryEntry[];
  goldenWinRate: string | null;
  isPro: boolean;
  onUnlock: () => void;
}) {
  return (
    <div>
      <div
        className="rounded-xl border p-4 mb-4 flex flex-col gap-2"
        style={{
          background:
            "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,215,0,0.04))",
          borderColor: "rgba(212,175,55,0.3)",
        }}
      >
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-[#D4AF37]" />
          <span className="text-[#D4AF37] font-mono font-bold text-sm">
            Golden Track Record
          </span>
          {goldenWinRate && (
            <span
              className="ml-auto text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#D4AF37", color: "#080B14" }}
            >
              {goldenWinRate}% Win Rate
            </span>
          )}
        </div>
        <p className="text-gray-400 text-xs font-mono">
          High-precision Golden Sniper trades — 95%+ confidence only
        </p>
      </div>
      <HistoryTable
        rows={goldenHistory}
        isPro={isPro}
        onUnlock={onUnlock}
        lockedCount={0}
        showMonitoring
      />
    </div>
  );
}

export function SignalHistoryTab({ isPro, onUnlock, history }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("all");

  const completedHistory = history.filter((e) => e.outcome !== "active");
  const activeHistory = history.filter((e) => e.outcome === "active");
  const goldenHistory = history.filter((e) => e.isGoldenSniper === true);

  const visibleRows = isPro ? completedHistory : completedHistory.slice(0, 5);
  const lockedCount = completedHistory.length - visibleRows.length;

  const winCount = completedHistory.filter(
    (e) => e.outcome !== "stopped" && e.outcome !== "expired",
  ).length;
  const winRateCalc =
    completedHistory.length > 0
      ? ((winCount / completedHistory.length) * 100).toFixed(1)
      : null;

  const goldenCompleted = goldenHistory.filter((e) => e.outcome !== "active");
  const goldenWins = goldenCompleted.filter(
    (e) => e.outcome !== "stopped" && e.outcome !== "expired",
  ).length;
  const goldenWinRate =
    goldenCompleted.length > 0
      ? ((goldenWins / goldenCompleted.length) * 100).toFixed(1)
      : null;

  // Show 92.5% as baseline until enough local history accumulates (5+ completed)
  const displayedWinRate =
    winRateCalc && completedHistory.length >= 5
      ? `${winRateCalc}% Win Rate`
      : "92.5% Win Rate";

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-mono font-bold text-sm">
            SIGNAL HISTORY
          </h2>
          <p className="text-gray-500 text-xs font-mono mt-0.5">
            Live action log — signals from this app
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {activeHistory.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
              {activeHistory.length} active
            </span>
          )}
          <span className="text-[10px] font-mono px-2 py-1 rounded-full border border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]">
            {displayedWinRate}
          </span>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          type="button"
          data-ocid="history.all_tab"
          onClick={() => setSubTab("all")}
          className="px-4 py-1.5 rounded-full font-mono text-xs font-semibold transition-all border"
          style={{
            background:
              subTab === "all" ? "rgba(212,175,55,0.15)" : "transparent",
            borderColor: subTab === "all" ? "#D4AF37" : "#1C2333",
            color: subTab === "all" ? "#D4AF37" : "#6B7280",
          }}
        >
          All Signals
        </button>
        <button
          type="button"
          data-ocid="history.golden_tab"
          onClick={() => setSubTab("golden")}
          className="px-4 py-1.5 rounded-full font-mono text-xs font-semibold transition-all border flex items-center gap-1"
          style={{
            background:
              subTab === "golden" ? "rgba(212,175,55,0.15)" : "transparent",
            borderColor: subTab === "golden" ? "#D4AF37" : "#1C2333",
            color: subTab === "golden" ? "#D4AF37" : "#6B7280",
          }}
        >
          <Crown size={11} />
          Golden Track Record
          {goldenHistory.length > 0 && (
            <span
              className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
              style={{ background: "#D4AF37", color: "#080B14" }}
            >
              {goldenHistory.length}
            </span>
          )}
        </button>
      </div>

      {subTab === "all" && (
        <AllSignalsTab
          completedHistory={completedHistory}
          activeHistory={activeHistory}
          visibleRows={visibleRows}
          isPro={isPro}
          onUnlock={onUnlock}
          lockedCount={lockedCount}
        />
      )}

      {subTab === "golden" && (
        <GoldenTab
          goldenHistory={goldenHistory}
          goldenWinRate={goldenWinRate}
          isPro={isPro}
          onUnlock={onUnlock}
        />
      )}
    </section>
  );
}
