import { useState, useEffect } from "react";
import {
  Upload,
  Search,
  Grid3x3,
  List,
  Filter,
  Download,
  Trash2,
  MoreVertical,
  FileText,
  X,
  Plus,
  Folder,
  Tag,
  Link,
  CheckSquare,
  Square,
  FolderPlus,
  ChevronRight,
  Home,
  ChevronDown,
  FolderOpen,
  Edit,
  Copy,
  Check,
} from "lucide-react";

interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  /** MIME type, e.g. image/jpeg */
  mimeType: string;
  /** Pixel width for images/video (optional) */
  width?: number;
  /** Pixel height for images/video (optional) */
  height?: number;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  /** Public or CDN URL */
  url: string;
  thumbnail?: string;
  folderId: string | null;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

const mockFolders: FolderItem[] = [
  { id: "products", name: "Products", parentId: null, createdAt: "2026-03-01" },
  { id: "team", name: "Team Photos", parentId: null, createdAt: "2026-03-05" },
  { id: "banners", name: "Banners", parentId: null, createdAt: "2026-03-10" },
  { id: "documents", name: "Documents", parentId: null, createdAt: "2026-03-15" },
  { id: "products-2024", name: "2024 Collection", parentId: "products", createdAt: "2026-03-20" },
  { id: "products-2025", name: "2025 Collection", parentId: "products", createdAt: "2026-03-25" },
];

const mockMedia: MediaFile[] = [
  {
    id: "1",
    name: "hero-image.jpg",
    type: "image",
    mimeType: "image/jpeg",
    width: 3840,
    height: 2160,
    size: "2.4 MB",
    uploadedAt: "2026-04-03",
    uploadedBy: "John Doe",
    url: "https://cdn.wolent.dev/media/1/hero-image.jpg",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
    folderId: null,
  },
  {
    id: "2",
    name: "product-photo.jpg",
    type: "image",
    mimeType: "image/jpeg",
    width: 2400,
    height: 1600,
    size: "1.8 MB",
    uploadedAt: "2026-04-02",
    uploadedBy: "Jane Smith",
    url: "https://cdn.wolent.dev/media/2/product-photo.jpg",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    folderId: "products",
  },
  {
    id: "3",
    name: "banner-design.jpg",
    type: "image",
    mimeType: "image/jpeg",
    width: 3000,
    height: 2000,
    size: "3.2 MB",
    uploadedAt: "2026-04-01",
    uploadedBy: "John Doe",
    url: "https://cdn.wolent.dev/media/3/banner-design.jpg",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    folderId: "banners",
  },
  {
    id: "4",
    name: "team-photo.jpg",
    type: "image",
    mimeType: "image/png",
    width: 1920,
    height: 1080,
    size: "2.1 MB",
    uploadedAt: "2026-03-30",
    uploadedBy: "Sarah Wilson",
    url: "https://cdn.wolent.dev/media/4/team-photo.png",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400",
    folderId: "team",
  },
  {
    id: "5",
    name: "office-space.jpg",
    type: "image",
    mimeType: "image/webp",
    width: 2560,
    height: 1707,
    size: "2.7 MB",
    uploadedAt: "2026-03-28",
    uploadedBy: "Mike Johnson",
    url: "https://cdn.wolent.dev/media/5/office-space.webp",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
    folderId: null,
  },
  {
    id: "6",
    name: "product-catalog.pdf",
    type: "document",
    mimeType: "application/pdf",
    size: "4.5 MB",
    uploadedAt: "2026-03-25",
    uploadedBy: "Jane Smith",
    url: "https://cdn.wolent.dev/media/6/product-catalog.pdf",
    folderId: "documents",
  },
];

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

function formatFolderTotalBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const kb = 1024;
  const units = ["B", "KB", "MB", "GB"] as const;
  let v = bytes;
  let i = 0;
  while (v >= kb && i < units.length - 1) {
    v /= kb;
    i += 1;
  }
  const decimals = i === 0 ? 0 : 1;
  return `${v.toFixed(decimals).replace(/\.0$/, "")} ${units[i]}`;
}

function folderDirectStats(
  folderId: string,
  allMedia: MediaFile[]
): { itemCount: number; totalBytes: number } {
  const files = allMedia.filter((f) => f.folderId === folderId);
  const totalBytes = files.reduce((sum, f) => sum + parseMediaSizeToBytes(f.size), 0);
  return { itemCount: files.length, totalBytes };
}

function formatMimeTypeLabel(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "JPEG",
    "image/jpg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/gif": "GIF",
    "image/svg+xml": "SVG",
    "image/avif": "AVIF",
    "application/pdf": "PDF",
    "video/mp4": "MP4",
    "video/webm": "WebM",
  };
  return map[mime.toLowerCase()] || mime.split("/").pop()?.toUpperCase() || mime;
}

