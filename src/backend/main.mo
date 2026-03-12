import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Timer "mo:core/Timer";
import Principal "mo:core/Principal";
import Outcall "./http-outcalls/outcall";

actor TokensightAI {

  // ---- Watchlist ----
  let watchlists = Map.empty<Principal, [Text]>();

  public shared ({ caller }) func addToWatchlist(symbol : Text) : async () {
    let current = switch (watchlists.get(caller)) {
      case (?list) { list };
      case null { [] };
    };
    let exists = current.find(func(s : Text) : Bool { s == symbol });
    if (exists == null) {
      watchlists.add(caller, current.concat([symbol]));
    };
  };

  public shared ({ caller }) func removeFromWatchlist(symbol : Text) : async () {
    let current = switch (watchlists.get(caller)) {
      case (?list) { list };
      case null { [] };
    };
    watchlists.add(caller, current.filter(func(s : Text) : Bool { s != symbol }));
  };

  public query ({ caller }) func getWatchlist() : async [Text] {
    switch (watchlists.get(caller)) {
      case (?list) { list };
      case null { [] };
    };
  };

  // ---- Premium Subscriptions ----
  let subscriptions = Map.empty<Principal, Int>();

  public shared ({ caller }) func subscribePremium() : async Text {
    let thirtyDays : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    let expiry : Int = Time.now() + thirtyDays;
    subscriptions.add(caller, expiry);
    "Premium activated for 30 days";
  };

  public query ({ caller }) func isPremium() : async Bool {
    switch (subscriptions.get(caller)) {
      case (?expiry) { expiry > Time.now() };
      case null { false };
    };
  };

  public query ({ caller }) func getSubscriptionExpiry() : async ?Int {
    subscriptions.get(caller);
  };

  // ---- Token Cache ----
  var tokenCache : Text = "";
  var lastRefresh : Int = 0;

  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    Outcall.transform(input);
  };

  func doRefreshTokenCache() : async () {
    let url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1";
    try {
      let result = await Outcall.httpGetRequest(url, [], transform);
      tokenCache := result;
      lastRefresh := Time.now();
    } catch (_) {
      // keep stale cache on error
    };
  };

  public func refreshTokenCache() : async () {
    await doRefreshTokenCache();
  };

  public query func getTokenCache() : async Text {
    tokenCache;
  };

  public query func getLastRefresh() : async Int {
    lastRefresh;
  };

  // Refresh every 5 minutes
  let _timer = Timer.recurringTimer<system>(#seconds(300), doRefreshTokenCache);

};
