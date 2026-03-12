import { TrendingUp, X } from "lucide-react";
import { useState } from "react";

export function SuccessBadge() {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">
      {showPopover && (
        <div className="bg-[#0D1117] border border-[#1C2333] rounded-lg p-3 w-56 shadow-xl text-xs text-gray-300 relative">
          <button
            type="button"
            onClick={() => setShowPopover(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-white"
          >
            <X size={12} />
          </button>
          <p className="font-semibold text-[#00FF88] mb-1">
            92.5% Success Rate
          </p>
          <p>
            Based on 847 verified signals over the last 90 days. Win = TP1 or
            higher reached before SL.
          </p>
        </div>
      )}
      <button
        type="button"
        data-ocid="success_badge.widget"
        onClick={() => setShowPopover((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D1117] border border-[#00FF88]/40 text-[#00FF88] text-xs font-mono font-semibold shadow-lg hover:border-[#00FF88] transition-all"
        style={{ boxShadow: "0 0 12px rgba(0,255,136,0.2)" }}
      >
        <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
        92.5% Success Rate
        <TrendingUp size={12} />
      </button>
    </div>
  );
}
