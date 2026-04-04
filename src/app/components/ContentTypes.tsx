import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  Plus,
  Database,
  Edit,
  Image as ImageIcon,
  Layers,
  BookOpen,
  Menu,
  LayoutTemplate,
  HelpCircle,
  Quote,
  LayoutGrid,
  List,
  Copy,
} from "lucide-react";
import { cmsColorSwatches as availableColors } from "../lib/cmsColors";
import {
  CONTENT_TYPES_STORAGE_KEY,
  getAllContentTypesForApp,
} from "../data/demoContentTypes";
import type { DemoContentType } from "../data/demoContentTypes";
import { duplicateContentTypeSchema, nextDuplicateDisplayName } from "../lib/cmsDuplicate";
import {
  contentPresets,
  type ContentPresetDefinition,
  type PresetIconKey,
} from "../data/contentPresets";

const CONTENT_TYPES_VIEW_KEY = "cms-content-types-view-mode";

function readContentTypesView(): "grid" | "list" {
  try {
    const v = localStorage.getItem(CONTENT_TYPES_VIEW_KEY);
    if (v === "list" || v === "grid") return v;
  } catch {
    /* ignore */
  }
  return "grid";
}

const PRESET_ICONS: Record<PresetIconKey, LucideIcon> = {
  blog: BookOpen,
  gallery: ImageIcon,
  navigation: Menu,
  landing: LayoutTemplate,
  faq: HelpCircle,
  testimonial: Quote,
};

