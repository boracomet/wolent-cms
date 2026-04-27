import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useConfirm } from "./ConfirmDialog";
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
  GripVertical,
  Settings,
} from "lucide-react";
import type { FolderItem, MediaFile } from "../data/mediaLibraryData";
import { api, ApiClientError } from "../api/client";
import {
  accentPickerSolidDots,
  cmsColorSwatches,
  resolveFolderAccent,
  resolveMediaAccent,
  type CmsColorName,
} from "../lib/cmsColors";

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Klasör / dosya ⋮ menüsü genişliği (w-60) */
const FOLDER_CONTEXT_MENU_W = 240;
const FILE_CONTEXT_MENU_W = 240;
const FOLDER_CONTEXT_MENU_EST_H = 340;
const FILE_CONTEXT_MENU_EST_H = 300;

function MediaLibraryAccentPicker({
  value,
  onChange,
  dense,
}: {
  value: CmsColorName | undefined;
  onChange: (next: CmsColorName | undefined) => void;
  dense?: boolean;
}) {
  const btn = dense ? "h-6 w-6" : "h-7 w-7";
  const dot = dense ? "h-3 w-3" : "h-4 w-4";
  const gap = dense ? "gap-1 px-2 py-1.5" : "gap-1.5";
  return (
    <div className={`flex flex-wrap ${gap}`} role="group" aria-label="Accent color">
      <button
        type="button"
        title="Automatic (palette by folder)"
        onClick={() => onChange(undefined)}
        className={`flex ${btn} shrink-0 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 ${
          value === undefined
            ? "border-white ring-2 ring-white/40"
            : "border-stone-300/82 dark:border-zinc-700/80 bg-white/78 dark:bg-zinc-900/50"
        }`}
      >
        <span
          className={`${dot} rounded-full bg-stone-400 dark:bg-zinc-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40`}
        />
      </button>
      {cmsColorSwatches.map((s) => (
        <button
          key={s.name}
          type="button"
          title={s.name}
          onClick={() => onChange(s.name)}
          className={`flex ${btn} shrink-0 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 ${
            value === s.name ? "border-white ring-2 ring-white/40" : "border-stone-300/82 dark:border-zinc-700/80 bg-white/78 dark:bg-zinc-900/50"
          }`}
        >
          <span className={`${dot} rounded-full ${accentPickerSolidDots[s.name]}`} />
        </button>
      ))}
    </div>
  );
}

/** HTML5 drag — medya dosyası taşıma */
const DND_MEDIA_MIME = "application/x-wolent-media";
const DND_FOLDER_MIME = "application/x-wolent-folder";

function parseMediaDragPayload(raw: string): string[] | null {
  try {
    const o = JSON.parse(raw) as { ids?: unknown };
    if (!Array.isArray(o.ids)) return null;
    const ids = o.ids.filter((x): x is string => typeof x === "string");
    return ids.length ? ids : null;
  } catch {
    return null;
  }
}

function dragEventHasMedia(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes(DND_MEDIA_MIME);
}

function parseFolderDragPayload(raw: string): string | null {
  try {
    const o = JSON.parse(raw) as { id?: unknown };
    return typeof o.id === "string" ? o.id : null;
  } catch {
    return null;
  }
}

function dragEventHasFolderDrag(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes(DND_FOLDER_MIME);
}

function dragEventHasOsFiles(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes("Files");
}

/** newParent, taşınan klasörün kendisi veya alt klasörü olamaz */
function wouldCreateFolderCycle(
  folders: FolderItem[],
  movingId: string,
  newParentId: string | null
): boolean {
  if (newParentId === null) return false;
  if (newParentId === movingId) return true;
  let id: string | null = newParentId;
  const seen = new Set<string>();
  while (id) {
    if (id === movingId) return true;
    if (seen.has(id)) break;
    seen.add(id);
    const f = folders.find((x) => x.id === id);
    id = f?.parentId ?? null;
  }
  return false;
}

/**
 * Ağaç satırında dikey konum: üst/alt = aynı üstte sırala, orta = içine taşı.
 * Yanlışlıkla hedef satıra bırakınca hep "alt klasör" olmasını azaltır.
 */
function folderDropZoneFromEvent(e: React.DragEvent, el: HTMLElement): "before" | "into" | "after" {
  const rect = el.getBoundingClientRect();
  const h = rect.height;
  if (h <= 0) return "into";
  const r = (e.clientY - rect.top) / h;
  if (r < 0.3) return "before";
  if (r > 0.7) return "after";
  return "into";
}

/** Aynı parent altında diziyi güncelle; anchor satırının üstüne / altına yerleştirir */
function reorderFolderAmongSiblings(
  folders: FolderItem[],
  movingId: string,
  anchorId: string,
  place: "before" | "after"
): FolderItem[] | null {
  if (movingId === anchorId) return null;
  const moving = folders.find((f) => f.id === movingId);
  const anchor = folders.find((f) => f.id === anchorId);
  if (!moving || !anchor) return null;
  const parentId = anchor.parentId;
  if (wouldCreateFolderCycle(folders, movingId, parentId)) return null;

  const updatedMoving: FolderItem = { ...moving, parentId };
  const without = folders.filter((f) => f.id !== movingId);
  const anchorIdx = without.findIndex((f) => f.id === anchorId);
  if (anchorIdx === -1) return null;
  const insertAt = place === "before" ? anchorIdx : anchorIdx + 1;
  return [...without.slice(0, insertAt), updatedMoving, ...without.slice(insertAt)];
}

