import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  ArrowLeft,
  Settings,
  Calendar,
  Clock,
  ListPlus,
  RotateCcw,
  X,
  Copy,
} from "lucide-react";
import { getDemoContentTypeByApiId } from "../data/demoContentTypes";
import { nextDuplicateDisplayName } from "../lib/cmsDuplicate";
import { api } from "../api/client";

interface ContentListRow {
  id: string;
  title: string;
  status: "published" | "draft";
  locale: string;
  updatedAt: string;
  updatedBy: string;
  description?: string;
  coverUrl?: string;
}

type ColumnKey =
  | "id"
  | "title"
  | "description"
  | "cover"
  | "status"
  | "locale"
  | "updatedAt"
  | "updatedBy"
  | "actions";

type FilterField = "createdAt" | "status" | "title" | "locale" | "updatedBy";

interface ListFilter {
  id: string;
  field: FilterField;
  operator: "is" | "is_not";
  /** yyyy-mm-dd — createdAt filtresi için (satırdaki updatedAt ile eşleşir) */
  date: string;
  time: string;
  textValue: string;
  statusValue: "" | "published" | "draft";
}

type TrashedEntry = { key: string; row: ContentListRow };


function formatStatusLabel(s: ContentListRow["status"]) {
  return s === "published" ? "Published" : "Draft";
}

function defaultColumnVisibility(
  showDescription: boolean,
  showCover: boolean
): Record<ColumnKey, boolean> {
  return {
    id: true,
    title: true,
    description: showDescription,
    cover: showCover,
    status: true,
    locale: true,
    updatedAt: true,
    updatedBy: true,
    actions: true,
  };
}

function rowMatchesFilter(row: ContentListRow, f: ListFilter): boolean {
  const neg = f.operator === "is_not";
  let ok = false;
  switch (f.field) {
    case "createdAt": {
      if (!f.date) return true;
      const dayPrefix = row.updatedAt.slice(0, 10);
      ok = dayPrefix === f.date;
      break;
    }
    case "status": {
      if (!f.statusValue) return true;
      ok = row.status === f.statusValue;
      break;
    }
    case "title": {
      const q = f.textValue.trim().toLowerCase();
      if (!q) return true;
      ok = row.title.toLowerCase().includes(q);
      break;
    }
    case "locale": {
      const q = f.textValue.trim().toLowerCase();
      if (!q) return true;
      ok = row.locale.toLowerCase() === q;
      break;
    }
    case "updatedBy": {
      const q = f.textValue.trim().toLowerCase();
      if (!q) return true;
      ok = row.updatedBy.toLowerCase().includes(q);
      break;
    }
    default:
      return true;
  }
  return neg ? !ok : ok;
}

function emptyDraftFilter(): Omit<ListFilter, "id"> {
  return {
    field: "createdAt",
    operator: "is",
    date: "",
    time: "",
    textValue: "",
    statusValue: "",
  };
}

const selectPopoverClass =
  "w-full px-3 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/40 appearance-none cursor-pointer";

