import axios from 'axios';
import { getNetwork } from '@wagmi/core';
import { getChainData } from './pages/dex/dex.service';

// const { chain } = getNetwork();
// console.log('🚀  file: App.tsx:9  network', chain);

// For common config
// axios.defaults.headers.post["Content-Type"] = "application/json";

// const baseURL =
// Number(chain?.id) === 1
// ? 'https://api.0x.org' // få fet i polygon også, evt check med dex.service.ts
// : Number(chain?.id) === 5
// ? 'https://goerli.api.0x.org'
// : 'https://api.0x.org';

const { zeroXApi: baseURL } = getChainData();

console.log('🚀  file: axios.ts:11  baseURL', baseURL);
export const cgAxios = axios.create({
  baseURL,
});
