import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './api/AuthContext';
import { I18nProvider } from './i18n/I18nProvider';
import { SetupWizard } from './components/SetupWizard';

type AppState = 'loading' | 'setup' | 'ready';

export default function App() {
  const [state, setState] = useState<AppState>('loading');

  useEffect(() => {
    // Check if setup is required on every app load
    fetch('/api/setup/status')
      .then(r => r.json())
      .then((json: { data?: { required: boolean } }) => {
        if (json.data?.required) {
          setState('setup');
        } else {
          setState('ready');
        }
      })
      .catch(() => {
        // If API is unreachable, show the app anyway (dev mode / offline)
        setState('ready');
      });
  }, []);

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-100" />
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
        <RouterProvider router={router} />
      </AuthProvider>
    </I18nProvider>
  );
}
