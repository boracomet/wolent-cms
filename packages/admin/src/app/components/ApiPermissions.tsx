import { useState, useEffect, useCallback } from "react";
import { api, getAccessToken } from "../api/client";
import { useConfirm } from "./ConfirmDialog";
import {
  Plus,
  Key,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  X,
  FileText,
  Database,
  Image,
  Users,
  Settings,
  ChevronRight,
  Globe,
  Share2,
  Save,
  Check,
  Play,
  Loader2,
  ChevronDown,
} from "lucide-react";

const API_METHOD_STORAGE_KEY = "cms-admin-api-method";

export type ApiAccessMethod = "rest" | "graphql";

function readStoredApiMethod(): ApiAccessMethod {
  try {
    const raw = localStorage.getItem(API_METHOD_STORAGE_KEY);
    if (raw === "graphql" || raw === "rest") return raw;
  } catch {
    /* ignore */
  }
  return "rest";
}

interface ApiToken {
  id: string;
  name: string;
  token: string;
  type: "Full Access" | "Read Only" | "Custom";
  createdAt: string;
  lastUsed: string;
  expiresAt?: string;
  permissions?: ApiPermissions;
}

interface ApiPermissions {
  contentTypes: {
    [key: string]: {
      enabled: boolean;
      find: boolean;
      findOne: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      publish?: boolean;
    };
  };
  media: {
    enabled: boolean;
    find: boolean;
    findOne: boolean;
    upload: boolean;
    delete: boolean;
  };
  users: {
    enabled: boolean;
    find: boolean;
    findOne: boolean;
    me: boolean;
  };
}

interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: {
    contentTypes: { read: boolean; create: boolean; update: boolean; delete: boolean };
    media: { read: boolean; create: boolean; update: boolean; delete: boolean };
    users: { read: boolean; create: boolean; update: boolean; delete: boolean };
  };
}

type ContentTypeItem = { id: string; name: string; pluralName: string; icon: typeof FileText; color: string };


function CreateTokenModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, accessLevel: string, expiresAt?: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [accessLevel, setAccessLevel] = useState('full');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onCreate(name.trim(), accessLevel, expiresAt || undefined);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Create API Token</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Token Name <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Production API"
              className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Token Type</label>
            <select value={accessLevel} onChange={e => setAccessLevel(e.target.value)}
              className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700">
              <option value="full">Full Access</option>
              <option value="read_only">Read Only</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expiration (Optional)</label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700" />
          </div>
          <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-4">
            <p className="text-sm text-stone-600 dark:text-zinc-400">Make sure to copy your API token now. You won't be able to see it again!</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !name.trim()}
            className="px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50">
            {saving ? 'Generating...' : 'Generate Token'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApiPermissions() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<"tokens" | "roles" | "apiSettings">(
    "tokens"
  );
  const [apiMethod, setApiMethod] = useState<ApiAccessMethod>(readStoredApiMethod);
  const [apiSettingsSavedFlash, setApiSettingsSavedFlash] = useState(false);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [contentTypesData, setContentTypesData] = useState<ContentTypeItem[]>([]);

  useEffect(() => {
    api.contentTypes.list()
      .then(res => {
        const icons = [FileText, Database, Settings, Users, Share2, Globe];
        const colors = ["blue", "green", "purple", "orange", "cyan", "pink"];
        const items = (res.data as Record<string, unknown>[]).map((t, i) => ({
          id: (t['singularName'] as string) ?? (t['uid'] as string),
          name: (t['displayName'] as string) ?? (t['uid'] as string),
          pluralName: (t['pluralName'] as string) ?? (t['displayName'] as string) ?? '',
          icon: icons[i % icons.length],
          color: colors[i % colors.length],
        }));
        setContentTypesData(items);
      })
      .catch(() => setContentTypesData([]));
  }, []);

  useEffect(() => {
    setRolesLoading(true);
    api.roles.list()
      .then(res => {
        const apiRoles = (res.data as Record<string, unknown>[]).map(r => ({
          id: r['id'] as string,
          name: r['name'] as string,
          description: r['description'] as string,
          usersCount: r['usersCount'] as number ?? 0,
          permissions: r['permissions'] as Role['permissions'],
        }));
        setRoles(apiRoles);
      })
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, []);

  useEffect(() => {
    api.apiTokens.list()
      .then(res => {
        const apiTokens = (res.data as unknown[]).map((t: unknown) => {
          const tok = t as Record<string, unknown>;
          return {
            id: tok['id'] as string,
            name: tok['name'] as string,
            token: tok['tokenPreview'] as string ?? '••••••••••••••••••••••••',
            type: (tok['accessLevel'] === 'full' ? 'Full Access' : tok['accessLevel'] === 'read_only' ? 'Read Only' : 'Custom') as ApiToken['type'],
            createdAt: new Date(tok['createdAt'] as string).toISOString().split('T')[0],
            lastUsed: tok['lastUsedAt'] ? new Date(tok['lastUsedAt'] as string).toLocaleDateString() : 'Never',
          } satisfies ApiToken;
        });
        setTokens(apiTokens);
      })
      .catch(() => {
        // Non-admin role — no tokens visible
        setTokens([]);
      });
  }, []);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleTokenVisibility = (id: string) => {
    const newVisible = new Set(visibleTokens);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleTokens(newVisible);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    // Could add toast notification here
  };

  const setApiAccessMethod = (method: ApiAccessMethod) => {
    setApiMethod(method);
    try {
      localStorage.setItem(API_METHOD_STORAGE_KEY, method);
    } catch {
      /* ignore */
    }
  };

  const handleSaveApiSettings = async () => {
    try {
      await api.settings.save("general", { apiMethod });
    } catch {
      /* Non-critical — keep going */
    }
    try { localStorage.setItem(API_METHOD_STORAGE_KEY, apiMethod); } catch { /* ignore */ }
    setApiSettingsSavedFlash(true);
    window.setTimeout(() => setApiSettingsSavedFlash(false), 2000);
  };

  const getEnabledContentTypesCount = (permissions?: ApiPermissions) => {
    if (!permissions) return 0;
    return Object.values(permissions.contentTypes).filter(ct => ct.enabled).length;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">API & Permissions</h1>
            <p className="text-stone-600 dark:text-zinc-400">Manage API tokens and user roles</p>
          </div>
          {activeTab === "apiSettings" ? (
            <button
              type="button"
              onClick={handleSaveApiSettings}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium"
            >
              {apiSettingsSavedFlash ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() =>
                activeTab === "tokens"
                  ? setShowTokenModal(true)
                  : setShowRoleModal(true)
              }
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "tokens" ? "Create API Token" : "Create Role"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-stone-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "tokens"
                ? "border-stone-300 dark:border-zinc-100 text-stone-900 dark:text-zinc-100"
                : "border-transparent text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100"
            }`}
          >
            API Tokens
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "roles"
                ? "border-stone-300 dark:border-zinc-100 text-stone-900 dark:text-zinc-100"
                : "border-transparent text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100"
            }`}
          >
            Roles & Permissions
          </button>
          <button
            onClick={() => setActiveTab("apiSettings")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "apiSettings"
                ? "border-stone-300 dark:border-zinc-100 text-stone-900 dark:text-zinc-100"
                : "border-transparent text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100"
            }`}
          >
            API Settings
          </button>
        </div>

        {/* API Tokens Tab */}
        {activeTab === "tokens" && (
          <div className="space-y-4">
            {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
            {tokenError && <p className="text-sm text-red-400">{tokenError}</p>}
            {tokens.map((token) => (
              <div
                key={token.id}
                className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-stone-400 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-stone-200 dark:bg-zinc-800 rounded flex items-center justify-center">
                        <Key className="w-6 h-6 text-stone-600 dark:text-zinc-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{token.name}</h3>
                        <p className="text-sm text-stone-600 dark:text-zinc-400 mb-2">
                          Created {token.createdAt} • Last used {token.lastUsed}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                            {token.type}
                          </span>
                          <span className="text-xs text-stone-500 dark:text-zinc-500">
                            {getEnabledContentTypesCount(token.permissions)}/{contentTypesData.length} Content Types
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedToken(token)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 active:bg-stone-400/90 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 rounded text-sm transition-colors"
                      >
                        Configure Permissions
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "API Token Sil",
                            message: `"${token.name}" token'ını silmek istediğine emin misin? Bu işlem geri alınamaz.`,
                            confirmLabel: "Evet, Sil",
                            variant: "danger",
                          });
                          if (!ok) return;
                          setDeleteError(null);
                          try {
                            await api.apiTokens.delete(token.id);
                            setTokens(prev => prev.filter(t => t.id !== token.id));
                          } catch (err: unknown) {
                            setDeleteError(err instanceof Error ? err.message : "Failed to delete token.");
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-4 flex items-center gap-3">
                    <code className="flex-1 text-sm font-mono text-stone-700 dark:text-zinc-300">
                      {visibleTokens.has(token.id) ? token.token : "••••••••••••••••••••••••••••••••"}
                    </code>
                    <button
                      onClick={() => toggleTokenVisibility(token.id)}
                      className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
                    >
                      {visibleTokens.has(token.id) ? (
                        <EyeOff className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToken(token.token)}
                      className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                    </button>
                  </div>
                </div>

                {/* Quick Permissions Overview */}
                {token.permissions && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-4 gap-3">
                      {contentTypesData.map((ct) => {
                        const perms = token.permissions?.contentTypes[ct.id];
                        if (!perms?.enabled) return null;
                        
                        const activePerms = [
                          perms.find && "read",
                          perms.create && "create",
                          perms.update && "update",
                          perms.delete && "delete",
                        ].filter(Boolean);

                        return (
                          <div
                            key={ct.id}
                            className={`bg-stone-100 dark:bg-zinc-950 rounded-lg p-3 ${ 
                              ct.id === 'articles' ? 'border border-blue-500/20' :
                              ct.id === 'pages' ? 'border border-green-500/20' :
                              ct.id === 'products' ? 'border border-purple-500/20' :
                              ct.id === 'team' ? 'border border-orange-500/20' :
                              'border border-stone-200 dark:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <ct.icon className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                              <span className="text-sm font-medium">{ct.name}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {activePerms.map((perm) => (
                                <span
                                  key={perm}
                                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                    perm === 'read' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    perm === 'create' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    perm === 'update' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                    perm === 'delete' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    'bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
                                  }`}
                                >
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* API Settings — REST vs GraphQL */}
        {activeTab === "apiSettings" && (
          <div className="w-full space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg p-6 w-full">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-zinc-100 mb-1">
                Default API method
              </h2>
              <p className="text-sm text-stone-600 dark:text-zinc-400 mb-6">
                Choose how client apps primarily access your headless CMS. Both
                endpoints can stay enabled on the server; this preference drives
                dashboard examples and generated snippets.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setApiAccessMethod("rest")}
                  className={`text-left rounded-lg border p-5 transition-all ${
                    apiMethod === "rest"
                      ? "border-stone-300 dark:border-zinc-100 bg-stone-200/75 dark:bg-zinc-800/40 ring-1 ring-stone-300/25 dark:ring-zinc-100/20"
                      : "border-stone-200 dark:border-zinc-800 bg-white/75 dark:bg-zinc-950/50 hover:border-stone-400 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-stone-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-stone-900 dark:text-zinc-100">REST</span>
                        {apiMethod === "rest" && (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-zinc-500 mb-3">
                        Resource URLs, JSON bodies, standard HTTP verbs (GET,
                        POST, PUT, DELETE).
                      </p>
                      <code className="text-[11px] text-stone-600 dark:text-zinc-400 font-mono block break-all">
                        GET /api/articles · POST /api/articles
                      </code>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setApiAccessMethod("graphql")}
                  className={`text-left rounded-lg border p-5 transition-all ${
                    apiMethod === "graphql"
                      ? "border-stone-300 dark:border-zinc-100 bg-stone-200/75 dark:bg-zinc-800/40 ring-1 ring-stone-300/25 dark:ring-zinc-100/20"
                      : "border-stone-200 dark:border-zinc-800 bg-white/75 dark:bg-zinc-950/50 hover:border-stone-400 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-stone-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Share2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-stone-900 dark:text-zinc-100">
                          GraphQL
                        </span>
                        {apiMethod === "graphql" && (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-zinc-500 mb-3">
                        One endpoint, typed schema, queries and mutations with
                        the fields you need.
                      </p>
                      <code className="text-[11px] text-stone-600 dark:text-zinc-400 font-mono block">
                        POST /api/graphql
                      </code>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-xs text-stone-600 dark:text-zinc-600 mt-5">
                Preference is saved in this browser ({apiMethod.toUpperCase()}).
              </p>
            </div>

            <ApiTester method={apiMethod} />
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            {rolesLoading && (
              <div className="flex items-center justify-center h-32 text-stone-500 dark:text-zinc-500 text-sm">Loading roles...</div>
            )}
            {!rolesLoading && roles.length === 0 && (
              <div className="flex items-center justify-center h-32 text-stone-500 dark:text-zinc-500 text-sm">No roles found.</div>
            )}
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg p-6 hover:border-stone-400 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-stone-200 dark:bg-zinc-800 rounded flex items-center justify-center">
                      <Shield className="w-6 h-6 text-stone-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{role.name}</h3>
                      <p className="text-sm text-stone-600 dark:text-zinc-400 mb-2">{role.description}</p>
                      <span className="text-xs text-stone-500 dark:text-zinc-500">{role.usersCount} users with this role</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRole(role)}
                    className="px-3 py-1.5 bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 active:bg-stone-400/90 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 rounded text-sm transition-colors"
                  >
                    Edit Permissions
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <PermissionCard
                    icon={FileText}
                    title="Content Types"
                    permissions={role.permissions.contentTypes}
                  />
                  <PermissionCard
                    icon={Image}
                    title="Media"
                    permissions={role.permissions.media}
                  />
                  <PermissionCard
                    icon={Users}
                    title="Users"
                    permissions={role.permissions.users}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* API Token Permissions Modal */}
        {selectedToken && (
          <ApiTokenPermissionsModal
            token={selectedToken}
            onClose={() => setSelectedToken(null)}
            contentTypes={contentTypesData}
          />
        )}

        {/* Create Token Modal */}
        {showTokenModal && <CreateTokenModal
          onClose={() => setShowTokenModal(false)}
          onCreate={async (name, accessLevel, expiresAt) => {
            try {
              const res = await api.apiTokens.create({ name, accessLevel, expiresAt });
              const tok = (res as { data: Record<string, unknown> }).data;
              const newToken: ApiToken = {
                id: tok['id'] as string,
                name: tok['name'] as string,
                token: tok['token'] as string ?? '••••••••••••••••••••••••',
                type: accessLevel === 'full' ? 'Full Access' : accessLevel === 'read_only' ? 'Read Only' : 'Custom',
                createdAt: new Date().toISOString().split('T')[0],
                lastUsed: 'Never',
              };
              setTokens(prev => [newToken, ...prev]);
              // Show the token (user needs to copy it once)
              setVisibleTokens(prev => new Set([...prev, newToken.id]));
              setShowTokenModal(false);
            } catch (err: unknown) {
              setTokenError(err instanceof Error ? err.message : "Failed to create token.");
            }
          }}
        />}

        {/* Create Role — Coming Soon Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-zinc-800">
                <h2 className="text-lg font-semibold">Create Role</h2>
                <button onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-300 mb-1">Role management coming soon</p>
                    <p className="text-sm text-stone-600 dark:text-zinc-400">
                      Custom role creation is not yet available. Currently 5 built-in roles are available: <span className="text-stone-700 dark:text-zinc-300">super_admin, admin, editor, author, viewer</span>.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-stone-500 dark:text-zinc-500">
                  Roles can be assigned to users in the <span className="text-stone-700 dark:text-zinc-300">User Management</span> section. Custom role CRUD with granular permissions will be added in a future update.
                </p>
              </div>
              <div className="flex justify-end px-6 py-4 border-t border-stone-200 dark:border-zinc-800">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium text-sm"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Permissions Modal */}
        {selectedRole && (
          <EditRoleModal
            role={selectedRole}
            onClose={() => setSelectedRole(null)}
            onSave={(updatedRole) => {
              setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
              setSelectedRole(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function ApiTokenPermissionsModal({
  token,
  onClose,
  contentTypes,
}: {
  token: ApiToken;
  onClose: () => void;
  contentTypes: ContentTypeItem[];
}) {
  const [permissions, setPermissions] = useState(token.permissions || {
    contentTypes: {},
    media: { enabled: false, find: false, findOne: false, upload: false, delete: false },
    users: { enabled: false, find: false, findOne: false, me: false },
  });

  const toggleContentType = (ctId: string, field: string, value: boolean) => {
    setPermissions({
      ...permissions,
      contentTypes: {
        ...permissions.contentTypes,
        [ctId]: {
          ...permissions.contentTypes[ctId],
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div>
            <h2 className="text-xl font-semibold">{token.name} - API Permissions</h2>
            <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">Configure content access for this API token</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Content Types Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Content Types</h3>
            <div className="space-y-4">
              {contentTypes.map((ct) => {
                const ctPerms = permissions.contentTypes[ct.id] || {
                  enabled: false,
                  find: false,
                  findOne: false,
                  create: false,
                  update: false,
                  delete: false,
                  publish: false,
                };

                return (
                  <div
                    key={ct.id}
                    className={`rounded-lg overflow-hidden border ${
                      ct.color === 'blue' ? 'border-blue-500/20' :
                      ct.color === 'green' ? 'border-green-500/20' :
                      ct.color === 'purple' ? 'border-purple-500/20' :
                      ct.color === 'orange' ? 'border-orange-500/20' :
                      'border-stone-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className={`p-4 border-b flex items-center justify-between ${
                      ct.color === 'blue' ? 'bg-blue-500/5 border-blue-500/20' :
                      ct.color === 'green' ? 'bg-green-500/5 border-green-500/20' :
                      ct.color === 'purple' ? 'bg-purple-500/5 border-purple-500/20' :
                      ct.color === 'orange' ? 'bg-orange-500/5 border-orange-500/20' :
                      'bg-stone-100 dark:bg-zinc-950 border-stone-200 dark:border-zinc-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <ct.icon className={`w-5 h-5 ${
                          ct.color === 'blue' ? 'text-blue-400' :
                          ct.color === 'green' ? 'text-green-400' :
                          ct.color === 'purple' ? 'text-purple-400' :
                          ct.color === 'orange' ? 'text-orange-400' :
                          'text-stone-600 dark:text-zinc-400'
                        }`} />
                        <div>
                          <h4 className="font-medium">{ct.pluralName}</h4>
                          <p className="text-xs text-stone-500 dark:text-zinc-500">API ID: {ct.id}</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-stone-600 dark:text-zinc-400">Enable</span>
                        <input
                          type="checkbox"
                          checked={ctPerms.enabled}
                          onChange={(e) => toggleContentType(ct.id, "enabled", e.target.checked)}
                          className="w-4 h-4"
                        />
                      </label>
                    </div>

                    {ctPerms.enabled && (
                      <div className="p-4 bg-stone-100 dark:bg-zinc-950">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <PermissionCheckbox
                            label="find"
                            description="Get list"
                            checked={ctPerms.find}
                            onChange={(checked) => toggleContentType(ct.id, "find", checked)}
                          />
                          <PermissionCheckbox
                            label="findOne"
                            description="Get one by ID"
                            checked={ctPerms.findOne}
                            onChange={(checked) => toggleContentType(ct.id, "findOne", checked)}
                          />
                          <PermissionCheckbox
                            label="create"
                            description="Create new"
                            checked={ctPerms.create}
                            onChange={(checked) => toggleContentType(ct.id, "create", checked)}
                          />
                          <PermissionCheckbox
                            label="update"
                            description="Update existing"
                            checked={ctPerms.update}
                            onChange={(checked) => toggleContentType(ct.id, "update", checked)}
                          />
                          <PermissionCheckbox
                            label="delete"
                            description="Delete entry"
                            checked={ctPerms.delete}
                            onChange={(checked) => toggleContentType(ct.id, "delete", checked)}
                          />
                          <PermissionCheckbox
                            label="publish"
                            description="Publish/unpublish"
                            checked={ctPerms.publish || false}
                            onChange={(checked) => toggleContentType(ct.id, "publish", checked)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Media Library</h3>
            <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-stone-600 dark:text-zinc-400" />
                  <h4 className="font-medium">Media Access</h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-stone-600 dark:text-zinc-400">Enable</span>
                  <input
                    type="checkbox"
                    checked={permissions.media.enabled}
                    className="w-4 h-4"
                  />
                </label>
              </div>

              {permissions.media.enabled && (
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <PermissionCheckbox
                      label="find"
                      description="List files"
                      checked={permissions.media.find}
                    />
                    <PermissionCheckbox
                      label="findOne"
                      description="Get file details"
                      checked={permissions.media.findOne}
                    />
                    <PermissionCheckbox
                      label="upload"
                      description="Upload files"
                      checked={permissions.media.upload}
                    />
                    <PermissionCheckbox
                      label="delete"
                      description="Delete files"
                      checked={permissions.media.delete}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Users Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Users & Authentication</h3>
            <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-stone-600 dark:text-zinc-400" />
                  <h4 className="font-medium">User Access</h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-stone-600 dark:text-zinc-400">Enable</span>
                  <input
                    type="checkbox"
                    checked={permissions.users.enabled}
                    className="w-4 h-4"
                  />
                </label>
              </div>

              {permissions.users.enabled && (
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <PermissionCheckbox
                      label="find"
                      description="List users"
                      checked={permissions.users.find}
                    />
                    <PermissionCheckbox
                      label="findOne"
                      description="Get user details"
                      checked={permissions.users.findOne}
                    />
                    <PermissionCheckbox
                      label="me"
                      description="Get current user"
                      checked={permissions.users.me}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900">
          <div className="text-sm text-stone-600 dark:text-zinc-400">
            {Object.values(permissions.contentTypes).filter(ct => ct.enabled).length} content types enabled
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button className="px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium">
              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionCheckbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 p-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-zinc-700 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 mt-0.5"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-stone-500 dark:text-zinc-500">{description}</p>
      </div>
    </label>
  );
}

function PermissionCard({
  icon: Icon,
  title,
  permissions,
}: {
  icon: any;
  title: string;
  permissions: { read: boolean; create: boolean; update: boolean; delete: boolean };
}) {
  const activeCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {permissions.read && <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded">Read</span>}
        {permissions.create && <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded">Create</span>}
        {permissions.update && <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded">Update</span>}
        {permissions.delete && <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded">Delete</span>}
      </div>
    </div>
  );
}

function PermissionSection({
  icon: Icon,
  title,
  permissions,
}: {
  icon: any;
  title: string;
  permissions: { read: boolean; create: boolean; update: boolean; delete: boolean };
}) {
  return (
    <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-stone-200 dark:bg-zinc-800 rounded flex items-center justify-center">
          <Icon className="w-5 h-5 text-stone-600 dark:text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-zinc-700 transition-colors">
          <input type="checkbox" checked={permissions.read} readOnly className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Read</p>
            <p className="text-xs text-stone-600 dark:text-zinc-400">View {title.toLowerCase()}</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-zinc-700 transition-colors">
          <input type="checkbox" checked={permissions.create} readOnly className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Create</p>
            <p className="text-xs text-stone-600 dark:text-zinc-400">Add new items</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-zinc-700 transition-colors">
          <input type="checkbox" checked={permissions.update} readOnly className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Update</p>
            <p className="text-xs text-stone-600 dark:text-zinc-400">Edit existing items</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-zinc-700 transition-colors">
          <input type="checkbox" checked={permissions.delete} readOnly className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Delete</p>
            <p className="text-xs text-stone-600 dark:text-zinc-400">Remove items</p>
          </div>
        </label>
      </div>
    </div>
  );
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

const REST_PRESETS = [
  { label: "List content types", method: "GET" as HttpMethod, path: "/api/content-types" },
  { label: "Get setup status", method: "GET" as HttpMethod, path: "/api/setup/status" },
  { label: "Current user", method: "GET" as HttpMethod, path: "/api/auth/me" },
  { label: "List media files", method: "GET" as HttpMethod, path: "/api/upload/files" },
  { label: "List users", method: "GET" as HttpMethod, path: "/api/admin/users" },
  { label: "List roles", method: "GET" as HttpMethod, path: "/api/admin/roles" },
];

const GRAPHQL_PRESETS = [
  {
    label: "Introspection",
    query: `query Introspection {
  __schema {
    queryType { name }
    types {
      name
      kind
    }
  }
}`,
  },
  {
    label: "Content types",
    query: `query ContentTypes {
  contentTypes {
    uid
    displayName
    singularName
    pluralName
  }
}`,
  },
];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-blue-400",
  PUT: "text-amber-400",
  DELETE: "text-red-400",
  PATCH: "text-violet-400",
};

function ApiTester({ method: apiMode }: { method: ApiAccessMethod }) {
  const [httpMethod, setHttpMethod] = useState<HttpMethod>("GET");
  const [path, setPath] = useState("/api/content-types");
  const [body, setBody] = useState("");
  const [gqlQuery, setGqlQuery] = useState(GRAPHQL_PRESETS[0].query);
  const [gqlVars, setGqlVars] = useState("");
  const [response, setResponse] = useState<{ status: number; time: number; body: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const sendRequest = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    const token = getAccessToken();
    const headers: Record<string, string> = {
      "X-Wolent-Tenant": "default",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const start = performance.now();
    try {
      let res: Response;
      if (apiMode === "graphql") {
        headers["Content-Type"] = "application/json";
        const gqlBody: Record<string, unknown> = { query: gqlQuery };
        if (gqlVars.trim()) {
          try { gqlBody.variables = JSON.parse(gqlVars); } catch { /* ignore */ }
        }
        res = await fetch("/api/graphql", {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(gqlBody),
        });
      } else {
        const opts: RequestInit = { method: httpMethod, headers, credentials: "include" };
        if (body.trim() && httpMethod !== "GET") {
          headers["Content-Type"] = "application/json";
          opts.body = body;
        }
        res = await fetch(path, opts);
      }
      const elapsed = Math.round(performance.now() - start);
      const text = await res.text();
      let formatted = text;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not json */ }
      setResponse({ status: res.status, time: elapsed, body: formatted, ok: res.ok });
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setResponse({ status: 0, time: elapsed, body: err instanceof Error ? err.message : "Network error", ok: false });
    } finally {
      setLoading(false);
    }
  }, [apiMode, httpMethod, path, body, gqlQuery, gqlVars]);

  const applyRestPreset = (preset: typeof REST_PRESETS[0]) => {
    setHttpMethod(preset.method);
    setPath(preset.path);
    setBody("");
    setShowPresets(false);
  };

  const applyGqlPreset = (preset: typeof GRAPHQL_PRESETS[0]) => {
    setGqlQuery(preset.query);
    setGqlVars("");
    setShowPresets(false);
  };

  const statusColor = response
    ? response.status >= 200 && response.status < 300 ? "text-emerald-400"
      : response.status >= 400 && response.status < 500 ? "text-amber-400"
        : response.status >= 500 ? "text-red-400" : "text-stone-600 dark:text-zinc-400"
    : "text-stone-600 dark:text-zinc-400";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-zinc-100">API Playground</h2>
          <p className="text-xs text-stone-500 dark:text-zinc-500 mt-0.5">
            {apiMode === "rest" ? "Send REST requests to test your API endpoints" : "Send GraphQL queries to test your schema"}
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPresets(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-zinc-400 bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 active:bg-stone-400/90 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 rounded-md transition-colors"
          >
            Presets <ChevronDown className="w-3 h-3" />
          </button>
          {showPresets && (
            <div className="absolute right-0 top-full mt-1 z-30 w-56 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden">
              {apiMode === "rest" ? (
                REST_PRESETS.map((p, i) => (
                  <button key={i} type="button" onClick={() => applyRestPreset(p)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-stone-300 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors">
                    <span className={`text-[10px] font-mono font-bold ${METHOD_COLORS[p.method]}`}>{p.method}</span>
                    <span className="text-stone-700 dark:text-zinc-300 truncate">{p.label}</span>
                  </button>
                ))
              ) : (
                GRAPHQL_PRESETS.map((p, i) => (
                  <button key={i} type="button" onClick={() => applyGqlPreset(p)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-stone-300 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 transition-colors">
                    {p.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {apiMode === "rest" ? (
          <>
            <div className="flex gap-2">
              <select
                value={httpMethod}
                onChange={e => setHttpMethod(e.target.value as HttpMethod)}
                className={`w-28 shrink-0 px-3 py-2.5 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600 ${METHOD_COLORS[httpMethod]}`}
              >
                {HTTP_METHODS.map(m => <option key={m} value={m} className="text-stone-700 dark:text-zinc-300">{m}</option>)}
              </select>
              <input
                type="text"
                value={path}
                onChange={e => setPath(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendRequest(); }}
                placeholder="/api/content-types"
                className="flex-1 px-3 py-2.5 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-sm font-mono text-stone-800 dark:text-zinc-200 placeholder:text-stone-500 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600"
              />
              <button
                type="button"
                onClick={sendRequest}
                disabled={loading}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Send
              </button>
            </div>
            {httpMethod !== "GET" && (
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-zinc-500 mb-1">Request Body (JSON)</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={4}
                  placeholder='{ "key": "value" }'
                  className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-sm font-mono text-stone-800 dark:text-zinc-200 placeholder:text-stone-500 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600 resize-y"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-zinc-500 mb-1">Query</label>
              <textarea
                value={gqlQuery}
                onChange={e => setGqlQuery(e.target.value)}
                rows={6}
                placeholder="{ contentTypes { uid displayName } }"
                className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-sm font-mono text-stone-800 dark:text-zinc-200 placeholder:text-stone-500 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600 resize-y"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-zinc-500 mb-1">Variables (JSON, optional)</label>
              <textarea
                value={gqlVars}
                onChange={e => setGqlVars(e.target.value)}
                rows={2}
                placeholder='{ "id": "1" }'
                className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-sm font-mono text-stone-800 dark:text-zinc-200 placeholder:text-stone-500 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600 resize-y"
              />
            </div>
            <button
              type="button"
              onClick={sendRequest}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Execute Query
            </button>
          </>
        )}

        {response && (
          <div className="rounded-lg border border-stone-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-white/88 dark:bg-zinc-950/80 border-b border-stone-200 dark:border-zinc-800 flex items-center gap-4 text-xs">
              <span className={`font-mono font-bold ${statusColor}`}>
                {response.status || "ERR"}
              </span>
              <span className="text-stone-500 dark:text-zinc-500">{response.time}ms</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                response.ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              }`}>
                {response.ok ? "OK" : "ERROR"}
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(response.body)}
                className="ml-auto text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 transition-colors"
                title="Copy response"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-stone-700 dark:text-zinc-300 overflow-auto max-h-80 bg-stone-100/92 dark:bg-zinc-950/40 leading-relaxed">
              {response.body}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function EditRoleModal({
  role,
  onClose,
  onSave,
}: {
  role: Role;
  onClose: () => void;
  onSave: (updated: Role) => void;
}) {
  const [perms, setPerms] = useState(() => ({
    contentTypes: { ...role.permissions.contentTypes },
    media: { ...role.permissions.media },
    users: { ...role.permissions.users },
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (section: 'contentTypes' | 'media' | 'users', key: string) => {
    setPerms(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: !(prev[section] as Record<string, boolean>)[key] },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.roles.updatePermissions(role.id, perms);
      onSave({ ...role, permissions: perms });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const sections: { key: 'contentTypes' | 'media' | 'users'; title: string; icon: any }[] = [
    { key: 'contentTypes', title: 'Content Types', icon: FileText },
    { key: 'media', title: 'Media Library', icon: Image },
    { key: 'users', title: 'User Management', icon: Users },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold">{role.name} Permissions</h2>
            <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">{role.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {sections.map(({ key, title, icon: Icon }) => (
            <div key={key} className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-stone-200 dark:bg-zinc-800 rounded flex items-center justify-center">
                  <Icon className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                </div>
                <h3 className="font-semibold">{title}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(perms[key]).map(([perm, val]) => (
                  <label
                    key={perm}
                    className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-zinc-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={val as boolean}
                      onChange={() => toggle(key, perm)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}