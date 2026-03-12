import { useCallback, useEffect, useState } from "react";

export type WalletType = "plug" | "bitfinity" | "stoic" | "nfid" | "nns";

export interface WalletState {
  walletType: WalletType | null;
  connected: boolean;
  principal: string | null;
  balanceICP: number | null;
  connecting: boolean;
  paying: boolean;
  error: string | null;
}

const INITIAL_STATE: WalletState = {
  walletType: null,
  connected: false,
  principal: null,
  balanceICP: null,
  connecting: false,
  paying: false,
  error: null,
};

const LS_SESSION_KEY = "ts_wallet_session";

interface StoredSession {
  walletType: WalletType;
  principal: string;
  balanceICP: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const win = () => window as any;

function isPlugInstalled(): boolean {
  return !!win().ic?.plug;
}

async function getPlugPrincipal(): Promise<string | null> {
  try {
    const agent = win().ic?.plug?.agent;
    if (agent) {
      const p = await agent.getPrincipal();
      return p?.toString() ?? null;
    }
    return win().ic?.plug?.principalId ?? null;
  } catch {
    return null;
  }
}

function saveSession(session: StoredSession) {
  try {
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(LS_SESSION_KEY);
  } catch {}
}

export function useICPWallet() {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_STATE);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;
    const raw = localStorage.getItem(LS_SESSION_KEY);
    if (!raw) return;
    let session: StoredSession;
    try {
      session = JSON.parse(raw) as StoredSession;
    } catch {
      clearSession();
      return;
    }

