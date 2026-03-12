# TokenSight AI

## Current State
The app has:
- 5-wallet connect modal with AuthClient redirect for NNS/NFID and a "Force Login" backup button
- Signal data from `useTokenData` hook with `signals` array
- `signalCount={signals.length}` passed to DashboardTab
- History tab shows signal history with golden track record subtab
- Free users see first signal free, rest locked; but Golden Track Record subtab is accessible to free users
- Price formatting uses `.toFixed(8)` for sub-$1, 2 decimals for $1+
- Admin principal bypass via `grantAdminAccess()` on wallet connect

## Requested Changes (Diff)

### Add
- Global `activeSignalsCount` variable derived from `signals.length` in App.tsx, passed to DashboardTab, SignalHistoryTab, and AlphaSection
- "Refresh & Sync Identity" button in wallet modal (rename/enhance the existing Force Login button) — triggers the same `forceLoginCheck` logic
- Price fallback: store last known price in a ref so `$0.000` never displays; use fallback if live price is 0 or unavailable

### Modify
- **DashboardTab**: `signalCount` shows `activeSignalsCount` (not hardcoded), sub-label reads `${activeSignalsCount} active` to match actual signal count
- **SignalHistoryTab**: Pass `activeSignalsCount` and show accurate active count. Hide Golden Track Record tab completely for free users (not just blur — remove tab button); free users only see the first 1 completed signal row (not 5)
- **AlphaSection**: Free user rule strictly enforced — only index[0] fully visible, index[1+] blurred and locked. Golden Sniper card also locked/blurred with Unlock button for non-pro/non-admin users
- **Header/Wallet Modal**: Rename "Force Login (Recover Session)" to "Refresh & Sync Identity" for clarity
- **Price formatting**: Update `fmt()` function in DashboardTab and signal price formatting in AlphaSection:
  - Under $0.001 (0.001): use `.toFixed(8)`
  - $0.001 to $1: use `.toFixed(6)` for clarity  
  - Over $1: use 2 decimal places with thousands separator
  - Never show $0.000 — use last known price as fallback
- **Admin bypass**: Already working; ensure `isAdminAccess` also unlocks GoldenTrack tab

### Remove
- Any hardcoded signal count numbers or legacy sample data
- Golden Track Record tab access for free (non-pro, non-admin) users

## Implementation Plan
1. Update `fmt()` price function with correct thresholds ($0.001 breakpoint for 8 decimals, $1 for 2 decimals); add last-known-price fallback in DashboardTab
2. In App.tsx: derive `activeSignalsCount = signals.length` and pass to all tabs
3. In SignalHistoryTab: hide Golden Track Record tab for non-pro/non-admin; show only 1 row (index[0]) for free users in completed history
4. In AlphaSection: enforce strict index[0] free rule, lock all others including golden sniper with blur/overlay for non-pro/non-admin
5. In Header: rename "Force Login (Recover Session)" to "Refresh & Sync Identity"
6. In DashboardTab: use `activeSignalsCount` prop for the Signals Today stat, sub reads `${activeSignalsCount} active`
