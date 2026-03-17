interface Window {
  TS_GLOBAL: {
    activeSignals: unknown[];
    history: unknown[];
    isScannerRunning: boolean;
  };
  TS_ULTRA_STATE: {
    activeSignals: unknown[];
    history: unknown[];
    livePrices: Record<string, number>;
    wsStatus: "connecting" | "live" | "disconnected";
    lastTickAt: number;
    isScannerRunning: boolean;
    fearGreedValue: number | null;
  };
}
