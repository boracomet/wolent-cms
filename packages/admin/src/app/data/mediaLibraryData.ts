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

export const mockFolders: FolderItem[] = [
  { id: "products", name: "Products", parentId: null, createdAt: "2026-03-01" },
  { id: "team", name: "Team Photos", parentId: null, createdAt: "2026-03-05" },
  { id: "banners", name: "Banners", parentId: null, createdAt: "2026-03-10" },
  { id: "documents", name: "Documents", parentId: null, createdAt: "2026-03-15" },
  { id: "products-2024", name: "2024 Collection", parentId: "products", createdAt: "2026-03-20" },
  { id: "products-2025", name: "2025 Collection", parentId: "products", createdAt: "2026-03-25" },
];

export const mockMedia: MediaFile[] = [
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
