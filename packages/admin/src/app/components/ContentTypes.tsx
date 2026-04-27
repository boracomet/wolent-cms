import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../api/client";
import { apiTypeToDemoType as apiToType, invalidateContentTypeCache, setCachedTypes } from "../lib/contentTypeCache";
import { useConfirm } from "./ConfirmDialog";
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
  Trash2,
  Loader2,
  FileText,
  ShoppingBag,
  Users,
  Tag,
  Calendar,
  Video,
  Music,
  Map,
  Star,
  MessageSquare,
  Bell,
  Globe,
  Briefcase,
  Award,
  Package,
  BarChart2,
  Newspaper,
  Folder,
  Link as LinkIcon,
  Settings,
  Zap,
  Heart,
  Film,
  Type,
  Home,
  Box,
} from "lucide-react";
import { cmsColorSwatches as availableColors } from "../lib/cmsColors";
import { useI18n } from "../i18n";
import { CONTENT_TYPES_STORAGE_KEY } from "../data/demoContentTypes";
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
  const [contentTypes, setContentTypes] = useState<DemoContentType[]>([]);
  const [ctLoading, setCtLoading] = useState(true);
  const { t } = useI18n();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => readContentTypesView());
  const [duplicateTarget, setDuplicateTarget] = useState<DemoContentType | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const confirm = useConfirm();

  const handleDelete = useCallback(async (ct: DemoContentType) => {
    const ok = await confirm({
      title: "İçerik Türünü Sil",
      message: `"${ct.name}" içerik türünü silmek istediğine emin misin? Bu türe ait tüm içerikler de kalıcı olarak silinecek.`,
      confirmLabel: "Evet, Sil",
      variant: "danger",
    });
    if (!ok) return;
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      await api.contentTypes.delete(ct.id);
      setContentTypes(prev => prev.filter(c => c.id !== ct.id));
      invalidateContentTypeCache();
      setDeleteSuccess(`"${ct.name}" başarıyla silindi.`);
      window.setTimeout(() => setDeleteSuccess(null), 5200);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Silme işlemi başarısız oldu.');
    }
  }, [confirm]);

  const syncFromApi = useCallback(() => {
    setCtLoading(true);
    api.contentTypes.list()
      .then(res => {
        const types = (res.data as unknown[]).map(t => apiToType(t as Record<string, unknown>));
        setContentTypes(types);
        setCachedTypes(types);
        try {
          localStorage.setItem(CONTENT_TYPES_STORAGE_KEY, JSON.stringify(types));
        } catch { /* ignore */ }
      })
      .catch(() => { setContentTypes([]); })
      .finally(() => setCtLoading(false));
  }, []);

  useEffect(() => {
    syncFromApi();
  }, [syncFromApi]);

  useEffect(() => {
    try {
      localStorage.setItem(CONTENT_TYPES_VIEW_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const applyPreset = async (preset: ContentPresetDefinition) => {
    const key = `${Date.now()}`;
    const built = preset.build(key);
    const existing = new Set(contentTypes.map((c) => c.apiId));
    const toAdd = built.filter((t) => !existing.has(t.apiId));
    setShowPresetsModal(false);

    if (toAdd.length === 0) {
      setPresetMessage("Bu şablondaki tüm içerik tipleri zaten mevcut (aynı API ID).");
      window.setTimeout(() => setPresetMessage(null), 5200);
      return;
    }

    let created = 0;
    let skipped = 0;
    for (const t of toAdd) {
      const attributes: Record<string, unknown> = {};
      for (const f of t.fields) {
        const attr: Record<string, unknown> = { type: f.type, required: f.required };
        if (f.description) attr['description'] = f.description;
        if (f.type === 'enumeration' && f.enumOptions?.length) {
          attr['enum'] = f.enumOptions;
        }
        attributes[f.apiName] = attr;
      }
      try {
        await api.contentTypes.create({
          displayName: t.name,
          singularApiId: t.apiId,
          pluralApiId: t.apiId.endsWith('s') ? t.apiId : `${t.apiId}s`,
          kind: t.isSingleType ? 'singleType' : 'collectionType',
          draftAndPublish: true,
          i18n: false,
          reviewWorkflow: false,
          attributes,
        });
        created++;
      } catch {
        skipped++;
      }
    }

    if (created > 0) {
      syncFromApi();
      invalidateContentTypeCache();
    }

    if (skipped > 0) {
      setPresetMessage(`${created} tip oluşturuldu. ${skipped} tip oluşturulamadı.`);
    } else if (created < built.length) {
      setPresetMessage(`${created} tip oluşturuldu. ${built.length - created} tip atlandı (çakışan API ID).`);
    } else {
      setPresetMessage(`${created} içerik tipi oluşturuldu.`);
    }
    window.setTimeout(() => setPresetMessage(null), 5200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{t("contentTypes.title")}</h1>
            <p className="text-stone-600 dark:text-zinc-400">{t("contentTypes.typesCount", { n: contentTypes.length })}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            <div
              className="flex items-center rounded-lg border border-stone-300/82 dark:border-zinc-700/80 p-0.5 bg-white/94 dark:bg-zinc-900/90 shrink-0"
              role="group"
              aria-label={t("contentTypes.viewMode")}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                title={t("contentTypes.gridView")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-stone-300 dark:bg-zinc-700 text-stone-900 dark:text-zinc-100 shadow-sm"
                    : "text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 hover:bg-stone-200/95 active:bg-stone-300/80 dark:hover:bg-zinc-800/75 dark:active:bg-zinc-800/90"
                }`}
              >
                <LayoutGrid className="w-4 h-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                title={t("contentTypes.listView")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-stone-300 dark:bg-zinc-700 text-stone-900 dark:text-zinc-100 shadow-sm"
                    : "text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 hover:bg-stone-200/95 active:bg-stone-300/80 dark:hover:bg-zinc-800/75 dark:active:bg-zinc-800/90"
                }`}
              >
                <List className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowPresetsModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-200 dark:bg-zinc-800/90 text-stone-900 dark:text-zinc-100 border border-stone-300/82 dark:border-zinc-700/80 rounded-md hover:bg-stone-300 dark:hover:bg-zinc-800 hover:border-stone-400 dark:hover:border-zinc-600 transition-colors font-medium"
            >
              <Layers className="w-4 h-4 opacity-90" />
              <span>{t("contentTypes.presets")}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("contentTypes.createContentType")}</span>
              <span className="sm:hidden">{t("contentTypes.newType")}</span>
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

        {deleteSuccess && (
          <div
            className="mb-4 px-4 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-200/95"
            role="status"
          >
            {deleteSuccess}
          </div>
        )}

        {deleteError && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300" role="alert">
            {deleteError}
          </div>
        )}

        {ctLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-stone-500 dark:text-zinc-500" />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTypes.map((ct) => {
              const colorClasses = availableColors.find((c) => c.name === ct.color);

              return (
                <div
                  key={ct.id}
                  className={`bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border ${colorClasses?.border} rounded-lg overflow-hidden hover:scale-[1.02] transition-all group relative`}
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
                          <p className="text-xs text-stone-500 dark:text-zinc-500">{ct.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-600 dark:text-zinc-400">API ID (Singular)</span>
                        <code className="text-stone-700 dark:text-zinc-300 bg-stone-200/95 dark:bg-zinc-800/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono">
                          {ct.apiId}
                        </code>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-600 dark:text-zinc-400">API ID (Plural)</span>
                        <code className="text-stone-700 dark:text-zinc-300 bg-stone-200/95 dark:bg-zinc-800/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono">
                          {ct.apiId}s
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-stone-200/85 dark:border-zinc-800/50">
                      <div className="text-sm">
                        <span className="text-stone-600 dark:text-zinc-400">{t("contentTypes.fieldsCount", { n: ct.fields.length })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/content-types/${ct.id}/builder${ct.isSingleType ? "?kind=single" : ""}`}
                          className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 backdrop-blur-sm rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDuplicateTarget(ct)}
                          className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 backdrop-blur-sm rounded transition-colors"
                          title={
                            ct.isSingleType
                              ? t("contentTypes.duplicateSingle")
                              : t("contentTypes.duplicateCollection")
                          }
                          aria-label={`Duplicate ${ct.name}`}
                        >
                          <Copy className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ct)}
                          className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 backdrop-blur-sm rounded transition-colors"
                          title={t("contentTypes.deleteType")}
                          aria-label={`Delete ${ct.name}`}
                        >
                          <Trash2 className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                        </button>
                        <Link
                          to={`/content/${ct.apiId}`}
                          className={`px-3 py-1.5 ${colorClasses?.bg} ${colorClasses?.icon} rounded-md hover:opacity-80 transition-opacity text-sm font-medium`}
                        >
                          {t("contentTypes.viewContent")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200/88 dark:border-zinc-800/60 bg-stone-50/92 dark:bg-zinc-900/40 backdrop-blur-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-stone-200/90 dark:border-zinc-800/80 text-left text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-500">
                  <th className="px-4 py-3 w-[min(40%,280px)]">{t("contentTypes.col.contentType")}</th>
                  <th className="px-4 py-3 hidden sm:table-cell">{t("contentTypes.col.apiId")}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{t("contentTypes.col.fields")}</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">{t("contentTypes.col.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-zinc-800/60">
                {contentTypes.map((ct) => {
                  const colorClasses = availableColors.find((c) => c.name === ct.color);
                  return (
                    <tr key={ct.id} className="hover:bg-stone-300 dark:hover:bg-zinc-800/25 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 shrink-0 rounded-lg ${colorClasses?.bg} flex items-center justify-center`}
                          >
                            <Database className={`w-5 h-5 ${colorClasses?.icon}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-stone-900 dark:text-zinc-100 truncate">{ct.name}</div>
                            <p className="text-xs text-stone-500 dark:text-zinc-500 line-clamp-2">{ct.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell align-middle">
                        <div className="flex flex-col gap-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-stone-500 dark:text-zinc-500 shrink-0">{t("contentTypes.singularLabel")}</span>
                            <code className="text-stone-700 dark:text-zinc-300 bg-white/78 dark:bg-zinc-950/60 px-2 py-0.5 rounded font-mono truncate">
                              {ct.apiId}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-stone-500 dark:text-zinc-500 shrink-0">{t("contentTypes.pluralLabel")}</span>
                            <code className="text-stone-700 dark:text-zinc-300 bg-white/78 dark:bg-zinc-950/60 px-2 py-0.5 rounded font-mono truncate">
                              {ct.apiId}s
                            </code>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-stone-600 dark:text-zinc-400 whitespace-nowrap">
                        {t("contentTypes.fieldsCount", { n: ct.fields.length })}
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Link
                            to={`/content-types/${ct.id}/builder${ct.isSingleType ? "?kind=single" : ""}`}
                            className="p-2 hover:bg-stone-300/85 dark:hover:bg-zinc-800/70 rounded-md transition-colors"
                            title={t("contentTypes.editType")}
                          >
                            <Edit className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDuplicateTarget(ct)}
                            className="p-2 hover:bg-stone-300/85 dark:hover:bg-zinc-800/70 rounded-md transition-colors"
                            title={
                              ct.isSingleType
                                ? t("contentTypes.duplicateSingle")
                                : t("contentTypes.duplicateCollection")
                            }
                            aria-label={`Duplicate ${ct.name}`}
                          >
                            <Copy className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ct)}
                            className="p-2 hover:bg-red-500/15 rounded-md transition-colors"
                            title={t("contentTypes.deleteType")}
                            aria-label={`Delete ${ct.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-stone-500 dark:text-zinc-500 hover:text-red-400" />
                          </button>
                          <Link
                            to={`/content/${ct.apiId}`}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium ${colorClasses?.bg} ${colorClasses?.icon} hover:opacity-85 transition-opacity`}
                          >
                            {t("contentTypes.view")}
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
            onConfirm={async (displayName) => {
              const next = duplicateContentTypeSchema(duplicateTarget, displayName, contentTypes);
              const attributes: Record<string, unknown> = {};
              for (const f of next.fields) {
                const attr: Record<string, unknown> = { type: f.type, required: f.required };
                if (f.description) attr['description'] = f.description;
                if (f.type === 'enumeration' && f.enumOptions?.length) attr['enum'] = f.enumOptions;
                attributes[f.apiName] = attr;
              }
              try {
                await api.contentTypes.create({
                  displayName: next.name,
                  singularApiId: next.apiId,
                  pluralApiId: next.apiId.endsWith('s') ? next.apiId : `${next.apiId}s`,
                  kind: next.isSingleType ? 'singleType' : 'collectionType',
                  draftAndPublish: true,
                  i18n: false,
                  reviewWorkflow: false,
                  attributes,
                });
                syncFromApi();
                invalidateContentTypeCache();
              } catch {
                setContentTypes((prev) => [...prev, next]);
              }
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
        className="bg-white/96 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dup-collection-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-200/85 dark:border-zinc-800/50">
          <h2 id="dup-collection-title" className="text-lg font-semibold text-stone-900 dark:text-zinc-100">
            {source.isSingleType ? "Tekil içerik tipini çoğalt" : "Koleksiyon tipini çoğalt"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <Plus className="w-5 h-5 rotate-45 text-stone-600 dark:text-zinc-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-stone-600 dark:text-zinc-400">
            Kopyalanıyor:{" "}
            <span className="text-stone-800 dark:text-zinc-200 font-medium">{source.name}</span>
            . Alanlar ve ayarlar aynı kalır; API ID isimden üretilir.
            {source.isSingleType ? (
              <> Kopya da tekil tip olarak kalır (tek kayıt).</>
            ) : null}
          </p>
          <div>
            <label htmlFor="dup-collection-name" className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
              Görünen ad
            </label>
            <input
              id="dup-collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white/88 dark:bg-zinc-950/80 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-600 text-stone-900 dark:text-zinc-100"
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
              className="px-4 py-2 rounded-md border border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-200/95 active:bg-stone-300/80 dark:hover:bg-zinc-800/75 dark:active:bg-zinc-800/90 transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => onConfirm(name)}
              disabled={!name.trim()}
              className="px-4 py-2 rounded-md bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-medium hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:pointer-events-none"
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
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/96 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-stone-200/85 dark:border-zinc-800/50 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-zinc-100">{t("contentTypes.contentPresets")}</h2>
            <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1 max-w-xl">
              Sık kullanılan site yapıları için hazır içerik tipleri. Her şablon birden fazla
              koleksiyon veya single type ekleyebilir; ilişki alanları birbirine bağlanacak şekilde
              tanımlıdır.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-stone-200/95 active:bg-stone-300/80 dark:hover:bg-zinc-800/75 dark:active:bg-zinc-800/90 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <Plus className="w-5 h-5 rotate-45 text-stone-600 dark:text-zinc-400" />
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
                  className={`relative rounded-xl border ${colorClasses?.border ?? "border-stone-200 dark:border-zinc-800"} bg-stone-100/92 dark:bg-zinc-950/40 overflow-hidden flex flex-col`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colorClasses?.gradient ?? "from-zinc-500/10"} to-transparent opacity-60 pointer-events-none`}
                  />
                  <div className="relative p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-11 h-11 rounded-lg ${colorClasses?.bg ?? "bg-stone-200 dark:bg-zinc-800/80"} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-5 h-5 ${colorClasses?.icon ?? "text-stone-700 dark:text-zinc-300"}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-stone-900 dark:text-zinc-100 text-lg leading-tight">
                          {preset.title}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1">{preset.description}</p>
                      </div>
                    </div>
                    <ul className="text-xs text-stone-600 dark:text-zinc-400 space-y-1.5 mb-4 flex-1 border-t border-stone-200/88 dark:border-zinc-800/60 pt-3">
                      {preset.includes.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className={`mt-1.5 h-1 w-1 rounded-full shrink-0 ${colorClasses?.bg ?? "bg-stone-400 dark:bg-zinc-600"} ring-1 ring-stone-400/60 dark:ring-zinc-600/50`} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => onApply(preset)}
                      className={`w-full py-2.5 rounded-lg font-medium text-sm transition-opacity ${colorClasses?.bg ?? "bg-stone-200 dark:bg-zinc-800"} ${colorClasses?.icon ?? "text-stone-800 dark:text-zinc-200"} hover:opacity-90 border ${colorClasses?.border ?? "border-stone-300 dark:border-zinc-700"}`}
                    >
                      {t("contentTypes.addPreset")}
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

export const CT_ICON_OPTIONS: { id: string; icon: LucideIcon; label: string }[] = [
  { id: 'database', icon: Database, label: 'Database' },
  { id: 'file-text', icon: FileText, label: 'Article' },
  { id: 'book-open', icon: BookOpen, label: 'Blog' },
  { id: 'newspaper', icon: Newspaper, label: 'News' },
  { id: 'shopping-bag', icon: ShoppingBag, label: 'Products' },
  { id: 'package', icon: Package, label: 'Package' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'image', icon: ImageIcon, label: 'Gallery' },
  { id: 'video', icon: Video, label: 'Video' },
  { id: 'music', icon: Music, label: 'Music' },
  { id: 'film', icon: Film, label: 'Film' },
  { id: 'tag', icon: Tag, label: 'Tag' },
  { id: 'calendar', icon: Calendar, label: 'Events' },
  { id: 'map', icon: Map, label: 'Location' },
  { id: 'star', icon: Star, label: 'Review' },
  { id: 'message-square', icon: MessageSquare, label: 'Comment' },
  { id: 'bell', icon: Bell, label: 'Notification' },
  { id: 'globe', icon: Globe, label: 'Page' },
  { id: 'briefcase', icon: Briefcase, label: 'Job' },
  { id: 'award', icon: Award, label: 'Award' },
  { id: 'bar-chart', icon: BarChart2, label: 'Analytics' },
  { id: 'folder', icon: Folder, label: 'Category' },
  { id: 'link', icon: LinkIcon, label: 'Link' },
  { id: 'settings', icon: Settings, label: 'Config' },
  { id: 'zap', icon: Zap, label: 'Action' },
  { id: 'heart', icon: Heart, label: 'Favorite' },
  { id: 'home', icon: Home, label: 'Page' },
  { id: 'box', icon: Box, label: 'Item' },
  { id: 'type', icon: Type, label: 'Text' },
  { id: 'layers', icon: Layers, label: 'Section' },
];

function CreateContentTypeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [selectedType, setSelectedType] = useState<"collection" | "single">("collection");
  const [selectedIcon, setSelectedIcon] = useState("database");
  const [selectedColor, setSelectedColor] = useState("blue");
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/94 dark:bg-zinc-900/90 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200/85 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            {(() => {
              const HeaderIconCmp = CT_ICON_OPTIONS.find(i => i.id === selectedIcon)?.icon ?? Database;
              const colorMeta = availableColors.find(c => c.name === selectedColor);
              return (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMeta?.bg ?? 'bg-stone-200 dark:bg-zinc-800'}`}>
                  <HeaderIconCmp className={`w-5 h-5 ${colorMeta?.icon ?? 'text-stone-900 dark:text-zinc-100'}`} />
                </div>
              );
            })()}
            <h2 className="text-xl font-semibold">{t("contentTypes.create.title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 backdrop-blur-sm rounded transition-colors"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1">{t("contentTypes.create.configurations")}</h3>
            <p className="text-sm text-stone-600 dark:text-zinc-400">{t("contentTypes.create.configurationsDesc")}</p>
          </div>

          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium mb-2">{t("contentTypes.create.displayName")}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("contentTypes.create.displayNamePlaceholder")}
                className="w-full px-3 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* API ID Singular */}
              <div>
                <label className="block text-sm font-medium mb-2">{t("contentTypes.create.apiIdSingular")}</label>
                <input
                  type="text"
                  value={displayName.toLowerCase()}
                  disabled
                  className="w-full px-3 py-2 bg-stone-200/85 dark:bg-zinc-800/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md text-stone-600 dark:text-zinc-400"
                />
                <p className="text-xs text-stone-500 dark:text-zinc-500 mt-2">
                  {t("contentTypes.create.apiIdSingularHint")}
                </p>
              </div>

              {/* API ID Plural */}
              <div>
                <label className="block text-sm font-medium mb-2">{t("contentTypes.create.apiIdPlural")}</label>
                <input
                  type="text"
                  value={displayName.toLowerCase() + "s"}
                  disabled
                  className="w-full px-3 py-2 bg-stone-200/85 dark:bg-zinc-800/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md text-stone-600 dark:text-zinc-400"
                />
                <p className="text-xs text-stone-500 dark:text-zinc-500 mt-2">{t("contentTypes.create.apiIdPluralHint")}</p>
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">{t("contentTypes.create.color")}</label>
              <div className="grid grid-cols-6 gap-3">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`relative h-14 rounded-lg ${color.bg} ${color.border} border-2 transition-all hover:scale-105 ${
                      selectedColor === color.name ? "ring-2 ring-stone-400 ring-offset-2 ring-offset-stone-100 dark:ring-zinc-100 dark:ring-offset-zinc-950" : ""
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} to-transparent rounded-lg`} />
                    {selectedColor === color.name && (() => {
                      const SelectedIconCmp = CT_ICON_OPTIONS.find(i => i.id === selectedIcon)?.icon ?? Database;
                      return (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-stone-900 dark:bg-zinc-100 rounded-full flex items-center justify-center">
                            <SelectedIconCmp className="w-3.5 h-3.5 text-white dark:text-zinc-950" />
                          </div>
                        </div>
                      );
                    })()}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">{t("contentTypes.create.icon")}</label>
              <div className="grid grid-cols-10 gap-1.5">
                {CT_ICON_OPTIONS.map(({ id, icon: IconCmp, label }) => {
                  const colorMeta = availableColors.find(c => c.name === selectedColor);
                  const isSelected = selectedIcon === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      title={label}
                      onClick={() => setSelectedIcon(id)}
                      className={`group relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                        isSelected
                          ? `${colorMeta?.bg ?? 'bg-stone-200 dark:bg-zinc-800'} ${colorMeta?.border ?? 'border-stone-400 dark:border-zinc-600'} border-2 shadow-sm`
                          : 'border-stone-200/85 dark:border-zinc-800/50 bg-stone-50/92 dark:bg-zinc-900/40 hover:border-stone-400 dark:hover:border-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <IconCmp className={`w-5 h-5 ${isSelected ? (colorMeta?.icon ?? 'text-stone-900 dark:text-zinc-100') : 'text-stone-600 dark:text-zinc-400 group-hover:text-stone-800 dark:text-zinc-200'}`} />
                      <span className="text-[9px] text-stone-500 dark:text-zinc-500 group-hover:text-stone-600 dark:text-zinc-400 truncate w-full text-center leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">{t("contentTypes.create.type")}</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedType("collection")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedType === "collection"
                      ? "border-stone-300 dark:border-zinc-100 bg-stone-200/85 dark:bg-zinc-800/50 backdrop-blur-sm"
                      : "border-stone-200/85 dark:border-zinc-800/50 hover:border-stone-400 dark:hover:border-zinc-700/50 bg-stone-50/85 dark:bg-zinc-900/30 backdrop-blur-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      selectedType === "collection" ? "border-stone-300 dark:border-zinc-100" : "border-stone-400 dark:border-zinc-600"
                    }`}>
                      {selectedType === "collection" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-900 dark:bg-zinc-100" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{t("contentTypes.create.collectionType")}</h4>
                      <p className="text-sm text-stone-600 dark:text-zinc-400">
                        {t("contentTypes.create.collectionDesc")}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType("single")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedType === "single"
                      ? "border-stone-300 dark:border-zinc-100 bg-stone-200/85 dark:bg-zinc-800/50 backdrop-blur-sm"
                      : "border-stone-200/85 dark:border-zinc-800/50 hover:border-stone-400 dark:hover:border-zinc-700/50 bg-stone-50/85 dark:bg-zinc-900/30 backdrop-blur-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      selectedType === "single" ? "border-stone-300 dark:border-zinc-100" : "border-stone-400 dark:border-zinc-600"
                    }`}>
                      {selectedType === "single" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-900 dark:bg-zinc-100" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{t("contentTypes.create.singleType")}</h4>
                      <p className="text-sm text-stone-600 dark:text-zinc-400">
                        {t("contentTypes.create.singleDesc")}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200/85 dark:border-zinc-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t("contentTypes.create.cancel")}
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
                    icon: selectedIcon,
                  },
                }
              );
              onClose();
            }}
            className="px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("contentTypes.create.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}