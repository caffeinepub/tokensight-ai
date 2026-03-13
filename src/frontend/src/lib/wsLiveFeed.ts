/**
 * TokenSight AI — WebSocket Live Price Feed
 * Millisecond-precision Binance combined stream
 */

type WsStatus = "connecting" | "live" | "disconnected";
type TickCallback = (
  symbol: string,
  price: number,
  changePercent: number,
) => void;

const STREAMS = [
  "btcusdt@ticker",
  "ethusdt@ticker",
  "solusdt@ticker",
  "bnbusdt@ticker",
  "xrpusdt@ticker",
  "adausdt@ticker",
  "dogeusdt@ticker",
  "avaxusdt@ticker",
  "linkusdt@ticker",
  "dotusdt@ticker",
  "pepeusdt@ticker",
  "shibusdt@ticker",
].join("/");

const STREAM_URL = `wss://stream.binance.com:9443/stream?streams=${STREAMS}`;

function ensureUltraState(): void {
  if (!(window as Window).TS_ULTRA_STATE) {
    (window as Window).TS_ULTRA_STATE = {
      activeSignals: [],
      history: [],
      livePrices: {},
      wsStatus: "connecting",
      lastTickAt: 0,
      isScannerRunning: false,
    };
  }
}

let _ws: WebSocket | null = null;
let _onTick: TickCallback | null = null;
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function setStatus(status: WsStatus): void {
  ensureUltraState();
  (window as Window).TS_ULTRA_STATE.wsStatus = status;
}

function connect(): void {
  ensureUltraState();
  setStatus("connecting");

  try {
    _ws = new WebSocket(STREAM_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  _ws.onopen = () => {
    setStatus("live");
    if (_reconnectTimer) {
      clearTimeout(_reconnectTimer);
      _reconnectTimer = null;
    }
  };

  _ws.onmessage = (evt: MessageEvent) => {
    try {
      const msg = JSON.parse(evt.data as string) as {
        data?: { s?: string; c?: string; P?: string };
      };
      const d = msg.data;
      if (!d?.s || !d?.c) return;
      const symbol = d.s.toUpperCase();
      const price = Number.parseFloat(d.c);
      const changePct = Number.parseFloat(d.P ?? "0");
      if (Number.isNaN(price) || price <= 0) return;

      const state = (window as Window).TS_ULTRA_STATE;
      state.livePrices[symbol] = price;
      state.lastTickAt = Date.now();

      if (_onTick) _onTick(symbol, price, changePct);
    } catch {
      // ignore parse errors
    }
  };

  _ws.onerror = () => {
    setStatus("disconnected");
  };

  _ws.onclose = () => {
    setStatus("disconnected");
    scheduleReconnect();
  };
}

function scheduleReconnect(): void {
  if (_reconnectTimer) return;
  _reconnectTimer = setTimeout(() => {
    _reconnectTimer = null;
    connect();
  }, 5000);
}

export function initLiveFeed(onTick: TickCallback): void {
  _onTick = onTick;
  ensureUltraState();
  connect();
}

export function getLivePrice(symbol: string): number | null {
  const p = (window as Window).TS_ULTRA_STATE?.livePrices?.[
    symbol.toUpperCase()
  ];
  return p ?? null;
}

export function getWsStatus(): WsStatus {
  return (window as Window).TS_ULTRA_STATE?.wsStatus ?? "disconnected";
}
