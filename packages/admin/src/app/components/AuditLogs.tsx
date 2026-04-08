import { useEffect, useState } from "react";
import { Search, ClipboardList, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "../api/client";

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
  "entry.unpublish":"bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  "media.upload":   "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "media.delete":   "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "contentType.create": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "contentType.update": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "contentType.delete": "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
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
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load audit logs."))
      .finally(() => setLoading(false));
  }, [page, search]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  const totalPages = meta?.pagination.pageCount ?? 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <ClipboardList className="w-6 h-6 text-zinc-400" />
            <h1 className="text-2xl sm:text-3xl font-semibold">Audit Logs</h1>
          </div>
          <p className="text-zinc-400 text-sm">Track every action taken in your CMS.</p>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter by action (e.g. entry.create)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950/50 border border-zinc-800/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Search
            </button>
            {search && (
              <button
                onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                className="px-3 py-2 text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg overflow-hidden">
          {error && (
            <div className="px-6 py-4 text-sm text-red-400 border-b border-zinc-800/50">{error}</div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                        No audit logs yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_COLORS[log.action] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                          {log.subject ? (
                            <span>
                              {log.subject}
                              {log.subjectId && <span className="text-zinc-500"> #{log.subjectId.slice(0, 8)}</span>}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {log.user ? (
                            <span>
                              {log.user.firstName} {log.user.lastName}
                              <span className="text-zinc-500 block text-xs">{log.user.email}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                          {log.ipAddress ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/50">
              <span className="text-xs text-zinc-500">
                Page {page} of {totalPages} · {meta?.pagination.total ?? 0} total
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-40 transition-colors"
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
