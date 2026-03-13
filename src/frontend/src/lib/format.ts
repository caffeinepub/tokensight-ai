/**
 * Price formatting utilities for TokenSight AI
 */

/**
 * Smart price formatter:
 * - >= $1: 2 decimal places with thousands separator
 * - $0.001 to $1: 6 decimal places
 * - < $0.001: subscript zero compression e.g. $0.0₅593
 */
export function fmtPrice(value: number): string {
  if (!value || Number.isNaN(value) || value <= 0) return "$0.00";

  if (value >= 1) {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (value >= 0.001) {
    return `$${value.toFixed(6)}`;
  }

  // Subscript zero compression for micro-prices
  const str = value.toFixed(10);
  // Find leading zeros after "0."
  const afterDot = str.split(".")[1] ?? "";
  let leadingZeros = 0;
  for (const ch of afterDot) {
    if (ch === "0") leadingZeros++;
    else break;
  }
  if (leadingZeros >= 3) {
    const subscripts = [
      "\u2080",
      "\u2081",
      "\u2082",
      "\u2083",
      "\u2084",
      "\u2085",
      "\u2086",
      "\u2087",
      "\u2088",
      "\u2089",
    ];
    const sub = subscripts[leadingZeros] ?? leadingZeros.toString();
    const sig = afterDot.slice(leadingZeros).slice(0, 4);
    return `$0.0${sub}${sig}`;
  }

  return `$${value.toFixed(8)}`;
}
