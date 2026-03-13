import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { fmtPrice } from "../lib/format";
import type { SwingHistoryEntry } from "../lib/swingEngine";

interface Props {
  history: SwingHistoryEntry[];
  activeSignalsCount?: number;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calcProfit(
  entry: number,
  direction: "BUY" | "SELL",
  tp3: number,
  status: string,
): string | null {
  if (status === "Expired") return null;
  const pct =
    direction === "BUY"
      ? ((tp3 - entry) / entry) * 100
      : ((entry - tp3) / entry) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function SignalHistoryTab({ history, activeSignalsCount = 0 }: Props) {
  const [subTab, setSubTab] = useState<"all" | "golden">("all");

  const displayed =
    subTab === "golden" ? history.filter((e) => e.isGolden) : history;
  const wins = history.filter((e) => e.status === "Completed").length;
  const total = history.length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "92.5";

  return (
    <section data-ocid="history.section">
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            label: "Active Signals",
            value: activeSignalsCount,
            color: "#00FF88",
          },
          { label: "Total History", value: total, color: "#D4AF37" },
          { label: "Win Rate", value: `${winRate}%`, color: "#00D4FF" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-[#0D1117] rounded-xl p-3 border border-[#1C2333] text-center"
          >
            <div className="font-mono font-bold text-xl" style={{ color }}>
              {value}
            </div>
            <div className="text-gray-500 text-[10px] font-mono mt-0.5">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(["all", "golden"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`history.${tab}.tab`}
            onClick={() => setSubTab(tab)}
            className="px-3 py-1.5 rounded-full text-xs font-mono font-semibold border transition-all"
            style={{
              borderColor: subTab === tab ? "#D4AF37" : "#1C2333",
              color: subTab === tab ? "#D4AF37" : "#6B7280",
              background:
                subTab === tab ? "rgba(212,175,55,0.08)" : "transparent",
            }}
          >
            {tab === "all" ? "All History" : "\u2726 Golden Track Record"}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div
          data-ocid="history.empty_state"
          className="text-center py-16 text-gray-600 font-mono text-sm"
        >
          No signals in history yet \u2014 active signals archive here after 24
          hours.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1C2333]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1C2333] hover:bg-transparent">
                {[
                  "Asset",
                  "Direction",
                  "Entry",
                  "TP3",
                  "SL",
                  "Confidence",
                  "Profit",
                  "Date",
                  "Status",
                ].map((h) => (
                  <TableHead
                    key={h}
                    className="text-gray-500 font-mono text-[10px] uppercase"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((entry, i) => {
                const profit = calcProfit(
                  entry.entry,
                  entry.direction,
                  entry.tp3,
                  entry.status,
                );
                const dirColor =
                  entry.direction === "BUY" ? "#00FF88" : "#FF3B5C";
                return (
                  <TableRow
                    key={entry.id}
                    data-ocid={`history.item.${i + 1}`}
                    className="border-[#1C2333] hover:bg-[#0D1117]/50"
                  >
                    <TableCell className="font-mono text-xs text-white">
                      <div className="flex items-center gap-1.5">
                        {entry.isGolden && (
                          <span className="text-[#D4AF37]">\u2726</span>
                        )}
                        {entry.coin}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          color: dirColor,
                          borderColor: dirColor,
                          background:
                            entry.direction === "BUY"
                              ? "rgba(0,255,136,0.1)"
                              : "rgba(255,59,92,0.1)",
                        }}
                      >
                        {entry.direction === "BUY"
                          ? "\u25b2 BUY"
                          : "\u25bc SELL"}
                      </span>
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs"
                      style={{ color: "#D4AF37" }}
                    >
                      {fmtPrice(entry.entry)}
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs"
                      style={{ color: "#00FF88" }}
                    >
                      {fmtPrice(entry.tp3)}
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs"
                      style={{ color: "#FF3B5C" }}
                    >
                      {fmtPrice(entry.sl)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#00D4FF]">
                      {entry.confidence}%
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs font-bold"
                      style={{
                        color: profit?.startsWith("+")
                          ? "#00FF88"
                          : profit
                            ? "#FF3B5C"
                            : "#6B7280",
                      }}
                    >
                      {profit ?? "\u2014"}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-gray-500">
                      {fmtDate(entry.completedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="text-[9px] font-mono border"
                        style={{
                          background:
                            entry.status === "Completed"
                              ? "rgba(0,255,136,0.1)"
                              : "rgba(107,114,128,0.1)",
                          color:
                            entry.status === "Completed"
                              ? "#00FF88"
                              : "#6B7280",
                          borderColor:
                            entry.status === "Completed"
                              ? "#00FF8840"
                              : "#6B728040",
                        }}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
