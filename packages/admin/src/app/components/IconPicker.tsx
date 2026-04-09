import { useState, useMemo, useRef, useEffect } from "react";
import { icons, type LucideIcon } from "lucide-react";
import { Search, X } from "lucide-react";

const POPULAR_ICONS = [
  "LayoutDashboard", "Database", "FileText", "Image", "Users", "Key",
  "Settings", "Layers", "Bell", "Globe", "Lock", "Palette", "Zap", "Mail",
  "Home", "Folder", "FolderOpen", "File", "Files", "BookOpen", "Book",
  "Newspaper", "PenTool", "Edit", "Pencil", "Type", "AlignLeft",
  "MessageSquare", "MessageCircle", "Send", "Inbox", "Archive",
  "ShoppingCart", "ShoppingBag", "CreditCard", "DollarSign", "Banknote",
  "Heart", "Star", "ThumbsUp", "Award", "Trophy", "Gift",
  "Camera", "Video", "Music", "Headphones", "Mic", "Film",
  "Map", "MapPin", "Navigation", "Compass",
  "Calendar", "Clock", "Timer", "AlarmClock",
  "BarChart3", "TrendingUp", "PieChart", "Activity",
  "Shield", "ShieldCheck", "Eye", "EyeOff", "Fingerprint",
  "Link", "ExternalLink", "Share2", "Download", "Upload",
  "Puzzle", "Terminal", "Code", "Braces", "Server", "HardDrive", "Cpu",
  "Wifi", "Bluetooth", "Radio", "Rss",
  "Tag", "Tags", "Hash", "AtSign", "Bookmark",
  "Package", "Box", "Boxes", "Truck",
  "User", "UserPlus", "UserCheck", "UserCog", "UsersRound",
  "Building", "Building2", "Store", "Warehouse",
  "Phone", "Smartphone", "Monitor", "Laptop", "Tablet",
  "Sun", "Moon", "Cloud", "CloudRain", "Snowflake",
  "Flame", "Droplets", "Leaf", "TreePine", "Flower2",
  "Cat", "Dog", "Bird", "Bug", "Fish",
  "Smile", "Frown", "Meh", "PartyPopper",
  "Rocket", "Plane", "Car", "Bike", "Train",
  "Wrench", "Hammer", "Scissors", "Paintbrush",
  "ClipboardList", "ClipboardCheck", "ListChecks", "CheckSquare",
  "AlertCircle", "AlertTriangle", "Info", "HelpCircle",
  "ChevronRight", "ArrowRight", "CornerDownRight", "MoveRight",
  "Grid", "LayoutGrid", "Kanban", "Table", "Columns",
  "Sparkles", "Wand2", "Crown", "Gem", "Diamond",
];

const ALL_ICON_NAMES = Object.keys(icons);

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  size?: "sm" | "md";
}

export function IconPicker({ value, onChange, size = "md" }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return POPULAR_ICONS.filter(n => n in icons);
    return ALL_ICON_NAMES.filter(n => n.toLowerCase().includes(q)).slice(0, 80);
  }, [search]);

  const CurrentIcon = (icons as Record<string, LucideIcon>)[value];
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${btnSize} rounded-lg bg-stone-200 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 flex items-center justify-center hover:border-stone-400 dark:hover:border-zinc-600 transition-colors`}
        title={value}
      >
        {CurrentIcon ? <CurrentIcon className={`${iconSize} text-stone-700 dark:text-zinc-300`} /> : <span className="text-xs text-stone-500 dark:text-zinc-500">?</span>}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-80 max-h-80 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-stone-200 dark:border-zinc-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-stone-500 dark:text-zinc-500 shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="flex-1 bg-transparent text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-500 dark:placeholder:text-zinc-600 outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="p-2 overflow-y-auto max-h-64 grid grid-cols-8 gap-1">
            {filtered.map(name => {
              const Icon = (icons as Record<string, LucideIcon>)[name];
              if (!Icon) return null;
              const isActive = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onChange(name); setOpen(false); setSearch(""); }}
                  title={name}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-600/20 border border-blue-500/50 text-blue-400"
                      : "hover:bg-stone-300 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-8 text-center text-xs text-stone-600 dark:text-zinc-600 py-4">No icons found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function LucideIconByName({ name, className }: { name: string; className?: string }) {
  const Icon = (icons as Record<string, LucideIcon>)[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
