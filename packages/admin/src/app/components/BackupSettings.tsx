import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Archive,
  ShieldCheck,
  Download,
  Trash2,
  RotateCcw,
  Upload,
  Check,
  AlertCircle,
  KeyRound,
  Lock,
} from "lucide-react";
import { useI18n } from "../i18n";
import { api } from "../api/client";

const MFA_SESSION_KEY = "cms-settings-backup-mfa";

export type BackupIncluded = {
  contentTypes: boolean;
  mediaLibrary: boolean;
  users: boolean;
  membershipsRoles: boolean;
  plugins: boolean;
  panelSettings: boolean;
};

export type CmsBackupFile = {
  cmsBackup: true;
  version: string;
  createdAt: string;
  label: string;
  included: BackupIncluded;
  data: Record<string, unknown>;
};

const defaultIncluded = (): BackupIncluded => ({
  contentTypes: true,
  mediaLibrary: true,
  users: true,
  membershipsRoles: true,
  plugins: true,
  panelSettings: true,
});

function readMfaUnlocked(): boolean {
  try {
    return sessionStorage.getItem(MFA_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function setMfaUnlocked() {
  try {
    sessionStorage.setItem(MFA_SESSION_KEY, "1");
  } catch { /* ignore */ }
}

function clearMfaSession() {
  try {
    sessionStorage.removeItem(MFA_SESSION_KEY);
  } catch { /* ignore */ }
}

export function BackupSettings() {
  const { t } = useI18n();
  const [mfaOk, setMfaOk] = useState(() => readMfaUnlocked());
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState(false);
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [hasTwoFactor, setHasTwoFactor] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const [exportInclude, setExportInclude] = useState<BackupIncluded>(() => defaultIncluded());
  const [importInclude, setImportInclude] = useState<BackupIncluded>(() => defaultIncluded());
  const [importFile, setImportFile] = useState<CmsBackupFile | null>(null);
  const [importRawName, setImportRawName] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mfaOk) return;
    let cancelled = false;
    api.auth.me().then((res) => {
      if (cancelled) return;
      setHasTwoFactor(!!res.data.twoFactorEnabled);
      setUserEmail(res.data.email);
    }).catch(() => {
      if (!cancelled) setHasTwoFactor(false);
    });
    return () => { cancelled = true; };
  }, [mfaOk]);

  const showToast = useCallback((msg: string, error = false) => {
    setToast({ msg, error });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const verifyMfa = async () => {
    const code = mfaCode.replace(/\s/g, "");
    if (!code) { setMfaError(true); return; }
    setMfaVerifying(true);
    try {
      if (hasTwoFactor) {
        await api.auth.verify2fa(code);
        setMfaUnlocked();
        setMfaOk(true);
        setMfaError(false);
        setMfaCode("");
      } else {
        const loginRes = await api.auth.login(userEmail, code);
        if (loginRes.data.accessToken || loginRes.data.requiresTwoFactor) {
          setMfaUnlocked();
          setMfaOk(true);
          setMfaError(false);
          setMfaCode("");
        } else {
          setMfaError(true);
        }
      }
    } catch {
      setMfaError(true);
    } finally {
      setMfaVerifying(false);
    }
  };

  const lockAgain = () => {
    clearMfaSession();
    setMfaOk(false);
    setMfaCode("");
  };

  const toggleExport = (key: keyof BackupIncluded) =>
    setExportInclude((p) => ({ ...p, [key]: !p[key] }));

  const toggleImport = (key: keyof BackupIncluded) =>
    setImportInclude((p) => ({ ...p, [key]: !p[key] }));

  const anyExportSelected = useMemo(() => Object.values(exportInclude).some(Boolean), [exportInclude]);

  const createBackup = async () => {
    if (!anyExportSelected) { showToast(t("settings.backup.nothingSelected"), true); return; }
    setExporting(true);
    try {
      const backup = await api.backup.export(exportInclude as unknown as Record<string, boolean>);
      const payload = JSON.stringify(backup, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wolent-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("settings.backup.created"));
    } catch {
      showToast(t("settings.backup.exportError") || "Export failed", true);
    } finally {
      setExporting(false);
    }
  };

  const onPickImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setImportFile(null);
    setImportRawName(null);
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const parsed = JSON.parse(text) as CmsBackupFile;
        if (!parsed.cmsBackup) throw new Error("not backup");
        setImportFile(parsed);
        setImportRawName(f.name);
        if (parsed.included) {
          setImportInclude({ ...defaultIncluded(), ...parsed.included });
        }
      } catch {
        showToast(t("settings.backup.invalidFile"), true);
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const runImport = async () => {
    if (!importFile) { showToast(t("settings.backup.pickFileFirst"), true); return; }
    setImporting(true);
    try {
      const res = await api.backup.import(importFile, importInclude as unknown as Record<string, boolean>);
      showToast(
        t("settings.backup.importApplied").replace("{n}", String(res.data.restored))
      );
      setImportFile(null);
      setImportRawName(null);
    } catch {
      showToast(t("settings.backup.restoreError") || "Import failed", true);
    } finally {
      setImporting(false);
    }
  };

  const checkboxRows: { key: keyof BackupIncluded; labelKey: string }[] = [
    { key: "contentTypes", labelKey: "includeContentTypes" },
    { key: "mediaLibrary", labelKey: "includeMedia" },
    { key: "users", labelKey: "includeUsers" },
    { key: "membershipsRoles", labelKey: "includeMemberships" },
    { key: "plugins", labelKey: "includePlugins" },
    { key: "panelSettings", labelKey: "includePanelSettings" },
  ];

  if (!mfaOk) {
    const isMfa = hasTwoFactor === true;
    const isLoading = hasTwoFactor === null;

    return (
      <>
        <div className="px-6 py-4 border-b border-stone-200/90 dark:border-zinc-800/80">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400/90" />
            {t("settings.backup.heading")}
          </h2>
          <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">{t("settings.backup.description")}</p>
        </div>
        <div className="p-6">
          <div className="max-w-md mx-auto rounded-xl border border-stone-200/90 dark:border-zinc-800/80 bg-white/78 dark:bg-zinc-950/60 p-6 text-center">
            <div className={`w-14 h-14 rounded-full border flex items-center justify-center mx-auto mb-4 ${
              isMfa
                ? "bg-violet-500/10 border-violet-500/25"
                : "bg-amber-500/10 border-amber-500/25"
            }`}>
              {isMfa
                ? <KeyRound className="w-7 h-7 text-violet-400" />
                : <Lock className="w-7 h-7 text-amber-400" />
              }
            </div>
            <h3 className="text-lg font-medium text-stone-900 dark:text-zinc-100 mb-1">
              {isMfa ? t("settings.backup.totpTitle") : t("settings.backup.mfaTitle")}
            </h3>
            <p className="text-sm text-stone-500 dark:text-zinc-500 mb-5">
              {isMfa ? t("settings.backup.totpHint") : t("settings.backup.mfaHint")}
            </p>
            {isLoading ? (
              <div className="py-4 text-sm text-stone-500 dark:text-zinc-500 animate-pulse">{t("settings.backup.verifying")}</div>
            ) : (
              <>
                <input
                  type={isMfa ? "text" : "password"}
                  inputMode={isMfa ? "numeric" : undefined}
                  autoComplete={isMfa ? "one-time-code" : "current-password"}
                  maxLength={isMfa ? 6 : undefined}
                  value={mfaCode}
                  onChange={(e) => {
                    const val = isMfa ? e.target.value.replace(/[^0-9]/g, "") : e.target.value;
                    setMfaCode(val);
                    setMfaError(false);
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") verifyMfa(); }}
                  placeholder={isMfa
                    ? (t("settings.backup.totpPlaceholder") || "000000")
                    : (t("settings.backup.passwordPlaceholder") || "Enter your password")
                  }
                  className={`w-full text-center px-4 py-3 rounded-lg bg-white dark:bg-zinc-900 border text-stone-900 dark:text-zinc-100 placeholder:text-stone-500 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 ${
                    isMfa
                      ? `text-2xl font-mono tracking-[0.3em] focus:ring-violet-500/40 ${mfaError ? "border-red-500/50" : "border-stone-300 dark:border-zinc-700"}`
                      : `text-lg focus:ring-amber-500/40 ${mfaError ? "border-red-500/50" : "border-stone-300 dark:border-zinc-700"}`
                  }`}
                />
                {mfaError && (
                  <p className="text-xs text-red-400/90 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {isMfa
                      ? (t("settings.backup.wrongTotp") || "Invalid code, try again")
                      : (t("settings.backup.wrongPassword") || "Wrong password")
                    }
                  </p>
                )}
                <button
                  type="button"
                  onClick={verifyMfa}
                  disabled={mfaVerifying || (isMfa && mfaCode.length !== 6)}
                  className={`w-full mt-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60 ${
                    isMfa
                      ? "bg-violet-600 hover:bg-violet-500"
                      : "bg-amber-600 hover:bg-amber-500"
                  }`}
                >
                  {mfaVerifying ? (t("settings.backup.verifying") || "Verifying...") : (t("settings.backup.verify") || "Verify")}
                </button>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200/90 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400/90" />
            {t("settings.backup.heading")}
          </h2>
          <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">{t("settings.backup.description")}</p>
        </div>
        <button
          type="button"
          onClick={lockAgain}
          className="shrink-0 text-xs text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 underline underline-offset-2"
        >
          {t("settings.backup.lockSection")}
        </button>
      </div>

      <div className="p-6 space-y-8">
        {toast && (
          <div
            className={`px-4 py-2.5 rounded-lg border text-sm ${
              toast.error
                ? "border-red-500/30 bg-red-500/10 text-red-200/95"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200/95"
            }`}
            role="status"
          >
            {toast.msg}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Export */}
          <section className="rounded-xl border border-stone-200/90 dark:border-zinc-800/80 bg-stone-100/92 dark:bg-zinc-950/40 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-zinc-200 uppercase tracking-wide">
              {t("settings.backup.exportTitle")}
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-500">{t("settings.backup.exportIntro")}</p>
            <div className="space-y-2">
              {checkboxRows.map(({ key, labelKey }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-stone-200/88 dark:border-zinc-800/60 bg-stone-50/85 dark:bg-zinc-900/30 px-3 py-2.5 cursor-pointer hover:border-stone-400 dark:hover:border-zinc-700/80 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={exportInclude[key]}
                    onChange={() => toggleExport(key)}
                    className="rounded border-stone-400 dark:border-zinc-600 text-amber-500 focus:ring-amber-500/40"
                  />
                  <span className="text-sm text-stone-700 dark:text-zinc-300">{t(`settings.backup.${labelKey}`)}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={createBackup}
              disabled={!anyExportSelected || exporting}
              className="w-full py-2.5 rounded-lg bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-medium hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? (t("settings.backup.exporting") || "Exporting...") : t("settings.backup.createDownload")}
            </button>
          </section>

          {/* Import */}
          <section className="rounded-xl border border-stone-200/90 dark:border-zinc-800/80 bg-stone-100/92 dark:bg-zinc-950/40 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-zinc-200 uppercase tracking-wide">
              {t("settings.backup.importTitle")}
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-500">{t("settings.backup.importIntro")}</p>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onPickImportFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white/78 dark:bg-zinc-900/50 text-sm text-stone-800 dark:text-zinc-200 hover:bg-stone-300 dark:hover:bg-zinc-800/60 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {t("settings.backup.chooseFile")}
            </button>
            {importFile && (
              <p className="text-xs text-stone-600 dark:text-zinc-400">
                <Check className="w-3.5 h-3.5 inline text-emerald-400 mr-1" />
                {importRawName} · {importFile.label}
              </p>
            )}
            <p className="text-xs font-medium text-stone-600 dark:text-zinc-400">{t("settings.backup.importApplyLabel")}</p>
            <div className="space-y-2">
              {checkboxRows.map(({ key, labelKey }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-stone-200/88 dark:border-zinc-800/60 bg-stone-50/85 dark:bg-zinc-900/30 px-3 py-2.5 cursor-pointer hover:border-stone-400 dark:hover:border-zinc-700/80 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={importInclude[key]}
                    onChange={() => toggleImport(key)}
                    className="rounded border-stone-400 dark:border-zinc-600 text-sky-500 focus:ring-sky-500/40"
                  />
                  <span className="text-sm text-stone-700 dark:text-zinc-300">{t(`settings.backup.${labelKey}`)}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={runImport}
              disabled={!importFile || importing}
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {importing ? (t("settings.backup.importing") || "Importing...") : t("settings.backup.runImport")}
            </button>
          </section>
        </div>

        <p className="text-xs text-stone-600 dark:text-zinc-600 max-w-3xl leading-relaxed">{t("settings.backup.footerNote")}</p>
      </div>
    </>
  );
}
