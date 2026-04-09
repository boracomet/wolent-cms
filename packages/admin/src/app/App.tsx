import { useEffect, useState, Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './api/AuthContext';
import { I18nProvider, useI18n } from './i18n';
import { SetupWizard } from './components/SetupWizard';
import { RouterErrorBoundary } from './components/RouterErrorBoundary';
import { ConfirmProvider } from './components/ConfirmDialog';

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

function isSetupForced(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('setup') === '1';
  } catch {
    return false;
  }
}

function AppInner() {
  const { t } = useI18n();
  const [state, setState] = useState<AppState>('loading');
  const [apiDownRetry, setApiDownRetry] = useState(0);

  useEffect(() => {
    setState('loading');
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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-stone-100 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 dark:border-zinc-700 border-t-zinc-100" />
        <p className="text-xs text-stone-600 dark:text-zinc-600">{t('common.appShell.loading')}</p>
      </div>
    );
  }

  if (state === 'api-down') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-stone-100 dark:bg-zinc-950 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-red-400 text-xl">!</span>
        </div>
        <div>
          <p className="text-stone-900 dark:text-zinc-100 font-medium mb-1">{t('common.appShell.apiDownTitle')}</p>
          <p className="text-stone-500 dark:text-zinc-500 text-sm max-w-xs">{t('common.appShell.apiDownBody')}</p>
        </div>
        <button
          type="button"
          onClick={() => setApiDownRetry(n => n + 1)}
          className="mt-2 px-5 py-2 rounded-lg bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 active:bg-stone-400/90 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 text-stone-800 dark:text-zinc-200 text-sm transition-colors"
        >
          {t('common.appShell.retry')}
        </button>
      </div>
    );
  }

  if (state === 'setup') {
    return <SetupWizard onComplete={() => setState('ready')} />;
  }

  return (
    <AuthProvider>
      <ConfirmProvider>
        <RouterErrorBoundary>
          <Suspense
            fallback={
              <div className="flex min-h-[100dvh] items-center justify-center bg-stone-100 dark:bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 dark:border-zinc-700 border-t-zinc-100" />
              </div>
            }
          >
            <RouterProvider router={router} />
          </Suspense>
        </RouterErrorBoundary>
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}
