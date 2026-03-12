# Tokensight AI

## Current State
- Full glassmorphism dashboard with Internet Identity login, on-chain watchlist via backend canister, premium tier gating, AI Alpha section, and prediction accuracy charts.
- Header shows Login/Logout/Unlock Pro buttons tied to Internet Identity.
- WatchlistTab requires login and reads/writes from backend canister (useWatchlist, useAddToWatchlist, useRemoveFromWatchlist).
- DashboardTab gates Low-cap Gems behind premium subscription with blur overlay and Unlock Pro button.
- AlphaSection renders top 5 growth tokens with gold border cards.
- TokenCard has watchlist star button disabled when not logged in.
- Token data comes from backend cache (useTokenCache -> backend canister) and falls back to mock data.

## Requested Changes (Diff)

### Add
- Local-storage-based watchlist hook (useLocalWatchlist) that reads/writes to localStorage without any backend calls.
- Neon glow CSS effect on AlphaSection cards (stronger pulsing box-shadow with gold/cyan neon).
- Mobile-responsive optimizations: smaller padding, better grid breakpoints, touch-friendly tap targets.

### Modify
- Header: Remove Login, Logout, and Unlock Pro buttons entirely. Keep only the logo and disclaimer banner.
- DashboardTab: Remove premium tier gate. Show all tokens (Top 20 + Low-cap Gems) for free without blur overlay or lock. Remove isPremium / subscribePremium logic.
- WatchlistTab: Replace backend canister watchlist logic with localStorage-based watchlist. Remove login-required gate — watchlist is always accessible. Star/unstar tokens saved to localStorage key "tokensight_watchlist".
- TokenCard: Wire watchlist star button to local storage hook (always enabled, no login check). Remove isLoggedIn guard.
- AlphaSection: Enhance neon glow effect on cards — stronger animated box-shadow with gold and cyan.
- useTokenData: Keep mock fallback. Ensure data loads correctly if cache is empty.

### Remove
- All Internet Identity login/logout UI flows.
- Premium subscription gate and Unlock Pro button everywhere.
- WatchlistTab login prompt screen.
- Backend watchlist mutations (useAddToWatchlist, useRemoveFromWatchlist, useWatchlist) usage from UI components — replaced by local storage.

## Implementation Plan
1. Create `src/frontend/src/hooks/useLocalWatchlist.ts` — localStorage-backed watchlist with add/remove/check functions, exposed as a React hook using useState + useEffect.
2. Update `Header.tsx` — remove all auth buttons; keep logo, subtitle, disclaimer banner only.
3. Update `DashboardTab.tsx` — remove isPremium check, show all tokens free. Remove lock overlay and Unlock Pro button. Show Low-cap Gems unconditionally.
4. Update `WatchlistTab.tsx` — replace useWatchlist/useRemoveFromWatchlist with useLocalWatchlist. Remove login guard. Keep empty state and token list UI.
5. Update `TokenCard.tsx` — replace useWatchlist/useAddToWatchlist/useRemoveFromWatchlist with useLocalWatchlist. Remove isLoggedIn guard, always enable star button.
6. Update `AlphaSection.tsx` — add stronger animated neon glow to cards.
7. Verify mobile responsiveness across all components (padding, grid, font sizes).
