import { useState } from "react";
import { Link, useParams } from "react-router";
import { Plus, Search, Filter, Edit, Trash2, MoreVertical } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  status: "published" | "draft";
  author: string;
  date: string;
  views: number;
}

const mockContent: ContentItem[] = [
  { id: "1", title: "Getting Started with Headless CMS", status: "published", author: "John Doe", date: "2026-04-01", views: 1234 },
  { id: "2", title: "Best Practices for Content Modeling", status: "published", author: "Jane Smith", date: "2026-03-30", views: 856 },
  { id: "3", title: "API Documentation Guide", status: "draft", author: "John Doe", date: "2026-03-28", views: 0 },
  { id: "4", title: "Understanding Content Relations", status: "published", author: "Sarah Wilson", date: "2026-03-25", views: 445 },
  { id: "5", title: "Media Management Tips", status: "draft", author: "Mike Johnson", date: "2026-03-20", views: 0 },
];

export function ContentManager() {
  const { type } = useParams();
  const [content, setContent] = useState(mockContent);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2 capitalize">{type}</h1>
            <p className="text-zinc-400">{content.length} entries found</p>
          </div>
          <Link
            to={`/content/${type}/create`}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Create New Entry
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 transition-colors">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Title</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Author</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Views</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {content.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/content/${type}/${item.id}`}
                      className="font-medium hover:text-zinc-300 transition-colors"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === "published"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{item.author}</td>
                  <td className="px-6 py-4 text-zinc-400">{item.date}</td>
                  <td className="px-6 py-4 text-zinc-400">{item.views}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/content/${type}/${item.id}`}
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

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-zinc-400">
            Showing 1 to {content.length} of {content.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors text-sm">
              Previous
            </button>
            <button className="px-3 py-1 bg-zinc-100 text-zinc-950 rounded hover:bg-zinc-200 transition-colors text-sm font-medium">
              1
            </button>
            <button className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors text-sm">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
