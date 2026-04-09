import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileDown,
} from "lucide-react";
import { api } from "../api/client";
import { useI18n } from "../i18n";

interface AuditLog {
  id: string;
  action: string;
  subject: string | null;
  subjectId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
}

interface Meta {
  pagination: { page: number; pageSize: number; pageCount: number; total: number };
}

const ACTION_COLORS: Record<string, string> = {
  "entry.create":   "bg-green-500/10 text-green-400 border-green-500/20",
  "entry.update":   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "entry.delete":   "bg-red-500/10 text-red-400 border-red-500/20",
  "entry.publish":  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "entry.unpublish":"bg-stone-500/10 dark:bg-zinc-500/10 text-stone-600 dark:text-zinc-400 border-stone-400/40 dark:border-zinc-500/20",
  "media.upload":   "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "media.delete":   "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "contentType.create": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "contentType.update": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "contentType.delete": "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

function auditActionLabel(action: string, t: (key: string) => string): string {
  const key = `audit.actions.${action}`;
  const label = t(key);
  return label === key ? action : label;
}

const MAX_EXPORT_ROWS = 5000;
const EXPORT_PAGE_SIZE = 100;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function localeTag(locale: string): string {
  if (locale === "tr") return "tr-TR";
  if (locale === "de") return "de-DE";
  return "en-US";
}

/** Yazdırma / “PDF olarak kaydet” — UTF-8, ek kütüphane yok */
function printHtmlUtf8(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "audit-export");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => {
    iframe.remove();
  };
  win.focus();
  window.setTimeout(() => {
    win.print();
    win.addEventListener("afterprint", cleanup, { once: true });
    window.setTimeout(cleanup, 120_000);
  }, 300);
}

async function fetchAllAuditLogsForExport(
  actionFilter: string
): Promise<{ logs: AuditLog[]; truncated: boolean }> {
  const all: AuditLog[] = [];
  let truncated = false;
  let page = 1;
  let pageCount = 1;
  do {
    const res = await api.auditLogs.list({
      page,
      pageSize: EXPORT_PAGE_SIZE,
      ...(actionFilter ? { action: actionFilter } : {}),
    });
    const data = res.data as AuditLog[];
    const m = res.meta as Meta;
    pageCount = m.pagination.pageCount;
    for (const row of data) {
      if (all.length >= MAX_EXPORT_ROWS) {
        truncated = true;
        return { logs: all, truncated };
      }
      all.push(row);
    }
    page += 1;
  } while (page <= pageCount);
  return { logs: all, truncated };
}

