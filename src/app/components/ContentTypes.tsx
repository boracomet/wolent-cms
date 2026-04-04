import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Database, Edit, Trash2, FileText, Image as ImageIcon, Users, Settings } from "lucide-react";
import { cmsColorSwatches as availableColors } from "../lib/cmsColors";
import { demoContentTypes } from "../data/demoContentTypes";
import type { DemoContentType } from "../data/demoContentTypes";

export function ContentTypes() {
  const [contentTypes, setContentTypes] = useState<DemoContentType[]>(demoContentTypes);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Content Types</h1>
            <p className="text-zinc-400">{contentTypes.length} types</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Content Type</span>
            <span className="sm:hidden">New Type</span>
          </button>
        </div>

        {/* Content Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contentTypes.map((ct) => {
            // Color mapping for Strapi-style colors
            const colorClasses = availableColors.find(c => c.name === ct.color);
            
            return (
              <div
                key={ct.id}
                className={`bg-zinc-900/50 backdrop-blur-xl border ${colorClasses?.border} rounded-lg overflow-hidden hover:scale-[1.02] transition-all group relative`}
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses?.gradient} to-transparent opacity-50`} />
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${colorClasses?.bg} backdrop-blur-sm rounded-lg flex items-center justify-center`}>
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

        {/* Create Modal */}
        {showCreateModal && (
          <CreateContentTypeModal onClose={() => setShowCreateModal(false)} />
        )}
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