import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Smart price formatter with subscript notation for micro-prices.
 * < $0.001: subscript zeros (e.g. $0.0₅593)
 * < $1: 8 decimals
 * >= $1: 2 decimals with comma separator
 */
export function fmtPrice(value: number): string {
  if (!value || value <= 0) return "0.00";

  if (value >= 1) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (value >= 0.001) {
    return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
  }

  // Micro-price: use subscript zero notation
  const str = value.toFixed(12);
  const match = str.match(/^0\.(0+)([1-9]\d{0,3})/);
  if (match) {
    const zeros = match[1].length;
    const significant = match[2];
    const subscriptMap: Record<string, string> = {
      "0": "₀",
      "1": "₁",
      "2": "₂",
      "3": "₃",
      "4": "₄",
      "5": "₅",
      "6": "₆",
      "7": "₇",
      "8": "₈",
      "9": "₉",
    };
    const subscriptZeros = String(zeros)
      .split("")
      .map((d) => subscriptMap[d] ?? d)
      .join("");
    return `0.0${subscriptZeros}${significant}`;
  }

  return value.toFixed(10);
}
