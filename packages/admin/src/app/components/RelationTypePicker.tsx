import { Check, ArrowRight, ArrowLeftRight, User, List, Link2, Tags } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RelationKind = "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";

export const RELATION_TYPE_LABELS: Record<RelationKind, string> = {
  manyToOne: "Tek seçim",
  oneToMany: "Liste",
  oneToOne: "Bire bir",
  manyToMany: "Çoklu seçim",
};

const OPTIONS: {
  value: RelationKind;
  label: string;
  description: string;
  hint: string;
  icon: LucideIcon;
  recommended?: boolean;
}[] = [
  {
    value: "manyToOne",
    label: "Tek seçim",
    description: "Bu kayıt, şu türden bir kayda bağlanır",
    hint: "Yazı → Kategori",
    icon: Link2,
    recommended: true,
  },
  {
    value: "oneToMany",
    label: "Liste",
    description: "Bu kayıt, diğer türden birden fazla kayda sahip olabilir",
    hint: "Kategori → Yazılar",
    icon: List,
  },
  {
    value: "oneToOne",
    label: "Bire bir",
    description: "Her kayıt bir hedefe bağlanır",
    hint: "Profil → Kullanıcı",
    icon: User,
  },
  {
    value: "manyToMany",
    label: "Çoklu seçim",
    description: "Birden fazla X, birden fazla Y",
    hint: "Makale ↔ Etiketler",
    icon: Tags,
  },
];

function RelationDiagram({ kind }: { kind: RelationKind }) {
  const box =
    "px-2 py-1 rounded border border-stone-300/80 dark:border-zinc-600/80 bg-stone-100/90 dark:bg-zinc-800/80 text-[10px] font-medium text-stone-700 dark:text-zinc-300";
  const multi =
    "px-1.5 py-0.5 rounded border border-dashed border-stone-400/70 dark:border-zinc-500/70 text-[9px] text-stone-500 dark:text-zinc-500";

  if (kind === "manyToOne") {
    return (
      <div className="flex items-center gap-1.5 mt-3" aria-hidden>
        <span className={box}>Bu kayıt</span>
        <ArrowRight className="w-3.5 h-3.5 text-violet-500 shrink-0" />
        <span className={box}>Hedef (1)</span>
      </div>
    );
  }
  if (kind === "oneToMany") {
    return (
      <div className="flex items-center gap-1.5 mt-3" aria-hidden>
        <span className={box}>Bu kayıt</span>
        <ArrowRight className="w-3.5 h-3.5 text-violet-500 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className={multi}>Kayıt 1</span>
          <span className={multi}>Kayıt 2</span>
        </div>
      </div>
    );
  }
  if (kind === "oneToOne") {
    return (
      <div className="flex items-center gap-1.5 mt-3" aria-hidden>
        <span className={box}>A</span>
        <ArrowLeftRight className="w-3.5 h-3.5 text-violet-500 shrink-0" />
        <span className={box}>B</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 mt-3" aria-hidden>
      <div className="flex flex-col gap-0.5">
        <span className={multi}>A1</span>
        <span className={multi}>A2</span>
      </div>
      <ArrowLeftRight className="w-3.5 h-3.5 text-violet-500 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className={multi}>B1</span>
        <span className={multi}>B2</span>
      </div>
    </div>
  );
}

export function formatRelationFieldSummary(
  fieldName: string,
  targetDisplayName?: string,
  relation?: string
): string {
  const target = targetDisplayName ?? "Hedef tür";
  const rel = relation && relation in RELATION_TYPE_LABELS
    ? RELATION_TYPE_LABELS[relation as RelationKind]
    : relation ?? "İlişki";
  const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, " ");
  return `${label} → ${target} (${rel})`;
}

export function RelationTypePicker({
  value,
  onChange,
  sourceLabel,
  targetLabel,
}: {
  value: RelationKind;
  onChange: (v: RelationKind) => void;
  /** Mevcut içerik türü görünen adı (diyagram ipucu için) */
  sourceLabel?: string;
  /** Seçilen hedef tür görünen adı */
  targetLabel?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        const hint =
          sourceLabel && targetLabel
            ? opt.value === "manyToMany"
              ? `${sourceLabel} ↔ ${targetLabel}`
              : opt.value === "oneToMany"
                ? `${sourceLabel} → ${targetLabel} (liste)`
                : `${sourceLabel} → ${targetLabel}`
            : opt.hint;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selected
                ? "border-violet-400/80 bg-violet-500/10 ring-1 ring-violet-400/25"
                : "border-stone-200/85 dark:border-zinc-800/50 hover:border-violet-500/35 bg-white/75 dark:bg-zinc-950/50"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selected ? "bg-violet-500/20" : "bg-stone-200/80 dark:bg-zinc-800/80"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${selected ? "text-violet-400" : "text-stone-600 dark:text-zinc-400"}`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-stone-900 dark:text-zinc-100">{opt.label}</p>
                    {opt.recommended && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        Önerilen
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {selected && <Check className="w-5 h-5 text-violet-400 shrink-0" />}
            </div>
            <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">{opt.description}</p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-500 mt-1.5">{hint}</p>
            <RelationDiagram kind={opt.value} />
          </button>
        );
      })}
    </div>
  );
}
