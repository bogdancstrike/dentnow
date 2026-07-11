import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadRuntimeConfig } from './config/runtime';
import './styles/main.css';

/**
 * Load `/config.json` before mounting React. There is no compiled content fallback:
 * if runtime configuration is unavailable the app renders an explicit error rather
 * than silently showing stale or missing data.
 */
async function bootstrap(): Promise<void> {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    throw new Error('missing #root element');
  }

  try {
    await loadRuntimeConfig();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[DentNow] runtime configuration unavailable', error);
    rootEl.textContent =
      'Configurare indisponibilă. Vă rugăm reîncărcați pagina.';
    return;
  }

  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
