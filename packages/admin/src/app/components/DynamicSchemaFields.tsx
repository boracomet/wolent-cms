import { useCallback, useState } from "react";
import { Link2, Upload, Images, Layers, LayoutGrid, Package } from "lucide-react";
import type { DemoField } from "../data/demoContentTypes";
import { MinimalTiptap } from "./MinimalTiptap";
import { MediaLibraryPickerModal } from "./MediaLibraryPickerModal";

type Props = {
  fields: DemoField[];
  values: Record<string, string>;
  onChange: (apiName: string, value: string) => void;
};

const inputClass =
  "w-full px-4 py-2.5 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

export function DynamicSchemaFields({ fields, values, onChange }: Props) {
  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const v = values[field.apiName] ?? "";
        const req = field.required ? (
          <span className="text-red-400" aria-hidden>
            *
          </span>
        ) : null;

        const label = (
          <label className="block text-sm font-medium mb-2">
            {field.label} {req}
            {field.description && (
              <span className="block text-xs font-normal text-zinc-500 mt-0.5">{field.description}</span>
            )}
          </label>
        );

        switch (field.type) {
          case "text":
          case "uid":
            return (
              <div key={field.id}>
                {label}
                <input
                  type="text"
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={`${inputClass} text-base`}
                  placeholder={field.type === "uid" ? "unique-slug" : ""}
                />
              </div>
            );

          case "text_long":
            return (
              <div key={field.id}>
                {label}
                <textarea
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-y min-h-[100px]`}
                />
              </div>
            );

          case "blocks":
            return (
              <div key={field.id}>
                {label}
                <MinimalTiptap
                  content={v}
                  onChange={(html) => onChange(field.apiName, html)}
                  placeholder="Rich text (blocks)…"
                />
              </div>
            );

          case "json":
            return (
              <div key={field.id}>
                {label}
                <textarea
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  rows={8}
                  spellCheck={false}
                  className={`${inputClass} font-mono text-xs leading-relaxed`}
                  placeholder='{\n  "key": "value"\n}'
                />
              </div>
            );

          case "number_int":
          case "number_float":
          case "number_big":
            return (
              <div key={field.id}>
                {label}
                <input
                  type="number"
                  step={field.type === "number_float" ? "0.01" : "1"}
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={inputClass}
                />
              </div>
            );

          case "password":
            return (
              <div key={field.id}>
                {label}
                <input
                  type="password"
                  value={v}
                  autoComplete="new-password"
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            );

          case "email":
            return (
              <div key={field.id}>
                {label}
                <input
                  type="email"
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={inputClass}
                  placeholder="name@example.com"
                />
              </div>
            );

          case "enumeration": {
            const opts = field.enumOptions?.length
              ? field.enumOptions
              : ["option_a", "option_b", "option_c"];
            return (
              <div key={field.id}>
                {label}
                <select
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          case "date":
            return (
              <div key={field.id}>
                {label}
                <input
                  type="date"
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={inputClass}
                />
              </div>
            );

          case "time":
            return (
              <div key={field.id}>
                {label}
                <input
                  type="time"
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={inputClass}
                />
              </div>
            );

          case "datetime":
            return (
              <div key={field.id}>
                {label}
                <input
                  type="datetime-local"
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={inputClass}
                />
              </div>
            );

          case "boolean": {
            const on = v === "true";
            return (
              <div
                key={field.id}
                className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">
                    {field.label} {req}
                  </p>
                  {field.description && <p className="text-xs text-zinc-500 mt-1">{field.description}</p>}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => onChange(field.apiName, on ? "false" : "true")}
                  className={`relative w-12 h-6 rounded-full transition-colors ${on ? "bg-blue-500" : "bg-zinc-700"}`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      on ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          }

          case "media":
            return (
              <DynamicMediaField
                key={field.id}
                field={field}
                value={v}
                onChange={onChange}
              />
            );

          case "relation":
            return (
              <div key={field.id}>
                {label}
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-violet-400 shrink-0" />
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => onChange(field.apiName, e.target.value)}
                    className={`${inputClass} flex-1`}
                    placeholder="İlişki ID gir…"
                  />
                </div>
              </div>
            );

          case "component":
            return (
              <div key={field.id} className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <Package className="w-4 h-4" />
                  {field.label}
                  {req}
                </div>
                <input
                  type="text"
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={inputClass}
                  placeholder={`${field.label}...`}
                />
              </div>
            );

          case "dynamiczone":
            return (
              <div key={field.id} className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-orange-400 text-sm font-medium">
                  <LayoutGrid className="w-4 h-4" />
                  {field.label}
                  {req}
                </div>
                <p className="text-xs text-zinc-500">
                  Add dynamic blocks to this zone.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md bg-zinc-800 text-xs border border-zinc-700 hover:bg-zinc-700"
                    onClick={() => onChange(field.apiName, v ? `${v}+hero` : "hero")}
                  >
                    + Hero block
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md bg-zinc-800 text-xs border border-zinc-700 hover:bg-zinc-700"
                    onClick={() => onChange(field.apiName, v ? `${v}+quote` : "quote")}
                  >
                    + Quote block
                  </button>
                </div>
                {v && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                    <Layers className="w-3.5 h-3.5" />
                    {v}
                  </div>
                )}
              </div>
            );

          default:
            return (
              <div key={field.id}>
                {label}
                <input
                  type="text"
                  value={v}
                  onChange={(e) => onChange(field.apiName, e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-zinc-600 mt-1">Tip: {field.type} (fallback)</p>
              </div>
            );
        }
      })}
    </div>
  );
}

function DynamicMediaField({
  field,
  value,
  onChange,
}: {
  field: DemoField;
  value: string;
  onChange: (apiName: string, value: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const req = field.required ? (
    <span className="text-red-400" aria-hidden>
      *
    </span>
  ) : null;

  const label = (
    <label className="block text-sm font-medium mb-2" htmlFor={`media-file-${field.id}`}>
      {field.label} {req}
      {field.description && (
        <span className="block text-xs font-normal text-zinc-500 mt-0.5">{field.description}</span>
      )}
    </label>
  );

  const applyLocalImage = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") onChange(field.apiName, result);
      };
      reader.readAsDataURL(file);
    },
    [field.apiName, onChange]
  );

  if (value) {
    return (
      <div>
        {label}
        <div className="space-y-2">
          <img
            src={value}
            alt=""
            className="max-h-48 rounded-lg border border-zinc-800/50 object-cover"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="text-sm px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            >
              Change from Gallery
            </button>
            <button
              type="button"
              onClick={() => onChange(field.apiName, "")}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Clear
            </button>
          </div>
        </div>
        <MediaLibraryPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(url) => onChange(field.apiName, url)}
        />
      </div>
    );
  }

  return (
    <div>
      {label}
      <div className="flex flex-col sm:flex-row gap-2">
        <div
          className={`flex-1 min-h-[8.5rem] flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg transition-colors bg-zinc-950/30 ${
            dragOver
              ? "border-blue-500/60 bg-blue-500/5"
              : "border-zinc-800/50 hover:border-zinc-600/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) applyLocalImage(file);
          }}
        >
          <input
            id={`media-file-${field.id}`}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) applyLocalImage(file);
              e.target.value = "";
            }}
          />
          <Upload className="w-8 h-8 text-zinc-500 shrink-0" aria-hidden />
          <p className="text-sm text-zinc-400 text-center px-2">
            Sürükleyip bırakın veya{" "}
            <label
              htmlFor={`media-file-${field.id}`}
              className="text-zinc-200 underline underline-offset-2 cursor-pointer hover:text-white"
            >
              dosya seçin
            </label>
          </p>
          <p className="text-xs text-zinc-600">PNG, JPG, WebP, GIF</p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 sm:py-0 sm:min-w-[8.5rem] bg-zinc-800/70 border border-zinc-200/90 rounded-md text-sm text-zinc-100 hover:bg-zinc-800 transition-colors shrink-0"
        >
          <Images className="w-4 h-4" />
          Gallery
        </button>
      </div>
      <MediaLibraryPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(field.apiName, url)}
      />
    </div>
  );
}
