import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface _SERVICE {
  trackVisit: ActorMethod<[string], undefined>;
  getVisitorStats: ActorMethod<[], { uniqueVisitors: bigint; totalPageViews: bigint }>;
  addToWatchlist: ActorMethod<[string], undefined>;
  removeFromWatchlist: ActorMethod<[string], undefined>;
  getWatchlist: ActorMethod<[], string[]>;
  isPremium: ActorMethod<[], boolean>;
  getSubscriptionExpiry: ActorMethod<[], [bigint] | []>;
  verifyIcpPayment: ActorMethod<[string], string>;
  submitTxidForVerification: ActorMethod<[string], string>;
  checkTxidVerified: ActorMethod<[string], boolean>;
  refreshTokenCache: ActorMethod<[], undefined>;
  getTokenCache: ActorMethod<[], string>;
  getLastRefresh: ActorMethod<[], bigint>;
}
