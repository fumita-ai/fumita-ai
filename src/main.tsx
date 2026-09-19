import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { StoreProvider } from './store';
import './index.css';

// オンライン時に新しいバージョンがあれば自動で更新する(要件 2.1)。
registerSW({ immediate: true });

// データが自動削除されにくいようにする(要件 2.2)。
if (typeof navigator !== 'undefined' && navigator.storage?.persist !== undefined) {
  void navigator.storage.persist().catch(() => undefined);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
