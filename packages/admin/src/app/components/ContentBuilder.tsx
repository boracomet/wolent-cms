import { useEffect, useState } from "react";
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
  Database,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CmsColorName } from "../lib/cmsColors";
import { fieldTileColors, getCmsColorClasses, cmsColorSwatches as availableColors } from "../lib/cmsColors";
import { api } from "../api/client";
import { useI18n } from "../i18n";
import { CT_ICON_OPTIONS } from "./ContentTypes";
import { RelationTypePicker, formatRelationFieldSummary, type RelationKind } from "./RelationTypePicker";
import { getFieldTypeHelp } from "../data/fieldHelp";
import type { DemoField } from "../data/demoContentTypes";

interface Field {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
  enumerationValues?: string;
  /** İlişki hedefi — singularName */
  targetType?: string;
  relation?: string;
  targetDisplayName?: string;
}

/** Strapi-aligned field types (admin) — each mapped to a CMS accent color */
const STRAPI_FIELD_TYPES: {
  id: string;
  label: string;
  icon: LucideIcon;
  color: CmsColorName;
  wide?: boolean;
}[] = [
  { id: "text", label: "Metin", icon: Type, color: "blue" },
  { id: "text_long", label: "Uzun metin", icon: AlignLeft, color: "green" },
  { id: "blocks", label: "Zengin metin", icon: Layers2, color: "purple" },
  { id: "json", label: "JSON", icon: Braces, color: "emerald" },
  { id: "number_int", label: "Tam sayı", icon: Hash, color: "orange" },
  { id: "number_float", label: "Ondalık sayı", icon: Hash, color: "yellow" },
  { id: "number_big", label: "Büyük tam sayı", icon: Hash, color: "teal" },
  { id: "password", label: "Parola", icon: KeyRound, color: "red" },
  { id: "email", label: "E-posta", icon: Mail, color: "pink" },
  { id: "enumeration", label: "Seçenek listesi", icon: ListOrdered, color: "violet" },
  { id: "uid", label: "Benzersiz kimlik", icon: Fingerprint, color: "indigo" },
  { id: "date", label: "Tarih", icon: Calendar, color: "cyan" },
  { id: "time", label: "Saat", icon: Clock, color: "teal" },
  { id: "datetime", label: "Tarih ve saat", icon: CalendarClock, color: "indigo" },
  { id: "boolean", label: "Evet/Hayır", icon: ToggleLeft, color: "yellow" },
  { id: "media", label: "Medya", icon: Image, color: "purple" },
  { id: "relation", label: "İlişki", icon: Link2, color: "violet", wide: true },
  { id: "component", label: "Bileşen", icon: Package, color: "emerald", wide: true },
  { id: "dynamiczone", label: "Dinamik bölge", icon: LayoutGrid, color: "orange", wide: true },
];

function demoFieldsToBuilderFields(demo: DemoField[]): Field[] {
  return demo.map((f, i) => ({
    id: f.id || String(i + 1),
    name: f.apiName,
    type: f.type,
    required: f.required,
    description: f.description,
    targetType: f.targetType,
    relation: f.relation,
    targetDisplayName: f.targetType,
  }));
}

function getFieldListSubtitle(
  field: Field,
  collections: { id: string; name: string }[]
): string {
  if (field.type === "relation" && (field.targetType || field.targetDisplayName)) {
    const target =
      collections.find((c) => c.id === field.targetType)?.name ??
      field.targetDisplayName ??
      field.targetType;
    return formatRelationFieldSummary(field.name, target, field.relation);
  }
  return field.description || getStrapiFieldDef(field.type).label;
}

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

/** text/plain + önek: yalnızca tutamaktan başlayan sürüklemeleri kabul et */
const DND_FIELD_PLAIN = "text/plain";
const DND_FIELD_PREFIX = "wolent-field:";

function reorderFieldsById(list: Field[], draggedId: string, targetId: string): Field[] {
  if (draggedId === targetId) return list;
  const fromIdx = list.findIndex((f) => f.id === draggedId);
  const toIdx = list.findIndex((f) => f.id === targetId);
  if (fromIdx < 0 || toIdx < 0) return list;
  const next = [...list];
  const [removed] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, removed);
  return next;
}

