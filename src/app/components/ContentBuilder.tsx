import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams, useLocation } from "react-router";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Type,
  Calendar,
  Link2,
  AlignLeft,
  Image,
  Hash,
  ToggleLeft,
  Mail,
  Trash2,
  X,
  Check,
  Layers2,
  Braces,
  KeyRound,
  ListOrdered,
  Fingerprint,
  CalendarClock,
  Clock,
  Package,
  LayoutGrid,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CmsColorName } from "../lib/cmsColors";
import { fieldTileColors, getCmsColorClasses } from "../lib/cmsColors";

interface Field {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
  enumerationValues?: string;
}

/** Strapi-aligned field types (admin) — each mapped to a CMS accent color */
const STRAPI_FIELD_TYPES: {
  id: string;
  label: string;
  icon: LucideIcon;
  color: CmsColorName;
  wide?: boolean;
}[] = [
  { id: "text", label: "Text", icon: Type, color: "blue" },
  { id: "text_long", label: "Text (Long text)", icon: AlignLeft, color: "green" },
  { id: "blocks", label: "Rich text (Blocks)", icon: Layers2, color: "purple" },
  { id: "json", label: "JSON", icon: Braces, color: "emerald" },
  { id: "number_int", label: "Number (integer)", icon: Hash, color: "orange" },
  { id: "number_float", label: "Number (decimal)", icon: Hash, color: "yellow" },
  { id: "number_big", label: "Number (big integer)", icon: Hash, color: "teal" },
  { id: "password", label: "Password", icon: KeyRound, color: "red" },
  { id: "email", label: "Email", icon: Mail, color: "pink" },
  { id: "enumeration", label: "Enumeration", icon: ListOrdered, color: "violet" },
  { id: "uid", label: "UID", icon: Fingerprint, color: "indigo" },
  { id: "date", label: "Date", icon: Calendar, color: "cyan" },
  { id: "time", label: "Time", icon: Clock, color: "teal" },
  { id: "datetime", label: "Datetime", icon: CalendarClock, color: "indigo" },
  { id: "boolean", label: "Boolean", icon: ToggleLeft, color: "yellow" },
  { id: "media", label: "Media", icon: Image, color: "purple" },
  { id: "relation", label: "Relation", icon: Link2, color: "violet", wide: true },
  { id: "component", label: "Component", icon: Package, color: "emerald", wide: true },
  { id: "dynamiczone", label: "Dynamic Zone", icon: LayoutGrid, color: "orange", wide: true },
];

const LEGACY_TYPE_MAP: Record<string, string> = {
  richtext: "blocks",
  textarea: "text_long",
  number: "number_int",
};

function resolveFieldTypeId(type: string): string {
  return LEGACY_TYPE_MAP[type] || type;
}

function getStrapiFieldDef(typeId: string) {
  const id = resolveFieldTypeId(typeId);
  return STRAPI_FIELD_TYPES.find((t) => t.id === id) ?? STRAPI_FIELD_TYPES[0];
}

