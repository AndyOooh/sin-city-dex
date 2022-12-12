import { useCallback } from 'react';
// import { cgAxios } from '../axios';
// import { Side, TokenPair } from '../types/types';
import { getNetwork } from '@wagmi/core';
import { cgAxios } from '../../axios';
import { Side, TokenPair } from '../../types/types';
import axios from 'axios';

const { chain } = getNetwork();
console.log('🚀  file: dex.service.ts:10  chain', chain);

// type getQuoteType = {
//   currentPair: TokenPair;
//   side: Side;
//   formValue: number;
//   takerAddress: string;
// };

export const getQuote = async (
  currentPair: TokenPair,
  side: Side,
  value: number,
  takerAddress: string
) => {
  console.log('🚀  file: dex.service.ts:24  takerAddress', takerAddress);
  const { sell: sellToken, buy: buyToken } = currentPair;
  if (!sellToken || !buyToken) return;
  let sellOrBuyQuery;
  let decimals;
  if (side === 'sell') {
    sellOrBuyQuery = 'sellAmount';
    decimals = sellToken.decimals;
  } else {
    sellOrBuyQuery = 'buyAmount';
    decimals = buyToken.decimals;
  }

  // ethers.utils.parseEther(amount.toString())
  const amountDecimals = (Number(value) * 10 ** decimals).toString();
  console.log('🚀  file: dex.service.ts:39  amountDecimals', amountDecimals);

  const params = {
    sellToken: sellToken?.address,
    buyToken: buyToken?.address,
    [sellOrBuyQuery]: amountDecimals,
    takerAddress,
    // skipValidation: true,
  };

  try {
    const { data } = await cgAxios.get('/swap/v1/quote', { params });
    // setPairPrice(result);
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const fetchTokenList = async (chainId: number | undefined) => {
  if (typeof chainId !== 'number') return;
  if (chainId === 5) {
    return await import('../../assets/goerli-tokens.json');
  } else if (chainId === 80001) {
    return await import('../../assets/mumbai-tokens.json');
  } else {
    const { tokenListUrl } = getChainData();
    const { data } = await axios.get(tokenListUrl);
    return data;
  }
};

export const getChainData = () => {
  console.log('chain', chain);
  let zeroXExchangeProxy;
  let tokenListUrl: string;
  let zeroXApi;
  switch (chain?.id) {
    case 5:
      zeroXExchangeProxy = '0xf91bb752490473b8342a3e964e855b9f9a2a668e';
      tokenListUrl = '';
      zeroXApi = 'https://goerli.api.0x.org';
      break;
    case 137:
      zeroXExchangeProxy = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';
      tokenListUrl =
        'https://api-polygon-tokens.polygon.technology/tokenlists/polygonTokens.tokenlist.json';
      zeroXApi = 'https://polygon.api.0x.org/';
      break;
    case 80001:
      // zeroXExchangeProxy = '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b';
      zeroXExchangeProxy = '0xF471D32cb40837bf24529FCF17418fC1a4807626';
      tokenListUrl =
        'https://api-polygon-tokens.polygon.technology/tokenlists/testnet.tokenlist.json';
      zeroXApi = 'https://mumbai.api.0x.org/';
      break;
    default: // mainnet
      zeroXExchangeProxy = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';
      tokenListUrl = 'https://tokens.coingecko.com/uniswap/all.json';
      zeroXApi = 'https://api.0x.org/';
  }
  return { zeroXExchangeProxy, tokenListUrl, zeroXApi };
};
