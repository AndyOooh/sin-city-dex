export type Token = {
    address: string;
    chainId: number;
    decimals: number;
    logoURI: string;
    name: string;
    symbol: string;
  };
  
  export type TokenPair = {
    sell: Token | null;
    buy: Token | null;
  };

  export type Side = 'sell' | 'buy';