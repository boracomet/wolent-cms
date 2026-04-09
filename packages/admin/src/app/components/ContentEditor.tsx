import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../api/client";
import { Link, useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  ChevronDown,
  Check,
  Calendar,
  User,
  Tag,
  Upload,
  Image as ImageIcon,
  X,
  Images,
  Languages,
  Loader2,
  Sparkles,
  Send,
} from "lucide-react";
import { MinimalTiptap } from "./MinimalTiptap";
import { DynamicSchemaFields } from "./DynamicSchemaFields";
import { MediaLibraryPickerModal } from "./MediaLibraryPickerModal";
import { AiTranslateModal } from "./AiTranslateModal";
import type { DemoField } from "../data/demoContentTypes";
import { buildEmptyValuesForFields } from "../data/demoContentTypes";
import { getCachedTypeByApiId, fetchContentTypes } from "../lib/contentTypeCache";
import { fetchEnabledLocales } from "../lib/locales";
import type { LocaleEntry } from "../lib/locales";

function getAiTranslateFieldKeys(
  dynamicEditor: boolean,
  fields: DemoField[],
): { titleKey: string; summaryKey: string } {
  if (!dynamicEditor || fields.length === 0) {
    return { titleKey: "title", summaryKey: "content" };
  }
  const candidates = fields.filter(
    (f) =>
      f.type === "text" ||
      f.type === "text_long" ||
      f.type === "blocks" ||
      f.type === "richtext",
  );
  if (candidates.length === 0) {
    return { titleKey: "title", summaryKey: "content" };
  }
  const titleField = candidates.find((f) => f.type === "text") ?? candidates[0];
  const summaryField =
    candidates.find((f) => f.apiName !== titleField.apiName) ?? titleField;
  return {
    titleKey: titleField.apiName,
    summaryKey: summaryField.apiName,
  };
}

type Locale = Pick<LocaleEntry, 'code' | 'name' | 'flag'>;

function buildLegacyInitial(localeCodes?: string[]): Record<string, Record<string, string>> {
  const codes = localeCodes ?? ["en", "tr", "de", "fr", "es"];
  return Object.fromEntries(codes.map(c => [c, { title: "", content: "" }]));
}

