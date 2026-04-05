import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { MinimalTiptap } from "./MinimalTiptap";
import { DynamicSchemaFields } from "./DynamicSchemaFields";
import { MediaLibraryPickerModal } from "./MediaLibraryPickerModal";
import { AiTranslateModal, AiTranslateSidebarButton } from "./AiTranslateModal";
import type { DemoField } from "../data/demoContentTypes";
import {
  buildEmptyValuesForFields,
  getDemoContentTypeByApiId,
  getEditorSeedForType,
  shouldUseDynamicEditor,
} from "../data/demoContentTypes";

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

interface Locale {
  code: string;
  name: string;
  flag: string;
}

const availableLocales: Locale[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

function buildLegacyInitial(isNewEntry: boolean): Record<string, Record<string, string>> {
  return {
    en: {
      title: isNewEntry ? "" : "Getting Started with Headless CMS",
      content: isNewEntry ? "" : "This is the English version of the content...",
    },
    tr: {
      title: isNewEntry ? "" : "Headless CMS ile Başlarken",
      content: isNewEntry ? "" : "İçeriğin Türkçe versiyonu...",
    },
    de: { title: "", content: "" },
    fr: { title: "", content: "" },
    es: { title: "", content: "" },
  };
}

export function ContentEditor() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "create";

  const schemaType = getDemoContentTypeByApiId(type);
  const dynamicEditor = shouldUseDynamicEditor(type);
  const schemaFields = schemaType?.fields ?? [];
  const aiTranslateKeys = useMemo(
    () => getAiTranslateFieldKeys(dynamicEditor, schemaFields),
    [dynamicEditor, schemaFields],
  );
  const aiTranslateShowSummary = aiTranslateKeys.titleKey !== aiTranslateKeys.summaryKey;

  const [currentLocale, setCurrentLocale] = useState<string>("en");
  const [showLocaleMenu, setShowLocaleMenu] = useState(false);
  const [showLocalizationStatusMenu, setShowLocalizationStatusMenu] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverGalleryOpen, setCoverGalleryOpen] = useState(false);
  const [aiTranslateOpen, setAiTranslateOpen] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);

  const [contentByLocale, setContentByLocale] = useState<Record<string, Record<string, string>>>(() =>
    buildLegacyInitial(isNew)
  );

  useEffect(() => {
    const st = getDemoContentTypeByApiId(type);
    const fields = st?.fields ?? [];
    const dyn = shouldUseDynamicEditor(type);
    if (dyn && fields.length > 0) {
      const next: Record<string, Record<string, string>> = {};
      for (const loc of availableLocales) {
        const base = buildEmptyValuesForFields(fields);
        if (!isNew && loc.code === "en" && type) {
          Object.assign(base, getEditorSeedForType(type));
        }
        next[loc.code] = base;
      }
      setContentByLocale(next);
    } else {
      setContentByLocale(buildLegacyInitial(isNew));
    }
  }, [type, id, isNew]);

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

  const typeName = type?.charAt(0).toUpperCase() + type?.slice(1) || "";
  const headingLabel = schemaType?.singularName ?? typeName;
  const backToListLabel = schemaType?.pluralName
    ? `Back to ${schemaType.pluralName}`
    : type
      ? `Back to ${typeName}s`
      : "Back to list";

  return (
    <div className="flex min-h-0 h-[100dvh] h-screen bg-zinc-950">
      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Üst blok — ContentList ile aynı hiyerarşi: geri linki, başlık satırı, araç şeridi */}
        <div className="shrink-0 w-full px-4 sm:px-6 lg:px-8 lg:pt-6">
          <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-4 mb-6">
            <Link
              to={`/content/${type}`}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {backToListLabel}
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 mb-2 truncate">
                  {isNew ? `Create ${headingLabel}` : `Edit ${headingLabel}`}
                </h1>
                <p className="text-zinc-400">
                  {isNew ? "Draft · not saved yet" : "Last saved 2 minutes ago"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  alert("Content saved!");
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium shrink-0 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>

          <div className="relative z-30 mb-6 rounded-lg border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative z-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowLocaleMenu(!showLocaleMenu);
                    setShowLocalizationStatusMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border transition-colors bg-zinc-800/70 border-zinc-700/50 hover:bg-zinc-700/70 text-zinc-200 text-sm"
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
                    <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg shadow-xl overflow-hidden z-[70]">
                      <div className="p-2">
                        <div className="text-xs font-medium text-zinc-500 px-3 py-2">
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
                                ? "bg-zinc-800/70"
                                : "hover:bg-zinc-800/50"
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
                                <Check className="w-4 h-4 text-zinc-400" />
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
                className="flex items-center gap-2 px-4 py-2 rounded-md border transition-colors bg-zinc-800/70 border-zinc-700/50 hover:bg-zinc-700/70 text-zinc-200 text-sm"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="text-zinc-500 whitespace-nowrap">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                    className="min-w-[8.5rem] px-3 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 text-sm"
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
                    className="flex items-center gap-2 px-4 py-2 rounded-md border transition-colors bg-zinc-800/70 border-zinc-700/50 hover:bg-zinc-700/70 text-zinc-200 text-sm"
                  >
                    <Languages className="w-4 h-4 shrink-0" />
                    <span className="font-medium hidden sm:inline">Localization</span>
                    <span className="text-zinc-400 text-xs tabular-nums">
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
                      <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg shadow-xl overflow-hidden z-[70]">
                        <div className="px-3 py-2 border-b border-zinc-800/50">
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                            Localization status
                          </p>
                        </div>
                        <div className="p-2 max-h-64 overflow-y-auto space-y-1">
                          {localesWithContent.map((locale) => (
                            <div
                              key={locale.code}
                              className="flex items-center justify-between px-3 py-2 rounded-md bg-zinc-950/40 border border-zinc-800/40"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg shrink-0">{locale.flag}</span>
                                <span className="text-sm text-zinc-200 truncate">{locale.name}</span>
                              </div>
                              {locale.hasContent ? (
                                <span className="flex items-center gap-1 text-xs text-green-400 shrink-0">
                                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                                  Complete
                                </span>
                              ) : (
                                <span className="text-xs text-zinc-500 shrink-0">Empty</span>
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
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-6 sm:p-8 space-y-6">
              {dynamicEditor && schemaFields.length > 0 ? (
                <>
                  <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-3 text-sm text-zinc-300">
                    <span className="text-violet-400 font-medium">Şema tabanlı düzenleme</span>
                    <span className="text-zinc-500"> — </span>
                    <span className="text-zinc-400">
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
                  className="w-full px-4 py-3 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
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
                      className="w-full h-64 object-cover rounded-lg border border-zinc-800/50"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCoverGalleryOpen(true)}
                        className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
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
                      className={`min-h-64 w-full flex flex-col items-center justify-center gap-3 px-4 py-8 border-2 border-dashed rounded-lg transition-colors bg-zinc-950/30 ${
                        coverDragOver
                          ? "border-blue-500/60 bg-blue-500/5"
                          : "border-zinc-800/50 hover:border-zinc-600/50"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                        setCoverDragOver(true);
                      }}
                      onDragLeave={() => setCoverDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setCoverDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file?.type.startsWith("image/")) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const r = reader.result;
                            if (typeof r === "string") setCoverImage(r);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    >
                      <input
                        id="cover-legacy-file"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file?.type.startsWith("image/")) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const r = reader.result;
                              if (typeof r === "string") setCoverImage(r);
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = "";
                        }}
                      />
                      <Upload className="w-12 h-12 text-zinc-500" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-zinc-300 mb-1">
                          Sürükleyip bırakın veya{" "}
                          <label
                            htmlFor="cover-legacy-file"
                            className="underline underline-offset-2 cursor-pointer hover:text-zinc-100"
                          >
                            dosya seçin
                          </label>
                        </p>
                        <p className="text-xs text-zinc-500">PNG, JPG, WebP, GIF</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverGalleryOpen(true)}
                      className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800/70 border border-zinc-700/80 rounded-md hover:bg-zinc-800 transition-colors text-zinc-100 font-medium sm:w-auto sm:self-start"
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
                <p className="text-xs text-zinc-500 mt-2">
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
                <p className="text-xs text-zinc-500 mt-2">
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
                        className="w-full px-4 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Author
                        </div>
                      </label>
                      <select className="w-full px-4 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>John Doe</option>
                        <option>Jane Smith</option>
                        <option>Sarah Wilson</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Category
                      </div>
                    </label>
                    <select className="w-full px-4 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select category...</option>
                      <option>Technology</option>
                      <option>Business</option>
                      <option>Lifestyle</option>
                    </select>
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
                      className="w-full px-4 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
                </>
              )}

              <div className="border-t border-zinc-800/50 pt-6 space-y-6">
                <div>
                  <AiTranslateSidebarButton onClick={() => setAiTranslateOpen(true)} />
                </div>

                <div className="pt-2 border-t border-zinc-800/50">
                  <h3 className="text-sm font-medium mb-3">Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Created</span>
                      <span className="text-zinc-100">Apr 3, 2026</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Updated</span>
                      <span className="text-zinc-100">Apr 3, 2026</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">By</span>
                      <span className="text-zinc-100">John Doe</span>
                    </div>
                  </div>
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