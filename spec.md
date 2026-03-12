# TokenSight AI - Final Policy Implementation

## Current State
Full-stack crypto trading dApp. Live Binance WebSocket, SMC signals, Golden Sniper card, ICP wallet connections (Plug, Bitfinity), admin panel at /tokensight-admin, signal history in localStorage.

## Requested Changes (Diff)

### Add
- NNS AuthClient login using https://identity.ic0.app (popup, retrieves principal)
- Golden Sniper 24h persistence lifecycle rules
- isGoldenSniper flag and entryTime, tp1HitAt, slHitAt tracking fields in HistoryEntry
- Golden Track Record sub-tab in History tab
- Manual Close buttons in /tokensight-admin for active signals

### Modify
- useICPWallet.ts: NNS case uses AuthClient instead of just opening a tab
- useSignalHistory.ts: 24h lifecycle, manualClose(), isGoldenSniper field
- SignalHistoryTab.tsx: sub-tabs All Signals / Golden Track Record
- AdminPanel.tsx: active signals list with Manual Close, NNS login option
- App.tsx: pass history, manualClose, signals to AdminPanel

### Remove
- Old NNS tab-only fallback without principal retrieval

## Implementation Plan
1. useSignalHistory.ts - new fields, 24h lifecycle, manualClose
2. useICPWallet.ts - AuthClient NNS login
3. SignalHistoryTab.tsx - sub-tabs
4. AdminPanel.tsx - manual close UI + NNS connect
5. App.tsx - wire everything