export function ContentBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const createState = location.state as
    | {
        displayName?: string;
        singularId?: string;
        pluralId?: string;
        color?: string;
      }
    | undefined;

  const kindParam = searchParams.get("kind");
  const isSingleType =
    kindParam === "single" || id === "5" || id === "6";

  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");

  const [displayName, setDisplayName] = useState("Article");
  const [singularId, setSingularId] = useState("article");
  const [pluralId, setPluralId] = useState("articles");
  const [typeAccent, setTypeAccent] = useState<string>("blue");

  useEffect(() => {
    if (id === "create" && createState?.displayName) {
      setDisplayName(createState.displayName);
      if (createState.singularId) setSingularId(createState.singularId);
      if (createState.pluralId) setPluralId(createState.pluralId);
      if (createState.color) setTypeAccent(createState.color);
    }
  }, [id, createState]);

  const [fields, setFields] = useState<Field[]>([
    { id: "1", name: "Title", type: "text", required: true },
    { id: "2", name: "Date", type: "date", required: true },
    {
      id: "3",
      name: "Author",
      type: "relation",
      required: false,
      description: "Relation (manyToOne) with User",
    },
    { id: "4", name: "Content", type: "blocks", required: true },
    { id: "5", name: "Cover", type: "media", required: false },
  ]);

  const [draftAndPublish, setDraftAndPublish] = useState(true);
  const [reviewWorkflow, setReviewWorkflow] = useState(false);
  const [i18n, setI18n] = useState(true);

  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [enumerationValues, setEnumerationValues] = useState("");

  const [relationTarget, setRelationTarget] = useState("categories");
  const [relationType, setRelationType] = useState<"oneToOne" | "oneToMany" | "manyToOne" | "manyToMany">(
    "manyToOne"
  );

  const availableCollections = [
    { id: "categories", name: "Categories", plural: "categories" },
    { id: "users", name: "Users", plural: "users" },
    { id: "tags", name: "Tags", plural: "tags" },
    { id: "articles", name: "Articles", plural: "articles" },
  ];

  const accentClasses = useMemo(() => getCmsColorClasses(typeAccent), [typeAccent]);

  const handleSave = () => {
    alert("Content type saved!");
    navigate("/content-types");
  };

  const closeModal = () => {
    setShowAddFieldModal(false);
    setSelectedFieldType(null);
    setNewFieldName("");
    setNewFieldRequired(false);
    setEnumerationValues("");
  };

  const addField = () => {
    if (!selectedFieldType || !newFieldName.trim()) return;
    const target = availableCollections.find((c) => c.id === relationTarget);
    let description: string | undefined;
    if (selectedFieldType === "relation") {
      description = `Relation (${relationType}) with ${target?.name ?? relationTarget}`;
    } else if (selectedFieldType === "enumeration" && enumerationValues.trim()) {
      description = `Enumeration: ${enumerationValues.trim()}`;
    } else if (selectedFieldType === "component") {
      description = "Component (repeatable group of fields)";
    } else if (selectedFieldType === "dynamiczone") {
      description = "Dynamic Zone (mix of components)";
    } else {
      description = getStrapiFieldDef(selectedFieldType).label;
    }

    const newField: Field = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      name: newFieldName.trim(),
      type: selectedFieldType,
      required: newFieldRequired,
      description,
      enumerationValues:
        selectedFieldType === "enumeration" && enumerationValues.trim()
          ? enumerationValues.trim()
          : undefined,
    };
    setFields((prev) => [...prev, newField]);
    closeModal();
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/content-types" className="p-2 hover:bg-zinc-800/50 rounded transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h1 className="text-2xl font-semibold">Edit {displayName}</h1>
                <p className="text-sm text-zinc-400">Configure content type structure</p>
              </div>
              {isSingleType && (
                <span
                  className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border ${accentClasses.border} ${accentClasses.bg} ${accentClasses.icon}`}
                >
                  Single Type
                </span>
              )}
              {!isSingleType && (
                <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400">
                  Collection Type
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setActiveTab("basic")}
                className={`text-sm font-medium pb-3 border-b-2 transition-colors ${
                  activeTab === "basic"
                    ? "text-blue-400 border-blue-400"
                    : "text-zinc-400 border-transparent hover:text-zinc-300"
                }`}
              >
                BASIC SETTINGS
              </button>
              <button
                onClick={() => setActiveTab("advanced")}
                className={`text-sm font-medium pb-3 border-b-2 transition-colors ${
                  activeTab === "advanced"
                    ? "text-blue-400 border-blue-400"
                    : "text-zinc-400 border-transparent hover:text-zinc-300"
                }`}
              >
                ADVANCED SETTINGS
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/content-types" className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors">
                Cancel
              </Link>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === "basic" ? (
            <>
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-950/70 border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-400">API ID (Singular)</label>
                    <input
                      type="text"
                      value={singularId}
                      onChange={(e) => setSingularId(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-950/70 border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${isSingleType ? "text-zinc-500" : "text-zinc-400"}`}
                    >
                      API ID (Plural)
                    </label>
                    <input
                      type="text"
                      value={isSingleType ? singularId : pluralId}
                      onChange={(e) => !isSingleType && setPluralId(e.target.value)}
                      disabled={isSingleType}
                      className={`w-full px-4 py-2 border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isSingleType ? "bg-zinc-950/30 text-zinc-500 cursor-not-allowed" : "bg-zinc-950/70"
                      }`}
                    />
                    {isSingleType && (
                      <p className="text-xs text-zinc-500 mt-1.5">
                        Single types use one entry; plural API id matches singular (Strapi-style demo).
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Fields</h3>

                <div className="space-y-2 mb-4">
                  {fields.map((field) => {
                    const def = getStrapiFieldDef(field.type);
                    const Icon = def.icon;
                    const listColors = getCmsColorClasses(def.color);
                    return (
                      <div
                        key={field.id}
                        className={`flex items-center gap-4 px-4 py-3 bg-zinc-950/50 border rounded-lg hover:border-zinc-600/50 transition-colors group ${listColors.border}`}
                      >
                        <GripVertical className="w-5 h-5 text-zinc-600 cursor-move" />

                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${listColors.bg} border ${listColors.border}`}
                        >
                          <Icon className={`w-5 h-5 ${listColors.icon}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.name}</span>
                            {field.required && <span className="text-red-400 text-xs">*</span>}
                          </div>
                          <p className="text-sm text-zinc-500 truncate">
                            {field.description || def.label}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-zinc-800/50 rounded transition-all"
                          aria-label="Remove field"
                        >
                          <Trash2 className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                  onClick={() => setShowAddFieldModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add another field to this {isSingleType ? "single type" : "collection type"}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">Advanced Settings</h3>

              <div className="space-y-6">
                <div className="flex items-start justify-between p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Draft & Publish</h4>
                    <p className="text-sm text-zinc-400">Write a draft version of each entry before publishing it</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftAndPublish(!draftAndPublish)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      draftAndPublish ? "bg-blue-500" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        draftAndPublish ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-start justify-between p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Internationalization</h4>
                    <p className="text-sm text-zinc-400">Manage content in multiple languages (i18n)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setI18n(!i18n)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${i18n ? "bg-blue-500" : "bg-zinc-700"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        i18n ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-start justify-between p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Review Workflow</h4>
                    <p className="text-sm text-zinc-400">Add a review stage before publishing content</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewWorkflow(!reviewWorkflow)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      reviewWorkflow ? "bg-blue-500" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        reviewWorkflow ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg">
                  <h4 className="font-medium mb-3">API Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        {isSingleType ? "Single type API key" : "Collection Name"}
                      </label>
                      <input
                        type="text"
                        value={isSingleType ? singularId : pluralId}
                        className="w-full px-4 py-2 bg-zinc-950/70 border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Singular API key</label>
                      <input
                        type="text"
                        value={singularId}
                        className="w-full px-4 py-2 bg-zinc-950/70 border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddFieldModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-zinc-900/95 border-b border-zinc-800/50 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold">Add New Field</h2>
              <button type="button" onClick={closeModal} className="p-2 hover:bg-zinc-800/50 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Select Field Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {STRAPI_FIELD_TYPES.map((ft) => {
                    const Icon = ft.icon;
                    const tc = fieldTileColors[ft.color];
                    const isSelected = selectedFieldType === ft.id;
                    return (
                      <button
                        key={ft.id}
                        type="button"
                        onClick={() => setSelectedFieldType(ft.id)}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                          ft.wide ? "col-span-2" : ""
                        } ${
                          isSelected
                            ? `${tc.selectedBorder} ${tc.selectedBg} ring-2 ring-zinc-100/25 ring-offset-2 ring-offset-zinc-950`
                            : `${tc.idleBorder} ${tc.idleBg}`
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? tc.selectedIconBg : tc.iconBg
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? tc.iconText : tc.iconText}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ft.label}</p>
                        </div>
                        {isSelected && <Check className={`w-5 h-5 shrink-0 ${tc.check}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedFieldType === "relation" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Relation Type <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ["manyToOne", "Many to One", "Articles → Category"],
                          ["oneToMany", "One to Many", "Category → Articles"],
                          ["oneToOne", "One to One", "Article → Author"],
                          ["manyToMany", "Many to Many", "Articles ↔ Tags"],
                        ] as const
                      ).map(([key, title, sub]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRelationType(key)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            relationType === key
                              ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400/30"
                              : "border-zinc-800/50 hover:border-violet-500/40 bg-zinc-950/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{title}</p>
                            {relationType === key && <Check className="w-5 h-5 text-violet-400" />}
                          </div>
                          <p className="text-xs text-zinc-500">{sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Target Collection <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={relationTarget}
                      onChange={(e) => setRelationTarget(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-950/70 border border-zinc-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {availableCollections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {selectedFieldType === "enumeration" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Enumeration values</label>
                  <textarea
                    value={enumerationValues}
                    onChange={(e) => setEnumerationValues(e.target.value)}
                    placeholder="e.g. draft, published, archived (comma-separated)"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-zinc-950/70 border border-zinc-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Field Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. Category, Author, Tags"
                  className="w-full px-4 py-2.5 bg-zinc-950/70 border border-zinc-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg">
                <div>
                  <p className="font-medium mb-1">Required field</p>
                  <p className="text-sm text-zinc-500">This field must be filled in</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewFieldRequired(!newFieldRequired)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    newFieldRequired ? "bg-blue-500" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      newFieldRequired ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 bg-zinc-900/95 border-t border-zinc-800/50 p-6 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-6 py-2.5 text-zinc-300 hover:text-zinc-100 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={addField}
                disabled={!selectedFieldType || !newFieldName.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
