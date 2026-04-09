import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Home,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import type { FolderItem, MediaFile } from "../data/mediaLibraryData";
import { resolveFolderAccent } from "../lib/cmsColors";
import { api } from "../api/client";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Seçilen görselin tam URL’si (CDN veya data URL) */
  onSelect: (imageUrl: string) => void;
};

function parseMediaSizeToBytes(size: string): number {
  const m = size.trim().match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return 0;
  const unit = (m[2] || "B").toUpperCase();
  const kb = 1024;
  if (unit === "GB") return n * kb ** 3;
  if (unit === "MB") return n * kb ** 2;
  if (unit === "KB") return n * kb;
  return n;
}

function folderStats(folderId: string, media: MediaFile[]) {
  const files = media.filter((f) => f.folderId === folderId);
  const bytes = files.reduce((s, f) => s + parseMediaSizeToBytes(f.size), 0);
  return { count: files.length, bytes };
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const kb = 1024;
  const u = ["B", "KB", "MB", "GB"] as const;
  let v = bytes;
  let i = 0;
  while (v >= kb && i < u.length - 1) {
    v /= kb;
    i += 1;
  }
  const d = i === 0 ? 0 : 1;
  return `${v.toFixed(d).replace(/\.0$/, "")} ${u[i]}`;
}