export function AuditLogs() {
  const { t, locale } = useI18n();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [exportPdfBusy, setExportPdfBusy] = useState(false);
  const [exportPdfError, setExportPdfError] = useState<string | null>(null);
  const PAGE_SIZE = 50;

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.auditLogs
      .list({ page, pageSize: PAGE_SIZE, ...(search ? { action: search } : {}) })
      .then((res) => {
        setLogs(res.data as AuditLog[]);
        setMeta(res.meta as Meta);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t("audit.loadError"))
      )
      .finally(() => setLoading(false));
  }, [page, search, t]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  const handleExportPdf = useCallback(async () => {
    setExportPdfError(null);
    setExportPdfBusy(true);
    try {
      const { logs: exportLogs, truncated } = await fetchAllAuditLogsForExport(search);
      if (exportLogs.length === 0) {
        setExportPdfError(t("audit.exportPdfEmpty"));
        return;
      }
      const lc = localeTag(locale);
      const now = new Date().toLocaleString(lc);
      const title = escapeHtml(t("audit.title"));
      const hAction = escapeHtml(t("audit.col.action"));
      const hSubject = escapeHtml(t("audit.col.subject"));
      const hUser = escapeHtml(t("audit.col.user"));
      const hIp = escapeHtml(t("audit.col.ip"));
      const hDate = escapeHtml(t("audit.col.date"));
      const metaParts = [
        `${escapeHtml(t("audit.exportPdfGenerated"))}: ${escapeHtml(now)}`,
        escapeHtml(t("audit.exportPdfRecords").replace("{n}", String(exportLogs.length))),
      ];
      if (search.trim()) {
        metaParts.push(escapeHtml(t("audit.exportPdfFilter").replace("{q}", search.trim())));
      }
      if (truncated) {
        metaParts.push(
          escapeHtml(t("audit.exportPdfTruncated").replace("{n}", String(MAX_EXPORT_ROWS)))
        );
      }
      const rows = exportLogs
        .map((log) => {
          const action = escapeHtml(auditActionLabel(log.action, t));
          const subj = log.subject
            ? `${escapeHtml(log.subject)}${log.subjectId ? ` #${escapeHtml(log.subjectId.slice(0, 8))}` : ""}`
            : "—";
          const user = log.user
            ? `${escapeHtml(`${log.user.firstName} ${log.user.lastName}`)}<br/><small>${escapeHtml(log.user.email)}</small>`
            : "—";
          const ip = log.ipAddress ? escapeHtml(log.ipAddress) : "—";
          const dt = escapeHtml(new Date(log.createdAt).toLocaleString(lc));
          return `<tr><td>${action}</td><td class="mono">${subj}</td><td>${user}</td><td class="mono">${ip}</td><td class="nowrap">${dt}</td></tr>`;
        })
        .join("");
      const html = `<!DOCTYPE html><html lang="${escapeHtml(locale)}"><head><meta charset="UTF-8"/><title>${title}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif; font-size: 9px; color: #111; }
  h1 { font-size: 16px; margin: 0 0 6px 0; }
  .meta { color: #444; font-size: 8px; margin-bottom: 12px; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #bbb; padding: 5px 6px; text-align: left; vertical-align: top; }
  th { background: #eee; font-weight: 600; font-size: 8px; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .mono { font-family: ui-monospace, monospace; font-size: 8px; }
  .nowrap { white-space: nowrap; }
</style></head><body>
<h1>${title}</h1>
<div class="meta">${metaParts.join(" · ")}</div>
<table>
<thead><tr><th>${hAction}</th><th>${hSubject}</th><th>${hUser}</th><th>${hIp}</th><th>${hDate}</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;
      printHtmlUtf8(html);
    } catch {
      setExportPdfError(t("audit.exportPdfError"));
    } finally {
      setExportPdfBusy(false);
    }
  }, [locale, search, t]);

  const totalPages = meta?.pagination.pageCount ?? 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <ClipboardList className="w-6 h-6 text-stone-600 dark:text-zinc-400" />
            <h1 className="text-2xl sm:text-3xl font-semibold">{t("audit.title")}</h1>
          </div>
          <p className="text-stone-600 dark:text-zinc-400 text-sm">{t("audit.subtitle")}</p>
        </div>

        {/* Filters */}
        <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-4 mb-6">
          {exportPdfError && (
            <p className="mb-3 text-sm text-red-400" role="alert">
              {exportPdfError}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 dark:text-zinc-400" />
              <input
                type="text"
                placeholder={t("audit.filterPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                className="w-full pl-10 pr-4 py-2 bg-white/75 dark:bg-zinc-950/50 border border-stone-200/85 dark:border-zinc-800/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md text-sm font-medium hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors"
            >
              {t("audit.search")}
            </button>
            <button
              type="button"
              disabled={exportPdfBusy || loading}
              onClick={() => void handleExportPdf()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-stone-400 dark:border-zinc-600/80 bg-stone-200 dark:bg-zinc-800/80 text-stone-900 dark:text-zinc-100 rounded-md text-sm font-medium hover:bg-stone-300 dark:hover:bg-zinc-800 hover:border-zinc-500 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {exportPdfBusy ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <FileDown className="w-4 h-4 shrink-0" />
              )}
              {exportPdfBusy ? t("audit.exportPdfBusy") : t("audit.exportPdf")}
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                className="px-3 py-2 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 text-sm transition-colors"
              >
                {t("audit.clear")}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg overflow-hidden">
          {error && (
            <div className="px-6 py-4 text-sm text-red-400 border-b border-stone-200/85 dark:border-zinc-800/50">{error}</div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-stone-500 dark:text-zinc-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-stone-200/85 dark:border-zinc-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400">{t("audit.col.action")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400">{t("audit.col.subject")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400">{t("audit.col.user")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400">{t("audit.col.ip")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400">{t("audit.col.date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-zinc-800/50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-stone-500 dark:text-zinc-500">
                        {t("audit.empty")}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-300 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            title={log.action}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_COLORS[log.action] ?? "bg-stone-500/10 dark:bg-zinc-500/10 text-stone-600 dark:text-zinc-400 border-stone-400/40 dark:border-zinc-500/20"}`}
                          >
                            {auditActionLabel(log.action, t)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-700 dark:text-zinc-300 font-mono text-xs">
                          {log.subject ? (
                            <span>
                              {log.subject}
                              {log.subjectId && <span className="text-stone-500 dark:text-zinc-500"> #{log.subjectId.slice(0, 8)}</span>}
                            </span>
                          ) : (
                            <span className="text-stone-600 dark:text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-700 dark:text-zinc-300">
                          {log.user ? (
                            <span>
                              {log.user.firstName} {log.user.lastName}
                              <span className="text-stone-500 dark:text-zinc-500 block text-xs">{log.user.email}</span>
                            </span>
                          ) : (
                            <span className="text-stone-600 dark:text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-500 dark:text-zinc-500 font-mono text-xs">
                          {log.ipAddress ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-stone-600 dark:text-zinc-400 text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200/85 dark:border-zinc-800/50">
              <span className="text-xs text-stone-500 dark:text-zinc-500">
                {t("audit.pageOf")
                  .replace("{page}", String(page))
                  .replace("{totalPages}", String(totalPages))
                  .replace("{total}", String(meta?.pagination.total ?? 0))}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded hover:bg-stone-300 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded hover:bg-stone-300 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
