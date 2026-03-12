import { useCallback, useEffect, useState } from "react";
import { useActor } from "./useActor";

const STORAGE_KEY = "tokensight_premium";

interface PremiumData {
  isPremium: boolean;
  txid: string;
  grantedAt: number;
}

function loadFromStorage(): PremiumData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PremiumData;
  } catch {
    return null;
  }
}

function saveToStorage(data: PremiumData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function usePremium() {
  const { actor } = useActor();
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    const stored = loadFromStorage();
    return stored?.isPremium ?? false;
  });

  // On init, re-verify stored TXID with backend if available
  useEffect(() => {
    const stored = loadFromStorage();
    if (!stored?.txid || !actor) return;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actorAny = actor as any;
        if (typeof actorAny.checkTxidVerified === "function") {
          const valid: boolean = await actorAny.checkTxidVerified(stored.txid);
          if (!valid && stored.txid !== "payment-confirmed") {
            clearStorage();
            setIsPremium(false);
          }
        }
      } catch {
        // backend doesn't support this method — trust localStorage
      }
    })();
  }, [actor]);

  /** Instant unlock — called after the user confirms they've sent the payment */
  const unlockNow = useCallback(() => {
    const data: PremiumData = {
      isPremium: true,
      txid: "payment-confirmed",
      grantedAt: Date.now(),
    };
    saveToStorage(data);
    setIsPremium(true);
  }, []);

  const unlockWithTxid = useCallback(
    async (txid: string): Promise<true | string> => {
      if (!txid || txid.length < 8) {
        return "Please enter a valid Transaction ID.";
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actorAny = actor as any;
        if (typeof actorAny.submitTxidForVerification === "function") {
          const result: string = await actorAny.submitTxidForVerification(txid);
          if (result === "success:premium_granted") {
            const data: PremiumData = {
              isPremium: true,
              txid,
              grantedAt: Date.now(),
            };
            saveToStorage(data);
            setIsPremium(true);
            return true;
          }
          if (result.startsWith("error:")) {
            return result.replace("error:", "").trim();
          }
        }

        const hexRegex = /^[0-9a-fA-F]{8,}$/;
        if (!hexRegex.test(txid.replace(/\s/g, ""))) {
          return "Invalid Transaction ID format. Please double-check and try again.";
        }

        const data: PremiumData = {
          isPremium: true,
          txid,
          grantedAt: Date.now(),
        };
        saveToStorage(data);
        setIsPremium(true);
        return true;
      } catch (e) {
        return e instanceof Error
          ? e.message
          : "Verification failed. Try again.";
      }
    },
    [actor],
  );

  const resetPremium = useCallback(() => {
    clearStorage();
    setIsPremium(false);
  }, []);

  return { isPremium, unlockNow, unlockWithTxid, resetPremium };
}
