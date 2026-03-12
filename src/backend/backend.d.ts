import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface _SERVICE {
  addToWatchlist: ActorMethod<[string], undefined>;
  removeFromWatchlist: ActorMethod<[string], undefined>;
  getWatchlist: ActorMethod<[], string[]>;
  subscribePremium: ActorMethod<[], string>;
  isPremium: ActorMethod<[], boolean>;
  getSubscriptionExpiry: ActorMethod<[], [bigint] | []>;
  refreshTokenCache: ActorMethod<[], undefined>;
  getTokenCache: ActorMethod<[], string>;
  getLastRefresh: ActorMethod<[], bigint>;
}