export function ContentEditor() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "create";

  const [schemaVersion, setSchemaVersion] = useState(0);
  useEffect(() => {
    fetchContentTypes().then(() => setSchemaVersion(v => v + 1));
  }, [type]);
  const schemaType = useMemo(() => getCachedTypeByApiId(type), [type, schemaVersion]);
  const dynamicEditor = Boolean(schemaType?.useDynamicEditor);
  const schemaFields = schemaType?.fields ?? [];
  const aiTranslateKeys = useMemo(
    () => getAiTranslateFieldKeys(dynamicEditor, schemaFields),
    [dynamicEditor, schemaFields],
  );
  const aiTranslateShowSummary = aiTranslateKeys.titleKey !== aiTranslateKeys.summaryKey;

  const [availableLocales, setAvailableLocales] = useState<Locale[]>([
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "tr", name: "Turkish", flag: "🇹🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
  ]);
  useEffect(() => {
    fetchEnabledLocales(() => api.settings.get("i18n")).then(setAvailableLocales);
  }, []);

  const [currentLocale, setCurrentLocale] = useState<string>("en");
  const [showLocaleMenu, setShowLocaleMenu] = useState(false);
  const [showLocalizationStatusMenu, setShowLocalizationStatusMenu] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverGalleryOpen, setCoverGalleryOpen] = useState(false);
  const [aiTranslateOpen, setAiTranslateOpen] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);

  const [contentByLocale, setContentByLocale] = useState<Record<string, Record<string, string>>>(() =>
    buildLegacyInitial()
  );

  // New entries only: resetting when schema loads must not wipe loaded data on edit.
  useEffect(() => {
    if (!isNew) return;
    const fields = schemaType?.fields ?? [];
    const dyn = Boolean(schemaType?.useDynamicEditor);
    const codes = availableLocales.map((l) => l.code);
    if (dyn && fields.length > 0) {
      const next: Record<string, Record<string, string>> = {};
      for (const loc of availableLocales) {
        next[loc.code] = buildEmptyValuesForFields(fields);
      }
      setContentByLocale(next);
    } else {
      setContentByLocale(buildLegacyInitial(codes));
    }
  }, [isNew, type, schemaType, availableLocales]);

  const currentContent = contentByLocale[currentLocale] ?? {};
  const selectedLocale = availableLocales.find((l) => l.code === currentLocale)!;

  const localesWithContent = availableLocales.map((locale) => {
    const row = contentByLocale[locale.code] ?? {};
    let hasContent = false;
    if (dynamicEditor && schemaFields.length) {
      hasContent = schemaFields.some((f) => {
        const val = row[f.apiName];
        if (val == null || val === "") return false;
        if (f.type === "boolean") return val === "true";
        return String(val).trim() !== "";
      });
    } else {
      hasContent = !!(row.title?.trim() || row.content?.trim());
    }
    return { ...locale, hasContent };
  });

  const localeCompleteCount = localesWithContent.filter((l) => l.hasContent).length;

  const updateContent = (field: string, value: string) => {
    setContentByLocale((prev) => ({
      ...prev,
      [currentLocale]: {
        ...(prev[currentLocale] ?? {}),
        [field]: value,
      },
    }));
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [entryMeta, setEntryMeta] = useState<{ createdAt?: string; updatedAt?: string } | null>(null);

  // Load existing entry data if editing
  useEffect(() => {
    if (!isNew && id && type) {
      setLoadError(null);
      api.entries.get(type, id)
        .then(res => {
          const entry = res.data as Record<string, unknown>;
          // Backend spreads field data directly into the entry object (alongside id, status, createdAt etc.)
          const systemKeys = new Set(['id', 'documentId', 'contentTypeId', 'tenantId', 'createdById', 'updatedById', 'createdAt', 'updatedAt', 'publishedAt', 'deletedAt', 'locale', 'status', 'version', 'data']);
          const fieldData = Object.fromEntries(
            Object.entries(entry)
              .filter(([k]) => !systemKeys.has(k))
              .map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
          );
          if (entry['coverImage']) setCoverImage(String(entry['coverImage']));
          const entryLocale =
            typeof entry['locale'] === "string" && entry['locale'].length >= 2
              ? entry['locale']
              : "en";
          setCurrentLocale(entryLocale);
          setContentByLocale((prev) => ({
            ...prev,
            [entryLocale]: { ...(prev[entryLocale] ?? {}), ...fieldData },
          }));
          setStatus((entry['status'] as 'draft' | 'published') ?? 'draft');
          setEntryMeta({
            createdAt: entry['createdAt'] ? new Date(entry['createdAt'] as string).toLocaleDateString() : undefined,
            updatedAt: entry['updatedAt'] ? new Date(entry['updatedAt'] as string).toLocaleDateString() : undefined,
          });
        })
        .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load entry.'));
    }
  }, [type, id, isNew]);

  const handleSave = useCallback(async () => {
    if (!type) return;
    setSaving(true);
    setSaveError(null);
    try {
      const data = { ...(contentByLocale[currentLocale] ?? {}), status, ...(coverImage ? { coverImage } : {}) };
      if (isNew) {
        const res = await api.entries.create(type, data, currentLocale);
        const created = (res as { data: Record<string, unknown> }).data;
        setSavedAt(new Date().toLocaleTimeString());
        navigate(`/content/${type}/${created['id']}`);
      } else if (id) {
        await api.entries.update(type, id, data);
        setSavedAt(new Date().toLocaleTimeString());
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [type, id, isNew, contentByLocale, currentLocale, navigate, status, coverImage]);

  const typeName = type?.charAt(0).toUpperCase() + type?.slice(1) || "";
  const headingLabel = schemaType?.singularName ?? typeName;
  const backToListLabel = schemaType?.pluralName
    ? `Back to ${schemaType.pluralName}`
    : type
      ? `Back to ${typeName}s`
      : "Back to list";

  return (
    <div className="flex min-h-0 h-[100dvh] h-screen bg-stone-100 dark:bg-zinc-950">
      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Üst blok — ContentList ile aynı hiyerarşi: geri linki, başlık satırı, araç şeridi */}
        <div className="shrink-0 w-full px-4 sm:px-6 lg:px-8 lg:pt-6">
          <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-4 mb-6">
            <Link
              to={`/content/${type}`}
              className="flex items-center gap-2 text-sm text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {backToListLabel}
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-zinc-100 mb-2 truncate">
                  {isNew ? `Create ${headingLabel}` : `Edit ${headingLabel}`}
                </h1>
                <p className={`text-sm ${saveError || loadError ? "text-red-400" : "text-stone-600 dark:text-zinc-400"}`}>
                  {saveError ?? loadError ?? (isNew ? "Draft · not saved yet" : savedAt ? `Last saved ${savedAt}` : "")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium shrink-0 w-full sm:w-auto disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="relative z-30 mb-6 rounded-lg border border-stone-200/85 dark:border-zinc-800/50 bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative z-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowLocaleMenu(!showLocaleMenu);
                    setShowLocalizationStatusMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border transition-colors bg-stone-200/95 dark:bg-zinc-800/70 border-stone-300/75 dark:border-zinc-700/50 hover:bg-stone-300 active:bg-stone-400/85 dark:hover:bg-zinc-700/75 dark:active:bg-zinc-600/65 text-stone-800 dark:text-zinc-200 text-sm"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="text-base leading-none">{selectedLocale.flag}</span>
                  <span className="font-medium">{selectedLocale.name}</span>
                  <ChevronDown className="w-4 h-4 opacity-80 shrink-0" />
                </button>

                {showLocaleMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-[60]"
                      onClick={() => setShowLocaleMenu(false)}
                      aria-hidden
                    />
                    <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-64 bg-white/96 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg shadow-xl overflow-hidden z-[70]">
                      <div className="p-2">
                        <div className="text-xs font-medium text-stone-500 dark:text-zinc-500 px-3 py-2">
                          SELECT LOCALE
                        </div>
                        {localesWithContent.map((locale) => (
                          <button
                            key={locale.code}
                            type="button"
                            onClick={() => {
                              setCurrentLocale(locale.code);
                              setShowLocaleMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                              currentLocale === locale.code
                                ? "bg-stone-200/95 dark:bg-zinc-800/70"
                                : "hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{locale.flag}</span>
                              <span>{locale.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {locale.hasContent && (
                                <span className="w-2 h-2 bg-green-400 rounded-full" />
                              )}
                              {currentLocale === locale.code && (
                                <Check className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => { if (id) window.open(`/api/${type}/${id}`, '_blank'); }}
                disabled={!id}
                title={id ? "Open entry JSON in new tab" : "Save entry first to preview"}
                className="flex items-center gap-2 px-4 py-2 rounded-md border transition-colors bg-stone-200/95 dark:bg-zinc-800/70 border-stone-300/75 dark:border-zinc-700/50 hover:bg-stone-300 active:bg-stone-400/85 dark:hover:bg-zinc-700/75 dark:active:bg-zinc-600/65 text-stone-800 dark:text-zinc-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setAiTranslateOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-violet-300 dark:border-violet-500/35 bg-gradient-to-r from-violet-100 to-blue-100 hover:from-violet-200 hover:to-blue-200 dark:from-violet-950/50 dark:to-blue-950/40 dark:hover:from-violet-900/50 dark:hover:to-blue-900/40 text-sm font-medium text-violet-700 dark:text-zinc-100 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0" />
                  <span className="hidden sm:inline">AI Translate</span>
                </button>

                <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-zinc-300">
                  <span className="text-stone-500 dark:text-zinc-500 whitespace-nowrap">Status</span>
                  <select
                    value={status}
                    onChange={async (e) => {
                      const next = e.target.value as "draft" | "published";
                      const prev = status;
                      setStatus(next);
                      if (!isNew && id && type) {
                        try {
                          if (next === "published") await api.entries.publish(type, id);
                          else await api.entries.unpublish(type, id);
                        } catch (err) {
                          setStatus(prev);
                          setSaveError(err instanceof Error ? err.message : 'Status update failed.');
                        }
                      }
                    }}
                    className="min-w-[8.5rem] px-3 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-900 dark:text-zinc-100 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>

                <div className="relative z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocalizationStatusMenu(!showLocalizationStatusMenu);
                      setShowLocaleMenu(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border transition-colors bg-stone-200/95 dark:bg-zinc-800/70 border-stone-300/75 dark:border-zinc-700/50 hover:bg-stone-300 active:bg-stone-400/85 dark:hover:bg-zinc-700/75 dark:active:bg-zinc-600/65 text-stone-800 dark:text-zinc-200 text-sm"
                  >
                    <Languages className="w-4 h-4 shrink-0" />
                    <span className="font-medium hidden sm:inline">Localization</span>
                    <span className="text-stone-600 dark:text-zinc-400 text-xs tabular-nums">
                      {localeCompleteCount}/{availableLocales.length}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-80 shrink-0" />
                  </button>

                  {showLocalizationStatusMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setShowLocalizationStatusMenu(false)}
                        aria-hidden
                      />
                      <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white/96 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg shadow-xl overflow-hidden z-[70]">
                        <div className="px-3 py-2 border-b border-stone-200/85 dark:border-zinc-800/50">
                          <p className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wide">
                            Localization status
                          </p>
                        </div>
                        <div className="p-2 max-h-64 overflow-y-auto space-y-1">
                          {localesWithContent.map((locale) => (
                            <div
                              key={locale.code}
                              className="flex items-center justify-between px-3 py-2 rounded-md bg-stone-100/92 dark:bg-zinc-950/40 border border-stone-200/80 dark:border-zinc-800/40"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg shrink-0">{locale.flag}</span>
                                <span className="text-sm text-stone-800 dark:text-zinc-200 truncate">{locale.name}</span>
                              </div>
                              {locale.hasContent ? (
                                <span className="flex items-center gap-1 text-xs text-green-400 shrink-0">
                                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                                  Complete
                                </span>
                              ) : (
                                <span className="text-xs text-stone-500 dark:text-zinc-500 shrink-0">Empty</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Editor — ContentList ile aynı max genişlik; px dışta, kart üst blok ile aynı genişlikte */}
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
            <div className="max-w-7xl mx-auto w-full">
              <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-6 sm:p-8 space-y-6">
              {dynamicEditor && schemaFields.length > 0 ? (
                <>
                  <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-3 text-sm text-stone-700 dark:text-zinc-300">
                    <span className="text-violet-400 font-medium">Şema tabanlı düzenleme</span>
                    <span className="text-stone-500 dark:text-zinc-500"> — </span>
                    <span className="text-stone-600 dark:text-zinc-400">
                      {schemaType?.name} · {schemaFields.length} alan · locale: {selectedLocale.code}
                    </span>
                  </div>
                  <DynamicSchemaFields
                    fields={schemaFields}
                    values={currentContent}
                    onChange={updateContent}
                  />
                </>
              ) : (
                <>
              {/* Title Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={currentContent.title ?? ""}
                  onChange={(e) => updateContent("title", e.target.value)}
                  placeholder={`Enter ${typeName.toLowerCase()} title in ${selectedLocale.name}`}
                  className="w-full px-4 py-3 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Cover Image
                  </div>
                </label>
                {coverImage ? (
                  <div className="relative group">
                    <img
                      src={coverImage}
                      alt="Cover"
                      className="w-full h-64 object-cover rounded-lg border border-stone-200/85 dark:border-zinc-800/50"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCoverGalleryOpen(true)}
                        className="px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium"
                      >
                        Gallery
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage(null)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div
                      className={`min-h-64 w-full flex flex-col items-center justify-center gap-3 px-4 py-8 border-2 border-dashed rounded-lg transition-colors bg-stone-100/88 dark:bg-zinc-950/30 ${
                        coverDragOver
                          ? "border-blue-500/60 bg-blue-500/5"
                          : "border-stone-200/85 dark:border-zinc-800/50 hover:border-stone-400 dark:hover:border-zinc-600/50"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                        setCoverDragOver(true);
                      }}
                      onDragLeave={() => setCoverDragOver(false)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setCoverDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file?.type.startsWith("image/")) {
                          setCoverUploading(true);
                          try {
                            const res = await api.media.upload(file);
                            const uploaded = (res as { data: Record<string, unknown> }).data;
                            setCoverImage(String(uploaded['url'] ?? ''));
                          } catch { /* silently fall back to local preview */ } finally {
                            setCoverUploading(false);
                          }
                        }
                      }}
                    >
                      <input
                        id="cover-legacy-file"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file?.type.startsWith("image/")) {
                            setCoverUploading(true);
                            try {
                              const res = await api.media.upload(file);
                              const uploaded = (res as { data: Record<string, unknown> }).data;
                              setCoverImage(String(uploaded['url'] ?? ''));
                            } catch { /* silently ignore */ } finally {
                              setCoverUploading(false);
                            }
                          }
                        }}
                      />
                      {coverUploading ? (
                        <>
                          <Loader2 className="w-12 h-12 text-stone-600 dark:text-zinc-400 animate-spin" />
                          <p className="text-sm text-stone-600 dark:text-zinc-400">Uploading…</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-stone-500 dark:text-zinc-500" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-stone-700 dark:text-zinc-300 mb-1">
                              Sürükleyip bırakın veya{" "}
                              <label
                                htmlFor="cover-legacy-file"
                                className="underline underline-offset-2 cursor-pointer hover:text-stone-900 dark:hover:text-zinc-100"
                              >
                                dosya seçin
                              </label>
                            </p>
                            <p className="text-xs text-stone-500 dark:text-zinc-500">PNG, JPG, WebP, GIF</p>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverGalleryOpen(true)}
                      className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-stone-200/95 dark:bg-zinc-800/70 border border-stone-300/82 dark:border-zinc-700/80 rounded-md hover:bg-stone-300 dark:hover:bg-zinc-800 transition-colors text-stone-900 dark:text-zinc-100 font-medium sm:w-auto sm:self-start"
                    >
                      <Images className="w-4 h-4" />
                      Gallery
                    </button>
                  </div>
                )}
                <MediaLibraryPickerModal
                  open={coverGalleryOpen}
                  onClose={() => setCoverGalleryOpen(false)}
                  onSelect={(url) => setCoverImage(url)}
                />
                <p className="text-xs text-stone-500 dark:text-zinc-500 mt-2">
                  Recommended size: 1200x630px (JPG, PNG)
                </p>
              </div>

              {/* Content Field (Rich Text Area) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Content <span className="text-red-400">*</span>
                </label>
                <MinimalTiptap
                  content={currentContent.content ?? ""}
                  onChange={(value) => updateContent("content", value)}
                  placeholder={`Write your content in ${selectedLocale.name}...`}
                />
                <p className="text-xs text-stone-500 dark:text-zinc-500 mt-2">
                  Supports rich text formatting
                </p>
              </div>

              {/* Additional Fields (Article specific) */}
              {type === "article" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Publish Date
                        </div>
                      </label>
                      <input
                        type="date"
                        value={currentContent["publishDate"] ?? ""}
                        onChange={(e) =>
                          setContentByLocale((prev) => ({
                            ...prev,
                            [currentLocale]: { ...prev[currentLocale], publishDate: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Author
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Author name"
                        value={currentContent["author"] ?? ""}
                        onChange={(e) =>
                          setContentByLocale((prev) => ({
                            ...prev,
                            [currentLocale]: { ...prev[currentLocale], author: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Category
                      </div>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Technology"
                      value={currentContent["category"] ?? ""}
                      onChange={(e) =>
                        setContentByLocale((prev) => ({
                          ...prev,
                          [currentLocale]: { ...prev[currentLocale], category: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Product specific fields */}
              {type === "product" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Price <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={currentContent["price"] ?? ""}
                      onChange={(e) =>
                        setContentByLocale((prev) => ({
                          ...prev,
                          [currentLocale]: { ...prev[currentLocale], price: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={currentContent["stock"] ?? ""}
                      onChange={(e) =>
                        setContentByLocale((prev) => ({
                          ...prev,
                          [currentLocale]: { ...prev[currentLocale], stock: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
                </>
              )}

              <div className="border-t border-stone-200/85 dark:border-zinc-800/50 pt-6 space-y-4">
                {entryMeta && (
                  <div className="space-y-3 text-sm">
                    <h3 className="text-sm font-medium text-stone-600 dark:text-zinc-400">Information</h3>
                    {entryMeta.createdAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 dark:text-zinc-500">Created</span>
                        <span className="text-stone-700 dark:text-zinc-300">{entryMeta.createdAt}</span>
                      </div>
                    )}
                    {entryMeta.updatedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 dark:text-zinc-500">Updated</span>
                        <span className="text-stone-700 dark:text-zinc-300">{entryMeta.updatedAt}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  {!isNew && id && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        setSaveError(null);
                        try {
                          const data = { ...(contentByLocale[currentLocale] ?? {}), ...(coverImage ? { coverImage } : {}) };
                          await api.entries.update(type!, id, data);
                          if (status !== 'published') {
                            await api.entries.publish(type!, id);
                            setStatus('published');
                          }
                          setSavedAt(new Date().toLocaleTimeString());
                        } catch (err) {
                          setSaveError(err instanceof Error ? err.message : 'Failed to publish.');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors font-medium disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      {status === 'published' ? 'Save & Re-publish' : 'Save & Publish'}
                    </button>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AiTranslateModal
        open={aiTranslateOpen}
        onClose={() => setAiTranslateOpen(false)}
        locales={availableLocales}
        defaultSourceCode={currentLocale}
        showSummaryField={aiTranslateShowSummary}
        onSave={({ targetLocale, title, summary }) => {
          setContentByLocale((prev) => {
            const row = { ...(prev[targetLocale] ?? {}) };
            row[aiTranslateKeys.titleKey] = title;
            if (aiTranslateShowSummary) {
              row[aiTranslateKeys.summaryKey] = summary;
            }
            return {
              ...prev,
              [targetLocale]: row,
            };
          });
          setCurrentLocale(targetLocale);
        }}
      />
    </div>
  );
}