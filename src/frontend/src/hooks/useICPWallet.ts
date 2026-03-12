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
  popupBlocked: boolean;
  manualLoginUrl: string | null;
}

const INITIAL_STATE: WalletState = {
  walletType: null,
  connected: false,
  principal: null,
  balanceICP: null,
  connecting: false,
  paying: false,
  error: null,
  popupBlocked: false,
  manualLoginUrl: null,
};

const LS_SESSION_KEY = "ts_wallet_session";
const SESSION_MAX_TTL = BigInt(7 * 24 * 60 * 60) * BigInt(1_000_000_000);
const SS_PENDING_KEY = "ts_pending_wallet_type";

interface StoredSession {
  walletType: WalletType;
  principal: string;
  balanceICP: number | null;
  expiresAt: number;
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

function saveSession(session: Omit<StoredSession, "expiresAt">) {
  try {
    const stored: StoredSession = {
      ...session,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(stored));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(LS_SESSION_KEY);
    sessionStorage.removeItem(SS_PENDING_KEY);
  } catch {}
}

function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function useICPWallet() {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    // ── REDIRECT RETURN HANDLER ──────────────────────────────────────────────
    // After NNS/NFID redirects back to the app, sessionStorage holds the pending type.
    const pendingWalletType = sessionStorage.getItem(
      SS_PENDING_KEY,
    ) as WalletType | null;

    if (pendingWalletType === "nns" || pendingWalletType === "nfid") {
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
          sessionStorage.removeItem(SS_PENDING_KEY);
          if (isAuth) {
            const identity = client.getIdentity();
            const principal = identity.getPrincipal().toString();
            saveSession({
              walletType: pendingWalletType,
              principal,
              balanceICP: null,
            });
            setWalletState((p) => ({
              ...p,
              connected: true,
              walletType: pendingWalletType,
              principal,
              balanceICP: null,
              connecting: false,
              error: null,
              popupBlocked: false,
              manualLoginUrl: null,
            }));
          }
        })
        .catch(() => sessionStorage.removeItem(SS_PENDING_KEY));
      return () => {
        cancelled = true;
      };
    }

    // ── PERSISTED SESSION RESTORE ────────────────────────────────────────────
    const session = getStoredSession();
    if (!session) return;

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
    } else if (
      session.walletType === "bitfinity" ||
      session.walletType === "stoic"
    ) {
      setWalletState((p) => ({
        ...p,
        connected: true,
        walletType: session.walletType,
        principal: session.principal,
        balanceICP: session.balanceICP,
      }));
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // ── FORCE LOGIN CHECK ──────────────────────────────────────────────────────
  // Called by the "Force Login" button — manually checks if AuthClient has a
  // valid delegation (e.g. after the user manually returned from the provider).
  const forceLoginCheck = useCallback(async (): Promise<boolean> => {
    try {
      const { AuthClient } = await import("@dfinity/auth-client");
      const client = await AuthClient.create({
        idleOptions: { disableIdle: true, disableDefaultIdleCallback: true },
      });
      const isAuth = await client.isAuthenticated();
      if (isAuth) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal().toString();
        const walletType =
          (sessionStorage.getItem(SS_PENDING_KEY) as WalletType) ??
          getStoredSession()?.walletType ??
          "nns";
        sessionStorage.removeItem(SS_PENDING_KEY);
        saveSession({ walletType, principal, balanceICP: null });
        setWalletState((p) => ({
          ...p,
          connected: true,
          walletType,
          principal,
          balanceICP: null,
          connecting: false,
          error: null,
          popupBlocked: false,
          manualLoginUrl: null,
        }));
        return true;
      }
    } catch {}
    return false;
  }, []);

  const connectWallet = useCallback(async (type: WalletType) => {
    // ── NNS / NFID — always full-window redirect ─────────────────────────────
    if (type === "nns" || type === "nfid") {
      const providerUrl =
        type === "nns"
          ? "https://identity.ic0.app"
          : "https://nfid.one/authenticate";

      setWalletState((p) => ({
        ...p,
        connecting: true,
        error: null,
        popupBlocked: false,
        manualLoginUrl: null,
        walletType: type,
      }));

      try {
        const { AuthClient } = await import("@dfinity/auth-client");
        const authClient = await AuthClient.create({
          idleOptions: { disableIdle: true, disableDefaultIdleCallback: true },
        });

        // Save pending wallet type to sessionStorage BEFORE the redirect happens
        sessionStorage.setItem(SS_PENDING_KEY, type);

        // Full-window redirect — NO windowOpenerFeatures = full page redirect
        authClient.login({
          identityProvider: providerUrl,
          maxTimeToLive: SESSION_MAX_TTL,
          onSuccess: () => {
            // Called if the browser uses a popup internally; also called after redirect returns
            const identity = authClient.getIdentity();
            const principal = identity.getPrincipal().toString();
            sessionStorage.removeItem(SS_PENDING_KEY);
            saveSession({ walletType: type, principal, balanceICP: null });
            setWalletState((p) => ({
              ...p,
              connected: true,
              principal,
              balanceICP: null,
              connecting: false,
              walletType: type,
              error: null,
              popupBlocked: false,
              manualLoginUrl: null,
            }));
          },
          onError: (err) => {
            sessionStorage.removeItem(SS_PENDING_KEY);
            setWalletState((p) => ({
              ...p,
              connecting: false,
              error: err ?? "Login failed",
              walletType: null,
            }));
          },
        });
      } catch (e) {
        sessionStorage.removeItem(SS_PENDING_KEY);
        const msg =
          e instanceof Error
            ? e.message
            : `${type === "nns" ? "NNS" : "NFID"} login failed`;
        setWalletState((p) => ({
          ...p,
          connecting: false,
          error: msg,
          walletType: null,
        }));
      }
      return;
    }

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
      popupBlocked: false,
      manualLoginUrl: null,
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
        if (!ic) {
          window.open(
            "https://wallet.bitfinity.network/",
            "_blank",
            "noopener,noreferrer",
          );
          setWalletState((p) => ({
            ...p,
            connecting: false,
            error: "Bitfinity not installed. Opening install page...",
          }));
          return;
        }
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
          error:
            "Stoic Web App opened. Approve the connection, then return here.",
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

  /** Manual Principal ID entry for admin/pro users */
  const connectManualPrincipal = useCallback((principal: string) => {
    if (!principal.trim()) return;
    saveSession({
      walletType: "nns",
      principal: principal.trim(),
      balanceICP: null,
    });
    setWalletState((p) => ({
      ...p,
      connected: true,
      principal: principal.trim(),
      walletType: "nns",
      balanceICP: null,
      connecting: false,
      error: null,
      popupBlocked: false,
      manualLoginUrl: null,
    }));
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

  return {
    walletState,
    connectWallet,
    connectManualPrincipal,
    forceLoginCheck,
    payWithWallet,
    disconnect,
  };
}
