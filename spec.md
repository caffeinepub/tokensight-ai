# TokenSight AI

## Current State
Signals are generated client-side in `swingEngine.ts` using `Math.random()` independently in every browser. While a Motoko canister exists as a central store and sync runs every 30 seconds, the sync uses a "merge" strategy that lets each browser keep its own locally-generated signals. This means Phone A and Phone B produce entirely different signal sets and never truly converge.

## Requested Changes (Diff)

### Add
- Deterministic PRNG (seeded by `symbol + timeSlot`) in `swingEngine.ts` so every browser that runs the scanner in the same 10-minute window produces bit-for-bit identical signals
- `seededRandom(seed)` and `getSignalSeed(symbol, timeSlot)` helpers replacing all `Math.random()` calls in scan logic
- `replaceFromCanister()` function in `backendSync.ts` that does a full state replace (not merge)

### Modify
- `swingEngine.ts` — replace every `Math.random()` in `runSwingScan()` with the seeded PRNG; change `syncFromCanister()` to full replace; remove localStorage as initial signal source (always pull canister first)
- `backendSync.ts` — expose `replaceFromCanister()` for authoritative full sync
- `App.tsx` — reduce canister poll from 30 s → 15 s for faster cross-device convergence

### Remove
- Merge logic in `syncFromCanister()` that allows local signals to coexist with canister signals
- Initial localStorage signal load before canister pull (localStorage now only used as offline fallback cache)

## Implementation Plan
1. Add deterministic PRNG helpers to `swingEngine.ts`
2. Replace all `Math.random()` calls inside `runSwingScan()` with seeded equivalents using `symbol + timeSlot` seed
3. Rewrite `syncFromCanister()` to do a hard replace: canister data wins completely
4. On `initSwingEngine()`, pull canister FIRST and replace local state before any scan runs
5. Update `App.tsx` canister poll interval to 15 s
6. Push newly generated signals to canister immediately after generation (unchanged)
