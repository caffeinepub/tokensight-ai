interface Window {
  ic?: {
    plug?: {
      requestConnect(params?: {
        whitelist?: string[];
        host?: string;
      }): Promise<boolean>;
      requestBalance(): Promise<
        Array<{
          amount: number;
          currency: string;
          image: string;
          name: string;
          value: number;
        }>
      >;
      requestTransfer(params: {
        to: string;
        amount: number;
        opts?: object;
      }): Promise<{ height: number }>;
      isConnected(): Promise<boolean>;
      disconnect(): Promise<void>;
    };
    bitfinityWallet?: {
      requestConnect(params?: { whitelist?: string[] }): Promise<string>;
      getBalance(): Promise<{ value: string; decimals: number } | number>;
      transfer(params: {
        to: string;
        amount: number;
        sendICPTs?: number;
      }): Promise<{ height: number }>;
      disconnect(): Promise<void>;
    };
  };
}