export function MediaLibraryPickerModal({ open, onClose, onSelect }: Props) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [allMedia, setAllMedia] = useState<MediaFile[]>([]);
  const [allFolders, setAllFolders] = useState<FolderItem[]>([]);

  useEffect(() => {
    if (!open) return;
    api.media.files({ pageSize: 200 }).then(res => {
      const files = (res.data as Record<string, unknown>[]).map(f => ({
        id: String(f['id'] ?? ''),
        name: String(f['name'] ?? ''),
        type: (String(f['mimeType'] ?? '').startsWith('image/') ? 'image' : String(f['mimeType'] ?? '').startsWith('video/') ? 'video' : 'document') as MediaFile['type'],
        mimeType: String(f['mimeType'] ?? ''),
        size: f['size'] ? `${(Number(f['size']) / 1024).toFixed(1)} KB` : '—',
        uploadedAt: f['createdAt'] ? new Date(f['createdAt'] as string).toLocaleDateString() : '',
        uploadedBy: '',
        url: String(f['url'] ?? ''),
        thumbnail: f['thumbnailUrl'] ? String(f['thumbnailUrl']) : (String(f['mimeType'] ?? '').startsWith('image/') ? String(f['url'] ?? '') : undefined),
        folderId: f['folderId'] ? String(f['folderId']) : null,
      }));
      setAllMedia(files);
    }).catch(() => {});
    api.media.folders().then(res => {
      const folders = (res.data as Record<string, unknown>[]).map(f => ({
        id: String(f['id'] ?? ''),
        name: String(f['name'] ?? ''),
        parentId: f['parentId'] ? String(f['parentId']) : null,
        createdAt: f['createdAt'] ? new Date(f['createdAt'] as string).toLocaleDateString() : '',
      }));
      setAllFolders(folders);
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setCurrentFolderId(null);
      setSearchQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filteredMedia = useMemo(() => {
    const inFolder = allMedia.filter((f) => f.folderId === currentFolderId);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return inFolder;
    return inFolder.filter((f) => f.name.toLowerCase().includes(q));
  }, [currentFolderId, searchQuery]);

  const currentFolders = allFolders.filter((f) => f.parentId === currentFolderId);

  const getBreadcrumbs = (): FolderItem[] => {
    const breadcrumbs: FolderItem[] = [];
    let folder: FolderItem | undefined = allFolders.find(
      (f) => f.id === currentFolderId
    );
    while (folder) {
      breadcrumbs.unshift(folder);
      folder = allFolders.find((f) => f.id === folder!.parentId);
    }
    return breadcrumbs;
  };

  const toggleExpand = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderFolderTree = (parentId: string | null, level = 0) => {
    return allFolders
      .filter((f) => f.parentId === parentId)
      .map((folder) => {
        const hasChildren = allFolders.some((x) => x.parentId === folder.id);
        const isExpanded = expandedFolders.has(folder.id);
        const isActive = currentFolderId === folder.id;
        const { count } = folderStats(folder.id, allMedia);
        const folderAccent = resolveFolderAccent(folder);

        return (
          <div key={folder.id}>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors border ${
                isActive
                  ? `${folderAccent.bg} ${folderAccent.border} ${folderAccent.icon}`
                  : "border-transparent hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 text-stone-700 dark:text-zinc-300"
              }`}
              style={{ paddingLeft: `${level * 14 + 8}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(folder.id);
                  }}
                  className="p-0.5 hover:bg-stone-300/85 active:bg-stone-400/70 dark:hover:bg-zinc-700/55 dark:active:bg-zinc-600/45 rounded shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-5 shrink-0" />
              )}
              <button
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                {isActive ? (
                  <FolderOpen className={`w-4 h-4 shrink-0 ${folderAccent.icon}`} />
                ) : (
                  <Folder className={`w-4 h-4 shrink-0 ${folderAccent.icon}`} />
                )}
                <span
                  className={`text-sm truncate ${isActive ? "text-stone-900 dark:text-zinc-100" : "text-stone-700 dark:text-zinc-300"}`}
                >
                  {folder.name}
                </span>
                <span className="text-xs text-stone-500 dark:text-zinc-500 shrink-0">{count}</span>
              </button>
            </div>
            {hasChildren && isExpanded && renderFolderTree(folder.id, level + 1)}
          </div>
        );
      });
  };

  if (!open) return null;

  const rootCount = allMedia.filter((f) => f.folderId === null).length;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/55"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        className="relative z-10 flex min-h-0 w-full max-w-6xl max-h-[min(90vh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-xl border border-stone-300/85 dark:border-zinc-700/90 bg-stone-100 dark:bg-zinc-950 shadow-2xl shadow-black/80 ring-1 ring-white/10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-stone-200/90 dark:border-zinc-800/80 shrink-0">
          <div>
            <h2 id="media-picker-title" className="text-lg font-semibold text-stone-900 dark:text-zinc-100">
              Media Library
            </h2>
            <p className="text-sm text-stone-500 dark:text-zinc-500 mt-0.5">
              Choose an image — click a file to set the cover
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-300 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-stone-200/90 dark:border-zinc-800/80 p-3 overflow-y-auto max-h-40 lg:max-h-none">
            <p className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wide px-2 mb-2">
              Folders
            </p>
            <button
              type="button"
              onClick={() => setCurrentFolderId(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mb-1 ${
                currentFolderId === null
                  ? "bg-blue-500/10 text-blue-400"
                  : "hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 text-stone-700 dark:text-zinc-300"
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">All Files</span>
              <span className="text-xs text-stone-500 dark:text-zinc-500">{rootCount}</span>
            </button>
            <div className="space-y-0.5">{renderFolderTree(null)}</div>
          </aside>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-3 border-b border-stone-200/90 dark:border-zinc-800/80 shrink-0 space-y-2">
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-zinc-500 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCurrentFolderId(null)}
                  className="hover:text-blue-400 transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                </button>
                {getBreadcrumbs().map((folder) => (
                  <span key={folder.id} className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-stone-600 dark:text-zinc-600" />
                    <button
                      type="button"
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-zinc-500" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-10 pr-3 py-2 bg-white/90 dark:bg-zinc-900/80 border border-stone-200 dark:border-zinc-800 rounded-lg text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-500 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {currentFolders.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {currentFolders.map((folder) => {
                    const { count, bytes } = folderStats(folder.id, allMedia);
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="text-left bg-white/82 dark:bg-zinc-900/60 border border-stone-200/90 dark:border-zinc-800/80 rounded-lg p-3 hover:border-stone-400 dark:hover:border-zinc-600 transition-colors"
                      >
                        <Folder
                          className={`w-8 h-8 mb-2 ${resolveFolderAccent(folder).icon}`}
                        />
                        <p className="font-medium text-sm text-stone-800 dark:text-zinc-200 truncate">
                          {folder.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-zinc-500">
                          {count} item{count !== 1 ? "s" : ""} · {formatBytes(bytes)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredMedia.map((file) => {
                  const isImage = file.type === "image";
                  return (
                    <button
                      key={file.id}
                      type="button"
                      disabled={!isImage}
                      onClick={() => {
                        if (!isImage) return;
                        onSelect(file.url);
                        onClose();
                      }}
                      className={`text-left rounded-lg border overflow-hidden transition-colors ${
                        isImage
                          ? "border-stone-200/90 dark:border-zinc-800/80 bg-stone-50/92 dark:bg-zinc-900/40 hover:border-blue-500/50 hover:ring-1 hover:ring-blue-500/20"
                          : "border-stone-200/85 dark:border-zinc-800/50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="aspect-square bg-stone-200 dark:bg-zinc-800 flex items-center justify-center relative">
                        {file.thumbnail ? (
                          <img
                            src={file.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-10 h-10 text-stone-600 dark:text-zinc-600" />
                        )}
                        {!isImage && (
                          <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-white/92 dark:bg-zinc-950/90 text-stone-600 dark:text-zinc-400">
                            Not an image
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate text-stone-800 dark:text-zinc-200">{file.name}</p>
                        <p className="text-[10px] text-stone-500 dark:text-zinc-500">{file.size}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredMedia.length === 0 && currentFolders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-stone-500 dark:text-zinc-500 text-sm">
                  <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                  No files in this folder
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
