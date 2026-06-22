import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { GameSyncProvider } from './lib/GameSync.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameSyncProvider>
      <App />
    </GameSyncProvider>
  </StrictMode>,
);
