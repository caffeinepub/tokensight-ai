import { Wifi } from "lucide-react";
import { useEffect, useState } from "react";

type WsStatus = "connecting" | "live" | "disconnected";

interface Props {
  wsStatus?: WsStatus;
  lastTickAt?: number;
}

function TsSquareLogo() {
  return (
    <img
      src="/assets/generated/ts-logo-192.dim_192x192.png"
      alt="TokenSight AI logo"
      width={32}
      height={32}
      style={{ borderRadius: 6, display: "block" }}
    />
  );
}

function WsIndicator({
  wsStatus,
  lastTickAt,
}: { wsStatus: WsStatus; lastTickAt: number }) {
  const [isFresh, setIsFresh] = useState(false);

  useEffect(() => {
    if (!lastTickAt) return;
    const fresh = Date.now() - lastTickAt < 500;
    setIsFresh(fresh);
    if (fresh) {
      const t = setTimeout(() => setIsFresh(false), 500);
      return () => clearTimeout(t);
    }
  }, [lastTickAt]);

  if (wsStatus === "live") {
    return (
      <span
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border"
        style={{
          color: "#00FF88",
          borderColor: isFresh ? "#00FF88" : "#00FF8840",
          background: isFresh ? "rgba(0,255,136,0.15)" : "rgba(0,255,136,0.06)",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#00FF88] shrink-0"
          style={{
            animation: isFresh
              ? "pulse 0.4s ease-in-out infinite"
              : "pulse 1.5s ease-in-out infinite",
          }}
        />
        HIGH-SPEED LIVE
      </span>
    );
  }

  if (wsStatus === "connecting") {
    return (
      <span
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border"
        style={{
          color: "#FFD700",
          borderColor: "#FFD70040",
          background: "rgba(255,215,0,0.06)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#FFD700] shrink-0"
          style={{ animation: "pulse 1s ease-in-out infinite" }}
        />
        CONNECTING...
      </span>
    );
  }

  return (
    <span
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border"
      style={{
        color: "#FF3B5C",
        borderColor: "#FF3B5C40",
        background: "rgba(255,59,92,0.06)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-[#FF3B5C] shrink-0"
        style={{ animation: "pulse 0.8s ease-in-out infinite" }}
      />
      RECONNECTING...
    </span>
  );
}

export function Header({ wsStatus = "connecting", lastTickAt = 0 }: Props) {
  return (
    <header
      data-ocid="app.header"
      className="sticky top-0 z-40 bg-[#080B14]/95 backdrop-blur-md border-b border-[#1C2333]"
    >
      <div className="max-w-7xl mx-auto px-3 md:px-6 h-14 flex items-center justify-between">
        {/* Logo + Name */}
        <div className="flex items-center gap-2.5">
          <TsSquareLogo />
          <div>
            <span className="text-white font-mono font-bold text-sm tracking-wider">
              TokenSight
            </span>
            <span className="text-[#F7D000] font-mono font-bold text-sm tracking-wider">
              {" "}
              AI
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <span
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border"
            style={{
              color: "#00FF88",
              borderColor: "#00FF88",
              background: "rgba(0,255,136,0.08)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#00FF88] shrink-0"
              style={{ animation: "pulse 1.5s ease-in-out infinite" }}
            />
            FREE ACCESS
          </span>

          <WsIndicator wsStatus={wsStatus} lastTickAt={lastTickAt} />

          <span
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono border"
            style={{
              color: "#00D4FF",
              borderColor: "#00D4FF40",
              background: "rgba(0,212,255,0.06)",
            }}
          >
            <Wifi size={10} />
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
