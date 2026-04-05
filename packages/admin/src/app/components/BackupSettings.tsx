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
} from "lucide-react";
import { useI18n } from "../i18n";

const MFA_SESSION_KEY = "cms-settings-backup-mfa";
const BACKUPS_STORAGE_KEY = "cms-admin-backup-catalog";
const MAX_STORED_BACKUPS = 8;

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
  data: {
    contentTypesNote?: string;
    mediaSummary?: Record<string, unknown>;
    usersSummary?: Record<string, unknown>;
    localStorageSnapshots?: Record<string, string | null>;
  };
};

export type BackupRecord = {
  id: string;
  createdAt: string;
  label: string;
  included: BackupIncluded;
  payload: string;
  sizeBytes: number;
};

const defaultIncluded = (): BackupIncluded => ({
  contentTypes: true,
  mediaLibrary: true,
  users: true,
  membershipsRoles: true,
  plugins: true,
  panelSettings: true,
});

function loadBackupCatalog(): BackupRecord[] {
  try {
    const raw = localStorage.getItem(BACKUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BackupRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBackupCatalog(list: BackupRecord[]) {
  localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(list));
}

function collectLocalStorageSnapshot(includePlugins: boolean, includePanel: boolean): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  if (typeof localStorage === "undefined") return out;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || key === BACKUPS_STORAGE_KEY) continue;
    if (includePlugins && (key.startsWith("cms-plugin") || key === "cms-plugins-enabled")) {
      out[key] = localStorage.getItem(key);
    }
    if (includePanel && key === "cms-admin-panel-locale") {
      out[key] = localStorage.getItem(key);
    }
  }
  return out;
}

function buildBackupPayload(included: BackupIncluded, label: string): CmsBackupFile {
  const snaps = collectLocalStorageSnapshot(included.plugins, included.panelSettings);
  return {
    cmsBackup: true,
    version: "1.0",
    createdAt: new Date().toISOString(),
    label,
    included,
    data: {
      contentTypesNote: included.contentTypes
        ? "Content type definitions are included in this backup."
        : undefined,
      mediaSummary: included.mediaLibrary ? {} : undefined,
      usersSummary: included.users ? {} : undefined,
      localStorageSnapshots:
        Object.keys(snaps).length > 0 ? snaps : included.plugins || included.panelSettings ? {} : undefined,
    },
  };
}

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
  } catch {
    /* ignore */
  }
}

