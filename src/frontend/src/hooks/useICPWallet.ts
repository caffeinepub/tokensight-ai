import { useCallback, useState } from "react";

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

const WALLET_INSTALL_URLS: Record<WalletType, string> = {
  plug: "https://plugwallet.ooo/",
  bitfinity: "https://wallet.bitfinity.network/",
  stoic: "https://www.stoicwallet.com/",
  nfid: "https://nfid.one/",
  nns: "https://nns.ic0.app/",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const win = () => window as any;

function isPlugInstalled(): boolean {
  return !!win().ic?.plug;
}
function isBitfinityInstalled(): boolean {
  return !!win().ic?.bitfinityWallet || !!win().bitfinityWallet;
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

export function useICPWallet() {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_STATE);

  const connectWallet = useCallback(async (type: WalletType) => {
    // NNS / Internet Identity — use AuthClient popup
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
            maxTimeToLive: BigInt(24 * 60 * 60 * 1000 * 1000 * 1000),
            windowOpenerFeatures:
              "toolbar=0,location=0,menubar=0,width=525,height=600,left=100,top=100",
            onSuccess: () => resolve(),
            onError: (err) =>
              reject(new Error(err ?? "Internet Identity login failed")),
          });
        });
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal().toString();
        setWalletState((p) => ({
          ...p,
          connected: true,
          principal,
          balanceICP: null,
          connecting: false,
          walletType: "nns",
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

    // Install / web redirect logic
    if (type === "plug" && !isPlugInstalled()) {
      window.open(WALLET_INSTALL_URLS.plug, "_blank", "noopener,noreferrer");
      setWalletState((p) => ({
        ...p,
        error: "Plug not installed. Opening install page...",
      }));
      return;
    }
    if (type === "bitfinity" && !isBitfinityInstalled()) {
      window.open(
        WALLET_INSTALL_URLS.bitfinity,
        "_blank",
        "noopener,noreferrer",
      );
      setWalletState((p) => ({
        ...p,
        error: "Bitfinity not installed. Opening install page...",
      }));
      return;
    }
    if (type === "stoic") {
      window.open(WALLET_INSTALL_URLS.stoic, "_blank", "noopener,noreferrer");
      setWalletState((p) => ({
        ...p,
        error:
          "Stoic Web App opened. Send ICP from stoicwallet.com, then use manual payment.",
      }));
      return;
    }
    if (type === "nfid") {
      window.open(WALLET_INSTALL_URLS.nfid, "_blank", "noopener,noreferrer");
      setWalletState((p) => ({
        ...p,
        error:
          "NFID opened in new tab. Complete login there, then return here.",
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
        setWalletState((p) => ({
          ...p,
          connected: true,
          balanceICP: icpEntry ? icpEntry.amount : 0,
          principal: principal ?? "plug-connected",
          connecting: false,
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
        setWalletState((p) => ({
          ...p,
          connected: true,
          balanceICP,
          principal: principal ?? "bitfinity-connected",
          connecting: false,
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

  const disconnect = useCallback(() => {
    setWalletState(INITIAL_STATE);
  }, []);

  return { walletState, connectWallet, payWithWallet, disconnect };
}