function AppearancePicker({
  selectedColor,
  setSelectedColor,
  selectedIcon,
  setSelectedIcon,
}: {
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  selectedIcon: string;
  setSelectedIcon: (i: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const colorMeta = availableColors.find(c => c.name === selectedColor);
  const IconCmp = CT_ICON_OPTIONS.find(i => i.id === selectedIcon)?.icon ?? Database;

  return (
    <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-6 mb-6">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full text-left group"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMeta?.bg ?? 'bg-stone-200 dark:bg-zinc-800'}`}>
          <IconCmp className={`w-5 h-5 ${colorMeta?.icon ?? 'text-stone-900 dark:text-zinc-100'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">{t("contentBuilder.appearance")}</h3>
          <p className="text-xs text-stone-500 dark:text-zinc-500 capitalize">{selectedColor} · {CT_ICON_OPTIONS.find(i => i.id === selectedIcon)?.label ?? selectedIcon}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-stone-400 dark:text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-5 pt-5 border-t border-stone-200/85 dark:border-zinc-800/50 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-3">{t("contentBuilder.color")}</label>
            <div className="grid grid-cols-6 gap-3">
              {availableColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.name)}
                  className={`relative h-12 rounded-lg ${color.bg} ${color.border} border-2 transition-all hover:scale-105 ${
                    selectedColor === color.name ? "ring-2 ring-stone-400 ring-offset-2 ring-offset-stone-100 dark:ring-zinc-100 dark:ring-offset-zinc-950" : ""
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} to-transparent rounded-lg`} />
                  {selectedColor === color.name && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 bg-stone-900 dark:bg-zinc-100 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white dark:text-zinc-950" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">{t("contentBuilder.icon")}</label>
            <div className="grid grid-cols-10 gap-1.5">
              {CT_ICON_OPTIONS.map(({ id, icon: Ic, label }) => {
                const cm = availableColors.find(c => c.name === selectedColor);
                const isSelected = selectedIcon === id;
                return (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    onClick={() => setSelectedIcon(id)}
                    className={`group relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      isSelected
                        ? `${cm?.bg ?? 'bg-stone-200 dark:bg-zinc-800'} ${cm?.border ?? 'border-stone-400 dark:border-zinc-600'} border-2 shadow-sm`
                        : 'border-stone-200/85 dark:border-zinc-800/50 bg-stone-50/92 dark:bg-zinc-900/40 hover:border-stone-400 dark:hover:border-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Ic className={`w-5 h-5 ${isSelected ? (cm?.icon ?? 'text-stone-900 dark:text-zinc-100') : 'text-stone-600 dark:text-zinc-400 group-hover:text-stone-800 dark:text-zinc-200'}`} />
                    <span className="text-[9px] text-stone-500 dark:text-zinc-500 group-hover:text-stone-600 dark:text-zinc-400 truncate w-full text-center leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
        icon?: string;
        initialFields?: DemoField[];
      }
    | undefined;

  const kindParam = searchParams.get("kind");
  const [isSingleType, setIsSingleType] = useState(kindParam === "single");
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");

  const [displayName, setDisplayName] = useState("");
  const [singularId, setSingularId] = useState("");
  const [pluralId, setPluralId] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [selectedIcon, setSelectedIcon] = useState("database");

  // For create mode: prefill from navigation state
  useEffect(() => {
    if (id === "create") {
      if (createState?.displayName) setDisplayName(createState.displayName);
      if (createState?.singularId) setSingularId(createState.singularId);
      if (createState?.pluralId) setPluralId(createState.pluralId);
      if (createState?.color) setSelectedColor(createState.color);
      if (createState?.icon) setSelectedIcon(createState.icon);
      if (createState?.initialFields?.length) {
        setFields(demoFieldsToBuilderFields(createState.initialFields));
      }
    }
  }, [id, createState]);

  // For edit mode: load from API
  useEffect(() => {
    if (!id || id === "create") return;
    api.contentTypes.get(id).then(res => {
      const t = res.data as Record<string, unknown>;
      const schema = (t['schema'] as Record<string, unknown> | undefined) ?? t;
      const attrs = (schema['attributes'] ?? {}) as Record<string, unknown>;
      setDisplayName((t['displayName'] as string) ?? '');
      setSingularId((t['singularName'] as string) ?? '');
      setPluralId((t['pluralName'] as string) ?? '');
      setIsSingleType(t['kind'] === 'singleType');
      if (t['color']) setSelectedColor(t['color'] as string);
      if (t['icon']) setSelectedIcon(t['icon'] as string);
      setDraftAndPublish(Boolean((schema['options'] as Record<string, unknown> | undefined)?.['draftAndPublish'] ?? true));
      const loadedFields: Field[] = Object.entries(attrs).map(([name, def], i) => {
        const d = def as Record<string, unknown>;
        const fieldType = (d['type'] as string) ?? 'text';
        const targetType = (d['targetType'] as string) ?? undefined;
        const relation = (d['relation'] as string) ?? undefined;
        let description = (d['description'] as string) ?? undefined;
        if (fieldType === 'relation' && targetType) {
          const relLabel = relation ? ` · ${relation}` : '';
          description = description ?? `İlişki: ${targetType}${relLabel}`;
        }
        return {
          id: String(i + 1),
          name,
          type: fieldType,
          required: Boolean(d['required']),
          description,
          enumerationValues: Array.isArray(d['enum']) ? (d['enum'] as string[]).join('\n') : undefined,
          targetType,
          relation,
          targetDisplayName: targetType,
        };
      });
      if (loadedFields.length > 0) setFields(loadedFields);
    }).catch(() => {});
  }, [id]);

  const [fields, setFields] = useState<Field[]>([]);

  const [draftAndPublish, setDraftAndPublish] = useState(true);
  const [reviewWorkflow, setReviewWorkflow] = useState(false);
  const [i18n, setI18n] = useState(true);

  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [enumerationValues, setEnumerationValues] = useState("");

  const [relationTarget, setRelationTarget] = useState("");
  const [relationType, setRelationType] = useState<RelationKind>("manyToOne");

  const [fieldDragOverId, setFieldDragOverId] = useState<string | null>(null);
  const [fieldDraggingId, setFieldDraggingId] = useState<string | null>(null);

  const [availableCollections, setAvailableCollections] = useState<{ id: string; name: string; plural: string }[]>([]);
  useEffect(() => {
    api.contentTypes.list().then(res => {
      const types = (res.data as { uid: string; displayName?: string; singularName?: string; pluralName?: string }[]).map(t => ({
        id: t.singularName ?? t.uid,
        name: t.displayName ?? t.uid,
        plural: t.pluralName ?? t.uid,
      }));
      setAvailableCollections(types);
      if (types.length > 0) {
        setRelationTarget((prev) => (prev && types.some((c) => c.id === prev) ? prev : types[0].id));
      }
    }).catch(() => {});
  }, []);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const attributes: Record<string, unknown> = {};
      for (const f of fields) {
        const attr: Record<string, unknown> = { type: f.type, required: f.required };
        if (f.description) attr['description'] = f.description;
        if (f.type === 'enumeration' && f.enumerationValues) {
          attr['enum'] = f.enumerationValues.split('\n').map(v => v.trim()).filter(Boolean);
        }
        if (f.type === 'relation') {
          attr['type'] = 'relation';
          if (f.relation) attr['relation'] = f.relation;
          if (f.targetType) attr['targetType'] = f.targetType;
        }
        attributes[f.name] = attr;
      }
      const payload = {
        displayName,
        singularApiId: singularId,
        pluralApiId: pluralId,
        kind: isSingleType ? "singleType" : "collectionType",
        draftAndPublish,
        i18n,
        reviewWorkflow,
        attributes,
        color: selectedColor,
        icon: selectedIcon,
      };
      if (id && id !== "create") {
        await api.contentTypes.update(id, payload);
      } else {
        await api.contentTypes.create(payload);
      }
      navigate("/content-types");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
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
    let targetType: string | undefined;
    let relation: string | undefined;
    let targetDisplayName: string | undefined;
    if (selectedFieldType === "relation") {
      targetType = target?.id ?? relationTarget;
      relation = relationType;
      targetDisplayName = target?.name ?? relationTarget;
      description = formatRelationFieldSummary(
        newFieldName.trim() || "alan",
        targetDisplayName,
        relationType
      );
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
      targetType,
      relation,
      targetDisplayName,
    };
    setFields((prev) => [...prev, newField]);
    closeModal();
  };

  const typeLabel = isSingleType ? t("contentBuilder.singleType") : t("contentBuilder.collectionType");

  return (
    <div className="bg-stone-100 dark:bg-zinc-950">
      <div className="p-4 sm:p-6 lg:p-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-6">
            <Link
              to="/content-types"
              className="flex items-center gap-2 text-sm text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {t("contentBuilder.backToContentTypes")}
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold mb-2 truncate">
                  {t("contentBuilder.edit", { name: displayName })}
                </h1>
                <p className="text-stone-600 dark:text-zinc-400">
                  {fields.length === 1 ? t("contentBuilder.fieldsCount", { n: fields.length }) : t("contentBuilder.fieldsCountPlural", { n: fields.length })} · {typeLabel}
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:shrink-0">
                <Link
                  to="/content-types"
                  className="flex items-center justify-center px-4 py-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors text-center sm:text-left"
                >
                  {t("contentBuilder.cancel")}
                </Link>
                {saveError && <span className="text-xs text-red-400">{saveError}</span>}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? t("contentBuilder.saving") : t("contentBuilder.save")}
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-20 bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg px-4 pt-3 mb-6">
            <div className="flex items-center gap-6 sm:gap-8 border-b border-stone-200/85 dark:border-zinc-800/50 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`text-sm font-medium pb-3 border-b-2 -mb-px transition-colors ${
                  activeTab === "basic"
                    ? "text-stone-900 dark:text-zinc-100 border-stone-300 dark:border-zinc-100"
                    : "text-stone-500 dark:text-zinc-500 border-transparent hover:text-stone-700 dark:hover:text-zinc-300"
                }`}
              >
                {t("contentBuilder.tabs.basic")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("advanced")}
                className={`text-sm font-medium pb-3 border-b-2 -mb-px transition-colors ${
                  activeTab === "advanced"
                    ? "text-stone-900 dark:text-zinc-100 border-stone-300 dark:border-zinc-100"
                    : "text-stone-500 dark:text-zinc-500 border-transparent hover:text-stone-700 dark:hover:text-zinc-300"
                }`}
              >
                {t("contentBuilder.tabs.advanced")}
              </button>
            </div>
          </div>

        <div>
          {activeTab === "basic" ? (
            <>
              <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t("contentBuilder.displayName")}</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2 bg-white/82 dark:bg-zinc-950/70 border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-stone-600 dark:text-zinc-400">{t("contentBuilder.apiIdSingular")}</label>
                    <input
                      type="text"
                      value={singularId}
                      onChange={(e) => setSingularId(e.target.value)}
                      className="w-full px-4 py-2 bg-white/82 dark:bg-zinc-950/70 border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${isSingleType ? "text-stone-500 dark:text-zinc-500" : "text-stone-600 dark:text-zinc-400"}`}
                    >
                      {t("contentBuilder.apiIdPlural")}
                    </label>
                    <input
                      type="text"
                      value={isSingleType ? singularId : pluralId}
                      onChange={(e) => !isSingleType && setPluralId(e.target.value)}
                      disabled={isSingleType}
                      className={`w-full px-4 py-2 border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isSingleType ? "bg-stone-100/88 dark:bg-zinc-950/30 text-stone-500 dark:text-zinc-500 cursor-not-allowed" : "bg-white/82 dark:bg-zinc-950/70"
                      }`}
                    />
                    {isSingleType && (
                      <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1.5">
                        {t("contentBuilder.singleTypePluralHint")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <AppearancePicker
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedIcon={selectedIcon}
                setSelectedIcon={setSelectedIcon}
              />

              <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{t("contentBuilder.fields")}</h3>

                <div className="space-y-2 mb-4">
                  {fields.map((field) => {
                    const def = getStrapiFieldDef(field.type);
                    const Icon = def.icon;
                    const listColors = getCmsColorClasses(def.color);
                    const isOver = fieldDragOverId === field.id && fieldDraggingId !== field.id;
                    const isDragging = fieldDraggingId === field.id;
                    return (
                      <div
                        key={field.id}
                        data-field-row
                        onDragOver={(e) => {
                          if (!Array.from(e.dataTransfer.types).includes(DND_FIELD_PLAIN)) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setFieldDragOverId(field.id);
                        }}
                        onDragLeave={(e) => {
                          const rel = e.relatedTarget as Node | null;
                          if (rel && e.currentTarget.contains(rel)) return;
                          setFieldDragOverId((id) => (id === field.id ? null : id));
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const raw = e.dataTransfer.getData(DND_FIELD_PLAIN);
                          setFieldDragOverId(null);
                          setFieldDraggingId(null);
                          if (!raw.startsWith(DND_FIELD_PREFIX)) return;
                          const fromId = raw.slice(DND_FIELD_PREFIX.length);
                          if (!fromId || fromId === field.id) return;
                          setFields((prev) => reorderFieldsById(prev, fromId, field.id));
                        }}
                        className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 px-4 py-3 bg-white/75 dark:bg-zinc-950/50 border rounded-lg transition-colors group ${listColors.border} ${
                          isOver ? "ring-2 ring-zinc-400/50 border-zinc-500/60" : ""
                        } ${isDragging ? "opacity-50" : ""} hover:border-stone-400 dark:hover:border-zinc-600/50`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={t("contentBuilder.dragToReorder")}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData(DND_FIELD_PLAIN, DND_FIELD_PREFIX + field.id);
                            e.dataTransfer.effectAllowed = "move";
                            setFieldDraggingId(field.id);
                            const row = (e.currentTarget as HTMLElement).closest<HTMLElement>(
                              "[data-field-row]"
                            );
                            if (row) {
                              try {
                                e.dataTransfer.setDragImage(row, 40, 24);
                              } catch {
                                /* Safari / edge cases */
                              }
                            }
                          }}
                          onDragEnd={() => {
                            setFieldDraggingId(null);
                            setFieldDragOverId(null);
                          }}
                          className="touch-none shrink-0 cursor-grab rounded p-1 -m-1 text-stone-500 dark:text-zinc-500 hover:bg-stone-300 dark:hover:bg-zinc-800/60 hover:text-stone-700 dark:hover:text-zinc-300 active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                        >
                          <GripVertical className="w-5 h-5 pointer-events-none" />
                        </div>

                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${listColors.bg} border ${listColors.border}`}
                          draggable={false}
                        >
                          <Icon className={`w-5 h-5 ${listColors.icon}`} />
                        </div>

                        <div className="flex-1 min-w-0" draggable={false}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.name}</span>
                            {field.required && <span className="text-red-400 text-xs">*</span>}
                          </div>
                          <p className="text-sm text-stone-500 dark:text-zinc-500 truncate">
                            {getFieldListSubtitle(field, availableCollections)}
                          </p>
                        </div>
                        </div>

                        <button
                          type="button"
                          draggable={false}
                          onClick={() => setFields((prev) => prev.filter((f) => f.id !== field.id))}
                          className="self-end sm:self-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 rounded transition-all"
                          aria-label={t("contentBuilder.removeField")}
                        >
                          <Trash2 className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
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
                  + {t("contentBuilder.addField", { kind: typeLabel })}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">{t("contentBuilder.advanced.title")}</h3>

              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4 bg-white/75 dark:bg-zinc-950/50 border border-stone-200/85 dark:border-zinc-800/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-1">{t("contentBuilder.advanced.draftPublish")}</h4>
                    <p className="text-sm text-stone-600 dark:text-zinc-400">{t("contentBuilder.advanced.draftPublishDesc")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftAndPublish(!draftAndPublish)}
                    className={`relative w-12 h-6 shrink-0 rounded-full transition-colors self-start sm:self-auto ${
                      draftAndPublish ? "bg-blue-500" : "bg-stone-300 dark:bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        draftAndPublish ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4 bg-white/75 dark:bg-zinc-950/50 border border-stone-200/85 dark:border-zinc-800/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-1">{t("contentBuilder.advanced.i18n")}</h4>
                    <p className="text-sm text-stone-600 dark:text-zinc-400">{t("contentBuilder.advanced.i18nDesc")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setI18n(!i18n)}
                    className={`relative w-12 h-6 shrink-0 rounded-full transition-colors self-start sm:self-auto ${i18n ? "bg-blue-500" : "bg-stone-300 dark:bg-zinc-700"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        i18n ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4 bg-white/75 dark:bg-zinc-950/50 border border-stone-200/85 dark:border-zinc-800/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-1">{t("contentBuilder.advanced.reviewWorkflow")}</h4>
                    <p className="text-sm text-stone-600 dark:text-zinc-400">{t("contentBuilder.advanced.reviewWorkflowDesc")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewWorkflow(!reviewWorkflow)}
                    className={`relative w-12 h-6 shrink-0 rounded-full transition-colors self-start sm:self-auto ${
                      reviewWorkflow ? "bg-blue-500" : "bg-stone-300 dark:bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        reviewWorkflow ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 bg-white/75 dark:bg-zinc-950/50 border border-stone-200/85 dark:border-zinc-800/50 rounded-lg min-w-0">
                  <h4 className="font-medium mb-3">{t("contentBuilder.advanced.apiSettings")}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-2">
                        {isSingleType ? t("contentBuilder.advanced.singleTypeApiKey") : t("contentBuilder.advanced.collectionName")}
                      </label>
                      <input
                        type="text"
                        value={isSingleType ? singularId : pluralId}
                        className="w-full px-4 py-2 bg-white/82 dark:bg-zinc-950/70 border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-2">{t("contentBuilder.advanced.singularApiKey")}</label>
                      <input
                        type="text"
                        value={singularId}
                        className="w-full px-4 py-2 bg-white/82 dark:bg-zinc-950/70 border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
      </div>

      {showAddFieldModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/96 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-xl w-full max-w-6xl max-h-[min(92vh,56rem)] flex flex-col shadow-2xl overflow-hidden">
            <div className="shrink-0 bg-white/96 dark:bg-zinc-900/95 border-b border-stone-200/85 dark:border-zinc-800/50 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold">{t("contentBuilder.addFieldModal.title")}</h2>
              <button type="button" onClick={closeModal} className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  {t("contentBuilder.addFieldModal.selectType")} <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {STRAPI_FIELD_TYPES.map((ft) => {
                    const Icon = ft.icon;
                    const tc = fieldTileColors[ft.color];
                    const isSelected = selectedFieldType === ft.id;
                    return (
                      <button
                        key={ft.id}
                        type="button"
                        onClick={() => setSelectedFieldType(ft.id)}
                        className={`flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-lg border-2 transition-all text-left ${
                          ft.wide ? "col-span-full" : ""
                        } ${
                          isSelected
                            ? `${tc.selectedBorder} ${tc.selectedBg} ring-2 ring-zinc-100/25 ring-offset-2 ring-offset-zinc-950`
                            : `${tc.idleBorder} ${tc.idleBg}`
                        }`}
                      >
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? tc.selectedIconBg : tc.iconBg
                          }`}
                        >
                          <Icon className={`w-[18px] h-[18px] sm:w-5 sm:h-5 ${isSelected ? tc.iconText : tc.iconText}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm leading-snug">{ft.label}</p>
                          {getFieldTypeHelp(ft.id) && (
                            <p className="text-[10px] sm:text-xs text-stone-500 dark:text-zinc-500 mt-0.5 leading-snug line-clamp-2">
                              {getFieldTypeHelp(ft.id)}
                            </p>
                          )}
                        </div>
                        {isSelected && <Check className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${tc.check}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedFieldType === "relation" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      {t("contentBuilder.addFieldModal.relationType")} <span className="text-red-400">*</span>
                    </label>
                    <RelationTypePicker
                      value={relationType}
                      onChange={setRelationType}
                      sourceLabel={displayName || "Bu tür"}
                      targetLabel={
                        availableCollections.find((c) => c.id === relationTarget)?.name
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      {t("contentBuilder.addFieldModal.relationTarget")} <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={relationTarget}
                      onChange={(e) => setRelationTarget(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/82 dark:bg-zinc-950/70 border border-stone-200/85 dark:border-zinc-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                  <label className="block text-sm font-medium mb-2">{t("contentBuilder.addFieldModal.enumerationValues")}</label>
                  <textarea
                    value={enumerationValues}
                    onChange={(e) => setEnumerationValues(e.target.value)}
                    placeholder={t("contentBuilder.addFieldModal.enumerationPlaceholder")}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white/82 dark:bg-zinc-950/70 border border-stone-200/85 dark:border-zinc-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("contentBuilder.addFieldModal.fieldName")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder={t("contentBuilder.addFieldModal.fieldNamePlaceholder")}
                  className="w-full px-4 py-2.5 bg-white/82 dark:bg-zinc-950/70 border border-stone-200/85 dark:border-zinc-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/75 dark:bg-zinc-950/50 border border-stone-200/85 dark:border-zinc-800/50 rounded-lg">
                <div>
                  <p className="font-medium mb-1">{t("contentBuilder.addFieldModal.required")}</p>
                  <p className="text-sm text-stone-500 dark:text-zinc-500">{t("contentBuilder.addFieldModal.requiredHint")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewFieldRequired(!newFieldRequired)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    newFieldRequired ? "bg-blue-500" : "bg-stone-300 dark:bg-zinc-700"
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

            <div className="shrink-0 bg-white/96 dark:bg-zinc-900/95 border-t border-stone-200/85 dark:border-zinc-800/50 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-5 sm:px-6 py-2.5 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors text-sm sm:text-base">
                {t("contentBuilder.addFieldModal.cancel")}
              </button>
              <button
                type="button"
                onClick={addField}
                disabled={!selectedFieldType || !newFieldName.trim()}
                className="px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 dark:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
              >
                {t("contentBuilder.addFieldModal.addField")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
