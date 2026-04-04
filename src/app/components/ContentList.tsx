import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreVertical, ArrowLeft } from "lucide-react";
import { getDemoContentTypeByApiId } from "../data/demoContentTypes";

interface ContentItem {
  id: string;
  title: string;
  status: "published" | "draft";
  locale: string;
  updatedAt: string;
  updatedBy: string;
}

const mockArticles: ContentItem[] = [
  {
    id: "1",
    title: "Getting Started with Headless CMS",
    status: "published",
    locale: "en",
    updatedAt: "2026-04-03",
    updatedBy: "John Doe",
  },
  {
    id: "2",
    title: "Advanced API Integration",
    status: "draft",
    locale: "en",
    updatedAt: "2026-04-02",
    updatedBy: "Jane Smith",
  },
];

const mockProducts: ContentItem[] = [
  {
    id: "1",
    title: "Premium Headphones",
    status: "published",
    locale: "en",
    updatedAt: "2026-04-03",
    updatedBy: "John Doe",
  },
];

function row(title: string, id: string, status: ContentItem["status"] = "published"): ContentItem {
  return {
    id,
    title,
    status,
    locale: "en",
    updatedAt: "2026-04-04",
    updatedBy: "Demo Editor",
  };
}

const CONTENT_LIST_MOCKS: Record<string, ContentItem[]> = {
  article: mockArticles,
  product: mockProducts,
  author: [row("John Doe", "1")],
  category: [row("Technology", "1"), row("Business", "2")],
  homepage: [row("Homepage", "1")],
  about: [row("About page", "1")],
  "field-showcase": [row("Tüm alan tipleri — örnek kayıt", "1")],
  "component-playground": [row("Component & Dynamic Zone örneği", "1")],
  "data-primitives-lab": [row("SKU / sayı / tarih lab kaydı", "1")],
};

export function ContentList() {
  const { type } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  const schema = useMemo(() => getDemoContentTypeByApiId(type), [type]);
  const contents = (type && CONTENT_LIST_MOCKS[type]) || [];
  const listHeading = schema?.pluralName ?? (type ? `${type.charAt(0).toUpperCase() + type.slice(1)}s` : "Entries");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 pt-12 lg:pt-0">
          <Link
            to="/content-types"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Content Types
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{listHeading}</h1>
              <p className="text-zinc-400">{contents.length} entries</p>
            </div>
            <Link
              to={`/content/${type}/create`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create {schema?.singularName ?? "entry"}</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/50 rounded-md hover:bg-zinc-700/70 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Locale</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Updated</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">By</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {contents.map((content) => (
                  <tr key={content.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{content.title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          content.status === "published"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {content.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 uppercase text-sm">{content.locale}</td>
                    <td className="px-6 py-4 text-zinc-400">{content.updatedAt}</td>
                    <td className="px-6 py-4 text-zinc-400">{content.updatedBy}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/content/${type}/${content.id}`}
                          className="p-2 hover:bg-zinc-800 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-zinc-400" />
                        </Link>
                        <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
