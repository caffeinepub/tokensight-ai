import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Share2, X } from "lucide-react";
import { useState } from "react";
import type { Signal } from "../hooks/useTokenData";

interface Props {
  signal: Signal;
  children: React.ReactNode;
}

export function ShareMyWin({ signal, children }: Props) {
  const [open, setOpen] = useState(false);
  const pnl = (((signal.tp3 - signal.entry) / signal.entry) * 100).toFixed(1);

  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 340;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#080B14";
    ctx.fillRect(0, 0, 600, 340);

    // Gold border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 596, 336);

    // Top accent
    const grad = ctx.createLinearGradient(0, 0, 600, 0);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, "#D4AF37");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 2, 600, 3);

    // Title
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("AI ALPHA TERMINAL", 300, 40);

    // Coin
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px monospace";
    ctx.fillText(signal.coin.toUpperCase(), 300, 100);

    // PnL
    ctx.fillStyle = "#00FF88";
    ctx.font = "bold 48px monospace";
    ctx.fillText(`+${pnl}%`, 300, 165);

    // Entry / TP3
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "13px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Entry: $${signal.entry.toFixed(2)}`, 80, 210);
    ctx.textAlign = "right";
    ctx.fillText(`TP3: $${signal.tp3.toFixed(2)}`, 520, 210);

    // R:R
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`R:R ${signal.rrRatio}`, 300, 250);

    // Footer
    ctx.fillStyle = "#6B7280";
    ctx.font = "11px monospace";
    ctx.fillText("tokensight.ai — AI Alpha Terminal", 300, 300);

    const link = document.createElement("a");
    link.download = `win-${signal.symbol}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <button
        type="button"
        data-ocid="share_win.open_modal_button"
        onClick={() => setOpen(true)}
        className="cursor-pointer bg-transparent border-0 p-0"
      >
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-ocid="share_win.modal"
          className="max-w-sm border-[#1C2333] bg-[#0D1117] text-white"
        >
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37] font-mono flex items-center gap-2">
              <Share2 size={16} /> Share My Win
            </DialogTitle>
          </DialogHeader>

          {/* Preview card */}
          <div
            className="rounded-xl p-5 text-center my-2 border"
            style={{
              background: "linear-gradient(135deg, #080B14, #0D1117)",
              borderColor: "#D4AF37",
              boxShadow: "0 0 20px rgba(212,175,55,0.2)",
            }}
          >
            <p className="text-[#D4AF37] text-xs font-mono tracking-widest mb-1">
              AI ALPHA TERMINAL
            </p>
            <p className="text-white font-bold text-xl mb-1">{signal.coin}</p>
            <p className="text-[#00FF88] font-mono font-bold text-4xl mb-2">
              +{pnl}%
            </p>
            <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
              <span>Entry: ${signal.entry.toFixed(2)}</span>
              <span>TP3: ${signal.tp3.toFixed(2)}</span>
            </div>
            <span className="bg-[#D4AF37]/20 text-[#FFD700] text-xs font-mono px-3 py-1 rounded-full border border-[#D4AF37]/40">
              R:R {signal.rrRatio}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              data-ocid="share_win.download_button"
              onClick={handleDownload}
              className="flex-1 bg-[#D4AF37] hover:bg-[#FFD700] text-[#080B14] font-bold font-mono"
            >
              <Download size={14} className="mr-1" /> Download PNG
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-[#1C2333] text-gray-400 hover:text-white bg-transparent"
            >
              <X size={14} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
