import { useEffect, useState } from "react";
import {
  Bot,
  Cloud,
  Cookie,
  Mail,
  Map,
  Puzzle,
  Settings2,
  Sparkles,
  BarChart3,
  ImageDown,
  KeyRound,
  Share2,
  Zap,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "../i18n";
import { notifyPluginsEnabledChanged } from "../lib/cmsPluginsEvents";
import {
  S3_COMPATIBLE_PROVIDERS,
  getS3ProviderMeta,
  isKnownS3ProviderId,
} from "../data/s3CompatibleProviders";

const GEMINI_API_KEY_STORAGE = "cms-plugin-gemini-api-key";
const GEMINI_MODEL_STORAGE = "cms-plugin-gemini-model";
const S3_PLUGIN_STORAGE_KEY = "cms-plugin-s3-config";
const SITEMAP_PLUGIN_STORAGE_KEY = "cms-plugin-sitemap-config";
const ROBOTS_TXT_STORAGE_KEY = "cms-plugin-robots-txt";
const REDIS_PLUGIN_STORAGE_KEY = "cms-plugin-redis-config";
const SMTP_PLUGIN_STORAGE_KEY = "cms-plugin-smtp-config";
const N8N_PLUGIN_STORAGE_KEY = "cms-plugin-n8n-config";
const OUTBOUND_WEBHOOK_STORAGE_KEY = "cms-plugin-outbound-webhook-config";
const NATIVE_ANALYTICS_PLUGIN_STORAGE_KEY = "cms-plugin-native-analytics-config";
const IMAGE_OPTIMIZATION_PLUGIN_STORAGE_KEY = "cms-plugin-image-optimization-config";

type N8nPluginConfig = {
  instanceUrl: string;
  webhookUrl: string;
  signingSecret: string;
  /** Which CMS events should trigger the n8n webhook */
  onContentCreated: boolean;
  onContentUpdated: boolean;
  onContentPublished: boolean;
  onContentDeleted: boolean;
  onMediaLibraryChange: boolean;
  onUserOrRoleChange: boolean;
  onContentTypeSchemaChange: boolean;
  onPluginSettingsChange: boolean;
  /** Extra fields included in the webhook JSON body */
  payloadIncludeLocales: boolean;
  payloadIncludeAuthor: boolean;
  payloadIncludeFullEntry: boolean;
};

function defaultN8nConfig(): N8nPluginConfig {
  return {
    instanceUrl: "",
    webhookUrl: "",
    signingSecret: "",
    onContentCreated: true,
    onContentUpdated: true,
    onContentPublished: true,
    onContentDeleted: false,
    onMediaLibraryChange: false,
    onUserOrRoleChange: false,
    onContentTypeSchemaChange: false,
    onPluginSettingsChange: false,
    payloadIncludeLocales: true,
    payloadIncludeAuthor: true,
    payloadIncludeFullEntry: false,
  };
}

function loadN8nConfig(): N8nPluginConfig {
  try {
    const raw = localStorage.getItem(N8N_PLUGIN_STORAGE_KEY);
    if (!raw) return defaultN8nConfig();
    const p = JSON.parse(raw) as Partial<N8nPluginConfig>;
    return { ...defaultN8nConfig(), ...p };
  } catch {
    return defaultN8nConfig();
  }
}

type OutboundWebhookPluginConfig = {
  /** Optional label e.g. Slack, Discord, Zapier */
  channelLabel: string;
  webhookUrl: string;
  signingSecret: string;
  onContentCreated: boolean;
  onContentUpdated: boolean;
  onContentPublished: boolean;
  onContentDeleted: boolean;
  onMediaLibraryChange: boolean;
  onUserOrRoleChange: boolean;
  onContentTypeSchemaChange: boolean;
  onPluginSettingsChange: boolean;
  payloadIncludeLocales: boolean;
  payloadIncludeAuthor: boolean;
  payloadIncludeFullEntry: boolean;
};

function defaultOutboundWebhookConfig(): OutboundWebhookPluginConfig {
  return {
    channelLabel: "",
    webhookUrl: "",
    signingSecret: "",
    onContentCreated: true,
    onContentUpdated: true,
    onContentPublished: true,
    onContentDeleted: false,
    onMediaLibraryChange: false,
    onUserOrRoleChange: false,
    onContentTypeSchemaChange: false,
    onPluginSettingsChange: false,
    payloadIncludeLocales: true,
    payloadIncludeAuthor: true,
    payloadIncludeFullEntry: false,
  };
}

function loadOutboundWebhookConfig(): OutboundWebhookPluginConfig {
  try {
    const raw = localStorage.getItem(OUTBOUND_WEBHOOK_STORAGE_KEY);
    if (!raw) return defaultOutboundWebhookConfig();
    const p = JSON.parse(raw) as Partial<OutboundWebhookPluginConfig>;
    return { ...defaultOutboundWebhookConfig(), ...p };
  } catch {
    return defaultOutboundWebhookConfig();
  }
}

type NativeAnalyticsPluginConfig = {
  ingestUrl: string;
  siteKey: string;
};

function defaultNativeAnalyticsConfig(): NativeAnalyticsPluginConfig {
  return {
    ingestUrl: "",
    siteKey: "",
  };
}

function loadNativeAnalyticsConfig(): NativeAnalyticsPluginConfig {
  try {
    const raw = localStorage.getItem(NATIVE_ANALYTICS_PLUGIN_STORAGE_KEY);
    if (!raw) return defaultNativeAnalyticsConfig();
    const p = JSON.parse(raw) as Partial<NativeAnalyticsPluginConfig>;
    return { ...defaultNativeAnalyticsConfig(), ...p };
  } catch {
    return defaultNativeAnalyticsConfig();
  }
}

type ImageOptimizationPluginConfig = {
  /** Medya kütüphanesi ve API çıktısında raster görseller WebP */
  deliverAsWebp: boolean;
  /** WebP kalite 1–100 (öneri 80–85) */
  webpQuality: string;
  /** Boş = sınır yok; genişlik px üst sınırı */
  maxWidthPx: string;
  /** Boş = sınır yok */
  maxHeightPx: string;
  /** EXIF/IPTC temizle */
  stripMetadata: boolean;
  /** EXIF yönüne göre döndür */
  autoOrient: boolean;
  /** Responsive srcset genişlikleri üret */
  generateSrcset: boolean;
  /** Virgülle ayrık genişlikler (px) */
  srcsetWidths: string;
  /**
   * WebP effort (Sharp/libvips benzeri: 0=hızlı … 6=küçük dosya).
   * Öneri: 4
   */
  webpEffort: string;
  /** Orijinalleri arşivde sakla (işlenmiş WebP ayrı) */
  retainOriginals: boolean;
};

function defaultImageOptimizationConfig(): ImageOptimizationPluginConfig {
  return {
    deliverAsWebp: true,
    webpQuality: "82",
    maxWidthPx: "2560",
    maxHeightPx: "",
    stripMetadata: true,
    autoOrient: true,
    generateSrcset: true,
    srcsetWidths: "480,768,1200,1920",
    webpEffort: "4",
    retainOriginals: true,
  };
}

function loadImageOptimizationConfig(): ImageOptimizationPluginConfig {
  try {
    const raw = localStorage.getItem(IMAGE_OPTIMIZATION_PLUGIN_STORAGE_KEY);
    if (!raw) return defaultImageOptimizationConfig();
    const p = JSON.parse(raw) as Partial<ImageOptimizationPluginConfig>;
    return { ...defaultImageOptimizationConfig(), ...p };
  } catch {
    return defaultImageOptimizationConfig();
  }
}

type SmtpPluginConfig = {
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  useTls: boolean;
  /** Virgülle ayrılmış alıcılar */
  recipientEmails: string;
  notifyNewArticle: boolean;
  notifyNewProduct: boolean;
  notifyNewGallery: boolean;
  notifyOtherCollections: boolean;
  notifyOnDraftSaved: boolean;
  notifyOnPublished: boolean;
};

function defaultSmtpConfig(): SmtpPluginConfig {
  return {
    host: "",
    port: "587",
    username: "",
    password: "",
    fromEmail: "",
    fromName: "",
    useTls: true,
    recipientEmails: "",
    notifyNewArticle: true,
    notifyNewProduct: false,
    notifyNewGallery: false,
    notifyOtherCollections: false,
    notifyOnDraftSaved: false,
    notifyOnPublished: true,
  };
}

function loadSmtpConfig(): SmtpPluginConfig {
  try {
    const raw = localStorage.getItem(SMTP_PLUGIN_STORAGE_KEY);
    if (!raw) return defaultSmtpConfig();
    const p = JSON.parse(raw) as Partial<SmtpPluginConfig>;
    return { ...defaultSmtpConfig(), ...p };
  } catch {
    return defaultSmtpConfig();
  }
}

type RedisPluginConfig = {
  host: string;
  port: string;
  password: string;
  dbIndex: string;
  useTls: boolean;
  keyPrefix: string;
  defaultTtlSec: string;
};

function defaultRedisConfig(): RedisPluginConfig {
  return {
    host: "",
    port: "6379",
    password: "",
    dbIndex: "0",
    useTls: false,
    keyPrefix: "cms:",
    defaultTtlSec: "3600",
  };
}

function loadRedisConfig(): RedisPluginConfig {
  try {
    const raw = localStorage.getItem(REDIS_PLUGIN_STORAGE_KEY);
    if (!raw) return defaultRedisConfig();
    const p = JSON.parse(raw) as Partial<RedisPluginConfig>;
    return { ...defaultRedisConfig(), ...p };
  } catch {
    return defaultRedisConfig();
  }
}

const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /

# Sitemap: https://www.example.com/sitemap.xml
`;

function loadRobotsTxt(): string {
  try {
    const raw = localStorage.getItem(ROBOTS_TXT_STORAGE_KEY);
    if (raw !== null) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_ROBOTS_TXT;
}

type SitemapChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

type SitemapPluginConfig = {
  baseUrl: string;
  sitemapPath: string;
  includeDrafts: boolean;
  defaultChangeFreq: SitemapChangeFreq;
  defaultPriority: string;
  pingSearchEngines: boolean;
};

function defaultSitemapConfig(): SitemapPluginConfig {
  return {
    baseUrl: "",
    sitemapPath: "/sitemap.xml",
    includeDrafts: false,
    defaultChangeFreq: "weekly",
    defaultPriority: "0.5",
    pingSearchEngines: false,
  };
}

function loadSitemapConfig(): SitemapPluginConfig {
  try {
    const raw = localStorage.getItem(SITEMAP_PLUGIN_STORAGE_KEY);
    if (!raw) return defaultSitemapConfig();
    const p = JSON.parse(raw) as Partial<SitemapPluginConfig>;
    return { ...defaultSitemapConfig(), ...p };
  } catch {
    return defaultSitemapConfig();
  }
}

type S3PluginConfig = {
  providerId: string;
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  pathStyle: boolean;
};

function defaultS3Config(): S3PluginConfig {
  return {
    providerId: "aws-s3",
    endpoint: "",
    region: "",
    bucket: "",
    accessKey: "",
    secretKey: "",
    pathStyle: false,
  };
}

function loadS3Config(): S3PluginConfig {
  try {
    const raw = localStorage.getItem(S3_PLUGIN_STORAGE_KEY);
    if (!raw) return defaultS3Config();
    const p = JSON.parse(raw) as Partial<S3PluginConfig>;
    const merged = { ...defaultS3Config(), ...p };
    if (!isKnownS3ProviderId(merged.providerId)) {
      merged.providerId = defaultS3Config().providerId;
    }
    return merged;
  } catch {
    return defaultS3Config();
  }
}

interface PluginItem {
  id: string;
  i18nPrefix: string;
  version: string;
  icon: LucideIcon;
  kind?:
    | "standard"
    | "gemini"
    | "s3"
    | "sitemap"
    | "robots"
    | "redis"
    | "smtp"
    | "n8n"
    | "outboundWebhook"
    | "nativeAnalytics"
    | "imageOptimization";
}

const plugins: PluginItem[] = [
  {
    id: "cookie-management",
    i18nPrefix: "plugins.cookie",
    version: "1.0.0",
    icon: Cookie,
    kind: "standard",
  },
  {
    id: "gemini-auto-translate",
    i18nPrefix: "plugins.gemini",
    version: "0.1.0",
    icon: Sparkles,
    kind: "gemini",
  },
  {
    id: "s3-object-storage",
    i18nPrefix: "plugins.s3",
    version: "0.1.0",
    icon: Cloud,
    kind: "s3",
  },
  {
    id: "sitemap-xml",
    i18nPrefix: "plugins.sitemap",
    version: "0.1.0",
    icon: Map,
    kind: "sitemap",
  },
  {
    id: "robots-txt",
    i18nPrefix: "plugins.robots",
    version: "0.1.0",
    icon: Bot,
    kind: "robots",
  },
  {
    id: "redis-cache",
    i18nPrefix: "plugins.redis",
    version: "0.1.0",
    icon: Zap,
    kind: "redis",
  },
  {
    id: "smtp-mail",
    i18nPrefix: "plugins.smtp",
    version: "0.1.0",
    icon: Mail,
    kind: "smtp",
  },
  {
    id: "n8n-automation",
    i18nPrefix: "plugins.n8n",
    version: "0.1.0",
    icon: Webhook,
    kind: "n8n",
  },
  {
    id: "outbound-webhook",
    i18nPrefix: "plugins.outboundWebhook",
    version: "0.1.0",
    icon: Share2,
    kind: "outboundWebhook",
  },
  {
    id: "native-analytics",
    i18nPrefix: "plugins.nativeAnalytics",
    version: "0.1.0",
    icon: BarChart3,
    kind: "nativeAnalytics",
  },
  {
    id: "image-optimization",
    i18nPrefix: "plugins.imageOptimization",
    version: "0.1.0",
    icon: ImageDown,
    kind: "imageOptimization",
  },
];

const NATIVE_ANALYTICS_SDK_SNIPPET = `import { createWolentAnalytics } from "./analytics/wolentAnalyticsClient";

const analytics = createWolentAnalytics({
  endpoint: "YOUR_INGEST_URL",
  siteKey: "YOUR_PUBLIC_SITE_KEY",
  heartbeatMs: 30000,
});

analytics.trackPageView({
  path: window.location.pathname + window.location.search,
  title: document.title,
});`;

function readStorage(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function Plugins() {
  const { t } = useI18n();
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>({
    "cookie-management": true,
    "gemini-auto-translate": false,
    "s3-object-storage": false,
    "sitemap-xml": false,
    "robots-txt": false,
    "redis-cache": false,
    "smtp-mail": false,
    "n8n-automation": false,
    "outbound-webhook": false,
    "native-analytics": false,
    "image-optimization": false,
  });

  const [geminiApiKey, setGeminiApiKey] = useState(() => readStorage(GEMINI_API_KEY_STORAGE));
  const [geminiModel, setGeminiModel] = useState(
    () => readStorage(GEMINI_MODEL_STORAGE) || "gemini-2.0-flash"
  );
  const [geminiSettingsOpen, setGeminiSettingsOpen] = useState(false);
  const [geminiSaveHint, setGeminiSaveHint] = useState(false);

  const [s3Config, setS3Config] = useState<S3PluginConfig>(() => loadS3Config());
  const [s3SettingsOpen, setS3SettingsOpen] = useState(false);
  const [s3SaveHint, setS3SaveHint] = useState(false);

  const [sitemapConfig, setSitemapConfig] = useState<SitemapPluginConfig>(() => loadSitemapConfig());
  const [sitemapSettingsOpen, setSitemapSettingsOpen] = useState(false);
  const [sitemapSaveHint, setSitemapSaveHint] = useState(false);

  const [robotsTxt, setRobotsTxt] = useState(() => loadRobotsTxt());
  const [robotsSettingsOpen, setRobotsSettingsOpen] = useState(false);
  const [robotsSaveHint, setRobotsSaveHint] = useState(false);

  const [redisConfig, setRedisConfig] = useState<RedisPluginConfig>(() => loadRedisConfig());
  const [redisSettingsOpen, setRedisSettingsOpen] = useState(false);
  const [redisSaveHint, setRedisSaveHint] = useState(false);

  const [smtpConfig, setSmtpConfig] = useState<SmtpPluginConfig>(() => loadSmtpConfig());
  const [smtpSettingsOpen, setSmtpSettingsOpen] = useState(false);
  const [smtpSaveHint, setSmtpSaveHint] = useState(false);

  const [n8nConfig, setN8nConfig] = useState<N8nPluginConfig>(() => loadN8nConfig());
  const [n8nSettingsOpen, setN8nSettingsOpen] = useState(false);
  const [n8nSaveHint, setN8nSaveHint] = useState(false);

  const [outboundWebhookConfig, setOutboundWebhookConfig] = useState<OutboundWebhookPluginConfig>(
    () => loadOutboundWebhookConfig()
  );
  const [outboundWebhookSettingsOpen, setOutboundWebhookSettingsOpen] = useState(false);
  const [outboundWebhookSaveHint, setOutboundWebhookSaveHint] = useState(false);

  const [nativeAnalyticsConfig, setNativeAnalyticsConfig] = useState<NativeAnalyticsPluginConfig>(
    () => loadNativeAnalyticsConfig()
  );
  const [nativeAnalyticsSettingsOpen, setNativeAnalyticsSettingsOpen] = useState(false);
  const [nativeAnalyticsSaveHint, setNativeAnalyticsSaveHint] = useState(false);

  const [imageOptimizationConfig, setImageOptimizationConfig] = useState<ImageOptimizationPluginConfig>(
    () => loadImageOptimizationConfig()
  );
  const [imageOptimizationSettingsOpen, setImageOptimizationSettingsOpen] = useState(false);
  const [imageOptimizationSaveHint, setImageOptimizationSaveHint] = useState(false);

  const s3ProviderMeta = getS3ProviderMeta(s3Config.providerId);
  const hasS3Credentials =
    s3Config.bucket.trim().length > 0 &&
    s3Config.accessKey.trim().length > 0 &&
    s3Config.secretKey.trim().length > 0;

  const hasSitemapBaseUrl = /^https?:\/\/.+/i.test(sitemapConfig.baseUrl.trim());

  const hasRobotsContent = robotsTxt.trim().length > 0;

  const redisPortOk = (() => {
    const p = redisConfig.port.trim();
    if (p === "") return true;
    const n = parseInt(p, 10);
    return /^\d+$/.test(p) && n >= 1 && n <= 65535;
  })();
  const hasRedisConnection =
    redisConfig.host.trim().length > 0 && redisPortOk && /^\d+$/.test(redisConfig.dbIndex.trim());

  const smtpPortOk = (() => {
    const p = smtpConfig.port.trim();
    if (p === "") return false;
    const n = parseInt(p, 10);
    return /^\d+$/.test(p) && n >= 1 && n <= 65535;
  })();
  const simpleEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  const hasSmtpServerOk =
    smtpConfig.host.trim().length > 0 && smtpPortOk && simpleEmail(smtpConfig.fromEmail);
  const smtpRecipientsList = smtpConfig.recipientEmails
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean);
  const hasSmtpRecipients = smtpRecipientsList.some((e) => simpleEmail(e));
  const smtpAnyContentNotify =
    smtpConfig.notifyNewArticle ||
    smtpConfig.notifyNewProduct ||
    smtpConfig.notifyNewGallery ||
    smtpConfig.notifyOtherCollections;
  const smtpAnyLifecycleNotify = smtpConfig.notifyOnDraftSaved || smtpConfig.notifyOnPublished;
  const smtpWantsNotify = smtpAnyContentNotify && smtpAnyLifecycleNotify;
  const smtpNotifyMisconfigured = smtpWantsNotify && !hasSmtpRecipients;

  const hasN8nWebhookUrl = /^https:\/\/.+/i.test(n8nConfig.webhookUrl.trim());
  const n8nWebhookInvalid =
    n8nConfig.webhookUrl.trim().length > 0 && !hasN8nWebhookUrl;
  const n8nAnyTrigger =
    n8nConfig.onContentCreated ||
    n8nConfig.onContentUpdated ||
    n8nConfig.onContentPublished ||
    n8nConfig.onContentDeleted ||
    n8nConfig.onMediaLibraryChange ||
    n8nConfig.onUserOrRoleChange ||
    n8nConfig.onContentTypeSchemaChange ||
    n8nConfig.onPluginSettingsChange;
  const n8nTriggersMissing = hasN8nWebhookUrl && !n8nAnyTrigger;

  const hasOutboundWebhookUrl = /^https:\/\/.+/i.test(outboundWebhookConfig.webhookUrl.trim());
  const outboundWebhookInvalid =
    outboundWebhookConfig.webhookUrl.trim().length > 0 && !hasOutboundWebhookUrl;
  const outboundWebhookAnyTrigger =
    outboundWebhookConfig.onContentCreated ||
    outboundWebhookConfig.onContentUpdated ||
    outboundWebhookConfig.onContentPublished ||
    outboundWebhookConfig.onContentDeleted ||
    outboundWebhookConfig.onMediaLibraryChange ||
    outboundWebhookConfig.onUserOrRoleChange ||
    outboundWebhookConfig.onContentTypeSchemaChange ||
    outboundWebhookConfig.onPluginSettingsChange;
  const outboundWebhookTriggersMissing = hasOutboundWebhookUrl && !outboundWebhookAnyTrigger;

  const nativeAnalyticsIngestOk =
    nativeAnalyticsConfig.ingestUrl.trim() === "" ||
    /^https:\/\/.+/i.test(nativeAnalyticsConfig.ingestUrl.trim());
  const nativeAnalyticsIngestInvalid =
    nativeAnalyticsConfig.ingestUrl.trim().length > 0 && !nativeAnalyticsIngestOk;

  const imageOptQualityNum = parseInt(imageOptimizationConfig.webpQuality.trim(), 10);
  const imageOptQualityOk =
    imageOptimizationConfig.webpQuality.trim() !== "" &&
    /^\d+$/.test(imageOptimizationConfig.webpQuality.trim()) &&
    imageOptQualityNum >= 1 &&
    imageOptQualityNum <= 100;
  const imageOptQualityInvalid =
    imageOptimizationConfig.webpQuality.trim() !== "" && !imageOptQualityOk;

  const imageOptEffortNum = parseInt(imageOptimizationConfig.webpEffort.trim(), 10);
  const imageOptEffortOk =
    imageOptimizationConfig.webpEffort.trim() !== "" &&
    /^\d+$/.test(imageOptimizationConfig.webpEffort.trim()) &&
    imageOptEffortNum >= 0 &&
    imageOptEffortNum <= 6;
  const imageOptEffortInvalid =
    imageOptimizationConfig.webpEffort.trim() !== "" && !imageOptEffortOk;

  const imageOptDimOk = (s: string) => {
    const x = s.trim();
    if (x === "") return true;
    const n = parseInt(x, 10);
    return /^\d+$/.test(x) && n >= 1 && n <= 16384;
  };
  const imageOptMaxWInvalid =
    imageOptimizationConfig.maxWidthPx.trim() !== "" &&
    !imageOptDimOk(imageOptimizationConfig.maxWidthPx);
  const imageOptMaxHInvalid =
    imageOptimizationConfig.maxHeightPx.trim() !== "" &&
    !imageOptDimOk(imageOptimizationConfig.maxHeightPx);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cms-plugins-enabled");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setEnabledById((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cms-plugins-enabled", JSON.stringify(enabledById));
      notifyPluginsEnabledChanged();
    } catch {
      /* ignore */
    }
  }, [enabledById]);

  const persistGeminiCredentials = () => {
    try {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, geminiApiKey);
      localStorage.setItem(GEMINI_MODEL_STORAGE, geminiModel);
      setGeminiSaveHint(true);
      window.setTimeout(() => setGeminiSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const persistS3Config = () => {
    try {
      localStorage.setItem(S3_PLUGIN_STORAGE_KEY, JSON.stringify(s3Config));
      setS3SaveHint(true);
      window.setTimeout(() => setS3SaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const persistSitemapConfig = () => {
    try {
      localStorage.setItem(SITEMAP_PLUGIN_STORAGE_KEY, JSON.stringify(sitemapConfig));
      setSitemapSaveHint(true);
      window.setTimeout(() => setSitemapSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const persistRobotsTxt = () => {
    try {
      localStorage.setItem(ROBOTS_TXT_STORAGE_KEY, robotsTxt);
      setRobotsSaveHint(true);
      window.setTimeout(() => setRobotsSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const persistRedisConfig = () => {
    try {
      localStorage.setItem(REDIS_PLUGIN_STORAGE_KEY, JSON.stringify(redisConfig));
      setRedisSaveHint(true);
      window.setTimeout(() => setRedisSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const persistSmtpConfig = () => {
    try {
      localStorage.setItem(SMTP_PLUGIN_STORAGE_KEY, JSON.stringify(smtpConfig));
      setSmtpSaveHint(true);
      window.setTimeout(() => setSmtpSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const persistN8nConfig = () => {
    try {
      localStorage.setItem(N8N_PLUGIN_STORAGE_KEY, JSON.stringify(n8nConfig));
      setN8nSaveHint(true);
      window.setTimeout(() => setN8nSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const persistOutboundWebhookConfig = () => {
    try {
      localStorage.setItem(OUTBOUND_WEBHOOK_STORAGE_KEY, JSON.stringify(outboundWebhookConfig));
      setOutboundWebhookSaveHint(true);
      window.setTimeout(() => setOutboundWebhookSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const persistNativeAnalyticsConfig = () => {
    try {
      localStorage.setItem(
        NATIVE_ANALYTICS_PLUGIN_STORAGE_KEY,
        JSON.stringify(nativeAnalyticsConfig)
      );
      setNativeAnalyticsSaveHint(true);
      window.setTimeout(() => setNativeAnalyticsSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const persistImageOptimizationConfig = () => {
    try {
      localStorage.setItem(
        IMAGE_OPTIMIZATION_PLUGIN_STORAGE_KEY,
        JSON.stringify(imageOptimizationConfig)
      );
      setImageOptimizationSaveHint(true);
      window.setTimeout(() => setImageOptimizationSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const hasGeminiKey = geminiApiKey.trim().length > 0;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-zinc-800/80 border border-zinc-700/50 rounded-lg flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-zinc-300" />
            </div>
            <h1 className="text-3xl font-semibold">{t("plugins.title")}</h1>
          </div>
          <p className="text-zinc-400">{t("plugins.subtitle")}</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-xl font-semibold">{t("plugins.installedHeading")}</h2>
            <p className="text-sm text-zinc-400 mt-1">{t("plugins.installedDescription")}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {plugins.map((plugin) => {
                const Icon = plugin.icon;
                const enabled = enabledById[plugin.id] ?? false;
                const isGemini = plugin.kind === "gemini";
                const isS3 = plugin.kind === "s3";
                const isSitemap = plugin.kind === "sitemap";
                const isRobots = plugin.kind === "robots";
                const isRedis = plugin.kind === "redis";
                const isSmtp = plugin.kind === "smtp";
                const isN8n = plugin.kind === "n8n";
                const isOutboundWebhook = plugin.kind === "outboundWebhook";
                const isNativeAnalytics = plugin.kind === "nativeAnalytics";
                const isImageOptimization = plugin.kind === "imageOptimization";

                const iconShell =
                  isGemini
                    ? "bg-cyan-500/15 border border-cyan-500/25"
                    : isS3
                      ? "bg-orange-500/15 border border-orange-500/25"
                      : isSitemap
                        ? "bg-emerald-500/15 border border-emerald-500/25"
                        : isRobots
                          ? "bg-violet-500/15 border border-violet-500/25"
                          : isRedis
                            ? "bg-rose-500/15 border border-rose-500/25"
                            : isSmtp
                              ? "bg-sky-500/15 border border-sky-500/25"
                              : isN8n
                                ? "bg-indigo-500/15 border border-indigo-500/25"
                                : isOutboundWebhook
                                  ? "bg-teal-500/15 border border-teal-500/25"
                                  : isNativeAnalytics
                                    ? "bg-blue-500/15 border border-blue-500/25"
                                    : isImageOptimization
                                      ? "bg-amber-500/15 border border-amber-500/25"
                                      : "bg-zinc-800";
                const iconColor =
                  isGemini
                    ? "text-cyan-400"
                    : isS3
                      ? "text-orange-400"
                      : isSitemap
                        ? "text-emerald-400"
                        : isRobots
                          ? "text-violet-400"
                          : isRedis
                            ? "text-rose-400"
                            : isSmtp
                              ? "text-sky-400"
                              : isN8n
                                ? "text-indigo-400"
                                : isOutboundWebhook
                                  ? "text-teal-400"
                                  : isNativeAnalytics
                                    ? "text-blue-400"
                                    : isImageOptimization
                                      ? "text-amber-400"
                                      : "text-zinc-400";

                return (
                  <div
                    key={plugin.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${iconShell}`}
                        >
                          <Icon className={`w-6 h-6 ${iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 gap-y-1">
                            <h3 className="font-semibold text-zinc-100">
                              {t(`${plugin.i18nPrefix}.name`)}
                            </h3>
                            <span className="text-xs text-zinc-500 font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">
                              v{plugin.version}
                            </span>
                            {enabled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                {t("plugins.active")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-500 border border-zinc-700/50">
                                {t("plugins.inactive")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                            {t(`${plugin.i18nPrefix}.description`)}
                          </p>

                          {isGemini && enabled && !hasGeminiKey && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.gemini.keyMissing")}
                            </p>
                          )}
                          {isS3 && enabled && !hasS3Credentials && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.s3.credentialsMissing")}
                            </p>
                          )}
                          {isSitemap && enabled && !hasSitemapBaseUrl && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.sitemap.baseUrlMissing")}
                            </p>
                          )}
                          {isRobots && enabled && !hasRobotsContent && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.robots.contentMissing")}
                            </p>
                          )}
                          {isRedis && enabled && !hasRedisConnection && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.redis.connectionMissing")}
                            </p>
                          )}
                          {isSmtp && enabled && !hasSmtpServerOk && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.smtp.serverMissing")}
                            </p>
                          )}
                          {isSmtp && enabled && hasSmtpServerOk && smtpNotifyMisconfigured && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.smtp.recipientsMissing")}
                            </p>
                          )}
                          {isN8n && enabled && !hasN8nWebhookUrl && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.n8n.webhookMissing")}
                            </p>
                          )}
                          {isN8n && enabled && hasN8nWebhookUrl && n8nTriggersMissing && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.n8n.triggersMissing")}
                            </p>
                          )}
                          {isOutboundWebhook && enabled && !hasOutboundWebhookUrl && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.outboundWebhook.webhookMissing")}
                            </p>
                          )}
                          {isOutboundWebhook &&
                            enabled &&
                            hasOutboundWebhookUrl &&
                            outboundWebhookTriggersMissing && (
                              <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                                {t("plugins.outboundWebhook.triggersMissing")}
                              </p>
                            )}
                          {isNativeAnalytics && enabled && nativeAnalyticsIngestInvalid && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.nativeAnalytics.ingestUrlInvalid")}
                            </p>
                          )}
                          {isNativeAnalytics &&
                            enabled &&
                            !nativeAnalyticsIngestInvalid &&
                            !nativeAnalyticsConfig.siteKey.trim() && (
                              <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                                {t("plugins.nativeAnalytics.siteKeyMissing")}
                              </p>
                            )}
                          {isImageOptimization && enabled && !imageOptimizationConfig.deliverAsWebp && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.imageOptimization.webpDisabledHint")}
                            </p>
                          )}
                          {isImageOptimization && enabled && imageOptQualityInvalid && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.imageOptimization.qualityInvalid")}
                            </p>
                          )}
                          {isImageOptimization && enabled && imageOptEffortInvalid && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.imageOptimization.effortInvalid")}
                            </p>
                          )}
                          {isImageOptimization && enabled && (imageOptMaxWInvalid || imageOptMaxHInvalid) && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.imageOptimization.dimensionInvalid")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2 shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => {
                              if (isGemini && !enabled) {
                                setGeminiSettingsOpen(true);
                              }
                              if (isGemini && enabled) {
                                setGeminiSettingsOpen(false);
                              }
                              if (isS3 && !enabled) {
                                setS3SettingsOpen(true);
                              }
                              if (isS3 && enabled) {
                                setS3SettingsOpen(false);
                              }
                              if (isSitemap && !enabled) {
                                setSitemapSettingsOpen(true);
                              }
                              if (isSitemap && enabled) {
                                setSitemapSettingsOpen(false);
                              }
                              if (isRobots && !enabled) {
                                setRobotsSettingsOpen(true);
                              }
                              if (isRobots && enabled) {
                                setRobotsSettingsOpen(false);
                              }
                              if (isRedis && !enabled) {
                                setRedisSettingsOpen(true);
                              }
                              if (isRedis && enabled) {
                                setRedisSettingsOpen(false);
                              }
                              if (isSmtp && !enabled) {
                                setSmtpSettingsOpen(true);
                              }
                              if (isSmtp && enabled) {
                                setSmtpSettingsOpen(false);
                              }
                              if (isN8n && !enabled) {
                                setN8nSettingsOpen(true);
                              }
                              if (isN8n && enabled) {
                                setN8nSettingsOpen(false);
                              }
                              if (isOutboundWebhook && !enabled) {
                                setOutboundWebhookSettingsOpen(true);
                              }
                              if (isOutboundWebhook && enabled) {
                                setOutboundWebhookSettingsOpen(false);
                              }
                              if (isNativeAnalytics && !enabled) {
                                setNativeAnalyticsSettingsOpen(true);
                              }
                              if (isNativeAnalytics && enabled) {
                                setNativeAnalyticsSettingsOpen(false);
                              }
                              if (isImageOptimization && !enabled) {
                                setImageOptimizationSettingsOpen(true);
                              }
                              if (isImageOptimization && enabled) {
                                setImageOptimizationSettingsOpen(false);
                              }
                              setEnabledById((prev) => ({
                                ...prev,
                                [plugin.id]: !enabled,
                              }));
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                        <button
                          type="button"
                          disabled={!enabled}
                          onClick={() => {
                            if (isGemini) setGeminiSettingsOpen((o) => !o);
                            else if (isS3) setS3SettingsOpen((o) => !o);
                            else if (isSitemap) setSitemapSettingsOpen((o) => !o);
                            else if (isRobots) setRobotsSettingsOpen((o) => !o);
                            else if (isRedis) setRedisSettingsOpen((o) => !o);
                            else if (isSmtp) setSmtpSettingsOpen((o) => !o);
                            else if (isN8n) setN8nSettingsOpen((o) => !o);
                            else if (isOutboundWebhook) setOutboundWebhookSettingsOpen((o) => !o);
                            else if (isNativeAnalytics) setNativeAnalyticsSettingsOpen((o) => !o);
                            else if (isImageOptimization) setImageOptimizationSettingsOpen((o) => !o);
                            else alert("Cookie plugin settings (demo)");
                          }}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                            enabled
                              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/50"
                              : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                          }`}
                        >
                          <Settings2 className="w-4 h-4" />
                          {t("plugins.configure")}
                        </button>
                      </div>
                    </div>

                    {isGemini && enabled && geminiSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-4">
                        <div>
                          <label
                            htmlFor="gemini-api-key"
                            className="block text-sm font-medium text-zinc-200 mb-2"
                          >
                            {t("plugins.gemini.apiKeyLabel")}
                          </label>
                          <input
                            id="gemini-api-key"
                            type="password"
                            autoComplete="off"
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            placeholder={t("plugins.gemini.apiKeyPlaceholder")}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-mono"
                          />
                          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                            {t("plugins.gemini.apiKeyHint")}
                          </p>
                        </div>
                        <div className="max-w-md">
                          <label
                            htmlFor="gemini-model"
                            className="block text-sm font-medium text-zinc-200 mb-2"
                          >
                            {t("plugins.gemini.modelLabel")}
                          </label>
                          <select
                            id="gemini-model"
                            value={geminiModel}
                            onChange={(e) => setGeminiModel(e.target.value)}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                          >
                            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                            <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                            <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistGeminiCredentials()}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.gemini.saveKey")}
                          </button>
                          {geminiSaveHint && (
                            <span className="text-xs text-green-400">{t("plugins.gemini.keySaved")}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isS3 && enabled && s3SettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-4">
                        <div className="max-w-xl">
                          <label
                            htmlFor="s3-provider"
                            className="block text-sm font-medium text-zinc-200 mb-2"
                          >
                            {t("plugins.s3.providerLabel")}
                          </label>
                          <select
                            id="s3-provider"
                            value={s3Config.providerId}
                            onChange={(e) =>
                              setS3Config((c) => ({ ...c, providerId: e.target.value }))
                            }
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                          >
                            {S3_COMPATIBLE_PROVIDERS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                            <span className="text-zinc-400 font-medium">
                              {t("plugins.s3.providerHintTitle")}:{" "}
                            </span>
                            {s3ProviderMeta.hint}
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="s3-endpoint"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.s3.endpointLabel")}
                            </label>
                            <input
                              id="s3-endpoint"
                              type="text"
                              autoComplete="off"
                              value={s3Config.endpoint}
                              onChange={(e) =>
                                setS3Config((c) => ({ ...c, endpoint: e.target.value }))
                              }
                              placeholder={s3ProviderMeta.endpointPlaceholder}
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 font-mono"
                            />
                            <p className="text-xs text-zinc-600 mt-1.5">{t("plugins.s3.endpointHint")}</p>
                          </div>
                          <div>
                            <label
                              htmlFor="s3-region"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.s3.regionLabel")}
                            </label>
                            <input
                              id="s3-region"
                              type="text"
                              autoComplete="off"
                              value={s3Config.region}
                              onChange={(e) =>
                                setS3Config((c) => ({ ...c, region: e.target.value }))
                              }
                              placeholder={s3ProviderMeta.regionPlaceholder}
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 font-mono"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="s3-bucket"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.s3.bucketLabel")}
                            </label>
                            <input
                              id="s3-bucket"
                              type="text"
                              autoComplete="off"
                              value={s3Config.bucket}
                              onChange={(e) =>
                                setS3Config((c) => ({ ...c, bucket: e.target.value }))
                              }
                              placeholder="my-media-bucket"
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 font-mono"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="s3-access-key"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.s3.accessKeyLabel")}
                            </label>
                            <input
                              id="s3-access-key"
                              type="text"
                              autoComplete="off"
                              value={s3Config.accessKey}
                              onChange={(e) =>
                                setS3Config((c) => ({ ...c, accessKey: e.target.value }))
                              }
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 font-mono"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="s3-secret-key"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.s3.secretKeyLabel")}
                            </label>
                            <input
                              id="s3-secret-key"
                              type="password"
                              autoComplete="off"
                              value={s3Config.secretKey}
                              onChange={(e) =>
                                setS3Config((c) => ({ ...c, secretKey: e.target.value }))
                              }
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 font-mono"
                            />
                          </div>
                        </div>

                        <label className="flex items-start gap-3 max-w-xl cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={s3Config.pathStyle}
                            onChange={(e) =>
                              setS3Config((c) => ({ ...c, pathStyle: e.target.checked }))
                            }
                            className="mt-1 rounded border-zinc-600 text-orange-500 focus:ring-orange-500/40"
                          />
                          <span>
                            <span className="text-sm font-medium text-zinc-200 block">
                              {t("plugins.s3.pathStyleLabel")}
                            </span>
                            <span className="text-xs text-zinc-500">{t("plugins.s3.pathStyleHint")}</span>
                          </span>
                        </label>

                        <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
                          {t("plugins.s3.storageHint")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistS3Config()}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.s3.save")}
                          </button>
                          {s3SaveHint && (
                            <span className="text-xs text-green-400">{t("plugins.s3.saved")}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isSitemap && enabled && sitemapSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-4">
                        <div className="max-w-xl">
                          <label
                            htmlFor="sitemap-base-url"
                            className="block text-sm font-medium text-zinc-200 mb-2"
                          >
                            {t("plugins.sitemap.baseUrlLabel")}
                          </label>
                          <input
                            id="sitemap-base-url"
                            type="text"
                            autoComplete="off"
                            value={sitemapConfig.baseUrl}
                            onChange={(e) =>
                              setSitemapConfig((c) => ({ ...c, baseUrl: e.target.value.trimEnd() }))
                            }
                            placeholder={t("plugins.sitemap.baseUrlPlaceholder")}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                          />
                          <p className="text-xs text-zinc-500 mt-2">{t("plugins.sitemap.baseUrlHint")}</p>
                        </div>

                        <div className="max-w-xl">
                          <label
                            htmlFor="sitemap-path"
                            className="block text-sm font-medium text-zinc-200 mb-2"
                          >
                            {t("plugins.sitemap.pathLabel")}
                          </label>
                          <input
                            id="sitemap-path"
                            type="text"
                            autoComplete="off"
                            value={sitemapConfig.sitemapPath}
                            onChange={(e) =>
                              setSitemapConfig((c) => ({ ...c, sitemapPath: e.target.value }))
                            }
                            placeholder="/sitemap.xml"
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                          <div>
                            <label
                              htmlFor="sitemap-changefreq"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.sitemap.changeFreqLabel")}
                            </label>
                            <select
                              id="sitemap-changefreq"
                              value={sitemapConfig.defaultChangeFreq}
                              onChange={(e) =>
                                setSitemapConfig((c) => ({
                                  ...c,
                                  defaultChangeFreq: e.target.value as SitemapChangeFreq,
                                }))
                              }
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            >
                              <option value="always">always</option>
                              <option value="hourly">hourly</option>
                              <option value="daily">daily</option>
                              <option value="weekly">weekly</option>
                              <option value="monthly">monthly</option>
                              <option value="yearly">yearly</option>
                              <option value="never">never</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="sitemap-priority"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.sitemap.priorityLabel")}
                            </label>
                            <select
                              id="sitemap-priority"
                              value={sitemapConfig.defaultPriority}
                              onChange={(e) =>
                                setSitemapConfig((c) => ({ ...c, defaultPriority: e.target.value }))
                              }
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            >
                              {["0.0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"].map(
                                (p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        </div>

                        <label className="flex items-start gap-3 max-w-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sitemapConfig.includeDrafts}
                            onChange={(e) =>
                              setSitemapConfig((c) => ({ ...c, includeDrafts: e.target.checked }))
                            }
                            className="mt-1 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500/40"
                          />
                          <span>
                            <span className="text-sm font-medium text-zinc-200 block">
                              {t("plugins.sitemap.includeDraftsLabel")}
                            </span>
                            <span className="text-xs text-zinc-500">{t("plugins.sitemap.includeDraftsHint")}</span>
                          </span>
                        </label>

                        <label className="flex items-start gap-3 max-w-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sitemapConfig.pingSearchEngines}
                            onChange={(e) =>
                              setSitemapConfig((c) => ({ ...c, pingSearchEngines: e.target.checked }))
                            }
                            className="mt-1 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500/40"
                          />
                          <span>
                            <span className="text-sm font-medium text-zinc-200 block">
                              {t("plugins.sitemap.pingLabel")}
                            </span>
                            <span className="text-xs text-zinc-500">{t("plugins.sitemap.pingHint")}</span>
                          </span>
                        </label>

                        <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
                          {t("plugins.sitemap.demoHint")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistSitemapConfig()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.sitemap.save")}
                          </button>
                          {sitemapSaveHint && (
                            <span className="text-xs text-green-400">{t("plugins.sitemap.saved")}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isRobots && enabled && robotsSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-4">
                        <div>
                          <label
                            htmlFor="robots-txt-editor"
                            className="block text-sm font-medium text-zinc-200 mb-2"
                          >
                            {t("plugins.robots.editorLabel")}
                          </label>
                          <textarea
                            id="robots-txt-editor"
                            value={robotsTxt}
                            onChange={(e) => setRobotsTxt(e.target.value)}
                            spellCheck={false}
                            rows={14}
                            className="w-full max-w-3xl px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-md text-sm text-zinc-100 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-y min-h-[200px]"
                            placeholder={t("plugins.robots.editorPlaceholder")}
                          />
                          <p className="text-xs text-zinc-500 mt-2 max-w-3xl leading-relaxed">
                            {t("plugins.robots.editorHint")}
                          </p>
                        </div>

                        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                          {t("plugins.robots.demoHint")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistRobotsTxt()}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.robots.save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRobotsTxt(DEFAULT_ROBOTS_TXT)}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-md text-sm transition-colors"
                          >
                            {t("plugins.robots.resetSample")}
                          </button>
                          {robotsSaveHint && (
                            <span className="text-xs text-green-400">{t("plugins.robots.saved")}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isRedis && enabled && redisSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="redis-host"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.redis.hostLabel")}
                            </label>
                            <input
                              id="redis-host"
                              type="text"
                              autoComplete="off"
                              value={redisConfig.host}
                              onChange={(e) =>
                                setRedisConfig((c) => ({ ...c, host: e.target.value }))
                              }
                              placeholder={t("plugins.redis.hostPlaceholder")}
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-mono"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="redis-port"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.redis.portLabel")}
                            </label>
                            <input
                              id="redis-port"
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              value={redisConfig.port}
                              onChange={(e) =>
                                setRedisConfig((c) => ({ ...c, port: e.target.value }))
                              }
                              placeholder="6379"
                              className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 font-mono ${
                                redisConfig.port.trim() !== "" && !redisPortOk
                                  ? "border-red-500/50 focus:ring-red-500/30"
                                  : "border-zinc-700 focus:ring-rose-500/40"
                              }`}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="redis-db"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.redis.dbIndexLabel")}
                            </label>
                            <input
                              id="redis-db"
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              value={redisConfig.dbIndex}
                              onChange={(e) =>
                                setRedisConfig((c) => ({ ...c, dbIndex: e.target.value }))
                              }
                              placeholder="0"
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-mono"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="redis-password"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.redis.passwordLabel")}
                            </label>
                            <input
                              id="redis-password"
                              type="password"
                              autoComplete="off"
                              value={redisConfig.password}
                              onChange={(e) =>
                                setRedisConfig((c) => ({ ...c, password: e.target.value }))
                              }
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-mono"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="redis-prefix"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.redis.keyPrefixLabel")}
                            </label>
                            <input
                              id="redis-prefix"
                              type="text"
                              autoComplete="off"
                              value={redisConfig.keyPrefix}
                              onChange={(e) =>
                                setRedisConfig((c) => ({ ...c, keyPrefix: e.target.value }))
                              }
                              placeholder="cms:"
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-mono"
                            />
                            <p className="text-xs text-zinc-600 mt-1.5">{t("plugins.redis.keyPrefixHint")}</p>
                          </div>
                          <div>
                            <label
                              htmlFor="redis-ttl"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.redis.defaultTtlLabel")}
                            </label>
                            <input
                              id="redis-ttl"
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              value={redisConfig.defaultTtlSec}
                              onChange={(e) =>
                                setRedisConfig((c) => ({ ...c, defaultTtlSec: e.target.value }))
                              }
                              placeholder="3600"
                              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-mono"
                            />
                            <p className="text-xs text-zinc-600 mt-1.5">{t("plugins.redis.defaultTtlHint")}</p>
                          </div>
                        </div>

                        <label className="flex items-start gap-3 max-w-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={redisConfig.useTls}
                            onChange={(e) =>
                              setRedisConfig((c) => ({ ...c, useTls: e.target.checked }))
                            }
                            className="mt-1 rounded border-zinc-600 text-rose-500 focus:ring-rose-500/40"
                          />
                          <span>
                            <span className="text-sm font-medium text-zinc-200 block">
                              {t("plugins.redis.tlsLabel")}
                            </span>
                            <span className="text-xs text-zinc-500">{t("plugins.redis.tlsHint")}</span>
                          </span>
                        </label>

                        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                          {t("plugins.redis.demoHint")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistRedisConfig()}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.redis.save")}
                          </button>
                          {redisSaveHint && (
                            <span className="text-xs text-green-400">{t("plugins.redis.saved")}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isSmtp && enabled && smtpSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                            {t("plugins.smtp.serverHeading")}
                          </h4>
                          <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                            <div className="sm:col-span-2">
                              <label
                                htmlFor="smtp-host"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.smtp.hostLabel")}
                              </label>
                              <input
                                id="smtp-host"
                                type="text"
                                autoComplete="off"
                                value={smtpConfig.host}
                                onChange={(e) =>
                                  setSmtpConfig((c) => ({ ...c, host: e.target.value }))
                                }
                                placeholder={t("plugins.smtp.hostPlaceholder")}
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 font-mono"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="smtp-port"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.smtp.portLabel")}
                              </label>
                              <input
                                id="smtp-port"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={smtpConfig.port}
                                onChange={(e) =>
                                  setSmtpConfig((c) => ({ ...c, port: e.target.value }))
                                }
                                placeholder="587"
                                className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 font-mono ${
                                  smtpConfig.port.trim() !== "" && !smtpPortOk
                                    ? "border-red-500/50 focus:ring-red-500/30"
                                    : "border-zinc-700 focus:ring-sky-500/40"
                                }`}
                              />
                            </div>
                            <label className="flex items-center gap-3 sm:pt-8 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={smtpConfig.useTls}
                                onChange={(e) =>
                                  setSmtpConfig((c) => ({ ...c, useTls: e.target.checked }))
                                }
                                className="rounded border-zinc-600 text-sky-500 focus:ring-sky-500/40"
                              />
                              <span className="text-sm text-zinc-300">{t("plugins.smtp.tlsLabel")}</span>
                            </label>
                            <div>
                              <label
                                htmlFor="smtp-user"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.smtp.usernameLabel")}
                              </label>
                              <input
                                id="smtp-user"
                                type="text"
                                autoComplete="off"
                                value={smtpConfig.username}
                                onChange={(e) =>
                                  setSmtpConfig((c) => ({ ...c, username: e.target.value }))
                                }
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 font-mono"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="smtp-pass"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.smtp.passwordLabel")}
                              </label>
                              <input
                                id="smtp-pass"
                                type="password"
                                autoComplete="off"
                                value={smtpConfig.password}
                                onChange={(e) =>
                                  setSmtpConfig((c) => ({ ...c, password: e.target.value }))
                                }
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 font-mono"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="smtp-from-email"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.smtp.fromEmailLabel")}
                              </label>
                              <input
                                id="smtp-from-email"
                                type="email"
                                autoComplete="off"
                                value={smtpConfig.fromEmail}
                                onChange={(e) =>
                                  setSmtpConfig((c) => ({ ...c, fromEmail: e.target.value }))
                                }
                                placeholder="noreply@example.com"
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 font-mono"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="smtp-from-name"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.smtp.fromNameLabel")}
                              </label>
                              <input
                                id="smtp-from-name"
                                type="text"
                                autoComplete="off"
                                value={smtpConfig.fromName}
                                onChange={(e) =>
                                  setSmtpConfig((c) => ({ ...c, fromName: e.target.value }))
                                }
                                placeholder="CMS"
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-zinc-800/80 pt-5">
                          <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                            {t("plugins.smtp.notifyHeading")}
                          </h4>
                          <p className="text-xs text-zinc-500 mb-4 max-w-3xl">
                            {t("plugins.smtp.notifyIntro")}
                          </p>

                          <label
                            htmlFor="smtp-recipients"
                            className="block text-sm font-medium text-zinc-200 mb-2"
                          >
                            {t("plugins.smtp.recipientsLabel")}
                          </label>
                          <input
                            id="smtp-recipients"
                            type="text"
                            autoComplete="off"
                            value={smtpConfig.recipientEmails}
                            onChange={(e) =>
                              setSmtpConfig((c) => ({ ...c, recipientEmails: e.target.value }))
                            }
                            placeholder={t("plugins.smtp.recipientsPlaceholder")}
                            className="w-full max-w-3xl px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                          />
                          <p className="text-xs text-zinc-600 mt-1.5 mb-4 max-w-3xl">
                            {t("plugins.smtp.recipientsHint")}
                          </p>

                          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                            {t("plugins.smtp.contentTypesHeading")}
                          </p>
                          <div className="grid gap-2 max-w-xl mb-5">
                            {(
                              [
                                ["notifyNewArticle", "notifyNewArticleLabel"],
                                ["notifyNewProduct", "notifyNewProductLabel"],
                                ["notifyNewGallery", "notifyNewGalleryLabel"],
                                ["notifyOtherCollections", "notifyOtherCollectionsLabel"],
                              ] as const
                            ).map(([key, labelKey]) => (
                              <label key={key} className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={smtpConfig[key]}
                                  onChange={(e) =>
                                    setSmtpConfig((c) => ({ ...c, [key]: e.target.checked }))
                                  }
                                  className="mt-1 rounded border-zinc-600 text-sky-500 focus:ring-sky-500/40"
                                />
                                <span className="text-sm text-zinc-300">
                                  {t(`plugins.smtp.${labelKey}`)}
                                </span>
                              </label>
                            ))}
                          </div>

                          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                            {t("plugins.smtp.lifecycleHeading")}
                          </p>
                          <div className="grid gap-2 max-w-xl">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={smtpConfig.notifyOnPublished}
                                onChange={(e) =>
                                  setSmtpConfig((c) => ({
                                    ...c,
                                    notifyOnPublished: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-sky-500 focus:ring-sky-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.smtp.notifyOnPublishedLabel")}
                              </span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={smtpConfig.notifyOnDraftSaved}
                                onChange={(e) =>
                                  setSmtpConfig((c) => ({
                                    ...c,
                                    notifyOnDraftSaved: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-sky-500 focus:ring-sky-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.smtp.notifyOnDraftSavedLabel")}
                              </span>
                            </label>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                          {t("plugins.smtp.demoHint")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistSmtpConfig()}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.smtp.save")}
                          </button>
                          {smtpSaveHint && (
                            <span className="text-xs text-green-400">{t("plugins.smtp.saved")}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isN8n && enabled && n8nSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                            {t("plugins.n8n.connectionHeading")}
                          </h4>
                          <p className="text-xs text-zinc-500 mb-4 max-w-3xl">
                            {t("plugins.n8n.connectionIntro")}
                          </p>
                          <div className="grid gap-4 max-w-3xl">
                            <div>
                              <label
                                htmlFor="n8n-instance-url"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.n8n.instanceUrlLabel")}
                              </label>
                              <input
                                id="n8n-instance-url"
                                type="url"
                                autoComplete="off"
                                value={n8nConfig.instanceUrl}
                                onChange={(e) =>
                                  setN8nConfig((c) => ({ ...c, instanceUrl: e.target.value }))
                                }
                                placeholder={t("plugins.n8n.instanceUrlPlaceholder")}
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
                              />
                              <p className="text-xs text-zinc-500 mt-1.5">
                                {t("plugins.n8n.instanceUrlHint")}
                              </p>
                            </div>
                            <div>
                              <label
                                htmlFor="n8n-webhook-url"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.n8n.webhookUrlLabel")}
                              </label>
                              <input
                                id="n8n-webhook-url"
                                type="url"
                                autoComplete="off"
                                value={n8nConfig.webhookUrl}
                                onChange={(e) =>
                                  setN8nConfig((c) => ({ ...c, webhookUrl: e.target.value }))
                                }
                                placeholder={t("plugins.n8n.webhookUrlPlaceholder")}
                                className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 font-mono ${
                                  n8nWebhookInvalid
                                    ? "border-amber-500/50 focus:ring-amber-500/30"
                                    : "border-zinc-700 focus:ring-indigo-500/40"
                                }`}
                              />
                              {n8nWebhookInvalid && (
                                <p className="text-xs text-amber-400/90 mt-1.5">
                                  {t("plugins.n8n.webhookUrlInvalid")}
                                </p>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor="n8n-signing-secret"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.n8n.signingSecretLabel")}
                              </label>
                              <input
                                id="n8n-signing-secret"
                                type="password"
                                autoComplete="off"
                                value={n8nConfig.signingSecret}
                                onChange={(e) =>
                                  setN8nConfig((c) => ({ ...c, signingSecret: e.target.value }))
                                }
                                placeholder={t("plugins.n8n.signingSecretPlaceholder")}
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
                              />
                              <p className="text-xs text-zinc-500 mt-1.5">
                                {t("plugins.n8n.signingSecretHint")}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                            {t("plugins.n8n.triggersHeading")}
                          </h4>
                          <p className="text-xs text-zinc-500 mb-3 max-w-3xl">
                            {t("plugins.n8n.triggersIntro")}
                          </p>
                          <div className="grid gap-3 max-w-3xl">
                            {(
                              [
                                ["onContentCreated", "plugins.n8n.onContentCreatedLabel"] as const,
                                ["onContentUpdated", "plugins.n8n.onContentUpdatedLabel"] as const,
                                ["onContentPublished", "plugins.n8n.onContentPublishedLabel"] as const,
                                ["onContentDeleted", "plugins.n8n.onContentDeletedLabel"] as const,
                                ["onMediaLibraryChange", "plugins.n8n.onMediaLibraryChangeLabel"] as const,
                                ["onUserOrRoleChange", "plugins.n8n.onUserOrRoleChangeLabel"] as const,
                                [
                                  "onContentTypeSchemaChange",
                                  "plugins.n8n.onContentTypeSchemaChangeLabel",
                                ] as const,
                                ["onPluginSettingsChange", "plugins.n8n.onPluginSettingsChangeLabel"] as const,
                              ] as const
                            ).map(([key, labelKey]) => (
                              <label key={key} className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={n8nConfig[key]}
                                  onChange={(e) =>
                                    setN8nConfig((c) => ({ ...c, [key]: e.target.checked }))
                                  }
                                  className="mt-1 rounded border-zinc-600 text-indigo-500 focus:ring-indigo-500/40"
                                />
                                <span className="text-sm text-zinc-300">{t(labelKey)}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                            {t("plugins.n8n.payloadHeading")}
                          </h4>
                          <p className="text-xs text-zinc-500 mb-3 max-w-3xl">
                            {t("plugins.n8n.payloadIntro")}
                          </p>
                          <div className="grid gap-3 max-w-3xl">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={n8nConfig.payloadIncludeLocales}
                                onChange={(e) =>
                                  setN8nConfig((c) => ({
                                    ...c,
                                    payloadIncludeLocales: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-indigo-500 focus:ring-indigo-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.n8n.payloadIncludeLocalesLabel")}
                              </span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={n8nConfig.payloadIncludeAuthor}
                                onChange={(e) =>
                                  setN8nConfig((c) => ({
                                    ...c,
                                    payloadIncludeAuthor: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-indigo-500 focus:ring-indigo-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.n8n.payloadIncludeAuthorLabel")}
                              </span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={n8nConfig.payloadIncludeFullEntry}
                                onChange={(e) =>
                                  setN8nConfig((c) => ({
                                    ...c,
                                    payloadIncludeFullEntry: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-indigo-500 focus:ring-indigo-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.n8n.payloadIncludeFullEntryLabel")}
                              </span>
                            </label>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                          {t("plugins.n8n.demoHint")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistN8nConfig()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.n8n.save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = n8nConfig.webhookUrl.trim();
                              window.alert(
                                url
                                  ? `${t("plugins.n8n.testWebhookDemoWithUrl")}\n\n${url}`
                                  : t("plugins.n8n.testWebhookDemoNoUrl"),
                              );
                            }}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.n8n.testWebhook")}
                          </button>
                          {n8nSaveHint && (
                            <span className="text-xs text-green-400">{t("plugins.n8n.saved")}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isOutboundWebhook && enabled && outboundWebhookSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                            {t("plugins.outboundWebhook.connectionHeading")}
                          </h4>
                          <p className="text-xs text-zinc-500 mb-4 max-w-3xl">
                            {t("plugins.outboundWebhook.connectionIntro")}
                          </p>
                          <div className="grid gap-4 max-w-3xl">
                            <div>
                              <label
                                htmlFor="outbound-webhook-channel"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.outboundWebhook.channelLabel")}
                              </label>
                              <input
                                id="outbound-webhook-channel"
                                type="text"
                                autoComplete="off"
                                value={outboundWebhookConfig.channelLabel}
                                onChange={(e) =>
                                  setOutboundWebhookConfig((c) => ({
                                    ...c,
                                    channelLabel: e.target.value,
                                  }))
                                }
                                placeholder={t("plugins.outboundWebhook.channelPlaceholder")}
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                              />
                              <p className="text-xs text-zinc-500 mt-1.5">
                                {t("plugins.outboundWebhook.channelHint")}
                              </p>
                            </div>
                            <div>
                              <label
                                htmlFor="outbound-webhook-url"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.outboundWebhook.webhookUrlLabel")}
                              </label>
                              <input
                                id="outbound-webhook-url"
                                type="url"
                                autoComplete="off"
                                value={outboundWebhookConfig.webhookUrl}
                                onChange={(e) =>
                                  setOutboundWebhookConfig((c) => ({
                                    ...c,
                                    webhookUrl: e.target.value,
                                  }))
                                }
                                placeholder={t("plugins.outboundWebhook.webhookUrlPlaceholder")}
                                className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 font-mono ${
                                  outboundWebhookInvalid
                                    ? "border-amber-500/50 focus:ring-amber-500/30"
                                    : "border-zinc-700 focus:ring-teal-500/40"
                                }`}
                              />
                              {outboundWebhookInvalid && (
                                <p className="text-xs text-amber-400/90 mt-1.5">
                                  {t("plugins.outboundWebhook.webhookUrlInvalid")}
                                </p>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor="outbound-webhook-secret"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.outboundWebhook.signingSecretLabel")}
                              </label>
                              <input
                                id="outbound-webhook-secret"
                                type="password"
                                autoComplete="off"
                                value={outboundWebhookConfig.signingSecret}
                                onChange={(e) =>
                                  setOutboundWebhookConfig((c) => ({
                                    ...c,
                                    signingSecret: e.target.value,
                                  }))
                                }
                                placeholder={t("plugins.outboundWebhook.signingSecretPlaceholder")}
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 font-mono"
                              />
                              <p className="text-xs text-zinc-500 mt-1.5">
                                {t("plugins.outboundWebhook.signingSecretHint")}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                            {t("plugins.outboundWebhook.triggersHeading")}
                          </h4>
                          <p className="text-xs text-zinc-500 mb-3 max-w-3xl">
                            {t("plugins.outboundWebhook.triggersIntro")}
                          </p>
                          <div className="grid gap-3 max-w-3xl">
                            {(
                              [
                                [
                                  "onContentCreated",
                                  "plugins.outboundWebhook.onContentCreatedLabel",
                                ] as const,
                                [
                                  "onContentUpdated",
                                  "plugins.outboundWebhook.onContentUpdatedLabel",
                                ] as const,
                                [
                                  "onContentPublished",
                                  "plugins.outboundWebhook.onContentPublishedLabel",
                                ] as const,
                                [
                                  "onContentDeleted",
                                  "plugins.outboundWebhook.onContentDeletedLabel",
                                ] as const,
                                [
                                  "onMediaLibraryChange",
                                  "plugins.outboundWebhook.onMediaLibraryChangeLabel",
                                ] as const,
                                [
                                  "onUserOrRoleChange",
                                  "plugins.outboundWebhook.onUserOrRoleChangeLabel",
                                ] as const,
                                [
                                  "onContentTypeSchemaChange",
                                  "plugins.outboundWebhook.onContentTypeSchemaChangeLabel",
                                ] as const,
                                [
                                  "onPluginSettingsChange",
                                  "plugins.outboundWebhook.onPluginSettingsChangeLabel",
                                ] as const,
                              ] as const
                            ).map(([key, labelKey]) => (
                              <label key={key} className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={outboundWebhookConfig[key]}
                                  onChange={(e) =>
                                    setOutboundWebhookConfig((c) => ({
                                      ...c,
                                      [key]: e.target.checked,
                                    }))
                                  }
                                  className="mt-1 rounded border-zinc-600 text-teal-500 focus:ring-teal-500/40"
                                />
                                <span className="text-sm text-zinc-300">{t(labelKey)}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                            {t("plugins.outboundWebhook.payloadHeading")}
                          </h4>
                          <p className="text-xs text-zinc-500 mb-3 max-w-3xl">
                            {t("plugins.outboundWebhook.payloadIntro")}
                          </p>
                          <div className="grid gap-3 max-w-3xl">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={outboundWebhookConfig.payloadIncludeLocales}
                                onChange={(e) =>
                                  setOutboundWebhookConfig((c) => ({
                                    ...c,
                                    payloadIncludeLocales: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-teal-500 focus:ring-teal-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.outboundWebhook.payloadIncludeLocalesLabel")}
                              </span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={outboundWebhookConfig.payloadIncludeAuthor}
                                onChange={(e) =>
                                  setOutboundWebhookConfig((c) => ({
                                    ...c,
                                    payloadIncludeAuthor: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-teal-500 focus:ring-teal-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.outboundWebhook.payloadIncludeAuthorLabel")}
                              </span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={outboundWebhookConfig.payloadIncludeFullEntry}
                                onChange={(e) =>
                                  setOutboundWebhookConfig((c) => ({
                                    ...c,
                                    payloadIncludeFullEntry: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-teal-500 focus:ring-teal-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.outboundWebhook.payloadIncludeFullEntryLabel")}
                              </span>
                            </label>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                          {t("plugins.outboundWebhook.demoHint")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistOutboundWebhookConfig()}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.outboundWebhook.save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = outboundWebhookConfig.webhookUrl.trim();
                              window.alert(
                                url
                                  ? `${t("plugins.outboundWebhook.testWebhookDemoWithUrl")}\n\n${url}`
                                  : t("plugins.outboundWebhook.testWebhookDemoNoUrl"),
                              );
                            }}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.outboundWebhook.testWebhook")}
                          </button>
                          {outboundWebhookSaveHint && (
                            <span className="text-xs text-green-400">
                              {t("plugins.outboundWebhook.saved")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {isNativeAnalytics && enabled && nativeAnalyticsSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                            {t("plugins.nativeAnalytics.connectionHeading")}
                          </h4>
                          <p className="text-xs text-zinc-500 mb-4 max-w-3xl">
                            {t("plugins.nativeAnalytics.connectionIntro")}
                          </p>
                          <div className="grid gap-4 max-w-3xl">
                            <div>
                              <label
                                htmlFor="native-analytics-ingest"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.nativeAnalytics.ingestUrlLabel")}
                              </label>
                              <input
                                id="native-analytics-ingest"
                                type="url"
                                autoComplete="off"
                                value={nativeAnalyticsConfig.ingestUrl}
                                onChange={(e) =>
                                  setNativeAnalyticsConfig((c) => ({
                                    ...c,
                                    ingestUrl: e.target.value,
                                  }))
                                }
                                placeholder={t("plugins.nativeAnalytics.ingestUrlPlaceholder")}
                                className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 font-mono ${
                                  nativeAnalyticsIngestInvalid
                                    ? "border-amber-500/50 focus:ring-amber-500/30"
                                    : "border-zinc-700 focus:ring-blue-500/40"
                                }`}
                              />
                              {nativeAnalyticsIngestInvalid && (
                                <p className="text-xs text-amber-400/90 mt-1.5">
                                  {t("plugins.nativeAnalytics.ingestUrlInvalid")}
                                </p>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor="native-analytics-site-key"
                                className="block text-sm font-medium text-zinc-200 mb-2"
                              >
                                {t("plugins.nativeAnalytics.siteKeyLabel")}
                              </label>
                              <input
                                id="native-analytics-site-key"
                                type="text"
                                autoComplete="off"
                                value={nativeAnalyticsConfig.siteKey}
                                onChange={(e) =>
                                  setNativeAnalyticsConfig((c) => ({
                                    ...c,
                                    siteKey: e.target.value,
                                  }))
                                }
                                placeholder={t("plugins.nativeAnalytics.siteKeyPlaceholder")}
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                              />
                              <p className="text-xs text-zinc-500 mt-1.5">
                                {t("plugins.nativeAnalytics.siteKeyHint")}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-2">
                            {t("plugins.nativeAnalytics.sdkHeading")}
                          </h4>
                          <p className="text-xs text-zinc-500 mb-2 max-w-3xl">
                            {t("plugins.nativeAnalytics.sdkModuleHint")}
                          </p>
                          <pre className="max-w-3xl p-4 rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed whitespace-pre">
                            {NATIVE_ANALYTICS_SDK_SNIPPET}
                          </pre>
                          <p className="text-xs text-zinc-600 mt-2 max-w-3xl">
                            {t("plugins.nativeAnalytics.sdkNote")}
                          </p>
                        </div>

                        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                          {t("plugins.nativeAnalytics.demoHint")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistNativeAnalyticsConfig()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.nativeAnalytics.save")}
                          </button>
                          {nativeAnalyticsSaveHint && (
                            <span className="text-xs text-green-400">
                              {t("plugins.nativeAnalytics.saved")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {isImageOptimization && enabled && imageOptimizationSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-6">
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 max-w-3xl">
                          <p className="text-xs font-medium text-amber-200/90 mb-1">
                            {t("plugins.imageOptimization.recommendedHeading")}
                          </p>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {t("plugins.imageOptimization.recommendedBody")}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                            {t("plugins.imageOptimization.outputHeading")}
                          </h4>
                          <div className="grid gap-3 max-w-3xl">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={imageOptimizationConfig.deliverAsWebp}
                                onChange={(e) =>
                                  setImageOptimizationConfig((c) => ({
                                    ...c,
                                    deliverAsWebp: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-amber-500 focus:ring-amber-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.imageOptimization.deliverAsWebpLabel")}
                              </span>
                            </label>
                            <p className="text-xs text-zinc-500 -mt-1 ml-8">
                              {t("plugins.imageOptimization.deliverAsWebpHint")}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                          <div>
                            <label
                              htmlFor="img-opt-quality"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.imageOptimization.qualityLabel")}
                            </label>
                            <input
                              id="img-opt-quality"
                              type="text"
                              inputMode="numeric"
                              value={imageOptimizationConfig.webpQuality}
                              onChange={(e) =>
                                setImageOptimizationConfig((c) => ({
                                  ...c,
                                  webpQuality: e.target.value,
                                }))
                              }
                              className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-md text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 ${
                                imageOptQualityInvalid
                                  ? "border-amber-500/50 focus:ring-amber-500/30"
                                  : "border-zinc-700 focus:ring-amber-500/40"
                              }`}
                            />
                            <p className="text-xs text-zinc-500 mt-1.5">
                              {t("plugins.imageOptimization.qualityHint")}
                            </p>
                          </div>
                          <div>
                            <label
                              htmlFor="img-opt-effort"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.imageOptimization.effortLabel")}
                            </label>
                            <input
                              id="img-opt-effort"
                              type="text"
                              inputMode="numeric"
                              value={imageOptimizationConfig.webpEffort}
                              onChange={(e) =>
                                setImageOptimizationConfig((c) => ({
                                  ...c,
                                  webpEffort: e.target.value,
                                }))
                              }
                              className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-md text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 ${
                                imageOptEffortInvalid
                                  ? "border-amber-500/50 focus:ring-amber-500/30"
                                  : "border-zinc-700 focus:ring-amber-500/40"
                              }`}
                            />
                            <p className="text-xs text-zinc-500 mt-1.5">
                              {t("plugins.imageOptimization.effortHint")}
                            </p>
                          </div>
                          <div>
                            <label
                              htmlFor="img-opt-maxw"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.imageOptimization.maxWidthLabel")}
                            </label>
                            <input
                              id="img-opt-maxw"
                              type="text"
                              inputMode="numeric"
                              value={imageOptimizationConfig.maxWidthPx}
                              onChange={(e) =>
                                setImageOptimizationConfig((c) => ({
                                  ...c,
                                  maxWidthPx: e.target.value,
                                }))
                              }
                              placeholder="2560"
                              className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-md text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 ${
                                imageOptMaxWInvalid
                                  ? "border-amber-500/50 focus:ring-amber-500/30"
                                  : "border-zinc-700 focus:ring-amber-500/40"
                              }`}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="img-opt-maxh"
                              className="block text-sm font-medium text-zinc-200 mb-2"
                            >
                              {t("plugins.imageOptimization.maxHeightLabel")}
                            </label>
                            <input
                              id="img-opt-maxh"
                              type="text"
                              inputMode="numeric"
                              value={imageOptimizationConfig.maxHeightPx}
                              onChange={(e) =>
                                setImageOptimizationConfig((c) => ({
                                  ...c,
                                  maxHeightPx: e.target.value,
                                }))
                              }
                              placeholder={t("plugins.imageOptimization.maxDimPlaceholder")}
                              className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-md text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 ${
                                imageOptMaxHInvalid
                                  ? "border-amber-500/50 focus:ring-amber-500/30"
                                  : "border-zinc-700 focus:ring-amber-500/40"
                              }`}
                            />
                            <p className="text-xs text-zinc-500 mt-1.5">
                              {t("plugins.imageOptimization.maxDimHint")}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                            {t("plugins.imageOptimization.processingHeading")}
                          </h4>
                          <div className="grid gap-3 max-w-3xl">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={imageOptimizationConfig.stripMetadata}
                                onChange={(e) =>
                                  setImageOptimizationConfig((c) => ({
                                    ...c,
                                    stripMetadata: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-amber-500 focus:ring-amber-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.imageOptimization.stripMetadataLabel")}
                              </span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={imageOptimizationConfig.autoOrient}
                                onChange={(e) =>
                                  setImageOptimizationConfig((c) => ({
                                    ...c,
                                    autoOrient: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-amber-500 focus:ring-amber-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.imageOptimization.autoOrientLabel")}
                              </span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={imageOptimizationConfig.retainOriginals}
                                onChange={(e) =>
                                  setImageOptimizationConfig((c) => ({
                                    ...c,
                                    retainOriginals: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-amber-500 focus:ring-amber-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.imageOptimization.retainOriginalsLabel")}
                              </span>
                            </label>
                            <p className="text-xs text-zinc-500 ml-8 -mt-2">
                              {t("plugins.imageOptimization.retainOriginalsHint")}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                            {t("plugins.imageOptimization.responsiveHeading")}
                          </h4>
                          <div className="grid gap-3 max-w-3xl">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={imageOptimizationConfig.generateSrcset}
                                onChange={(e) =>
                                  setImageOptimizationConfig((c) => ({
                                    ...c,
                                    generateSrcset: e.target.checked,
                                  }))
                                }
                                className="mt-1 rounded border-zinc-600 text-amber-500 focus:ring-amber-500/40"
                              />
                              <span className="text-sm text-zinc-300">
                                {t("plugins.imageOptimization.generateSrcsetLabel")}
                              </span>
                            </label>
                            {imageOptimizationConfig.generateSrcset && (
                              <div className="ml-8">
                                <label
                                  htmlFor="img-opt-srcset"
                                  className="block text-xs font-medium text-zinc-500 mb-1.5"
                                >
                                  {t("plugins.imageOptimization.srcsetWidthsLabel")}
                                </label>
                                <input
                                  id="img-opt-srcset"
                                  type="text"
                                  value={imageOptimizationConfig.srcsetWidths}
                                  onChange={(e) =>
                                    setImageOptimizationConfig((c) => ({
                                      ...c,
                                      srcsetWidths: e.target.value,
                                    }))
                                  }
                                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                />
                                <p className="text-xs text-zinc-500 mt-1.5">
                                  {t("plugins.imageOptimization.srcsetWidthsHint")}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                          {t("plugins.imageOptimization.demoHint")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistImageOptimizationConfig()}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.imageOptimization.save")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImageOptimizationConfig(defaultImageOptimizationConfig())
                            }
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.imageOptimization.resetRecommended")}
                          </button>
                          {imageOptimizationSaveHint && (
                            <span className="text-xs text-green-400">
                              {t("plugins.imageOptimization.saved")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-6 text-center">
              <p className="text-sm text-zinc-500">{t("plugins.footer")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