    if (session.walletType === "nns" || session.walletType === "nfid") {
      import("@dfinity/auth-client")
        .then(({ AuthClient }) =>
          AuthClient.create({
            idleOptions: {
              disableIdle: true,
              disableDefaultIdleCallback: true,
            },
          }),
        )
        .then(async (client) => {
          const isAuth = await client.isAuthenticated();
          if (cancelled) return;
          if (isAuth) {
            const identity = client.getIdentity();
            const principal = identity.getPrincipal().toString();
            setWalletState((p) => ({
              ...p,
              connected: true,
              walletType: session.walletType,
              principal,
              balanceICP: session.balanceICP,
            }));
          } else {
            clearSession();
          }
        })
        .catch(() => clearSession());
    } else if (session.walletType === "plug") {
      const plug = win().ic?.plug;
      if (plug) {
        Promise.resolve(
          plug.isConnected ? plug.isConnected() : Promise.resolve(false),
        )
          .then((isConnected: boolean) => {
            if (cancelled) return;
            if (isConnected) {
              setWalletState((p) => ({
                ...p,
                connected: true,
                walletType: "plug",
                principal: session.principal,
                balanceICP: session.balanceICP,
              }));
            } else {
              clearSession();
            }
          })
          .catch(() => clearSession());
      } else {
        clearSession();
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const connectWallet = useCallback(async (type: WalletType) => {
    // Internet Identity (NNS) via AuthClient popup
    if (type === "nns") {
      setWalletState((p) => ({
        ...p,
        connecting: true,
        error: null,
        walletType: "nns",
      }));
      try {
        const { AuthClient } = await import("@dfinity/auth-client");
        const authClient = await AuthClient.create({
          idleOptions: { disableIdle: true, disableDefaultIdleCallback: true },
        });
        await new Promise<void>((resolve, reject) => {
          authClient.login({
            identityProvider: "https://identity.ic0.app",
            maxTimeToLive:
              BigInt(24 * 60 * 60 * 1000 * 1000 * 1000) * BigInt(30),
            windowOpenerFeatures:
              "toolbar=0,location=0,menubar=0,width=525,height=600,left=100,top=100",
            onSuccess: () => resolve(),
            onError: (err) =>
              reject(new Error(err ?? "Internet Identity login failed")),
          });
        });
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal().toString();
        saveSession({ walletType: "nns", principal, balanceICP: null });
        setWalletState((p) => ({
          ...p,
          connected: true,
          principal,
          balanceICP: null,
          connecting: false,
          walletType: "nns",
          error: null,
        }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "NNS login failed";
        setWalletState((p) => ({
          ...p,
          connecting: false,
          error: msg,
          walletType: null,
        }));
      }
      return;
    }

    // NFID (Google Login) via AuthClient with NFID identity provider
    if (type === "nfid") {
      setWalletState((p) => ({
        ...p,
        connecting: true,
        error: null,
        walletType: "nfid",
      }));
      try {
        const { AuthClient } = await import("@dfinity/auth-client");
        const authClient = await AuthClient.create({
          idleOptions: { disableIdle: true, disableDefaultIdleCallback: true },
        });
        await new Promise<void>((resolve, reject) => {
          authClient.login({
            identityProvider: "https://nfid.one/authenticate",
            maxTimeToLive:
              BigInt(24 * 60 * 60 * 1000 * 1000 * 1000) * BigInt(30),
            windowOpenerFeatures:
              "toolbar=0,location=0,menubar=0,width=525,height=600,left=100,top=100",
            onSuccess: () => resolve(),
            onError: (err) => reject(new Error(err ?? "NFID login failed")),
          });
        });
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal().toString();
        saveSession({ walletType: "nfid", principal, balanceICP: null });
        setWalletState((p) => ({
          ...p,
          connected: true,
          principal,
          balanceICP: null,
          connecting: false,
          walletType: "nfid",
          error: null,
        }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "NFID login failed";
        setWalletState((p) => ({
          ...p,
          connecting: false,
          error: msg,
          walletType: null,
        }));
      }
      return;
    }

    // Plug Wallet — redirect to install if not present
    if (type === "plug" && !isPlugInstalled()) {
      window.open("https://plugwallet.ooo/", "_blank", "noopener,noreferrer");
      setWalletState((p) => ({
        ...p,
        error: "Plug not installed. Opening install page...",
      }));
      return;
    }

    setWalletState((p) => ({
      ...p,
      connecting: true,
      error: null,
      walletType: type,
    }));
    try {
      if (type === "plug") {
        await win().ic.plug.requestConnect({
          whitelist: [],
          host: "https://ic0.app",
        });
        const balances = await win().ic.plug.requestBalance();
        const icpEntry = balances.find(
          (b: { currency: string; name: string; amount: number }) =>
            b.currency === "ICP" || b.name === "ICP",
        );
        const principal = await getPlugPrincipal();
        const bal = icpEntry ? icpEntry.amount : 0;
        saveSession({
          walletType: "plug",
          principal: principal ?? "plug-connected",
          balanceICP: bal,
        });
        setWalletState((p) => ({
          ...p,
          connected: true,
          balanceICP: bal,
          principal: principal ?? "plug-connected",
          connecting: false,
          error: null,
        }));
      } else if (type === "bitfinity") {
        const ic = win().ic?.bitfinityWallet ?? win().bitfinityWallet;
        await ic.requestConnect({ whitelist: [] });
        const raw = await ic.getBalance();
        let balanceICP = 0;
        if (typeof raw === "number") balanceICP = raw / 1e8;
        else if (raw && typeof raw === "object" && "value" in raw)
          balanceICP = Number(raw.value) / 10 ** (raw.decimals ?? 8);
        let principal: string | null = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawPrincipal: any = await ic.getPrincipal?.();
          if (rawPrincipal) principal = String(rawPrincipal);
        } catch {}
        saveSession({
          walletType: "bitfinity",
          principal: principal ?? "bitfinity-connected",
          balanceICP,
        });
        setWalletState((p) => ({
          ...p,
          connected: true,
          balanceICP,
          principal: principal ?? "bitfinity-connected",
          connecting: false,
          error: null,
        }));
      } else if (type === "stoic") {
        window.open(
          "https://www.stoicwallet.com/",
          "_blank",
          "noopener,noreferrer",
        );
        setWalletState((p) => ({
          ...p,
          connecting: false,
          error: "Stoic Web App opened. Use manual payment after sending ICP.",
        }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      setWalletState((p) => ({
        ...p,
        connecting: false,
        error: msg,
        walletType: null,
      }));
    }
  }, []);

  const payWithWallet = useCallback(
    async (recipientAccountId: string, amountE8s: number) => {
      const current = walletState;
      if (!current.connected) throw new Error("No wallet connected");
      setWalletState((p) => ({ ...p, paying: true, error: null }));
      try {
        if (current.walletType === "plug") {
          await win().ic.plug.requestTransfer({
            to: recipientAccountId,
            amount: amountE8s,
          });
        } else if (current.walletType === "bitfinity") {
          const ic = win().ic?.bitfinityWallet ?? win().bitfinityWallet;
          await ic.transfer({
            to: recipientAccountId,
            amount: amountE8s,
            sendICPTs: amountE8s,
          });
        } else {
          throw new Error("Unsupported wallet for direct payment");
        }
        setWalletState((p) => ({ ...p, paying: false }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Payment failed";
        setWalletState((p) => ({ ...p, paying: false, error: msg }));
        throw new Error(msg);
      }
    },
    [walletState],
  );

  const disconnect = useCallback(async () => {
    clearSession();
    const wt = walletState.walletType;
    if (wt === "nns" || wt === "nfid") {
      try {
        const { AuthClient } = await import("@dfinity/auth-client");
        const client = await AuthClient.create({
          idleOptions: { disableIdle: true, disableDefaultIdleCallback: true },
        });
        await client.logout();
      } catch {}
    }
    setWalletState(INITIAL_STATE);
  }, [walletState.walletType]);

  return { walletState, connectWallet, payWithWallet, disconnect };
}