function resolutionLabel(file: MediaFile): string {
  if (file.width != null && file.height != null) {
    return `${file.width.toLocaleString()} × ${file.height.toLocaleString()} px`;
  }
  return "—";
}

export function MediaLibrary() {
  const [media, setMedia] = useState(mockMedia);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    setUrlCopied(false);
  }, [selectedFile?.id]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState(mockFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [contextMenuFolder, setContextMenuFolder] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const filteredMedia = media.filter((file) => file.folderId === currentFolderId);
  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredMedia.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredMedia.map((f) => f.id)));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedFiles.size} files?`)) {
      setMedia(media.filter((f) => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
    }
  };

  const handleBulkDownload = () => {
    alert(`Downloading ${selectedFiles.size} files...`);
  };

  const handleCopyURLs = () => {
    const urls = media
      .filter((f) => selectedFiles.has(f.id))
      .map((f) => f.url)
      .join("\n");
    navigator.clipboard.writeText(urls);
    alert("URLs copied to clipboard!");
  };

  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: FolderItem = {
        id: `folder-${Date.now()}`,
        name: newFolderName,
        parentId: currentFolderId,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setFolders([...folders, newFolder]);
      setNewFolderName("");
      setShowCreateFolderModal(false);
    }
  };

  const handleMoveFiles = (targetFolderId: string | null) => {
    const updatedMedia = media.map((file) => {
      if (selectedFiles.has(file.id)) {
        return { ...file, folderId: targetFolderId };
      }
      return file;
    });
    setMedia(updatedMedia);
    setSelectedFiles(new Set());
    setShowMoveModal(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    const folderToDelete = folders.find((f) => f.id === folderId);
    if (!folderToDelete) return;

    const filesInFolder = media.filter((f) => f.folderId === folderId).length;
    const subFolders = folders.filter((f) => f.parentId === folderId).length;

    const message = filesInFolder > 0 || subFolders > 0
      ? `Delete "${folderToDelete.name}"? This will delete ${filesInFolder} file(s) and ${subFolders} subfolder(s).`
      : `Delete "${folderToDelete.name}"?`;

    if (confirm(message)) {
      // Delete folder and all its contents recursively
      const foldersToDelete = new Set([folderId]);
      const getAllChildFolders = (parentId: string) => {
        folders
          .filter((f) => f.parentId === parentId)
          .forEach((f) => {
            foldersToDelete.add(f.id);
            getAllChildFolders(f.id);
          });
      };
      getAllChildFolders(folderId);

      setFolders(folders.filter((f) => !foldersToDelete.has(f.id)));
      setMedia(media.filter((f) => !foldersToDelete.has(f.folderId || "")));
      
      if (currentFolderId === folderId) {
        setCurrentFolderId(folderToDelete.parentId);
      }
      setContextMenuFolder(null);
    }
  };

  const handleRenameFolder = (folderId: string) => {
    setRenamingFolderId(folderId);
    const folder = folders.find((f) => f.id === folderId);
    setRenameValue(folder?.name || "");
    setContextMenuFolder(null);
  };

  const saveRename = () => {
    if (renamingFolderId && renameValue.trim()) {
      setFolders(
        folders.map((f) =>
          f.id === renamingFolderId ? { ...f, name: renameValue } : f
        )
      );
    }
    setRenamingFolderId(null);
    setRenameValue("");
  };

  const getBreadcrumbs = () => {
    const breadcrumbs: FolderItem[] = [];
    let folder = currentFolder;
    while (folder) {
      breadcrumbs.unshift(folder);
      folder = folders.find((f) => f.id === folder!.parentId) || null;
    }
    return breadcrumbs;
  };

  const renderFolderTree = (parentId: string | null, level: number = 0) => {
    const childFolders = folders.filter((f) => f.parentId === parentId);
    return childFolders.map((folder) => {
      const hasChildren = folders.some((f) => f.parentId === folder.id);
      const isExpanded = expandedFolders.has(folder.id);
      const isActive = currentFolderId === folder.id;
      const fileCount = media.filter((f) => f.folderId === folder.id).length;

      return (
        <div key={folder.id}>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              isActive
                ? "bg-blue-500/10 text-blue-400"
                : "hover:bg-zinc-800/50 text-zinc-300"
            }`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolderExpansion(folder.id);
                }}
                className="p-0.5 hover:bg-zinc-700/50 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <button
              onClick={() => setCurrentFolderId(folder.id)}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              {isActive ? (
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm truncate flex-1 text-left">{folder.name}</span>
              <span className="text-xs text-zinc-500">{fileCount}</span>
            </button>
          </div>
          {isExpanded && renderFolderTree(folder.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Media Library</h1>
            <p className="text-zinc-400">{filteredMedia.length} files in current folder</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Files</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Folder Tree */}
          <div className="col-span-3">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Folders</h3>
                <button
                  onClick={() => setShowCreateFolderModal(true)}
                  className="p-1.5 hover:bg-zinc-800/50 rounded transition-colors"
                  title="Create folder"
                >
                  <FolderPlus className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Root */}
              <div
                onClick={() => setCurrentFolderId(null)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors mb-2 ${
                  currentFolderId === null
                    ? "bg-blue-500/10 text-blue-400"
                    : "hover:bg-zinc-800/50 text-zinc-300"
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="text-sm flex-1">All Files</span>
                <span className="text-xs text-zinc-500">
                  {media.filter((f) => f.folderId === null).length}
                </span>
              </div>

              {/* Folder Tree */}
              <div className="space-y-1">{renderFolderTree(null)}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {/* Breadcrumb */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="hover:text-blue-400 transition-colors"
                >
                  <Home className="w-4 h-4" />
                </button>
                {getBreadcrumbs().map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                {/* Select All Checkbox */}
                <button
                  onClick={toggleSelectAll}
                  className="p-2 hover:bg-zinc-800/50 rounded transition-colors"
                  title="Select all"
                >
                  {selectedFiles.size === filteredMedia.length &&
                  filteredMedia.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Square className="w-5 h-5 text-zinc-400" />
                  )}
                </button>

                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/50 rounded-md hover:bg-zinc-700/70 transition-colors">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <div className="flex items-center gap-1 bg-zinc-800/70 backdrop-blur-sm rounded-md p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded transition-colors ${
                      viewMode === "grid"
                        ? "bg-zinc-700/70"
                        : "hover:bg-zinc-700/50"
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded transition-colors ${
                      viewMode === "list"
                        ? "bg-zinc-700/70"
                        : "hover:bg-zinc-700/50"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedFiles.size > 0 && (
              <div className="bg-blue-600 border border-blue-500 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {selectedFiles.size} file{selectedFiles.size > 1 ? "s" : ""}{" "}
                    selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button
                    onClick={handleCopyURLs}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                  >
                    <Link className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy URLs</span>
                  </button>
                  <button
                    onClick={() => setShowMoveModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                  >
                    <Folder className="w-4 h-4" />
                    <span className="hidden sm:inline">Move to</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors">
                    <Tag className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Tags</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                  <button
                    onClick={() => setSelectedFiles(new Set())}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Folders in Current Directory */}
            {currentFolders.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {currentFolders.map((folder) => {
                  const { itemCount, totalBytes } = folderDirectStats(
                    folder.id,
                    media
                  );
                  const isRenaming = renamingFolderId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      onDoubleClick={() => !isRenaming && setCurrentFolderId(folder.id)}
                      className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-4 hover:border-zinc-700/50 transition-colors cursor-pointer group relative"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Folder className="w-10 h-10 text-blue-400" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuFolder(folder.id);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setContextMenuPosition({ x: rect.left, y: rect.bottom });
                          }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-zinc-800/50 rounded transition-all"
                        >
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                      {isRenaming ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={saveRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename();
                            if (e.key === "Escape") {
                              setRenamingFolderId(null);
                              setRenameValue("");
                            }
                          }}
                          className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <p className="font-medium truncate mb-1">{folder.name}</p>
                      )}
                      <p className="text-xs text-zinc-500">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                        <span className="text-zinc-600"> · </span>
                        {formatFolderTotalBytes(totalBytes)}
                      </p>

                      {/* Context Menu */}
                      {contextMenuFolder === folder.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setContextMenuFolder(null)}
                          />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg shadow-xl overflow-hidden z-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameFolder(folder.id);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
                            >
                              <Edit className="w-4 h-4 text-zinc-400" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 transition-colors text-left"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Media Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((file) => (
                  <div
                    key={file.id}
                    className={`bg-zinc-900/50 backdrop-blur-xl border rounded-lg overflow-hidden hover:border-zinc-700/50 transition-colors cursor-pointer group relative ${
                      selectedFiles.has(file.id)
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-zinc-800/50"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(file.id);
                        }}
                        className="p-1 bg-zinc-900/80 backdrop-blur-sm rounded hover:bg-zinc-800 transition-colors"
                      >
                        {selectedFiles.has(file.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Square className="w-5 h-5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>

                    <div
                      onClick={() => setSelectedFile(file)}
                      className="aspect-square bg-zinc-800 flex items-center justify-center relative overflow-hidden"
                    >
                      {file.thumbnail ? (
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-12 h-12 text-zinc-600" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-zinc-900 rounded hover:bg-zinc-800 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-zinc-900 rounded hover:bg-zinc-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div onClick={() => setSelectedFile(file)} className="p-3">
                      <p className="text-sm font-medium truncate mb-1">
                        {file.name}
                      </p>
                      <p className="text-xs text-zinc-500">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="border-b border-zinc-800/50">
                    <tr>
                      <th className="px-3 py-4 w-12"></th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                        Size
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                        Uploaded By
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-zinc-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredMedia.map((file) => (
                      <tr
                        key={file.id}
                        className={`hover:bg-zinc-800/30 transition-colors ${
                          selectedFiles.has(file.id) ? "bg-blue-500/10" : ""
                        }`}
                      >
                        <td className="px-3 py-4">
                          <button
                            onClick={() => toggleFileSelection(file.id)}
                            className="p-1 hover:bg-zinc-800 rounded transition-colors"
                          >
                            {selectedFiles.has(file.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Square className="w-5 h-5 text-zinc-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                              {file.thumbnail ? (
                                <img
                                  src={file.thumbnail}
                                  alt=""
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <FileText className="w-5 h-5 text-zinc-400" />
                              )}
                            </div>
                            <span className="font-medium truncate">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 capitalize">
                          {file.type}
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{file.size}</td>
                        <td className="px-6 py-4 text-zinc-400">
                          {file.uploadedBy}
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {file.uploadedAt}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
                              <Download className="w-4 h-4 text-zinc-400" />
                            </button>
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
            )}
          </div>
        </div>

        {/* File Details Modal */}
        {selectedFile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold">File Details</h2>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 hover:bg-zinc-800/50 backdrop-blur-sm rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Preview */}
                  <div>
                    <div className="aspect-square bg-zinc-800/70 backdrop-blur-sm rounded-lg flex items-center justify-center overflow-hidden">
                      {selectedFile.thumbnail ? (
                        <img
                          src={selectedFile.thumbnail}
                          alt={selectedFile.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FileText className="w-24 h-24 text-zinc-600" />
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        File Name
                      </label>
                      <input
                        type="text"
                        value={selectedFile.name}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Type
                      </label>
                      <p className="text-zinc-100 capitalize">
                        {selectedFile.type}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Format
                      </label>
                      <p className="text-zinc-100">
                        {formatMimeTypeLabel(selectedFile.mimeType)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                        {selectedFile.mimeType}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Resolution
                      </label>
                      <p className="text-zinc-100 font-mono text-sm">
                        {resolutionLabel(selectedFile)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Public URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={selectedFile.url}
                          title={selectedFile.url}
                          className="flex-1 min-w-0 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-300 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(selectedFile.url);
                            setUrlCopied(true);
                            window.setTimeout(() => setUrlCopied(false), 2000);
                          }}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 text-xs text-zinc-200 transition-colors"
                        >
                          {urlCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <a
                        href={selectedFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
                      >
                        <Link className="w-3 h-3" />
                        Open in new tab
                      </a>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Size
                      </label>
                      <p className="text-zinc-100">{selectedFile.size}</p>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Uploaded By
                      </label>
                      <p className="text-zinc-100">{selectedFile.uploadedBy}</p>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Uploaded At
                      </label>
                      <p className="text-zinc-100">{selectedFile.uploadedAt}</p>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold">Upload Files</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-zinc-800/50 backdrop-blur-sm rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="border-2 border-dashed border-zinc-800/50 rounded-lg p-12 text-center hover:border-zinc-700/50 transition-colors">
                  <Upload className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Drop files to upload
                  </h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    or click to browse
                  </p>
                  <button className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
                    Select Files
                  </button>
                  <p className="text-xs text-zinc-500 mt-4">
                    Supported formats: JPG, PNG, GIF, PDF, MP4 (Max 10MB)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Folder Modal */}
        {showCreateFolderModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold">Create New Folder</h2>
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  className="p-2 hover:bg-zinc-800/50 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New Folder"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowCreateFolderModal(false)}
                    className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
                  >
                    Create Folder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Move to Folder Modal */}
        {showMoveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold">Move to Folder</h2>
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="p-2 hover:bg-zinc-800/50 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-2 max-h-96 overflow-auto mb-6">
                  <button
                    onClick={() => handleMoveFiles(null)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors text-left"
                  >
                    <Home className="w-5 h-5 text-zinc-400" />
                    <span>Root / All Files</span>
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleMoveFiles(folder.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors text-left"
                      style={{
                        paddingLeft: `${
                          (folders.filter((f) => f.id === folder.parentId)
                            .length > 0
                            ? 1
                            : 0) *
                            16 +
                          16
                        }px`,
                      }}
                    >
                      <Folder className="w-5 h-5 text-blue-400" />
                      <span>{folder.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowMoveModal(false)}
                    className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}