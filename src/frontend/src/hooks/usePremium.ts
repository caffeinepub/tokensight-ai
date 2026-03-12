import { useCallback, useEffect, useState } from "react";

export type ProTier = "monthly" | "yearly";

export interface PremiumState {
  isPro: boolean;
  proTier: ProTier | null;
  purchaseDate: number | null;
  daysRemaining: number | null;
  isAdminAccess: boolean;
  unlockPro: (tier: ProTier) => void;
  grantAdminAccess: () => void;
  revokePro: () => void;
}

const TIER_DAYS: Record<ProTier, number> = {
  monthly: 30,
  yearly: 365,
};

export function usePremium(): PremiumState {
  const [isPro, setIsPro] = useState(false);
  const [proTier, setProTier] = useState<ProTier | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<number | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isAdminAccess, setIsAdminAccess] = useState(false);

  const revokePro = useCallback(() => {
    localStorage.removeItem("proTier");
    localStorage.removeItem("purchaseDate");
    setIsPro(false);
    setProTier(null);
    setPurchaseDate(null);
    setDaysRemaining(null);
    setIsAdminAccess(false);
  }, []);

  const grantAdminAccess = useCallback(() => {
    setIsPro(true);
    setIsAdminAccess(true);
    setProTier("yearly");
    setDaysRemaining(365);
  }, []);

  useEffect(() => {
    const storedTier = localStorage.getItem("proTier") as ProTier | null;
    const storedDate = localStorage.getItem("purchaseDate");
    if (storedTier && storedDate) {
      const purchasedAt = Number(storedDate);
      const now = Date.now();
      const maxDays = TIER_DAYS[storedTier];
      const elapsed = (now - purchasedAt) / (1000 * 60 * 60 * 24);
      const remaining = Math.ceil(maxDays - elapsed);
      if (remaining <= 0) {
        revokePro();
      } else {
        setIsPro(true);
        setProTier(storedTier);
        setPurchaseDate(purchasedAt);
        setDaysRemaining(remaining);
      }
    }
  }, [revokePro]);

  const unlockPro = useCallback((tier: ProTier) => {
    const now = Date.now();
    localStorage.setItem("proTier", tier);
    localStorage.setItem("purchaseDate", String(now));
    setIsPro(true);
    setProTier(tier);
    setPurchaseDate(now);
    setDaysRemaining(TIER_DAYS[tier]);
  }, []);

  return {
    isPro,
    proTier,
    purchaseDate,
    daysRemaining,
    isAdminAccess,
    unlockPro,
    grantAdminAccess,
    revokePro,
  };
}
