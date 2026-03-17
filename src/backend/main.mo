import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Timer "mo:core/Timer";
import Principal "mo:core/Principal";
import Outcall "./http-outcalls/outcall";

actor TokensightAI {

  // ---- Visitor Analytics ----
  let visitors = Map.empty<Text, Int>(); // fingerprint -> last seen timestamp
  var totalPageViews : Int = 0;

  public func trackVisit(fingerprint : Text) : async () {
    totalPageViews += 1;
    visitors.add(fingerprint, Time.now());
  };

  public query func getVisitorStats() : async { uniqueVisitors : Int; totalPageViews : Int } {
    { uniqueVisitors = visitors.size(); totalPageViews = totalPageViews };
  };

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
  let verifiedTxids = Map.empty<Text, Int>(); // txid -> timestamp

  let RECIPIENT_ACCOUNT = "255275225e5f08f8c2ae0f0873dc36063f6fe23be44299a37896054a4f40351d";

  public query ({ caller }) func isPremium() : async Bool {
    switch (subscriptions.get(caller)) {
      case (?expiry) { expiry > Time.now() };
      case null { false };
    };
  };

  public query ({ caller }) func getSubscriptionExpiry() : async ?Int {
    subscriptions.get(caller);
  };

  public shared (msg) func verifyIcpPayment(tier : Text) : async Text {
    let url = "https://ic-api.internetcomputer.org/api/v3/accounts/" # RECIPIENT_ACCOUNT # "/transactions?limit=10";
    try {
      let result = await Outcall.httpGetRequest(url, [], transform);
      if (result.size() > 50) {
        let days : Int = if (tier == "yearly") { 365 } else { 30 };
        let nanos : Int = days * 24 * 60 * 60 * 1_000_000_000;
        let expiry : Int = Time.now() + nanos;
        subscriptions.add(msg.caller, expiry);
        return "success:premium_granted";
      } else {
        return "error:no_transaction_found";
      };
    } catch (_) {
      return "error:ledger_unreachable";
    };
  };

  public shared (msg) func submitTxidForVerification(txid : Text) : async Text {
    if (txid.size() != 64) {
      return "error:invalid_format";
    };
    switch (verifiedTxids.get(txid)) {
      case (?_) { return "error:txid_already_used" };
      case null {};
    };
    verifiedTxids.add(txid, Time.now());
    let thirtyDays : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    let expiry : Int = Time.now() + thirtyDays;
    subscriptions.add(msg.caller, expiry);
    "success:premium_granted";
  };

  public query func checkTxidVerified(txid : Text) : async Bool {
    switch (verifiedTxids.get(txid)) {
      case (?_) { true };
      case null { false };
    };
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
    } catch (_) {};
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

  let _timer = Timer.recurringTimer<system>(#seconds(300), doRefreshTokenCache);

  // ---- Global Signal Store (Unified Brain) ----
  // All active signals stored as JSON — this is the single source of truth
  // that all browser instances sync from, ensuring every user sees identical signals.
  var activeSignalsJson : Text = "[]";
  var signalHistoryJson : Text = "[]";
  var lastSignalUpdate : Int = 0;

  // Push the full active signals JSON (called by whichever instance generates new signals)
  public func putSignals(json : Text) : async () {
    activeSignalsJson := json;
    lastSignalUpdate := Time.now();
  };

  // Retrieve the canonical active signals JSON
  public query func getSignals() : async Text {
    activeSignalsJson;
  };

  // Push updated history JSON
  public func putSignalHistory(json : Text) : async () {
    signalHistoryJson := json;
  };

  // Retrieve the canonical signal history JSON
  public query func getSignalHistory() : async Text {
    signalHistoryJson;
  };

  // Get nanosecond timestamp of last signal update (for cache-invalidation checks)
  public query func getLastSignalUpdate() : async Int {
    lastSignalUpdate;
  };

};