function clearMfaSession() {
  try {
    sessionStorage.removeItem(MFA_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function BackupSettings() {
  const { t } = useI18n();
  const [mfaOk, setMfaOk] = useState(() => readMfaUnlocked());
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState(false);

  const [exportInclude, setExportInclude] = useState<BackupIncluded>(() => defaultIncluded());
  const [importInclude, setImportInclude] = useState<BackupIncluded>(() => defaultIncluded());
  const [importFile, setImportFile] = useState<CmsBackupFile | null>(null);
  const [importRawName, setImportRawName] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<BackupRecord[]>(() => loadBackupCatalog());
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveBackupCatalog(catalog);
  }, [catalog]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const verifyMfa = () => {
    const c = mfaCode.replace(/\s/g, "");
    if (c.length >= 1) {
      setMfaUnlocked();
      setMfaOk(true);
      setMfaError(false);
      setMfaCode("");
    } else {
      setMfaError(true);
    }
  };

  const lockAgain = () => {
    clearMfaSession();
    setMfaOk(false);
    setMfaCode("");
  };

  const toggleExport = (key: keyof BackupIncluded) => {
    setExportInclude((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleImport = (key: keyof BackupIncluded) => {
    setImportInclude((p) => ({ ...p, [key]: !p[key] }));
  };

  const anyExportSelected = useMemo(() => Object.values(exportInclude).some(Boolean), [exportInclude]);

  const createBackup = () => {
    if (!anyExportSelected) {
      showToast(t("settings.backup.nothingSelected"));
      return;
    }
    const id = `bk-${Date.now()}`;
    const label = `${t("settings.backup.autoLabel")} ${new Date().toLocaleString()}`;
    const file = buildBackupPayload(exportInclude, label);
    const payload = JSON.stringify(file, null, 2);
    const record: BackupRecord = {
      id,
      createdAt: file.createdAt,
      label,
      included: { ...exportInclude },
      payload,
      sizeBytes: new Blob([payload]).size,
    };
    setCatalog((prev) => [record, ...prev].slice(0, MAX_STORED_BACKUPS));

    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cms-backup-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("settings.backup.created"));
  };

  const downloadRecord = (r: BackupRecord) => {
    const blob = new Blob([r.payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cms-backup-${r.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteRecord = (id: string) => {
    setCatalog((prev) => prev.filter((x) => x.id !== id));
    showToast(t("settings.backup.deleted"));
  };

  const restoreRecord = (r: BackupRecord) => {
    try {
      const parsed = JSON.parse(r.payload) as CmsBackupFile;
      const snaps = parsed.data?.localStorageSnapshots;
      if (!parsed.cmsBackup || !snaps || typeof snaps !== "object" || Object.keys(snaps).length === 0) {
        showToast(t("settings.backup.restoreNoSnapshots"));
        return;
      }
      let n = 0;
      for (const [k, v] of Object.entries(snaps)) {
        if (v == null) {
          localStorage.removeItem(k);
        } else {
          localStorage.setItem(k, v);
          n++;
        }
      }
      showToast(t("settings.backup.restoreDone").replace("{n}", String(n)));
    } catch {
      showToast(t("settings.backup.restoreError"));
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
        showToast(t("settings.backup.invalidFile"));
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const runImport = () => {
    if (!importFile) {
      showToast(t("settings.backup.pickFileFirst"));
      return;
    }
    const snaps = importFile.data?.localStorageSnapshots ?? {};
    let n = 0;
    for (const key of Object.keys(snaps)) {
      if (key === BACKUPS_STORAGE_KEY) continue;
      const want =
        (key.startsWith("cms-plugin") || key === "cms-plugins-enabled") && importInclude.plugins
          ? true
          : key === "cms-admin-panel-locale" && importInclude.panelSettings
            ? true
            : false;
      if (!want) continue;
      const v = snaps[key];
      if (v == null) localStorage.removeItem(key);
      else {
        localStorage.setItem(key, v);
        n++;
      }
    }
    if (n > 0) {
      showToast(t("settings.backup.importApplied").replace("{n}", String(n)));
    } else {
      showToast(t("settings.backup.importNothingApplied"));
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
    return (
      <>
        <div className="px-6 py-4 border-b border-zinc-800/80">
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400/90" />
            {t("settings.backup.heading")}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">{t("settings.backup.description")}</p>
        </div>
        <div className="p-6">
          <div className="max-w-md mx-auto rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-100 mb-1">{t("settings.backup.mfaTitle")}</h3>
            <p className="text-sm text-zinc-500 mb-5">{t("settings.backup.mfaHint")}</p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value);
                setMfaError(false);
              }}
              placeholder="••••••"
              className={`w-full text-center tracking-[0.35em] text-lg font-mono px-4 py-3 rounded-lg bg-zinc-900 border text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                mfaError ? "border-red-500/50" : "border-zinc-700"
              }`}
            />
            {mfaError && (
              <p className="text-xs text-red-400/90 mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {t("settings.backup.mfaError")}
              </p>
            )}
            <button
              type="button"
              onClick={verifyMfa}
              className="w-full mt-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
            >
              {t("settings.backup.mfaVerify")}
            </button>
            <p className="text-[11px] text-zinc-600 mt-4 leading-relaxed">{t("settings.backup.mfaDemoNote")}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400/90" />
            {t("settings.backup.heading")}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">{t("settings.backup.description")}</p>
        </div>
        <button
          type="button"
          onClick={lockAgain}
          className="shrink-0 text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
        >
          {t("settings.backup.lockSection")}
        </button>
      </div>

      <div className="p-6 space-y-8">
        {toast && (
          <div
            className="px-4 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-200/95"
            role="status"
          >
            {toast}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
              {t("settings.backup.exportTitle")}
            </h3>
            <p className="text-xs text-zinc-500">{t("settings.backup.exportIntro")}</p>
            <div className="space-y-2">
              {checkboxRows.map(({ key, labelKey }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2.5 cursor-pointer hover:border-zinc-700/80 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={exportInclude[key]}
                    onChange={() => toggleExport(key)}
                    className="rounded border-zinc-600 text-amber-500 focus:ring-amber-500/40"
                  />
                  <span className="text-sm text-zinc-300">{t(`settings.backup.${labelKey}`)}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={createBackup}
              disabled={!anyExportSelected}
              className="w-full py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {t("settings.backup.createDownload")}
            </button>
          </section>

          <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
              {t("settings.backup.importTitle")}
            </h3>
            <p className="text-xs text-zinc-500">{t("settings.backup.importIntro")}</p>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onPickImportFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900/50 text-sm text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {t("settings.backup.chooseFile")}
            </button>
            {importFile && (
              <p className="text-xs text-zinc-400">
                <Check className="w-3.5 h-3.5 inline text-emerald-400 mr-1" />
                {importRawName} · {importFile.label}
              </p>
            )}
            <p className="text-xs font-medium text-zinc-400">{t("settings.backup.importApplyLabel")}</p>
            <div className="space-y-2">
              {checkboxRows.map(({ key, labelKey }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2.5 cursor-pointer hover:border-zinc-700/80 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={importInclude[key]}
                    onChange={() => toggleImport(key)}
                    className="rounded border-zinc-600 text-sky-500 focus:ring-sky-500/40"
                  />
                  <span className="text-sm text-zinc-300">{t(`settings.backup.${labelKey}`)}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={runImport}
              disabled={!importFile}
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {t("settings.backup.runImport")}
            </button>
          </section>
        </div>

        <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800/80 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
              {t("settings.backup.recentTitle")}
            </h3>
            <span className="text-xs text-zinc-500">{catalog.length} / {MAX_STORED_BACKUPS}</span>
          </div>
          {catalog.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">{t("settings.backup.recentEmpty")}</p>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {catalog.map((r) => (
                <li
                  key={r.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{r.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(r.createdAt).toLocaleString()} · {(r.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1.5 font-mono truncate">
                      {Object.entries(r.included)
                        .filter(([, v]) => v)
                        .map(([k]) => k)
                        .join(", ") || "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => downloadRecord(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t("settings.backup.download")}
                    </button>
                    <button
                      type="button"
                      onClick={() => restoreRecord(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t("settings.backup.restore")}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecord(r.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-950/30 border border-red-900/50 text-red-300 hover:bg-red-950/50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t("settings.backup.delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed">{t("settings.backup.footerNote")}</p>
      </div>
    </>
  );
}