function treeFolderRowDropClass(folderId: string, dropTargetKey: string | null): string {
  const p = `folder:${folderId}`;
  if (dropTargetKey === `${p}:before`) {
    return "shadow-[inset_0_2px_0_0] shadow-emerald-400/90 relative z-[1]";
  }
  if (dropTargetKey === `${p}:after`) {
    return "shadow-[inset_0_-2px_0_0] shadow-emerald-400/90 relative z-[1]";
  }
  if (dropTargetKey === `${p}:into` || dropTargetKey === p) {
    return "ring-2 ring-blue-500/70 ring-offset-2 ring-offset-zinc-950";
  }
  return "";
}

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
  const confirmDialog = useConfirm();
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    setUrlCopied(false);
  }, [selectedFile?.id]);

  const [mediaLoading, setMediaLoading] = useState(true);

  // Load real data from API
  useEffect(() => {
    setMediaLoading(true);
    Promise.allSettled([
      api.media.files({ pageSize: 100 }),
      api.media.folders(),
    ]).then(([filesResult, foldersResult]) => {
      if (filesResult.status === 'fulfilled') {
        const apiFiles = (filesResult.value.data as unknown[]).map((f: unknown) => {
          const file = f as Record<string, unknown>;
          return {
            id: file['id'] as string,
            name: file['name'] as string,
            type: ((file['mime'] as string)?.startsWith('image') ? 'image'
              : (file['mime'] as string)?.startsWith('video') ? 'video' : 'document') as 'image' | 'video' | 'document',
            mimeType: file['mime'] as string,
            size: formatBytes(file['size'] as number),
            uploadedAt: new Date(file['createdAt'] as string).toISOString().split('T')[0],
            uploadedBy: '',
            url: file['url'] as string,
            thumbnail: (file['mime'] as string)?.startsWith('image') ? file['url'] as string : undefined,
            folderId: (file['folderId'] as string) ?? null,
          } satisfies MediaFile;
        });
        setMedia(apiFiles);
      } else {
        setUploadError('Failed to load files from server.');
      }
      if (foldersResult.status === 'fulfilled') {
        const apiFolders = (foldersResult.value.data as unknown[]).map((f: unknown) => {
          const folder = f as Record<string, unknown>;
          return {
            id: folder['id'] as string,
            name: folder['name'] as string,
            parentId: (folder['parentId'] as string) ?? null,
            createdAt: new Date(folder['createdAt'] as string).toISOString().split('T')[0],
          } satisfies FolderItem;
        });
        setFolders(apiFolders);
      }
    }).finally(() => setMediaLoading(false));
  }, []);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [contextMenuFolder, setContextMenuFolder] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  /** Bırakma hedefi: `root` = kök, `main-view` = mevcut klasör alanı, aksi `folder:${id}` */
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [fileDropOverMain, setFileDropOverMain] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [newFolderAccent, setNewFolderAccent] = useState<CmsColorName | undefined>(
    undefined
  );
  const [contextMenuFile, setContextMenuFile] = useState<string | null>(null);
  const [uploadAccent, setUploadAccent] = useState<CmsColorName | undefined>(undefined);

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

  const handleBulkDelete = async () => {
    const ok = await confirmDialog({
      title: "Toplu Dosya Silme",
      message: `${selectedFiles.size} dosyayı silmek istediğine emin misin? Bu işlem geri alınamaz.`,
      confirmLabel: "Evet, Sil",
      variant: "danger",
    });
    if (!ok) return;
    const ids = Array.from(selectedFiles);
    const results = await Promise.allSettled(ids.map(id => api.media.deleteFile(id)));
    const failed = results.filter(r => r.status === 'rejected').length;
    const succeededIds = ids.filter((_, i) => results[i].status === 'fulfilled');
    if (succeededIds.length > 0) {
      setMedia(prev => prev.filter(f => !succeededIds.includes(f.id)));
      setSelectedFiles(new Set());
    }
    if (failed > 0) {
      setUploadError(`${failed} of ${ids.length} files could not be deleted.`);
    }
  };

  const handleBulkDownload = () => {
    media
      .filter((f) => selectedFiles.has(f.id))
      .forEach((f) => {
        const a = document.createElement("a");
        a.href = f.url;
        a.download = f.name;
        a.target = "_blank";
        a.click();
      });
  };

  const handleCopyURLs = () => {
    const urls = media
      .filter((f) => selectedFiles.has(f.id))
      .map((f) => f.url)
      .join("\n");
    navigator.clipboard.writeText(urls);
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

  const setMediaFileAccent = (fileId: string, accent: CmsColorName | undefined) => {
    setMedia((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, accentColor: accent } : f))
    );
    setSelectedFile((sf) =>
      sf?.id === fileId ? { ...sf, accentColor: accent } : sf
    );
    api.media.updateFile(fileId, { accentColor: accent ?? null }).catch(() => {});
  };

  const handleDeleteFileFromMenu = async (fileId: string) => {
    const file = media.find((f) => f.id === fileId);
    if (!file) return;
    const ok = await confirmDialog({
      title: "Dosya Sil",
      message: `"${file.name}" dosyasını silmek istediğine emin misin?`,
      confirmLabel: "Evet, Sil",
      variant: "danger",
    });
    if (ok) {
      try {
        await api.media.deleteFile(fileId);
      } catch { /* ignore */ }
      setMedia((prev) => prev.filter((f) => f.id !== fileId));
      setSelectedFiles((sel) => {
        const next = new Set(sel);
        next.delete(fileId);
        return next;
      });
      setSelectedFile((sf) => (sf?.id === fileId ? null : sf));
      setContextMenuFile(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreateFolderError(null);
    try {
      const result = await api.media.createFolder({
        name: newFolderName.trim(),
        parentId: currentFolderId ?? undefined,
        color: newFolderAccent ?? undefined,
      });
      const created = (result as { data: Record<string, unknown> }).data;
      const newFolder: FolderItem = {
        id: created['id'] as string,
        name: created['name'] as string,
        parentId: (created['parentId'] as string) ?? null,
        createdAt: new Date().toISOString().split("T")[0],
        ...(newFolderAccent ? { accentColor: newFolderAccent } : {}),
      };
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName("");
      setNewFolderAccent(undefined);
      setCreateFolderError(null);
      setShowCreateFolderModal(false);
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create folder.";
      setCreateFolderError(msg);
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
    selectedFiles.forEach(id => {
      api.media.updateFile(id, { folderId: targetFolderId }).catch(() => {});
    });
    setSelectedFiles(new Set());
    setShowMoveModal(false);
  };

  const resolveDragFileIds = (file: MediaFile): string[] => {
    if (selectedFiles.has(file.id) && selectedFiles.size > 0) {
      const inFolder = filteredMedia
        .filter((f) => selectedFiles.has(f.id))
        .map((f) => f.id);
      if (inFolder.length > 0) return inFolder;
    }
    return [file.id];
  };

  const moveFileIdsToFolder = (fileIds: string[], targetFolderId: string | null) => {
    if (!fileIds.length) return;
    // Optimistic UI update
    setMedia((prev) =>
      prev.map((f) => {
        if (!fileIds.includes(f.id)) return f;
        if (f.folderId === targetFolderId) return f;
        return { ...f, folderId: targetFolderId };
      })
    );
    setSelectedFiles((sel) => {
      const next = new Set(sel);
      fileIds.forEach((id) => next.delete(id));
      return next;
    });
    // Persist to API
    fileIds.forEach((id) => {
      api.media.updateFile(id, { folderId: targetFolderId }).catch(() => {
        // Revert on failure
        setMedia((prev) => prev.map((f) => f.id === id ? { ...f } : f));
      });
    });
  };

  const moveFolderToParent = (folderId: string, newParentId: string | null) => {
    setFolders((prev) => {
      if (wouldCreateFolderCycle(prev, folderId, newParentId)) return prev;
      return prev.map((f) => (f.id === folderId ? { ...f, parentId: newParentId } : f));
    });
    if (newParentId) {
      setExpandedFolders((prev) => new Set(prev).add(newParentId));
    }
    api.media.updateFolder(folderId, { parentId: newParentId }).catch(() => {});
    setContextMenuFolder(null);
    setContextMenuFile(null);
  };

  const addOsFilesToFolder = async (
    fileList: FileList,
    targetFolderId: string | null,
    accentColor?: CmsColorName
  ) => {
    const files = Array.from(fileList).filter((f) => f.size > 0);
    if (!files.length) return;

    for (const file of files) {
      try {
        const result = await api.media.upload(file, targetFolderId ?? undefined);
        const uploaded = (result as { data: Record<string, unknown> }).data;
        const isImage = (uploaded['mime'] as string)?.startsWith('image/');
        setMedia((prev) => [...prev, {
          id: uploaded['id'] as string,
          name: uploaded['name'] as string,
          type: isImage ? 'image' : 'document',
          mimeType: uploaded['mime'] as string,
          size: formatBytes(uploaded['size'] as number),
          uploadedAt: new Date().toISOString().split('T')[0],
          uploadedBy: 'You',
          url: uploaded['url'] as string,
          thumbnail: isImage ? uploaded['url'] as string : undefined,
          folderId: targetFolderId,
          ...(accentColor ? { accentColor } : {}),
        }]);
      } catch (err) {
        setUploadError(`Failed to upload "${file.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const handleDropOnFolderTarget = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetKey(null);
    setFileDropOverMain(false);

    const movedFolderId = parseFolderDragPayload(e.dataTransfer.getData(DND_FOLDER_MIME));
    if (movedFolderId) {
      if (targetFolderId !== null) {
        const row = e.currentTarget as HTMLElement;
        if (row.hasAttribute("data-tree-folder-row")) {
          const zone = folderDropZoneFromEvent(e, row);
          if (zone === "into") {
            moveFolderToParent(movedFolderId, targetFolderId);
          } else {
            setFolders((prev) => {
              const next = reorderFolderAmongSiblings(
                prev,
                movedFolderId,
                targetFolderId,
                zone
              );
              return next ?? prev;
            });
            setContextMenuFolder(null);
            setContextMenuFile(null);
          }
        } else {
          moveFolderToParent(movedFolderId, targetFolderId);
        }
      } else {
        moveFolderToParent(movedFolderId, null);
      }
      return;
    }

    const ids = parseMediaDragPayload(e.dataTransfer.getData(DND_MEDIA_MIME));
    if (ids) {
      moveFileIdsToFolder(ids, targetFolderId);
      return;
    }

    if (e.dataTransfer.files?.length) {
      addOsFilesToFolder(e.dataTransfer.files, targetFolderId);
    }
  };

  const handleDragOverFolderTarget = (e: React.DragEvent, key: string) => {
    const internal = dragEventHasMedia(e) || dragEventHasFolderDrag(e);
    const osFiles = dragEventHasOsFiles(e);
    if (!internal && !osFiles) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = osFiles && !internal ? "copy" : "move";
    setDropTargetKey(key);
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    const rel = e.relatedTarget as Node | null;
    if (rel && e.currentTarget.contains(rel)) return;
    setDropTargetKey(null);
  };

  const bindFolderDropHandlers = (folderId: string) => {
    const key = `folder:${folderId}`;
    return {
      onDragOver: (e: React.DragEvent) => {
        const internal = dragEventHasMedia(e) || dragEventHasFolderDrag(e);
        const osFiles = dragEventHasOsFiles(e);
        if (!internal && !osFiles) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = osFiles && !internal ? "copy" : "move";
        const el = e.currentTarget as HTMLElement;
        if (
          dragEventHasFolderDrag(e) &&
          !dragEventHasMedia(e) &&
          el.hasAttribute("data-tree-folder-row")
        ) {
          const z = folderDropZoneFromEvent(e, el);
          setDropTargetKey(`${key}:${z}`);
        } else {
          setDropTargetKey(key);
        }
      },
      onDragLeave: handleFolderDragLeave,
      onDrop: (e: React.DragEvent) => handleDropOnFolderTarget(e, folderId),
    };
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folderToDelete = folders.find((f) => f.id === folderId);
    if (!folderToDelete) return;

    const filesInFolder = media.filter((f) => f.folderId === folderId).length;
    const subFolders = folders.filter((f) => f.parentId === folderId).length;

    const detail = filesInFolder > 0 || subFolders > 0
      ? `"${folderToDelete.name}" klasörünü silmek istediğine emin misin? İçindeki ${filesInFolder} dosya ve ${subFolders} alt klasör de silinecek.`
      : `"${folderToDelete.name}" klasörünü silmek istediğine emin misin?`;

    const ok = await confirmDialog({
      title: "Klasör Sil",
      message: detail,
      confirmLabel: "Evet, Sil",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await api.media.deleteFolder(folderId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to delete folder.');
      setContextMenuFolder(null);
      return;
    }

    // Remove folder and all its contents from local state
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
      api.media.updateFolder(renamingFolderId, { name: renameValue.trim() }).catch(() => {});
    }
    setRenamingFolderId(null);
    setRenameValue("");
  };

  const getBreadcrumbs = () => {
    const breadcrumbs: FolderItem[] = [];
    let folder: FolderItem | undefined = currentFolder;
    while (folder) {
      breadcrumbs.unshift(folder);
      const parentId = folder.parentId;
      folder = parentId ? folders.find((f) => f.id === parentId) : undefined;
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
      const folderAccent = resolveFolderAccent(folder);

      return (
        <div key={folder.id}>
          <div
            data-tree-folder-row
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors border ${
              isActive
                ? `${folderAccent.bg} ${folderAccent.border} ${folderAccent.icon}`
                : "border-transparent hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 text-stone-700 dark:text-zinc-300"
            } ${treeFolderRowDropClass(folder.id, dropTargetKey)}`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
            {...bindFolderDropHandlers(folder.id)}
          >
            {hasChildren ? (
              <button
                type="button"
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolderExpansion(folder.id);
                }}
                className="shrink-0 p-0.5 hover:bg-stone-300/85 active:bg-stone-400/70 dark:hover:bg-zinc-700/55 dark:active:bg-zinc-600/45 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-5 shrink-0" aria-hidden />
            )}
            <div
              role="button"
              tabIndex={0}
              aria-label={`Move folder ${folder.name}`}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData(DND_FOLDER_MIME, JSON.stringify({ id: folder.id }));
                e.dataTransfer.effectAllowed = "move";
                const row = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-tree-folder-row]");
                if (row) {
                  try {
                    e.dataTransfer.setDragImage(row, 24, 18);
                  } catch {
                    /* ignore */
                  }
                }
              }}
              onDragEnd={() => setDropTargetKey(null)}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 touch-none cursor-grab rounded p-0.5 text-stone-600 dark:text-zinc-600 hover:bg-stone-300 dark:hover:bg-zinc-800/60 hover:text-stone-600 dark:text-zinc-400 active:cursor-grabbing outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
            >
              <GripVertical className="w-3.5 h-3.5 pointer-events-none" />
            </div>
            <button
              type="button"
              draggable={false}
              onClick={() => setCurrentFolderId(folder.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              {isActive ? (
                <FolderOpen className={`h-4 w-4 shrink-0 ${folderAccent.icon}`} />
              ) : (
                <Folder className={`h-4 w-4 shrink-0 ${folderAccent.icon}`} />
              )}
              <span
                className={`flex-1 truncate text-sm ${isActive ? "text-stone-900 dark:text-zinc-100" : "text-stone-700 dark:text-zinc-300"}`}
              >
                {folder.name}
              </span>
              <span className="shrink-0 text-xs text-stone-500 dark:text-zinc-500">{fileCount}</span>
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
        {uploadError && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="flex-1">{uploadError}</span>
            <button type="button" onClick={() => setUploadError(null)} className="text-red-400/70 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Media Library</h1>
            <p className="text-stone-600 dark:text-zinc-400">{filteredMedia.length} files in current folder</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Files</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sidebar - Folder Tree */}
          <div className="lg:col-span-3 min-w-0">
            <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-4 lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                <h3 className="font-semibold text-sm">Folders</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderAccent(undefined);
                    setCreateFolderError(null);
                    setShowCreateFolderModal(true);
                  }}
                  className="p-1.5 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 rounded transition-colors shrink-0"
                  title="Create folder"
                >
                  <FolderPlus className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                </button>
              </div>

              {/* Root */}
              <div
                onClick={() => setCurrentFolderId(null)}
                onDragOver={(e) => handleDragOverFolderTarget(e, "root")}
                onDragLeave={handleFolderDragLeave}
                onDrop={(e) => handleDropOnFolderTarget(e, null)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors mb-2 ${
                  currentFolderId === null
                    ? "bg-blue-500/10 text-blue-400"
                    : "hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 text-stone-700 dark:text-zinc-300"
                } ${
                  dropTargetKey === "root"
                    ? "ring-2 ring-blue-500/70 ring-offset-2 ring-offset-zinc-950"
                    : ""
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="text-sm flex-1">All Files</span>
                <span className="text-xs text-stone-500 dark:text-zinc-500">
                  {media.filter((f) => f.folderId === null).length}
                </span>
              </div>

              {/* Folder Tree */}
              <div className="space-y-1">{renderFolderTree(null)}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 min-w-0">
            <div
              className={`rounded-xl min-h-[min(40vh,20rem)] transition-colors ${
                dropTargetKey === "main-view" || fileDropOverMain
                  ? "ring-2 ring-dashed ring-blue-500/50 bg-blue-500/5"
                  : ""
              }`}
              onDragEnter={(e) => {
                const onlyOs =
                  dragEventHasOsFiles(e) &&
                  !dragEventHasMedia(e) &&
                  !dragEventHasFolderDrag(e);
                if (onlyOs) {
                  e.preventDefault();
                  setFileDropOverMain(true);
                }
              }}
              onDragOver={(e) => {
                const t = e.target as HTMLElement;
                if (t.closest("[data-folder-card]")) return;

                if (dragEventHasMedia(e) || dragEventHasFolderDrag(e)) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropTargetKey("main-view");
                  return;
                }
                if (dragEventHasOsFiles(e)) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  setFileDropOverMain(true);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setFileDropOverMain(false);
                  setDropTargetKey((k) => (k === "main-view" ? null : k));
                }
              }}
              onDrop={(e) => {
                const t = e.target as HTMLElement;
                if (t.closest("[data-folder-card]")) return;

                e.preventDefault();
                e.stopPropagation();
                setFileDropOverMain(false);
                setDropTargetKey(null);

                const movedFolderId = parseFolderDragPayload(
                  e.dataTransfer.getData(DND_FOLDER_MIME)
                );
                if (movedFolderId) {
                  moveFolderToParent(movedFolderId, currentFolderId);
                  return;
                }

                const ids = parseMediaDragPayload(e.dataTransfer.getData(DND_MEDIA_MIME));
                if (ids) {
                  moveFileIdsToFolder(ids, currentFolderId);
                  return;
                }

                if (e.dataTransfer.files?.length) {
                  addOsFilesToFolder(e.dataTransfer.files, currentFolderId);
                }
              }}
            >
            {/* Breadcrumb */}
            <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="hover:text-blue-400 transition-colors"
                >
                  <Home className="w-4 h-4" />
                </button>
                {getBreadcrumbs().map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-stone-500 dark:text-zinc-500" />
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
            <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                {/* Select All Checkbox */}
                <button
                  onClick={toggleSelectAll}
                  className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 rounded transition-colors"
                  title="Select all"
                >
                  {selectedFiles.size === filteredMedia.length &&
                  filteredMedia.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Square className="w-5 h-5 text-stone-600 dark:text-zinc-400" />
                  )}
                </button>

                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 dark:text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-stone-200/95 dark:bg-zinc-800/70 backdrop-blur-sm border border-stone-300/75 dark:border-zinc-700/50 rounded-md hover:bg-stone-300 active:bg-stone-400/85 dark:hover:bg-zinc-700/75 dark:active:bg-zinc-600/65 transition-colors">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <div className="flex items-center gap-1 bg-stone-200/95 dark:bg-zinc-800/70 backdrop-blur-sm rounded-md p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded transition-colors ${
                      viewMode === "grid"
                        ? "bg-stone-300 dark:bg-zinc-700/70"
                        : "hover:bg-stone-300/85 active:bg-stone-400/70 dark:hover:bg-zinc-700/55 dark:active:bg-zinc-600/45"
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded transition-colors ${
                      viewMode === "list"
                        ? "bg-stone-300 dark:bg-zinc-700/70"
                        : "hover:bg-stone-300/85 active:bg-stone-400/70 dark:hover:bg-zinc-700/55 dark:active:bg-zinc-600/45"
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
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-stone-800 active:bg-stone-950 dark:hover:bg-zinc-200 dark:active:bg-white/20 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button
                    onClick={handleCopyURLs}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-stone-800 active:bg-stone-950 dark:hover:bg-zinc-200 dark:active:bg-white/20 rounded-md transition-colors"
                  >
                    <Link className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy URLs</span>
                  </button>
                  <button
                    onClick={() => setShowMoveModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-stone-800 active:bg-stone-950 dark:hover:bg-zinc-200 dark:active:bg-white/20 rounded-md transition-colors"
                  >
                    <Folder className="w-4 h-4" />
                    <span className="hidden sm:inline">Move to</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-stone-800 active:bg-stone-950 dark:hover:bg-zinc-200 dark:active:bg-white/20 rounded-md transition-colors">
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
                    className="p-2 hover:bg-stone-800 active:bg-stone-950 dark:hover:bg-zinc-200 dark:active:bg-white/10 rounded transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {mediaLoading && (
              <div className="flex items-center justify-center py-12 text-stone-500 dark:text-zinc-500 text-sm gap-2">
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Loading media...
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
                      data-folder-card
                      draggable={!isRenaming}
                      onDragStart={(e) => {
                        if ((e.target as HTMLElement).closest("[data-folder-no-drag]")) {
                          e.preventDefault();
                          return;
                        }
                        e.stopPropagation();
                        e.dataTransfer.setData(
                          DND_FOLDER_MIME,
                          JSON.stringify({ id: folder.id })
                        );
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDropTargetKey(null)}
                      onClick={() => {
                        if (!isRenaming) setCurrentFolderId(folder.id);
                      }}
                      {...bindFolderDropHandlers(folder.id)}
                      className={`bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border rounded-lg p-4 transition-colors cursor-pointer group relative ${
                        dropTargetKey === `folder:${folder.id}`
                          ? "border-blue-500/60 ring-2 ring-blue-500/50"
                          : "border-stone-200/85 dark:border-zinc-800/50 hover:border-stone-400 dark:hover:border-zinc-700/50"
                      } ${!isRenaming ? "active:cursor-grabbing" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Folder
                          className={`w-10 h-10 ${resolveFolderAccent(folder).icon}`}
                        />
                        <button
                          type="button"
                          data-folder-no-drag
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuFile(null);
                            const br = e.currentTarget.getBoundingClientRect();
                            const padX = 8;
                            const padY = 10;
                            const menuH = FOLDER_CONTEXT_MENU_EST_H;
                            let left = br.right - FOLDER_CONTEXT_MENU_W;
                            left = Math.max(
                              padX,
                              Math.min(left, window.innerWidth - FOLDER_CONTEXT_MENU_W - padX)
                            );
                            const roomBelow = window.innerHeight - br.bottom;
                            const openBelow = roomBelow >= menuH + padY;
                            const top = openBelow
                              ? br.bottom + padY
                              : Math.max(padY, br.top - menuH - padY);
                            setContextMenuPosition({ top, left });
                            setContextMenuFolder((prev) =>
                              prev === folder.id ? null : folder.id
                            );
                          }}
                          className="relative z-10 p-1.5 rounded-md hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 text-stone-600 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 transition-colors"
                          aria-haspopup="menu"
                          aria-expanded={contextMenuFolder === folder.id}
                        >
                          <MoreVertical className="w-4 h-4" />
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
                          className="w-full px-2 py-1 bg-stone-100 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <p className="font-medium truncate mb-1">{folder.name}</p>
                      )}
                      <p className="text-xs text-stone-500 dark:text-zinc-500">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                        <span className="text-stone-600 dark:text-zinc-600"> · </span>
                        {formatFolderTotalBytes(totalBytes)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Media Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((file) => {
                  const fileAccent = resolveMediaAccent(file);
                  return (
                  <div
                    key={file.id}
                    className={`group relative overflow-hidden rounded-lg border bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl transition-colors ${
                      selectedFiles.has(file.id)
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : `${fileAccent.border} hover:opacity-95`
                    }`}
                  >
                    <div className="absolute top-3 left-3 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(file.id);
                        }}
                        className="rounded bg-white/90 dark:bg-zinc-900/80 p-1 backdrop-blur-sm transition-colors hover:bg-stone-300 dark:hover:bg-zinc-800"
                      >
                        {selectedFiles.has(file.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-400" />
                        ) : (
                          <Square className="h-5 w-5 text-stone-600 dark:text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <button
                        type="button"
                        data-media-no-drag
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuFolder(null);
                          const br = e.currentTarget.getBoundingClientRect();
                          const padX = 8;
                          const padY = 10;
                          const menuH = FILE_CONTEXT_MENU_EST_H;
                          let left = br.right - FILE_CONTEXT_MENU_W;
                          left = Math.max(
                            padX,
                            Math.min(left, window.innerWidth - FILE_CONTEXT_MENU_W - padX)
                          );
                          const roomBelow = window.innerHeight - br.bottom;
                          const openBelow = roomBelow >= menuH + padY;
                          const top = openBelow
                            ? br.bottom + padY
                            : Math.max(padY, br.top - menuH - padY);
                          setContextMenuPosition({ top, left });
                          setContextMenuFile((prev) =>
                            prev === file.id ? null : file.id
                          );
                        }}
                        className="rounded bg-white/90 dark:bg-zinc-900/80 p-1.5 backdrop-blur-sm text-stone-600 dark:text-zinc-400 transition-colors hover:bg-stone-300 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-zinc-200"
                        aria-haspopup="menu"
                        aria-expanded={contextMenuFile === file.id}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

                    <div
                      draggable
                      onDragStart={(e) => {
                        if ((e.target as HTMLElement).closest("button, [data-media-no-drag]")) {
                          e.preventDefault();
                          return;
                        }
                        const ids = resolveDragFileIds(file);
                        e.dataTransfer.setData(
                          DND_MEDIA_MIME,
                          JSON.stringify({ ids })
                        );
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDropTargetKey(null)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                    <div
                      onClick={() => setSelectedFile(file)}
                        className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden bg-stone-200 dark:bg-zinc-800"
                    >
                      {file.thumbnail ? (
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                            className="h-full w-full object-cover"
                            draggable={false}
                        />
                      ) : (
                          <FileText className="h-12 w-12 text-stone-600 dark:text-zinc-600" />
                      )}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                            type="button"
                          onClick={(e) => e.stopPropagation()}
                            className="rounded bg-white dark:bg-zinc-900 p-2 transition-colors hover:bg-stone-300 dark:hover:bg-zinc-800"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                          onClick={(e) => e.stopPropagation()}
                            className="rounded bg-white dark:bg-zinc-900 p-2 transition-colors hover:bg-stone-300 dark:hover:bg-zinc-800"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                      <div onClick={() => setSelectedFile(file)} className="cursor-pointer p-3">
                        <p className="mb-1 truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-stone-500 dark:text-zinc-500">{file.size}</p>
                    </div>
                  </div>
                  </div>
                );
                })}
              </div>
            ) : (
              <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="border-b border-stone-200/85 dark:border-zinc-800/50">
                    <tr>
                      <th className="px-3 py-3 w-10 shrink-0"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400 uppercase tracking-wider w-20">Type</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400 uppercase tracking-wider w-24">Size</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400 uppercase tracking-wider w-28 whitespace-nowrap">Uploaded By</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 dark:text-zinc-400 uppercase tracking-wider w-28 whitespace-nowrap">Date</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-stone-600 dark:text-zinc-400 uppercase tracking-wider w-28 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                    {filteredMedia.map((file) => {
                      const rowAccent = resolveMediaAccent(file);
                      return (
                      <tr
                        key={file.id}
                        draggable
                        onDragStart={(e) => {
                          if ((e.target as HTMLElement).closest("button, [data-media-no-drag]")) {
                            e.preventDefault();
                            return;
                          }
                          const ids = resolveDragFileIds(file);
                          e.dataTransfer.setData(
                            DND_MEDIA_MIME,
                            JSON.stringify({ ids })
                          );
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDropTargetKey(null)}
                        className={`cursor-grab transition-colors active:cursor-grabbing hover:bg-stone-300 dark:hover:bg-zinc-800/30 ${
                          selectedFiles.has(file.id)
                            ? "bg-blue-500/10"
                            : rowAccent.bg
                        }`}
                      >
                        <td className="px-3 py-4">
                          <button
                            onClick={() => toggleFileSelection(file.id)}
                            className="p-1 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
                          >
                            {selectedFiles.has(file.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Square className="w-5 h-5 text-stone-600 dark:text-zinc-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-stone-200 dark:bg-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                              {file.thumbnail ? (
                                <img
                                  src={file.thumbnail}
                                  alt=""
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                              )}
                            </div>
                            <span className="font-medium truncate text-sm">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-stone-600 dark:text-zinc-400 capitalize whitespace-nowrap">
                          {file.type}
                        </td>
                        <td className="px-3 py-3 text-sm text-stone-600 dark:text-zinc-400 whitespace-nowrap">{file.size}</td>
                        <td className="px-3 py-3 text-sm text-stone-600 dark:text-zinc-400 whitespace-nowrap truncate max-w-[7rem]">
                          {file.uploadedBy}
                        </td>
                        <td className="px-3 py-3 text-sm text-stone-600 dark:text-zinc-400 whitespace-nowrap">
                          {file.uploadedAt}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors">
                              <Download className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                            </button>
                            <button className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors">
                              <Trash2 className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                            </button>
                            <button
                              type="button"
                              data-media-no-drag
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenuFolder(null);
                                const br = e.currentTarget.getBoundingClientRect();
                                const padX = 8;
                                const padY = 10;
                                const menuH = FILE_CONTEXT_MENU_EST_H;
                                let left = br.right - FILE_CONTEXT_MENU_W;
                                left = Math.max(
                                  padX,
                                  Math.min(left, window.innerWidth - FILE_CONTEXT_MENU_W - padX)
                                );
                                const roomBelow = window.innerHeight - br.bottom;
                                const openBelow = roomBelow >= menuH + padY;
                                const top = openBelow
                                  ? br.bottom + padY
                                  : Math.max(padY, br.top - menuH - padY);
                                setContextMenuPosition({ top, left });
                                setContextMenuFile((prev) =>
                                  prev === file.id ? null : file.id
                                );
                              }}
                              className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
                              aria-haspopup="menu"
                              aria-expanded={contextMenuFile === file.id}
                            >
                              <MoreVertical className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* File Details Modal */}
        {selectedFile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/94 dark:bg-zinc-900/90 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-6 border-b border-stone-200/85 dark:border-zinc-800/50">
                <h2 className="text-xl font-semibold">File Details</h2>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 backdrop-blur-sm rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Preview */}
                  <div>
                    <div className="aspect-square bg-stone-200/95 dark:bg-zinc-800/70 backdrop-blur-sm rounded-lg flex items-center justify-center overflow-hidden">
                      {selectedFile.thumbnail ? (
                        <img
                          src={selectedFile.thumbnail}
                          alt={selectedFile.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FileText className="w-24 h-24 text-stone-600 dark:text-zinc-600" />
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-1">
                        File Name
                      </label>
                      <input
                        type="text"
                        value={selectedFile.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setSelectedFile(sf => sf ? { ...sf, name: newName } : sf);
                          setMedia(prev => prev.map(f => f.id === selectedFile.id ? { ...f, name: newName } : f));
                        }}
                        onBlur={(e) => {
                          const name = e.target.value.trim();
                          if (name && name !== selectedFile.name) {
                            api.media.updateFile(selectedFile.id, { name }).catch(() => {});
                          }
                        }}
                        className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-1">
                        Type
                      </label>
                      <p className="text-stone-900 dark:text-zinc-100 capitalize">
                        {selectedFile.type}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-1">
                        Format
                      </label>
                      <p className="text-stone-900 dark:text-zinc-100">
                        {formatMimeTypeLabel(selectedFile.mimeType)}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-zinc-500 mt-0.5 font-mono">
                        {selectedFile.mimeType}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-1">
                        Resolution
                      </label>
                      <p className="text-stone-900 dark:text-zinc-100 font-mono text-sm">
                        {resolutionLabel(selectedFile)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-2">
                        Accent color
                      </label>
                      <MediaLibraryAccentPicker
                        value={selectedFile.accentColor}
                        onChange={(c) => setMediaFileAccent(selectedFile.id, c)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-1">
                        Public URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={selectedFile.url}
                          title={selectedFile.url}
                          className="flex-1 min-w-0 px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md text-xs text-stone-700 dark:text-zinc-300 font-mono focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(selectedFile.url);
                            setUrlCopied(true);
                            window.setTimeout(() => setUrlCopied(false), 2000);
                          }}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 rounded-md hover:bg-stone-300 active:bg-stone-400/90 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 text-xs text-stone-800 dark:text-zinc-200 transition-colors"
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
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-1">
                        Size
                      </label>
                      <p className="text-stone-900 dark:text-zinc-100">{selectedFile.size}</p>
                    </div>

                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-1">
                        Uploaded By
                      </label>
                      <p className="text-stone-900 dark:text-zinc-100">{selectedFile.uploadedBy}</p>
                    </div>

                    <div>
                      <label className="block text-sm text-stone-600 dark:text-zinc-400 mb-1">
                        Uploaded At
                      </label>
                      <p className="text-stone-900 dark:text-zinc-100">{selectedFile.uploadedAt}</p>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                      <a
                        href={selectedFile.url}
                        download={selectedFile.name}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-200 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 rounded-md hover:bg-stone-300 active:bg-stone-400/90 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                      <button
                        onClick={() => { if (selectedFile) handleDeleteFileFromMenu(selectedFile.id); }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
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
            <div className="bg-white/94 dark:bg-zinc-900/90 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-stone-200/85 dark:border-zinc-800/50">
                <h2 className="text-xl font-semibold">Upload Files</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadAccent(undefined);
                  }}
                  className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 backdrop-blur-sm rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-stone-600 dark:text-zinc-400 mb-2">Accent for new files</p>
                  <MediaLibraryAccentPicker
                    value={uploadAccent}
                    onChange={setUploadAccent}
                  />
                </div>
                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,video/*,.pdf,application/pdf"
                  onChange={(e) => {
                    const list = e.target.files;
                    if (list?.length) {
                      addOsFilesToFolder(list, currentFolderId, uploadAccent);
                      e.target.value = "";
                      setShowUploadModal(false);
                      setUploadAccent(undefined);
                    }
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      uploadInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files?.length) {
                      addOsFilesToFolder(
                        e.dataTransfer.files,
                        currentFolderId,
                        uploadAccent
                      );
                      setShowUploadModal(false);
                      setUploadAccent(undefined);
                    }
                  }}
                  className="border-2 border-dashed border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-12 text-center hover:border-stone-400 dark:hover:border-zinc-700/50 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:focus-visible:ring-zinc-600"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-stone-600 dark:text-zinc-400 mx-auto mb-4 pointer-events-none" />
                  <h3 className="text-lg font-medium mb-2 pointer-events-none">
                    Drop files to upload
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-zinc-400 mb-4 pointer-events-none">
                    or click to browse
                  </p>
                  <span className="inline-flex px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md font-medium pointer-events-none">
                    Select Files
                  </span>
                  <p className="text-xs text-stone-500 dark:text-zinc-500 mt-4 pointer-events-none">
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
            <div className="bg-white/96 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-stone-200/85 dark:border-zinc-800/50">
                <h2 className="text-xl font-semibold">Create New Folder</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderAccent(undefined);
                    setCreateFolderError(null);
                  }}
                  className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 rounded transition-colors"
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
                    onChange={(e) => {
                      setNewFolderName(e.target.value);
                      setCreateFolderError(null);
                    }}
                    placeholder="New Folder"
                    className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                    autoFocus
                  />
                  {createFolderError ? (
                    <p className="mt-2 text-sm text-red-400" role="alert">
                      {createFolderError}
                    </p>
                  ) : null}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Folder color
                  </label>
                  <MediaLibraryAccentPicker
                    value={newFolderAccent}
                    onChange={setNewFolderAccent}
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateFolderModal(false);
                      setNewFolderAccent(undefined);
                      setCreateFolderError(null);
                    }}
                    className="px-4 py-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium"
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
            <div className="bg-white/96 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-stone-200/85 dark:border-zinc-800/50">
                <h2 className="text-xl font-semibold">Move to Folder</h2>
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-2 max-h-96 overflow-auto mb-6">
                  <button
                    onClick={() => handleMoveFiles(null)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg hover:border-stone-400 dark:hover:border-zinc-700 transition-colors text-left"
                  >
                    <Home className="w-5 h-5 text-stone-600 dark:text-zinc-400" />
                    <span>Root / All Files</span>
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleMoveFiles(folder.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg hover:border-stone-400 dark:hover:border-zinc-700 transition-colors text-left"
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
                      <Folder
                        className={`w-5 h-5 ${resolveFolderAccent(folder).icon}`}
                      />
                      <span>{folder.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowMoveModal(false)}
                    className="px-4 py-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {typeof document !== "undefined" &&
        contextMenuFolder &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[200]"
              role="presentation"
              aria-hidden
              onClick={() => setContextMenuFolder(null)}
            />
            <div
              className="fixed z-[210] w-60 rounded-lg border border-stone-300/85 dark:border-zinc-700/90 bg-stone-100 dark:bg-zinc-950 py-1 shadow-2xl ring-1 ring-black/50"
              style={{
                top: `${contextMenuPosition.top}px`,
                left: `${contextMenuPosition.left}px`,
              }}
              role="menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-stone-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium text-stone-600 dark:text-zinc-400">
                Folder
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleRenameFolder(contextMenuFolder)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-900 dark:text-zinc-100 transition-colors hover:bg-stone-300 dark:hover:bg-zinc-800/90 hover:text-white"
              >
                <Edit className="h-4 w-4 shrink-0 text-stone-600 dark:text-zinc-400" />
                Rename
              </button>
              <div className="border-t border-stone-200 dark:border-zinc-800 px-3 py-2">
                <div className="mb-1.5 text-xs font-medium text-stone-500 dark:text-zinc-500">
                  Accent color
                </div>
                <MediaLibraryAccentPicker
                  dense
                  value={folders.find((f) => f.id === contextMenuFolder)?.accentColor}
                  onChange={(c) => {
                    const id = contextMenuFolder;
                    if (!id) return;
                    setFolders((prev) =>
                      prev.map((f) => (f.id === id ? { ...f, accentColor: c } : f))
                    );
                    api.media.updateFolder(id, { color: c ?? null }).catch(() => {});
                  }}
                />
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleDeleteFolder(contextMenuFolder)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-950/50 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Delete
              </button>
            </div>
          </>,
          document.body
        )}

      {typeof document !== "undefined" &&
        contextMenuFile &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[200]"
              role="presentation"
              aria-hidden
              onClick={() => setContextMenuFile(null)}
            />
            <div
              className="fixed z-[210] w-60 rounded-lg border border-stone-300/85 dark:border-zinc-700/90 bg-stone-100 dark:bg-zinc-950 py-1 shadow-2xl ring-1 ring-black/50"
              style={{
                top: `${contextMenuPosition.top}px`,
                left: `${contextMenuPosition.left}px`,
              }}
              role="menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-stone-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium text-stone-600 dark:text-zinc-400">
                File
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  const f = media.find((x) => x.id === contextMenuFile);
                  if (f) setSelectedFile(f);
                  setContextMenuFile(null);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-900 dark:text-zinc-100 transition-colors hover:bg-stone-300 dark:hover:bg-zinc-800/90 hover:text-white"
              >
                <Settings className="h-4 w-4 shrink-0 text-stone-600 dark:text-zinc-400" />
                File settings
              </button>
              <div className="border-t border-stone-200 dark:border-zinc-800 px-3 py-2">
                <div className="mb-1.5 text-xs font-medium text-stone-500 dark:text-zinc-500">
                  Accent color
                </div>
                <MediaLibraryAccentPicker
                  dense
                  value={media.find((f) => f.id === contextMenuFile)?.accentColor}
                  onChange={(c) => setMediaFileAccent(contextMenuFile, c)}
                />
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleDeleteFileFromMenu(contextMenuFile)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-950/50 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Delete
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}