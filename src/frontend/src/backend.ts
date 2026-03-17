import { Actor, HttpAgent } from "@icp-sdk/core/agent";

export class ExternalBlob {
  private _url: string;
  onProgress?: (progress: number) => void;

  constructor(url: string) {
    this._url = url;
  }

  static fromURL(url: string): ExternalBlob {
    return new ExternalBlob(url);
  }

  async getBytes(): Promise<Uint8Array> {
    const res = await fetch(this._url);
    return new Uint8Array(await res.arrayBuffer());
  }
}

export type backendInterface = {
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
  addToWatchlist(symbol: string): Promise<undefined>;
  removeFromWatchlist(symbol: string): Promise<undefined>;
  getWatchlist(): Promise<string[]>;
  subscribePremium(): Promise<string>;
  isPremium(): Promise<boolean>;
  getSubscriptionExpiry(): Promise<[bigint] | []>;
  refreshTokenCache(): Promise<undefined>;
  getTokenCache(): Promise<string>;
  getLastRefresh(): Promise<bigint>;
  // Unified Signal Sync — canister as single source of truth
  putSignals(json: string): Promise<undefined>;
  getSignals(): Promise<string>;
  putSignalHistory(json: string): Promise<undefined>;
  getSignalHistory(): Promise<string>;
  getLastSignalUpdate(): Promise<bigint>;
};

export interface CreateActorOptions {
  agentOptions?: ConstructorParameters<typeof HttpAgent>[0];
  actorOptions?: { agent?: HttpAgent };
  agent?: HttpAgent;
  processError?: (e: unknown) => never;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const idlFactory = ({ IDL }: { IDL: any }) => {
  return IDL.Service({
    addToWatchlist: IDL.Func([IDL.Text], [], []),
    removeFromWatchlist: IDL.Func([IDL.Text], [], []),
    getWatchlist: IDL.Func([], [IDL.Vec(IDL.Text)], ["query"]),
    subscribePremium: IDL.Func([], [IDL.Text], []),
    isPremium: IDL.Func([], [IDL.Bool], ["query"]),
    getSubscriptionExpiry: IDL.Func([], [IDL.Opt(IDL.Nat64)], ["query"]),
    refreshTokenCache: IDL.Func([], [], []),
    getTokenCache: IDL.Func([], [IDL.Text], ["query"]),
    getLastRefresh: IDL.Func([], [IDL.Nat64], ["query"]),
    // Signal sync
    putSignals: IDL.Func([IDL.Text], [], []),
    getSignals: IDL.Func([], [IDL.Text], ["query"]),
    putSignalHistory: IDL.Func([IDL.Text], [], []),
    getSignalHistory: IDL.Func([], [IDL.Text], ["query"]),
    getLastSignalUpdate: IDL.Func([], [IDL.Nat64], ["query"]),
  });
};

export function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): backendInterface {
  const agent = options?.agent ?? new HttpAgent(options?.agentOptions);

  // biome-ignore lint/suspicious/noExplicitAny: required for actor creation
  const actor = Actor.createActor(idlFactory as any, {
    agent,
    canisterId,
  }) as backendInterface;

  return actor;
}