export function ContentTypes() {
  const [contentTypes, setContentTypes] = useState<DemoContentType[]>(() => getAllContentTypesForApp());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => readContentTypesView());
  const [duplicateTarget, setDuplicateTarget] = useState<DemoContentType | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CONTENT_TYPES_VIEW_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem(CONTENT_TYPES_STORAGE_KEY, JSON.stringify(contentTypes));
    } catch {
      /* ignore */
    }
  }, [contentTypes]);

  const applyPreset = (preset: ContentPresetDefinition) => {
    const key = `${Date.now()}`;
    const built = preset.build(key);
    setContentTypes((prev) => {
      const existing = new Set(prev.map((c) => c.apiId));
      const toAdd = built.filter((t) => !existing.has(t.apiId));
      queueMicrotask(() => {
        if (toAdd.length === 0) {
          setPresetMessage(
            "Bu şablondaki tüm içerik tipleri zaten mevcut (aynı API ID)."
          );
        } else if (toAdd.length < built.length) {
          setPresetMessage(
            `${toAdd.length} tip eklendi. ${built.length - toAdd.length} tip atlandı (çakışan API ID).`
          );
        } else {
          setPresetMessage(`${toAdd.length} içerik tipi eklendi.`);
        }
        window.setTimeout(() => setPresetMessage(null), 5200);
      });
      return [...prev, ...toAdd];
    });
    setShowPresetsModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Content Types</h1>
            <p className="text-zinc-400">{contentTypes.length} types</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            <div
              className="flex items-center rounded-lg border border-zinc-700/80 p-0.5 bg-zinc-900/90 shrink-0"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                title="Grid view"
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-zinc-700 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80"
                }`}
              >
                <LayoutGrid className="w-4 h-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                title="List view"
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-zinc-700 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80"
                }`}
              >
                <List className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowPresetsModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800/90 text-zinc-100 border border-zinc-700/80 rounded-md hover:bg-zinc-800 hover:border-zinc-600 transition-colors font-medium"
            >
              <Layers className="w-4 h-4 opacity-90" />
              <span>Presets</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Content Type</span>
              <span className="sm:hidden">New Type</span>
            </button>
          </div>
        </div>

        {presetMessage && (
          <div
            className="mb-4 px-4 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-200/95"
            role="status"
          >
            {presetMessage}
          </div>
        )}

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTypes.map((ct) => {
              const colorClasses = availableColors.find((c) => c.name === ct.color);

              return (
                <div
                  key={ct.id}
                  className={`bg-zinc-900/50 backdrop-blur-xl border ${colorClasses?.border} rounded-lg overflow-hidden hover:scale-[1.02] transition-all group relative`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colorClasses?.gradient} to-transparent opacity-50`}
                  />

                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 ${colorClasses?.bg} backdrop-blur-sm rounded-lg flex items-center justify-center`}
                        >
                          <Database className={`w-6 h-6 ${colorClasses?.icon}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{ct.name}</h3>
                          <p className="text-xs text-zinc-500">{ct.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">API ID (Singular)</span>
                        <code className="text-zinc-300 bg-zinc-800/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono">
                          {ct.apiId}
                        </code>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">API ID (Plural)</span>
                        <code className="text-zinc-300 bg-zinc-800/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono">
                          {ct.apiId}s
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                      <div className="text-sm">
                        <span className="text-zinc-400">{ct.fields.length} fields</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/content-types/${ct.id}/builder${ct.isSingleType ? "?kind=single" : ""}`}
                          className="p-2 hover:bg-zinc-800/50 backdrop-blur-sm rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-zinc-400" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDuplicateTarget(ct)}
                          className="p-2 hover:bg-zinc-800/50 backdrop-blur-sm rounded transition-colors"
                          title={
                            ct.isSingleType
                              ? "Duplicate single type (schema)"
                              : "Duplicate collection type"
                          }
                          aria-label={`Duplicate ${ct.name}`}
                        >
                          <Copy className="w-4 h-4 text-zinc-400" />
                        </button>
                        <Link
                          to={`/content/${ct.apiId}`}
                          className={`px-3 py-1.5 ${colorClasses?.bg} ${colorClasses?.icon} rounded-md hover:opacity-80 transition-opacity text-sm font-medium`}
                        >
                          View Content →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 w-[min(40%,280px)]">Content type</th>
                  <th className="px-4 py-3 hidden sm:table-cell">API ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Fields</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {contentTypes.map((ct) => {
                  const colorClasses = availableColors.find((c) => c.name === ct.color);
                  return (
                    <tr key={ct.id} className="hover:bg-zinc-800/25 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 shrink-0 rounded-lg ${colorClasses?.bg} flex items-center justify-center`}
                          >
                            <Database className={`w-5 h-5 ${colorClasses?.icon}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-zinc-100 truncate">{ct.name}</div>
                            <p className="text-xs text-zinc-500 line-clamp-2">{ct.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell align-middle">
                        <div className="flex flex-col gap-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 shrink-0">Singular</span>
                            <code className="text-zinc-300 bg-zinc-950/60 px-2 py-0.5 rounded font-mono truncate">
                              {ct.apiId}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 shrink-0">Plural</span>
                            <code className="text-zinc-300 bg-zinc-950/60 px-2 py-0.5 rounded font-mono truncate">
                              {ct.apiId}s
                            </code>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-zinc-400 whitespace-nowrap">
                        {ct.fields.length} fields
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Link
                            to={`/content-types/${ct.id}/builder${ct.isSingleType ? "?kind=single" : ""}`}
                            className="p-2 hover:bg-zinc-800/70 rounded-md transition-colors"
                            title="Edit type"
                          >
                            <Edit className="w-4 h-4 text-zinc-400" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDuplicateTarget(ct)}
                            className="p-2 hover:bg-zinc-800/70 rounded-md transition-colors"
                            title={
                              ct.isSingleType
                                ? "Duplicate single type (schema)"
                                : "Duplicate collection type"
                            }
                            aria-label={`Duplicate ${ct.name}`}
                          >
                            <Copy className="w-4 h-4 text-zinc-400" />
                          </button>
                          <Link
                            to={`/content/${ct.apiId}`}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium ${colorClasses?.bg} ${colorClasses?.icon} hover:opacity-85 transition-opacity`}
                          >
                            View →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateContentTypeModal onClose={() => setShowCreateModal(false)} />
        )}

        {duplicateTarget && (
          <DuplicateCollectionModal
            key={duplicateTarget.id}
            source={duplicateTarget}
            contentTypes={contentTypes}
            onClose={() => setDuplicateTarget(null)}
            onConfirm={(displayName) => {
              const next = duplicateContentTypeSchema(duplicateTarget, displayName, contentTypes);
              setContentTypes((prev) => [...prev, next]);
              setDuplicateTarget(null);
            }}
          />
        )}

        {showPresetsModal && (
          <PresetsModal
            onClose={() => setShowPresetsModal(false)}
            onApply={applyPreset}
          />
        )}
      </div>
    </div>
  );
}

function DuplicateCollectionModal({
  source,
  contentTypes,
  onClose,
  onConfirm,
}: {
  source: DemoContentType;
  contentTypes: DemoContentType[];
  onClose: () => void;
  onConfirm: (displayName: string) => void;
}) {
  const takenNames = useMemo(
    () => new Set(contentTypes.map((t) => t.name)),
    [contentTypes]
  );
  const [name, setName] = useState(() => nextDuplicateDisplayName(source.name, takenNames));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dup-collection-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
          <h2 id="dup-collection-title" className="text-lg font-semibold text-zinc-100">
            {source.isSingleType ? "Tekil içerik tipini çoğalt" : "Koleksiyon tipini çoğalt"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <Plus className="w-5 h-5 rotate-45 text-zinc-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-zinc-400">
            Kopyalanıyor:{" "}
            <span className="text-zinc-200 font-medium">{source.name}</span>
            . Alanlar ve ayarlar aynı kalır; API ID isimden üretilir.
            {source.isSingleType ? (
              <> Kopya da tekil tip olarak kalır (tek kayıt).</>
            ) : null}
          </p>
          <div>
            <label htmlFor="dup-collection-name" className="block text-sm font-medium text-zinc-300 mb-2">
              Görünen ad
            </label>
            <input
              id="dup-collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-600 text-zinc-100"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              setName(nextDuplicateDisplayName(name.trim() || source.name, takenNames))
            }
            className="text-sm text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
          >
            Sonuna +1 ile sıradaki isim (ör. İsim 1, İsim 2)
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
              onClick={() => onConfirm(name)}
              disabled={!name.trim()}
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

function PresetsModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (preset: ContentPresetDefinition) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-zinc-800/50 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Content presets</h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Sık kullanılan site yapıları için hazır içerik tipleri. Her şablon birden fazla
              koleksiyon veya single type ekleyebilir; ilişki alanları birbirine bağlanacak şekilde
              tanımlıdır.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-zinc-800/80 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <Plus className="w-5 h-5 rotate-45 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentPresets.map((preset) => {
              const colorClasses = availableColors.find((c) => c.name === preset.color);
              const Icon = PRESET_ICONS[preset.icon];
              return (
                <div
                  key={preset.id}
                  className={`relative rounded-xl border ${colorClasses?.border ?? "border-zinc-800"} bg-zinc-950/40 overflow-hidden flex flex-col`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colorClasses?.gradient ?? "from-zinc-500/10"} to-transparent opacity-60 pointer-events-none`}
                  />
                  <div className="relative p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-11 h-11 rounded-lg ${colorClasses?.bg ?? "bg-zinc-800/80"} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-5 h-5 ${colorClasses?.icon ?? "text-zinc-300"}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-zinc-100 text-lg leading-tight">
                          {preset.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">{preset.description}</p>
                      </div>
                    </div>
                    <ul className="text-xs text-zinc-400 space-y-1.5 mb-4 flex-1 border-t border-zinc-800/60 pt-3">
                      {preset.includes.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className={`mt-1.5 h-1 w-1 rounded-full shrink-0 ${colorClasses?.bg ?? "bg-zinc-600"} ring-1 ring-zinc-600/50`} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => onApply(preset)}
                      className={`w-full py-2.5 rounded-lg font-medium text-sm transition-opacity ${colorClasses?.bg ?? "bg-zinc-800"} ${colorClasses?.icon ?? "text-zinc-200"} hover:opacity-90 border ${colorClasses?.border ?? "border-zinc-700"}`}
                    >
                      Add preset
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateContentTypeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [selectedType, setSelectedType] = useState<"collection" | "single">("collection");
  const [selectedColor, setSelectedColor] = useState("blue");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center">
              <span className="font-bold text-zinc-950">CT</span>
            </div>
            <h2 className="text-xl font-semibold">Create Content Type</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800/50 backdrop-blur-sm rounded transition-colors"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1">Configurations</h3>
            <p className="text-sm text-zinc-400">A type for modeling data</p>
          </div>

          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Article"
                className="w-full px-3 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* API ID Singular */}
              <div>
                <label className="block text-sm font-medium mb-2">API ID (Singular)</label>
                <input
                  type="text"
                  value={displayName.toLowerCase()}
                  disabled
                  className="w-full px-3 py-2 bg-zinc-800/50 backdrop-blur-sm border border-zinc-800/50 rounded-md text-zinc-400"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  The UID is used to generate the API routes and databases tables/collections
                </p>
              </div>

              {/* API ID Plural */}
              <div>
                <label className="block text-sm font-medium mb-2">API ID (Plural)</label>
                <input
                  type="text"
                  value={displayName.toLowerCase() + "s"}
                  disabled
                  className="w-full px-3 py-2 bg-zinc-800/50 backdrop-blur-sm border border-zinc-800/50 rounded-md text-zinc-400"
                />
                <p className="text-xs text-zinc-500 mt-2">Pluralized API ID</p>
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Color</label>
              <div className="grid grid-cols-6 gap-3">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`relative h-14 rounded-lg ${color.bg} ${color.border} border-2 transition-all hover:scale-105 ${
                      selectedColor === color.name ? "ring-2 ring-zinc-100 ring-offset-2 ring-offset-zinc-950" : ""
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} to-transparent rounded-lg`} />
                    {selectedColor === color.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center">
                          <Database className="w-4 h-4 text-zinc-950" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedType("collection")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedType === "collection"
                      ? "border-zinc-100 bg-zinc-800/50 backdrop-blur-sm"
                      : "border-zinc-800/50 hover:border-zinc-700/50 bg-zinc-900/30 backdrop-blur-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      selectedType === "collection" ? "border-zinc-100" : "border-zinc-600"
                    }`}>
                      {selectedType === "collection" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-100" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Collection Type</h4>
                      <p className="text-sm text-zinc-400">
                        Best for multiple instances like articles, products, comments, etc.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType("single")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedType === "single"
                      ? "border-zinc-100 bg-zinc-800/50 backdrop-blur-sm"
                      : "border-zinc-800/50 hover:border-zinc-700/50 bg-zinc-900/30 backdrop-blur-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      selectedType === "single" ? "border-zinc-100" : "border-zinc-600"
                    }`}>
                      {selectedType === "single" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-100" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Single Type</h4>
                      <p className="text-sm text-zinc-400">
                        Best for single instance like about us, homepage, etc.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!displayName.trim()}
            onClick={() => {
              const name = displayName.trim();
              const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
              navigate(
                `/content-types/create/builder?kind=${selectedType === "single" ? "single" : "collection"}`,
                {
                  state: {
                    displayName: name,
                    singularId: slug || "content-type",
                    pluralId: slug ? `${slug}s` : "content-types",
                    color: selectedColor,
                  },
                }
              );
              onClose();
            }}
            className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}