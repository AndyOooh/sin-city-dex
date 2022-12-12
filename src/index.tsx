import React from 'react';
import ReactDOM from 'react-dom/client';
import '@rainbow-me/rainbowkit/styles.css';
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { chains, client } from './wagmi';
import { BrowserRouter } from 'react-router-dom';

import './styles/index.scss';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <WagmiConfig client={client}>
      <BrowserRouter>
        <RainbowKitProvider
          chains={chains}
          theme={darkTheme({
            accentColor: '#95ede7',
            accentColorForeground: '#a356bf',
            overlayBlur: 'large',
          })}>
          <App />
        </RainbowKitProvider>
      </BrowserRouter>
    </WagmiConfig>
  </React.StrictMode>
);
