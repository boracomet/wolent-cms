/**
 * Wolent / CMS native analytics — browser SDK örneği.
 * Ön yüz (Next, Vite, vanilla) projenize kopyalayıp `endpoint` ve `siteKey` ile kullanın.
 * Gerçek veri toplama üretimde kendi API’nize POST edilir; bu modül yalnızca sözleşmeyi gösterir.
 */

export type WolentAnalyticsInit = {
  /** Örn. https://api.siteniz.com/v1/analytics/ingest */
  endpoint: string;
  /** Eklenti ayarlarında görünen site / public key */
  siteKey: string;
  /** İsteğe bağlı: sayfa heartbeat aralığı (ms), 0 = kapalı */
  heartbeatMs?: number;
};

export type PageViewPayload = {
  path: string;
  title?: string;
  referrer?: string;
};

type HeartbeatPayload = {
  path: string;
  activeSeconds: number;
};

function safeJson(res: Response): Promise<unknown> {
  const text = res.text();
  return text.then((t) => {
    try {
      return JSON.parse(t) as unknown;
    } catch {
      return { raw: t };
    }
  });
}

/**
 * Örnek: `const a = createWolentAnalytics({ endpoint: "...", siteKey: "..." });`
 */
export function createWolentAnalytics(options: WolentAnalyticsInit) {
  const { endpoint, siteKey, heartbeatMs = 30_000 } = options;
  let pathStart = Date.now();
  let currentPath =
    typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  async function post<T extends object>(body: T & { type: string }) {
    const payload = { ...body, siteKey, ts: Date.now() };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
      keepalive: true,
    });
    if (!res.ok) {
      const err = await safeJson(res);
      throw new Error(`Analytics ingest failed: ${res.status} ${JSON.stringify(err)}`);
    }
    return res;
  }

  /** Tam sayfa / SPA route değişiminde çağırın */
  function trackPageView(partial: PageViewPayload) {
    currentPath = partial.path;
    pathStart = Date.now();
    return post({
      type: "pageview",
      path: partial.path,
      title: partial.title,
      referrer: partial.referrer ?? (typeof document !== "undefined" ? document.referrer : undefined),
    });
  }

  /** Sekme kapanırken veya route değişmeden önce süreyi göndermek için */
  function flushDuration() {
    const activeSeconds = Math.round((Date.now() - pathStart) / 1000);
    if (activeSeconds < 1) return Promise.resolve();
    const body: HeartbeatPayload & { type: string } = {
      type: "heartbeat",
      path: currentPath,
      activeSeconds,
    };
    pathStart = Date.now();
    return post(body);
  }

  function startHeartbeat() {
    if (!heartbeatMs || heartbeatMs <= 0 || typeof window === "undefined") return;
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      void flushDuration();
    }, heartbeatMs);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  if (typeof window !== "undefined" && heartbeatMs > 0) {
    startHeartbeat();
    window.addEventListener("beforeunload", () => {
      void flushDuration();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void flushDuration();
    });
  }

  return {
    trackPageView,
    flushDuration,
    startHeartbeat,
    stopHeartbeat,
  };
}
