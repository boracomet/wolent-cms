import { useEffect, useState, Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './api/AuthContext';
import { I18nProvider } from './i18n/I18nProvider';
import { SetupWizard } from './components/SetupWizard';
import { RouterErrorBoundary } from './components/RouterErrorBoundary';

type AppState = 'loading' | 'setup' | 'ready' | 'api-down';

async function checkSetupStatus(retries = 3): Promise<boolean | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch('/api/setup/status');
      const json = await r.json() as { data?: { required: boolean } };
      return json.data?.required ?? false;
    } catch {
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, 1200 * (i + 1)));
      }
    }
  }
  return null; // API unreachable after retries
}

// Dev-only: ?setup=1 in the URL forces the wizard regardless of DB state.
// Useful for testing the wizard after the first run is already complete.
function isSetupForced(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('setup') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [state, setState] = useState<AppState>('loading');
  const [apiDownRetry, setApiDownRetry] = useState(0);

  useEffect(() => {
    setState('loading');
    // ?setup=1 → show wizard regardless of DB state (dev/demo use)
    if (isSetupForced()) {
      setState('setup');
      return;
    }
    checkSetupStatus(3).then(required => {
      if (required === null) {
        setState('api-down');
      } else if (required) {
        setState('setup');
      } else {
        setState('ready');
      }
    });
  }, [apiDownRetry]);

  if (state === 'loading') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-100" />
        <p className="text-xs text-zinc-600">Connecting to API…</p>
      </div>
    );
  }

  if (state === 'api-down') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-zinc-950 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-red-400 text-xl">!</span>
        </div>
        <div>
          <p className="text-zinc-100 font-medium mb-1">Cannot reach the API</p>
          <p className="text-zinc-500 text-sm max-w-xs">
            Make sure the backend is running on <code className="text-zinc-400">localhost:3000</code>.
          </p>
        </div>
        <button
          onClick={() => setApiDownRetry(n => n + 1)}
          className="mt-2 px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state === 'setup') {
    return (
      <I18nProvider>
        <SetupWizard onComplete={() => setState('ready')} />
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
      <AuthProvider>
        <RouterErrorBoundary>
          <Suspense
            fallback={
              <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-100" />
              </div>
            }
          >
            <RouterProvider router={router} />
          </Suspense>
        </RouterErrorBoundary>
      </AuthProvider>
    </I18nProvider>
  );
}