function DuplicateEntryModal({
  row,
  takenTitles,
  onClose,
  onConfirm,
}: {
  row: ContentListRow;
  takenTitles: Set<string>;
  onClose: () => void;
  onConfirm: (title: string) => void;
}) {
  const [title, setTitle] = useState(() => nextDuplicateDisplayName(row.title, takenTitles));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dup-entry-heading"
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
          <h2 id="dup-entry-heading" className="text-lg font-semibold text-zinc-100">
            İçeriği çoğalt
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-zinc-400">
            Kaynak: <span className="text-zinc-200 font-medium">{row.title}</span>
          </p>
          <div>
            <label htmlFor="dup-entry-title-input" className="block text-sm font-medium text-zinc-300 mb-2">
              Yeni başlık
            </label>
            <input
              id="dup-entry-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-600 text-zinc-100"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              setTitle(nextDuplicateDisplayName(title.trim() || row.title, takenTitles))
            }
            className="text-sm text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
          >
            Sonuna +1 ile sıradaki başlık (ör. Başlık 1, Başlık 2)
          </button>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800/80 transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => onConfirm(title)}
              disabled={!title.trim()}
              className="px-4 py-2 rounded-md bg-zinc-100 text-zinc-950 font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Çoğalt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContentList() {
  const { type } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [filterRows, setFilterRows] = useState<ListFilter[]>([]);
  const [draft, setDraft] = useState(emptyDraftFilter);
  const [activeByType, setActiveByType] = useState<Record<string, ContentListRow[]>>({});
  const [trashByType, setTrashByType] = useState<Record<string, TrashedEntry[]>>({});
  const [apiLoading, setApiLoading] = useState(false);
  const [rowToDuplicate, setRowToDuplicate] = useState<ContentListRow | null>(null);

  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const columnsPopoverRef = useRef<HTMLDivElement>(null);

  const schema = useMemo(() => getDemoContentTypeByApiId(type), [type]);
  const contents = type ? activeByType[type] ?? [] : [];
  const takenEntryTitles = useMemo(() => new Set(contents.map((c) => c.title)), [contents]);
  const trashedForType = type ? trashByType[type] ?? [] : [];
  const trashCount = trashedForType.length;
  const listHeading = schema?.pluralName ?? (type ? `${type.charAt(0).toUpperCase() + type.slice(1)}s` : "Entries");

  const circleMediaApi = schema?.listCircleMediaField;
  const circleFieldMeta = circleMediaApi
    ? schema?.fields.find((f) => f.apiName === circleMediaApi)
    : undefined;
  const coverColumnLabel = circleFieldMeta?.label ?? "Image";
  const showGalleryColumns = Boolean(circleMediaApi);
  const showDescriptionCol =
    showGalleryColumns &&
    Boolean(schema?.fields.some((f) => f.apiName === "description"));

  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnKey, boolean>>(() =>
    defaultColumnVisibility(showDescriptionCol, showGalleryColumns)
  );

  useEffect(() => {
    setColumnVisibility(defaultColumnVisibility(showDescriptionCol, showGalleryColumns));
  }, [type, showDescriptionCol, showGalleryColumns]);

  // Load real data from API — falls back to mock if API not available
  useEffect(() => {
    if (!type) return;
    setApiLoading(true);
    api.entries.list(type, { page: 1, pageSize: 100 })
      .then((res) => {
        const rows = (res.data as Record<string, unknown>[]).map((entry) => ({
          id: String(entry['id'] ?? ''),
          title: String(entry['title'] ?? entry['name'] ?? entry['headline'] ?? entry['id'] ?? 'Untitled'),
          status: (entry['status'] as 'published' | 'draft') ?? 'draft',
          locale: String(entry['locale'] ?? 'en'),
          updatedAt: entry['updatedAt'] ? new Date(entry['updatedAt'] as string).toLocaleDateString() : '',
          updatedBy: String(entry['updatedBy'] ?? ''),
          description: entry['description'] ? String(entry['description']) : undefined,
        }));
        setActiveByType(prev => ({ ...prev, [type]: rows }));
      })
      .catch(() => {
        // API not reachable — keep mock data
      })
      .finally(() => setApiLoading(false));
  }, [type]);

  useEffect(() => {
    setTrashOpen(false);
  }, [type]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (filtersOpen && filterPopoverRef.current && !filterPopoverRef.current.contains(t)) {
        setFiltersOpen(false);
      }
      if (columnsOpen && columnsPopoverRef.current && !columnsPopoverRef.current.contains(t)) {
        setColumnsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [filtersOpen, columnsOpen]);

  useEffect(() => {
    if (!trashOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrashOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [trashOpen]);

  const moveToTrash = (row: ContentListRow) => {
    if (!type) return;
    // Optimistic UI update
    setActiveByType((prev) => {
      const cur = [...(prev[type] ?? [])];
      const i = cur.findIndex(
        (r) => r.id === row.id && r.updatedAt === row.updatedAt && r.title === row.title
      );
      if (i === -1) return prev;
      cur.splice(i, 1);
      return { ...prev, [type]: cur };
    });
    const key = `${type}-${row.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setTrashByType((prev) => ({
      ...prev,
      [type]: [...(prev[type] ?? []), { key, row }],
    }));
    // Delete from backend
    api.entries.delete(type, row.id).catch(() => {
      // Revert on failure
      setActiveByType((prev) => ({ ...prev, [type]: [...(prev[type] ?? []), row] }));
      setTrashByType((prev) => ({ ...prev, [type]: (prev[type] ?? []).filter((e) => e.key !== key) }));
    });
  };

  const restoreFromTrash = (entryKey: string) => {
    if (!type) return;
    const entry = trashedForType.find((e) => e.key === entryKey);
    if (!entry) return;
    setTrashByType((prev) => ({
      ...prev,
      [type]: (prev[type] ?? []).filter((e) => e.key !== entryKey),
    }));
    setActiveByType((prev) => ({
      ...prev,
      [type]: [...(prev[type] ?? []), entry.row],
    }));
  };

  const confirmDuplicateEntry = (row: ContentListRow, inputTitle: string) => {
    if (!type) return;
    const taken = new Set((activeByType[type] ?? []).map((r) => r.title));
    let title = inputTitle.trim() || nextDuplicateDisplayName(row.title, taken);
    if (taken.has(title)) {
      title = nextDuplicateDisplayName(title, taken);
    }
    const newId = `dup-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const copy: ContentListRow = {
      ...row,
      id: newId,
      title,
      updatedAt: today,
    };
    setActiveByType((prev) => ({
      ...prev,
      [type]: [...(prev[type] ?? []), copy],
    }));
    setRowToDuplicate(null);
  };

  const searchedContents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contents;
    return contents.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [contents, searchQuery]);

  const filteredContents = useMemo(() => {
    if (filterRows.length === 0) return searchedContents;
    return searchedContents.filter((row) => filterRows.every((f) => rowMatchesFilter(row, f)));
  }, [searchedContents, filterRows]);

  const toggleColumn = (key: ColumnKey) => {
    if (key === "actions") return;
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addFilterFromDraft = () => {
    const id = `flt-${Date.now()}`;
    setFilterRows((prev) => [...prev, { ...draft, id }]);
    setDraft(emptyDraftFilter());
  };

  const removeFilter = (id: string) => {
    setFilterRows((prev) => prev.filter((f) => f.id !== id));
  };

  const configureColumns: { key: ColumnKey; label: string }[] = useMemo(() => {
    const base: { key: ColumnKey; label: string }[] = [
      { key: "id", label: "id" },
      { key: "title", label: "title" },
    ];
    if (showDescriptionCol) base.push({ key: "description", label: "description" });
    if (showGalleryColumns) base.push({ key: "cover", label: coverColumnLabel.toLowerCase() });
    base.push(
      { key: "status", label: "status" },
      { key: "locale", label: "locale" },
      { key: "updatedAt", label: "updatedAt" },
      { key: "updatedBy", label: "updatedBy" },
      { key: "actions", label: "actions" }
    );
    return base;
  }, [showDescriptionCol, showGalleryColumns, coverColumnLabel]);

  const v = columnVisibility;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-6">
          <Link
            to="/content-types"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Content Types
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{listHeading}</h1>
              <p className="text-zinc-400">{filteredContents.length} entries found</p>
            </div>
            <Link
              to={`/content/${type}/create`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create {schema?.singularName ?? "entry"}</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </div>
        </div>

        {/* relative z-20: dropdowns extend over the table below; later sibling would paint on top otherwise */}
        <div className="relative z-20 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0 relative" ref={filterPopoverRef}>
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen((o) => !o);
                  setColumnsOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                  filtersOpen || filterRows.length > 0
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                    : "bg-zinc-800/70 border-zinc-700/50 hover:bg-zinc-700/70 text-zinc-200"
                }`}
              >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
                {filterRows.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/30">{filterRows.length}</span>
                )}
              </button>

              {filtersOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-[min(100vw-2rem,22rem)] rounded-xl border border-zinc-700/80 bg-zinc-950 shadow-xl shadow-black/50 p-3 space-y-3">
                  {filterRows.length > 0 && (
                    <ul className="space-y-2 max-h-32 overflow-y-auto text-xs border-b border-zinc-800 pb-2 mb-1">
                      {filterRows.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-center justify-between gap-2 text-zinc-400 bg-zinc-900/80 rounded-md px-2 py-1.5"
                        >
                          <span className="truncate">
                            {f.field === "createdAt" ? "createdAt" : f.field}{" "}
                            <span className="text-zinc-500">{f.operator}</span>{" "}
                            {f.field === "createdAt"
                              ? f.date || "—"
                              : f.field === "status"
                                ? f.statusValue
                                : f.textValue || "—"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFilter(f.id)}
                            className="text-zinc-500 hover:text-red-400 shrink-0"
                            aria-label="Remove filter"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div>
                    <label className="sr-only">Field</label>
                    <select
                      value={draft.field}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, field: e.target.value as FilterField }))
                      }
                      className={selectPopoverClass}
                    >
                      <option value="createdAt">createdAt</option>
                      <option value="status">status</option>
                      <option value="title">title</option>
                      <option value="locale">locale</option>
                      <option value="updatedBy">updatedBy</option>
                    </select>
                  </div>
                  <div>
                    <label className="sr-only">Operator</label>
                    <select
                      value={draft.operator}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, operator: e.target.value as "is" | "is_not" }))
                      }
                      className={selectPopoverClass}
                    >
                      <option value="is">is</option>
                      <option value="is_not">is not</option>
                    </select>
                  </div>

                  {draft.field === "createdAt" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input
                          type="date"
                          value={draft.date}
                          onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                          className="w-full pl-9 pr-2 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input
                          type="time"
                          value={draft.time}
                          onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                          className="w-full pl-9 pr-2 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                    </div>
                  )}

                  {draft.field === "status" && (
                    <select
                      value={draft.statusValue}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          statusValue: e.target.value as ListFilter["statusValue"],
                        }))
                      }
                      className={selectPopoverClass}
                    >
                      <option value="">Select status…</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  )}

                  {(draft.field === "title" ||
                    draft.field === "locale" ||
                    draft.field === "updatedBy") && (
                    <input
                      type="text"
                      value={draft.textValue}
                      onChange={(e) => setDraft((d) => ({ ...d, textValue: e.target.value }))}
                      placeholder={
                        draft.field === "title"
                          ? "Contains…"
                          : draft.field === "locale"
                            ? "e.g. en"
                            : "Name contains…"
                      }
                      className="w-full px-3 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  )}

                  <button
                    type="button"
                    onClick={addFilterFromDraft}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800/90 border border-zinc-700/80 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add filter
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setTrashOpen(true);
                setFiltersOpen(false);
                setColumnsOpen(false);
              }}
              className={`relative shrink-0 p-2 rounded-md border transition-colors ${
                trashOpen || trashCount > 0
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-200"
                  : "bg-zinc-800/70 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/70"
              }`}
              title="Trash — deleted entries"
              aria-expanded={trashOpen}
            >
              <Trash2 className="w-5 h-5" />
              {trashCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white tabular-nums">
                  {trashCount > 99 ? "99+" : trashCount}
                </span>
              )}
            </button>

            <div className="relative shrink-0" ref={columnsPopoverRef}>
              <button
                type="button"
                onClick={() => {
                  setColumnsOpen((o) => !o);
                  setFiltersOpen(false);
                }}
                className={`p-2 rounded-md border transition-colors ${
                  columnsOpen
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                    : "bg-zinc-800/70 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/70"
                }`}
                title="Configure the view"
                aria-expanded={columnsOpen}
              >
                <Settings className="w-5 h-5" />
              </button>

              {columnsOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-zinc-700/80 bg-zinc-950 shadow-xl shadow-black/50 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-zinc-800/90 flex items-center gap-2 text-indigo-300/95">
                    <ListPlus className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-medium">Configure the view</span>
                  </div>
                  <ul className="p-2 max-h-72 overflow-y-auto space-y-0.5">
                    {configureColumns.map(({ key, label }) => {
                      const on = v[key];
                      const locked = key === "actions";
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => toggleColumn(key)}
                            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                              on ? "bg-zinc-800/70 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/40"
                            } ${locked ? "opacity-80 cursor-default" : ""}`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                on
                                  ? "bg-indigo-500 border-indigo-400 text-white"
                                  : "border-zinc-600 bg-zinc-900"
                              }`}
                            >
                              {on ? "✓" : ""}
                            </span>
                            <span className="font-mono text-xs">{label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem]">
              <thead className="border-b border-zinc-800/50">
                <tr>
                  {v.id && (
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-sm font-medium text-zinc-400">ID</th>
                  )}
                  {v.title && (
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-sm font-medium text-zinc-400">Title</th>
                  )}
                  {showDescriptionCol && v.description && (
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-sm font-medium text-zinc-400 min-w-[140px]">
                      Description
                    </th>
                  )}
                  {showGalleryColumns && v.cover && (
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-sm font-medium text-zinc-400 w-px whitespace-nowrap">
                      {coverColumnLabel}
                    </th>
                  )}
                  {v.status && (
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-sm font-medium text-zinc-400">Status</th>
                  )}
                  {v.locale && (
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-sm font-medium text-zinc-400">Locale</th>
                  )}
                  {v.updatedAt && (
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-sm font-medium text-zinc-400">Updated</th>
                  )}
                  {v.updatedBy && (
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-sm font-medium text-zinc-400">By</th>
                  )}
                  {v.actions && (
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-right text-sm font-medium text-zinc-400">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredContents.map((content) => (
                  <tr
                    key={`${content.id}-${content.updatedAt}-${content.title}`}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    {v.id && (
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-zinc-400 font-mono">{content.id}</td>
                    )}
                    {v.title && (
                      <td
                        className="px-3 py-3 sm:px-6 sm:py-4 font-medium max-w-[280px] truncate"
                        title={content.title}
                      >
                        {content.title}
                      </td>
                    )}
                    {showDescriptionCol && v.description && (
                      <td
                        className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-zinc-400 max-w-xs truncate"
                        title={content.description}
                      >
                        {content.description && content.description !== "—"
                          ? content.description
                          : "—"}
                      </td>
                    )}
                    {showGalleryColumns && v.cover && (
                      <td className="px-6 py-3 w-px whitespace-nowrap align-middle">
                        {content.coverUrl ? (
                          <img
                            src={content.coverUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-zinc-600/60 bg-zinc-800"
                          />
                        ) : (
                          <div
                            className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 ring-1 ring-zinc-700/50 flex items-center justify-center"
                            aria-hidden
                          >
                            <span className="text-[10px] text-zinc-600">—</span>
                          </div>
                        )}
                      </td>
                    )}
                    {v.status && (
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          content.status === "published"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                          {formatStatusLabel(content.status)}
                      </span>
                    </td>
                    )}
                    {v.locale && (
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-400 uppercase text-sm">{content.locale}</td>
                    )}
                    {v.updatedAt && (
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-400">{content.updatedAt}</td>
                    )}
                    {v.updatedBy && (
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-zinc-400">{content.updatedBy}</td>
                    )}
                    {v.actions && (
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/content/${type}/${content.id}`}
                          className="p-2 hover:bg-zinc-800 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-zinc-400" />
                        </Link>
                          {schema && !schema.isSingleType && (
                            <button
                              type="button"
                              onClick={() => setRowToDuplicate(content)}
                              className="p-2 hover:bg-zinc-800 rounded transition-colors"
                              title="Duplicate entry"
                              aria-label={`Duplicate “${content.title}”`}
                            >
                              <Copy className="w-4 h-4 text-zinc-400" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => moveToTrash(content)}
                            className="p-2 hover:bg-zinc-800 rounded transition-colors"
                            title="Move to trash"
                            aria-label={`Move “${content.title}” to trash`}
                          >
                          <Trash2 className="w-4 h-4 text-zinc-400" />
                        </button>
                          <button type="button" className="p-2 hover:bg-zinc-800 rounded transition-colors">
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {rowToDuplicate && type && (
        <DuplicateEntryModal
          key={rowToDuplicate.id + rowToDuplicate.updatedAt}
          row={rowToDuplicate}
          takenTitles={takenEntryTitles}
          onClose={() => setRowToDuplicate(null)}
          onConfirm={(title) => confirmDuplicateEntry(rowToDuplicate, title)}
        />
      )}

      {trashOpen &&
        type &&
        createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6" role="presentation">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/55"
              aria-hidden
              onClick={() => setTrashOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="trash-modal-title"
              className="relative z-10 flex max-h-[min(85vh,32rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-700/90 bg-zinc-950 shadow-2xl shadow-black/80 ring-1 ring-white/10"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 px-5 py-3 shrink-0">
                <div className="min-w-0">
                  <h2 id="trash-modal-title" className="text-base font-semibold text-zinc-100">
                    Trash
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {listHeading} · {trashCount} deleted {trashCount === 1 ? "entry" : "entries"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTrashOpen(false)}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {trashedForType.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center text-sm text-zinc-500">
                    <Trash2 className="w-10 h-10 mb-3 opacity-30" />
                    <p>Trash is empty.</p>
                    <p className="text-xs text-zinc-600 mt-1">Deleted entries appear here. You can restore them anytime.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {trashedForType.map(({ key, row }) => (
                      <li
                        key={key}
                        className="flex items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-100 truncate" title={row.title}>
                            {row.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-zinc-500">
                            <span
                              className={
                                row.status === "published"
                                  ? "text-green-400/90"
                                  : "text-yellow-400/90"
                              }
                            >
                              {formatStatusLabel(row.status)}
                            </span>
                            <span>·</span>
                            <span>ID {row.id}</span>
                            <span>·</span>
                            <span>{row.updatedAt}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => restoreFromTrash(key)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:bg-zinc-700/80 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
