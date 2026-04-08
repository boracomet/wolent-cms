import type { CmsColorName } from "../lib/cmsColors";

export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  mimeType: string;
  width?: number;
  height?: number;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
  thumbnail?: string;
  folderId: string | null;
  /** Kart / liste vurgu rengi */
  accentColor?: CmsColorName;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  accentColor?: CmsColorName;
}

