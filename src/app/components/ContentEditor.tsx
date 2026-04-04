import { useEffect, useState } from "react";
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
  Folder,
} from "lucide-react";
import { MinimalTiptap } from "./MinimalTiptap";
import { DynamicSchemaFields } from "./DynamicSchemaFields";
import {
  buildEmptyValuesForFields,
  getDemoContentTypeByApiId,
  getEditorSeedForType,
  shouldUseDynamicEditor,
} from "../data/demoContentTypes";

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

  const [currentLocale, setCurrentLocale] = useState<string>("en");
  const [showLocaleMenu, setShowLocaleMenu] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [coverImage, setCoverImage] = useState<string | null>(null);

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

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar — z-index so locale dropdown stacks above the scrollable editor below */}
        <div className="relative z-30 shrink-0 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800/50 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to={`/content/${type}`}
                className="p-2 hover:bg-zinc-800/50 backdrop-blur-sm rounded transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold">
                  {isNew ? `Create ${headingLabel}` : `Edit ${headingLabel}`}
                </h1>
                <p className="text-sm text-zinc-400">
                  {isNew ? "Draft - Not saved" : "Last saved 2 minutes ago"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Locale Selector - Moved to top bar */}
              <div className="relative z-50">
                <button
                  onClick={() => setShowLocaleMenu(!showLocaleMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/50 rounded-md hover:bg-zinc-700/70 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-lg">{selectedLocale.flag}</span>
                  <span className="hidden sm:inline font-medium">{selectedLocale.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showLocaleMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div 
                      className="fixed inset-0 z-[60]" 
                      onClick={() => setShowLocaleMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg shadow-xl overflow-hidden z-[70]">
                      <div className="p-2">
                        <div className="text-xs font-medium text-zinc-500 px-3 py-2">
                          SELECT LOCALE
                        </div>
                        {localesWithContent.map((locale) => (
                          <button
                            key={locale.code}
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

              <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/50 rounded-md hover:bg-zinc-700/70 transition-colors">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </button>

              <button
                onClick={() => {
                  // Save logic here
                  alert("Content saved!");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
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
                        onClick={() => {
                          // Open media library
                          alert('Open Media Library to change image');
                        }}
                        className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
                      >
                        Change Image
                      </button>
                      <button
                        onClick={() => setCoverImage(null)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        // Mock: Open media library
                        setCoverImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800');
                      }}
                      className="w-full h-64 border-2 border-dashed border-zinc-800/50 rounded-lg hover:border-zinc-700/50 transition-colors flex flex-col items-center justify-center gap-3 bg-zinc-950/30 hover:bg-zinc-950/50"
                    >
                      <Upload className="w-12 h-12 text-zinc-500" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-zinc-300 mb-1">
                          Click to upload cover image
                        </p>
                        <p className="text-xs text-zinc-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        // Open media library modal
                        alert('Opening Media Library...');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/50 rounded-md hover:bg-zinc-700/70 transition-colors"
                    >
                      <Folder className="w-4 h-4" />
                      <span className="font-medium">Select from Media Library</span>
                    </button>
                  </div>
                )}
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
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Status & Settings */}
      <aside className="hidden lg:block w-80 border-l border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl overflow-auto">
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-medium mb-3">Status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="w-full px-3 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Locales Status */}
          <div>
            <h3 className="text-sm font-medium mb-3">Localization Status</h3>
            <div className="space-y-2">
              {localesWithContent.map((locale) => (
                <div
                  key={locale.code}
                  className="flex items-center justify-between p-3 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{locale.flag}</span>
                    <span className="text-sm">{locale.name}</span>
                  </div>
                  {locale.hasContent ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      Complete
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">Empty</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="pt-6 border-t border-zinc-800/50">
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
      </aside>
    </div>
  );
}