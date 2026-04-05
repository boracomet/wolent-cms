/** Card / field accent colors used across Content Types & Content Builder */
export const cmsColorSwatches = [
  { name: "blue", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-400", gradient: "from-blue-500/10" },
  { name: "green", bg: "bg-green-500/10", border: "border-green-500/20", icon: "text-green-400", gradient: "from-green-500/10" },
  { name: "purple", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-400", gradient: "from-purple-500/10" },
  { name: "orange", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "text-orange-400", gradient: "from-orange-500/10" },
  { name: "pink", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: "text-pink-400", gradient: "from-pink-500/10" },
  { name: "cyan", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: "text-cyan-400", gradient: "from-cyan-500/10" },
  { name: "yellow", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: "text-yellow-400", gradient: "from-yellow-500/10" },
  { name: "red", bg: "bg-red-500/10", border: "border-red-500/20", icon: "text-red-400", gradient: "from-red-500/10" },
  { name: "indigo", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: "text-indigo-400", gradient: "from-indigo-500/10" },
  { name: "teal", bg: "bg-teal-500/10", border: "border-teal-500/20", icon: "text-teal-400", gradient: "from-teal-500/10" },
  { name: "emerald", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", gradient: "from-emerald-500/10" },
  { name: "violet", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: "text-violet-400", gradient: "from-violet-500/10" },
] as const;

export type CmsColorName = (typeof cmsColorSwatches)[number]["name"];

/**
 * Medya kütüphanesi renk paleti — tam doygun diskler (düşük opaklık /20 yerine).
 * Koyu panelde seçeneklerin soluk görünmesini engeller.
 */
export const accentPickerSolidDots: Record<CmsColorName, string> = {
  blue: "bg-blue-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40",
  green: "bg-green-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40",
  purple: "bg-purple-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40",
  orange: "bg-orange-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40",
  pink: "bg-pink-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40",
  cyan: "bg-cyan-400 ring-1 ring-inset ring-white/30 shadow-sm shadow-black/40",
  yellow: "bg-amber-400 ring-1 ring-inset ring-white/30 shadow-sm shadow-black/40",
  red: "bg-red-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40",
  indigo: "bg-indigo-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40",
  teal: "bg-teal-400 ring-1 ring-inset ring-white/30 shadow-sm shadow-black/40",
  emerald: "bg-emerald-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40",
  violet: "bg-violet-500 ring-1 ring-inset ring-white/25 shadow-sm shadow-black/40",
};

export function getCmsColorClasses(name: string) {
  return cmsColorSwatches.find((c) => c.name === name) ?? cmsColorSwatches[0];
}

/** Deterministic hash for stable folder → accent mapping */
function hashStringToUint(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/**
 * Klasör kartı / ağaç ikonları için CMS renk paletinden tutarlı bir vurgu.
 * Aynı `folderId` her zaman aynı renge düşer (yeniden boyamada “titremez”).
 */
export function getFolderAccentFromId(folderId: string): (typeof cmsColorSwatches)[number] {
  const idx = hashStringToUint(folderId) % cmsColorSwatches.length;
  return cmsColorSwatches[idx];
}

/** Kayıtlı `accentColor` varsa onu, yoksa id üzerinden deterministik renk */
export function resolveFolderAccent(folder: {
  id: string;
  accentColor?: CmsColorName;
}): (typeof cmsColorSwatches)[number] {
  if (folder.accentColor) return getCmsColorClasses(folder.accentColor);
  return getFolderAccentFromId(folder.id);
}

export function resolveMediaAccent(media: {
  id: string;
  accentColor?: CmsColorName;
}): (typeof cmsColorSwatches)[number] {
  if (media.accentColor) return getCmsColorClasses(media.accentColor);
  return getFolderAccentFromId(media.id);
}

/** Stronger saturation for field-type picker tiles (still same hue family) */
export const fieldTileColors: Record<
  CmsColorName,
  {
    idleBorder: string;
    idleBg: string;
    iconBg: string;
    iconText: string;
    selectedBorder: string;
    selectedBg: string;
    selectedIconBg: string;
    check: string;
  }
> = {
  blue: {
    idleBorder: "border-zinc-800/60 hover:border-blue-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-blue-500/10",
    iconBg: "bg-blue-500/20",
    iconText: "text-blue-400",
    selectedBorder: "border-blue-400",
    selectedBg: "bg-blue-500/15",
    selectedIconBg: "bg-blue-500/30",
    check: "text-blue-400",
  },
  green: {
    idleBorder: "border-zinc-800/60 hover:border-green-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-green-500/10",
    iconBg: "bg-green-500/20",
    iconText: "text-green-400",
    selectedBorder: "border-green-400",
    selectedBg: "bg-green-500/15",
    selectedIconBg: "bg-green-500/30",
    check: "text-green-400",
  },
  purple: {
    idleBorder: "border-zinc-800/60 hover:border-purple-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-purple-500/10",
    iconBg: "bg-purple-500/20",
    iconText: "text-purple-400",
    selectedBorder: "border-purple-400",
    selectedBg: "bg-purple-500/15",
    selectedIconBg: "bg-purple-500/30",
    check: "text-purple-400",
  },
  orange: {
    idleBorder: "border-zinc-800/60 hover:border-orange-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-orange-500/10",
    iconBg: "bg-orange-500/20",
    iconText: "text-orange-400",
    selectedBorder: "border-orange-400",
    selectedBg: "bg-orange-500/15",
    selectedIconBg: "bg-orange-500/30",
    check: "text-orange-400",
  },
  pink: {
    idleBorder: "border-zinc-800/60 hover:border-pink-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-pink-500/10",
    iconBg: "bg-pink-500/20",
    iconText: "text-pink-400",
    selectedBorder: "border-pink-400",
    selectedBg: "bg-pink-500/15",
    selectedIconBg: "bg-pink-500/30",
    check: "text-pink-400",
  },
  cyan: {
    idleBorder: "border-zinc-800/60 hover:border-cyan-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-cyan-500/10",
    iconBg: "bg-cyan-500/20",
    iconText: "text-cyan-400",
    selectedBorder: "border-cyan-400",
    selectedBg: "bg-cyan-500/15",
    selectedIconBg: "bg-cyan-500/30",
    check: "text-cyan-400",
  },
  yellow: {
    idleBorder: "border-zinc-800/60 hover:border-yellow-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-yellow-500/10",
    iconBg: "bg-yellow-500/20",
    iconText: "text-yellow-400",
    selectedBorder: "border-yellow-400",
    selectedBg: "bg-yellow-500/15",
    selectedIconBg: "bg-yellow-500/30",
    check: "text-yellow-400",
  },
  red: {
    idleBorder: "border-zinc-800/60 hover:border-red-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-red-500/10",
    iconBg: "bg-red-500/20",
    iconText: "text-red-400",
    selectedBorder: "border-red-400",
    selectedBg: "bg-red-500/15",
    selectedIconBg: "bg-red-500/30",
    check: "text-red-400",
  },
  indigo: {
    idleBorder: "border-zinc-800/60 hover:border-indigo-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-indigo-500/10",
    iconBg: "bg-indigo-500/20",
    iconText: "text-indigo-400",
    selectedBorder: "border-indigo-400",
    selectedBg: "bg-indigo-500/15",
    selectedIconBg: "bg-indigo-500/30",
    check: "text-indigo-400",
  },
  teal: {
    idleBorder: "border-zinc-800/60 hover:border-teal-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-teal-500/10",
    iconBg: "bg-teal-500/20",
    iconText: "text-teal-400",
    selectedBorder: "border-teal-400",
    selectedBg: "bg-teal-500/15",
    selectedIconBg: "bg-teal-500/30",
    check: "text-teal-400",
  },
  emerald: {
    idleBorder: "border-zinc-800/60 hover:border-emerald-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-emerald-500/10",
    iconBg: "bg-emerald-500/20",
    iconText: "text-emerald-400",
    selectedBorder: "border-emerald-400",
    selectedBg: "bg-emerald-500/15",
    selectedIconBg: "bg-emerald-500/30",
    check: "text-emerald-400",
  },
  violet: {
    idleBorder: "border-zinc-800/60 hover:border-violet-500/50",
    idleBg: "bg-zinc-950/60 hover:bg-violet-500/10",
    iconBg: "bg-violet-500/20",
    iconText: "text-violet-400",
    selectedBorder: "border-violet-400",
    selectedBg: "bg-violet-500/15",
    selectedIconBg: "bg-violet-500/30",
    check: "text-violet-400",
  },
};
