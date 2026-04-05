import type { LucideIcon } from "lucide-react";
import {
  Shield,
  Webhook,
  Activity,
  Download,
  Gauge,
  MonitorSmartphone,
  Layers,
  Image as ImageIcon,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  KeyRound,
  Search,
  Trash2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "../i18n";

const sectionNav = [
  { id: "auth", label: "Kimlik & oturum" },
  { id: "api", label: "API & webhook" },
  { id: "ops", label: "Operasyon" },
  { id: "security", label: "Güvenlik" },
  { id: "content", label: "İçerik UX" },
  { id: "media", label: "Medya" },
  { id: "audit", label: "Denetim" },
];

export function FeatureGapsShowcase() {
  const { t } = useI18n();

  return (
    <div className="min-h-[100dvh] min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <p className="text-xs font-medium text-amber-400/90 uppercase tracking-wider mb-2">
            {t("featureGaps.badge")}
          </p>
          <h1 className="text-2xl font-semibold text-zinc-100">{t("featureGaps.title")}</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">{t("featureGaps.subtitle")}</p>
          <nav className="flex flex-wrap gap-2 mt-5">
            {sectionNav.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs px-3 py-1.5 rounded-md border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] space-y-16">
        {/* Kimlik */}
        <section id="auth" className="scroll-mt-24 space-y-4">
          <SectionTitle icon={Shield} title="Kimlik & oturum" hint="§19.1, §19.2 — YOK" />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Giriş ekranı (mock)</p>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-4 max-w-sm mx-auto">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-zinc-900" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">E-posta</label>
                  <div className="mt-1 h-9 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 flex items-center text-sm text-zinc-500">
                    admin@ornek.com
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Şifre</label>
                  <div className="mt-1 h-9 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 flex items-center text-sm text-zinc-600">
                    ••••••••
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-full py-2 rounded-md bg-zinc-100 text-zinc-900 text-sm font-medium opacity-60 cursor-not-allowed"
                >
                  Giriş yap
                </button>
                <p className="text-center text-xs text-zinc-600">Şifremi unuttum · SSO (planlı)</p>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">2FA doğrulama (mock)</p>
              <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <KeyRound className="w-4 h-4" />
                  Authenticator kodu
                </div>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-11 rounded-md border border-zinc-700 bg-zinc-900 text-center text-lg font-mono text-zinc-300 flex items-center justify-center"
                    >
                      {i <= 2 ? String(i) : ""}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 text-center">Yedek kodlar · cihaz güvenilirliği (planlı)</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 flex items-start gap-3">
                <MonitorSmartphone className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">Aktif oturumlar</p>
                  <p className="text-xs text-zinc-500 mt-1">Chrome · macOS · İstanbul — şimdi</p>
                  <p className="text-xs text-zinc-500">Safari · iOS — 2 saat önce</p>
                  <button
                    type="button"
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Diğer oturumları sonlandır
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API & Webhook */}
        <section id="api" className="scroll-mt-24 space-y-4">
          <SectionTitle icon={Webhook} title="API & webhook" hint="§19.3, §19.4 — YOK / MOCK" />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-200">Webhook’lar</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-900 font-medium opacity-70 cursor-default"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Yeni webhook
                </button>
              </div>
              <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
                <div className="rounded-lg border border-zinc-800 overflow-hidden text-sm min-w-[28rem]">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-zinc-900/80 text-xs text-zinc-500 border-b border-zinc-800">
                  <span className="col-span-4">URL</span>
                  <span className="col-span-3">Olay</span>
                  <span className="col-span-3">Durum</span>
                  <span className="col-span-2 text-right">İşlem</span>
                </div>
                <div className="divide-y divide-zinc-800/80">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs">
                    <span className="col-span-4 truncate text-zinc-400">https://api.ornek…/hook</span>
                    <span className="col-span-3 text-zinc-500">entry.publish</span>
                    <span className="col-span-3 flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                    </span>
                    <span className="col-span-2 text-right">
                      <Trash2 className="w-3.5 h-3.5 inline text-zinc-600" />
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs">
                    <span className="col-span-4 truncate text-zinc-400">https://hooks.slack…</span>
                    <span className="col-span-3 text-zinc-500">media.upload</span>
                    <span className="col-span-3 flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> Son hata
                    </span>
                    <span className="col-span-2 text-right">
                      <Trash2 className="w-3.5 h-3.5 inline text-zinc-600" />
                    </span>
                  </div>
                </div>
                </div>
              </div>
              <p className="text-xs text-zinc-600">İmza doğrulama, yeniden deneme kuyruğu (planlı)</p>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <FileJson className="w-4 h-4 text-zinc-500" />
                OpenAPI / dokümantasyon
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-500 space-y-2">
                <p className="text-zinc-400">GET /api/articles</p>
                <p className="pl-4 text-zinc-600">200 · application/json</p>
                <p className="text-zinc-400 pt-2">POST /api/articles</p>
                <p className="pl-4 text-zinc-600">201 · Bearer token</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-400 cursor-default"
                >
                  openapi.json indir
                </button>
                <button
                  type="button"
                  className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-400 inline-flex items-center gap-1 cursor-default"
                >
                  Swagger UI <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Operasyon */}
        <section id="ops" className="scroll-mt-24 space-y-4">
          <SectionTitle icon={Activity} title="Operasyon & yedek" hint="§19.5 — YOK" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: "API", ok: true, ms: "42 ms" },
              { name: "Veritabanı", ok: true, ms: "8 ms" },
              { name: "Önbellek", ok: false, ms: "—" },
            ].map((svc) => (
              <div
                key={svc.name}
                className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">{svc.name}</span>
                  {svc.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-2xl font-semibold text-zinc-100">{svc.ms}</p>
                <p className="text-xs text-zinc-600">Sağlık kontrolü (mock)</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">Tam yedek</p>
              <p className="text-xs text-zinc-500 mt-1">Son: 3 Nisan 2026, 02:00 · 12 MB</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-zinc-700 text-zinc-300 cursor-default"
              >
                <Download className="w-4 h-4" />
                JSON dışa aktar
              </button>
              <button
                type="button"
                className="text-sm px-4 py-2 rounded-md bg-zinc-800 text-zinc-500 cursor-not-allowed"
              >
                Zamanla
              </button>
            </div>
          </div>
        </section>

        {/* Güvenlik */}
        <section id="security" className="scroll-mt-24 space-y-4">
          <SectionTitle icon={Gauge} title="Güvenlik & kota" hint="§19.6 — YOK" />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
              <p className="text-sm font-medium text-zinc-200">API hız limiti</p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={10}
                  max={1000}
                  defaultValue={120}
                  disabled
                  className="flex-1 accent-zinc-400 opacity-70"
                />
                <span className="text-sm font-mono text-zinc-400 w-16">120/dk</span>
              </div>
              <p className="text-xs text-zinc-600">IP başına · burst (planlı)</p>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-3">
              <p className="text-sm font-medium text-zinc-200">E-posta (SMTP) — entegrasyon kartı</p>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950/80">
                <Mail className="w-8 h-8 text-zinc-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">Gönderici yapılandırılmadı</p>
                  <p className="text-xs text-zinc-600">Şifre sıfırlama, bildirimler için SMTP gerekli</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-500">YOK</span>
              </div>
            </div>
          </div>
        </section>

        {/* İçerik UX */}
        <section id="content" className="scroll-mt-24 space-y-4">
          <SectionTitle icon={Layers} title="İçerik listesi UX" hint="§19.7 — KISMI" />
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 flex items-center gap-3 text-sm text-red-200/90">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Kaydetme başarısız: ağ zaman aşımı. Tekrar dene veya taslak olarak sakla.</span>
          </div>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60">
              <span className="text-xs text-zinc-500 mr-2">2 seçili</span>
              <button type="button" className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 cursor-default">
                Yayınla
              </button>
              <button type="button" className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 cursor-default">
                Taslağa al
              </button>
              <button type="button" className="text-xs px-2 py-1 rounded border border-red-900/50 text-red-400/80 cursor-default">
                Sil
              </button>
              <div className="flex-1" />
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ara…</span>
              </div>
            </div>
            <div className="p-12 text-center border border-dashed border-zinc-800 m-4 rounded-lg">
              <p className="text-sm text-zinc-500">Bu filtreyle kayıt yok</p>
              <p className="text-xs text-zinc-600 mt-2">Boş durum + toplu işlem çubuğu (mock)</p>
            </div>
          </div>
        </section>

        {/* Medya */}
        <section id="media" className="scroll-mt-24 space-y-4">
          <SectionTitle icon={ImageIcon} title="Medya politikası" hint="§19.8 — MOCK" />
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-zinc-200 mb-3">Yükleme sınırları</p>
              <ul className="text-sm text-zinc-500 space-y-2">
                <li>Maks. dosya: <span className="text-zinc-300">10 MB</span></li>
                <li>İzinli türler: <span className="text-zinc-300">jpg, png, webp, svg</span></li>
                <li>CDN / imza URL (planlı)</li>
              </ul>
            </div>
            <div className="rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950/50 min-h-[140px] flex flex-col items-center justify-center text-zinc-600 text-sm gap-2">
              <ImageIcon className="w-8 h-8 opacity-50" />
              Sürükle veya seç (mock)
            </div>
          </div>
        </section>

        {/* Denetim */}
        <section id="audit" className="scroll-mt-24 space-y-4">
          <SectionTitle icon={Search} title="Denetim günlüğü" hint="§19.9 — YOK" />
          <div className="overflow-x-auto rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-sm">
            <div className="min-w-[32rem] overflow-hidden rounded-xl">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-900/80 text-xs text-zinc-500 border-b border-zinc-800">
              <span className="col-span-2">Zaman</span>
              <span className="col-span-2">Kullanıcı</span>
              <span className="col-span-3">Eylem</span>
              <span className="col-span-5">Hedef</span>
            </div>
            {[
              ["14:02", "admin", "entry.update", "Article #demo-1"],
              ["13:58", "editor", "media.upload", "hero.webp"],
              ["13:40", "admin", "api_token.create", "Mobile app"],
            ].map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-zinc-800/60 text-xs"
              >
                <span className="col-span-2 text-zinc-500">{row[0]}</span>
                <span className="col-span-2 text-zinc-400">{row[1]}</span>
                <span className="col-span-3 text-zinc-300">{row[2]}</span>
                <span className="col-span-5 text-zinc-500 truncate">{row[3]}</span>
              </div>
            ))}
            </div>
          </div>
          <p className="text-xs text-zinc-600">
            Gerçek kayıt yok; arayüz §19 ile hizalı prototiptir.
          </p>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
        <Icon className="w-5 h-5 text-zinc-300" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        <p className="text-xs text-zinc-500">{hint}</p>
      </div>
    </div>
  );
}
