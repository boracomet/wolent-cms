import { useState, useCallback, createContext, useContext, useRef, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useI18n } from "../i18n";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const confirm: ConfirmFn = useCallback((opts) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    state?.resolve(result);
    setState(null);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, close]);

  const variant = state?.variant ?? "danger";
  const variantStyles = {
    danger: {
      icon: "bg-red-500/15 text-red-400",
      btn: "bg-red-600 hover:bg-red-500 text-white",
    },
    warning: {
      icon: "bg-amber-500/15 text-amber-400",
      btn: "bg-amber-600 hover:bg-amber-500 text-white",
    },
    default: {
      icon: "bg-stone-300 dark:bg-zinc-700 text-stone-700 dark:text-zinc-300",
      btn: "bg-stone-900 dark:bg-zinc-100 hover:bg-stone-800 active:bg-stone-950 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 text-white dark:text-zinc-950",
    },
  }[variant];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === backdropRef.current) close(false); }}
        >
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl w-full max-w-md shadow-2xl mx-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4 p-6">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${variantStyles.icon}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-stone-900 dark:text-zinc-100 mb-1">
                  {state.title ?? t("common.confirm.defaultTitle")}
                </h3>
                <p className="text-sm text-stone-600 dark:text-zinc-400 leading-relaxed">
                  {state.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => close(false)}
                className="p-1 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded-md transition-colors shrink-0 -mt-1 -mr-1"
              >
                <X className="w-4 h-4 text-stone-500 dark:text-zinc-500" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2 text-sm text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors rounded-md hover:bg-stone-300 dark:hover:bg-zinc-800"
              >
                {state.cancelLabel ?? t("common.confirm.cancel")}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                autoFocus
                className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${variantStyles.btn}`}
              >
                {state.confirmLabel ?? t("common.confirm.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
