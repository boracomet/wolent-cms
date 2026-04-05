import { useState, useEffect } from "react";
import { api } from "../api/client";
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

const contentTypesData = [
  { id: "articles", name: "Article", pluralName: "Articles", icon: FileText, color: "blue" },
  { id: "pages", name: "Page", pluralName: "Pages", icon: Database, color: "green" },
  { id: "products", name: "Product", pluralName: "Products", icon: Settings, color: "purple" },
  { id: "team", name: "Team Member", pluralName: "Team Members", icon: Users, color: "orange" },
];


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
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">Create API Token</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Token Name <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Production API"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Token Type</label>
            <select value={accessLevel} onChange={e => setAccessLevel(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700">
              <option value="full">Full Access</option>
              <option value="read_only">Read Only</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expiration (Optional)</label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700" />
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-sm text-zinc-400">Make sure to copy your API token now. You won't be able to see it again!</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !name.trim()}
            className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50">
            {saving ? 'Generating...' : 'Generate Token'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApiPermissions() {
  const [activeTab, setActiveTab] = useState<"tokens" | "roles" | "apiSettings">(
    "tokens"
  );
  const [apiMethod, setApiMethod] = useState<ApiAccessMethod>(readStoredApiMethod);
  const [apiSettingsSavedFlash, setApiSettingsSavedFlash] = useState(false);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

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

  const handleSaveApiSettings = () => {
    try {
      localStorage.setItem(API_METHOD_STORAGE_KEY, apiMethod);
    } catch {
      /* ignore */
    }
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
            <p className="text-zinc-400">Manage API tokens and user roles</p>
          </div>
          {activeTab === "apiSettings" ? (
            <button
              type="button"
              onClick={handleSaveApiSettings}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
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
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "tokens" ? "Create API Token" : "Create Role"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "tokens"
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-100"
            }`}
          >
            API Tokens
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "roles"
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-100"
            }`}
          >
            Roles & Permissions
          </button>
          <button
            onClick={() => setActiveTab("apiSettings")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "apiSettings"
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-100"
            }`}
          >
            API Settings
          </button>
        </div>

        {/* API Tokens Tab */}
        {activeTab === "tokens" && (
          <div className="space-y-4">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center">
                        <Key className="w-6 h-6 text-zinc-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{token.name}</h3>
                        <p className="text-sm text-zinc-400 mb-2">
                          Created {token.createdAt} • Last used {token.lastUsed}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                            {token.type}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {getEnabledContentTypesCount(token.permissions)}/{contentTypesData.length} Content Types
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedToken(token)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors"
                      >
                        Configure Permissions
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-zinc-800 rounded transition-colors"
                        onClick={async () => {
                          if (!confirm(`Delete "${token.name}"?`)) return;
                          try {
                            await api.apiTokens.delete(token.id);
                            setTokens(prev => prev.filter(t => t.id !== token.id));
                          } catch { alert('Failed to delete token'); }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-center gap-3">
                    <code className="flex-1 text-sm font-mono text-zinc-300">
                      {visibleTokens.has(token.id) ? token.token : "••••••••••••••••••••••••••••••••"}
                    </code>
                    <button
                      onClick={() => toggleTokenVisibility(token.id)}
                      className="p-2 hover:bg-zinc-800 rounded transition-colors"
                    >
                      {visibleTokens.has(token.id) ? (
                        <EyeOff className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToken(token.token)}
                      className="p-2 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-zinc-400" />
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
                            className={`bg-zinc-950 rounded-lg p-3 ${ 
                              ct.id === 'articles' ? 'border border-blue-500/20' :
                              ct.id === 'pages' ? 'border border-green-500/20' :
                              ct.id === 'products' ? 'border border-purple-500/20' :
                              ct.id === 'team' ? 'border border-orange-500/20' :
                              'border border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <ct.icon className="w-4 h-4 text-zinc-400" />
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
                                    'bg-zinc-800 text-zinc-400'
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full">
              <h2 className="text-lg font-semibold text-zinc-100 mb-1">
                Default API method
              </h2>
              <p className="text-sm text-zinc-400 mb-6">
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
                      ? "border-zinc-100 bg-zinc-800/40 ring-1 ring-zinc-100/20"
                      : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-zinc-100">REST</span>
                        {apiMethod === "rest" && (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-zinc-100 text-zinc-950 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mb-3">
                        Resource URLs, JSON bodies, standard HTTP verbs (GET,
                        POST, PUT, DELETE).
                      </p>
                      <code className="text-[11px] text-zinc-400 font-mono block break-all">
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
                      ? "border-zinc-100 bg-zinc-800/40 ring-1 ring-zinc-100/20"
                      : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <Share2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-zinc-100">
                          GraphQL
                        </span>
                        {apiMethod === "graphql" && (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-zinc-100 text-zinc-950 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mb-3">
                        One endpoint, typed schema, queries and mutations with
                        the fields you need.
                      </p>
                      <code className="text-[11px] text-zinc-400 font-mono block">
                        POST /graphql
                      </code>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-xs text-zinc-600 mt-5">
                Preference is saved in this browser ({apiMethod.toUpperCase()}).
              </p>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center">
                      <Shield className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{role.name}</h3>
                      <p className="text-sm text-zinc-400 mb-2">{role.description}</p>
                      <span className="text-xs text-zinc-500">{role.usersCount} users with this role</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRole(role)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors"
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
            } catch {
              alert('Failed to create token');
            }
          }}
        />}

        {/* Edit Role Permissions Modal */}
        {selectedRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-semibold">{selectedRole.name} Permissions</h2>
                  <p className="text-sm text-zinc-400 mt-1">{selectedRole.description}</p>
                </div>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="p-2 hover:bg-zinc-800 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <PermissionSection
                  icon={FileText}
                  title="Content Types"
                  permissions={selectedRole.permissions.contentTypes}
                />
                <PermissionSection
                  icon={Image}
                  title="Media Library"
                  permissions={selectedRole.permissions.media}
                />
                <PermissionSection
                  icon={Users}
                  title="User Management"
                  permissions={selectedRole.permissions.users}
                />
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
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
  contentTypes: typeof contentTypesData;
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div>
            <h2 className="text-xl font-semibold">{token.name} - API Permissions</h2>
            <p className="text-sm text-zinc-400 mt-1">Configure content access for this API token</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded transition-colors"
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
                      'border-zinc-800'
                    }`}
                  >
                    <div className={`p-4 border-b flex items-center justify-between ${
                      ct.color === 'blue' ? 'bg-blue-500/5 border-blue-500/20' :
                      ct.color === 'green' ? 'bg-green-500/5 border-green-500/20' :
                      ct.color === 'purple' ? 'bg-purple-500/5 border-purple-500/20' :
                      ct.color === 'orange' ? 'bg-orange-500/5 border-orange-500/20' :
                      'bg-zinc-950 border-zinc-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <ct.icon className={`w-5 h-5 ${
                          ct.color === 'blue' ? 'text-blue-400' :
                          ct.color === 'green' ? 'text-green-400' :
                          ct.color === 'purple' ? 'text-purple-400' :
                          ct.color === 'orange' ? 'text-orange-400' :
                          'text-zinc-400'
                        }`} />
                        <div>
                          <h4 className="font-medium">{ct.pluralName}</h4>
                          <p className="text-xs text-zinc-500">API ID: {ct.id}</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-zinc-400">Enable</span>
                        <input
                          type="checkbox"
                          checked={ctPerms.enabled}
                          onChange={(e) => toggleContentType(ct.id, "enabled", e.target.checked)}
                          className="w-4 h-4"
                        />
                      </label>
                    </div>

                    {ctPerms.enabled && (
                      <div className="p-4 bg-zinc-950">
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
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-zinc-400" />
                  <h4 className="font-medium">Media Access</h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-zinc-400">Enable</span>
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
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-zinc-400" />
                  <h4 className="font-medium">User Access</h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-zinc-400">Enable</span>
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

        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-900">
          <div className="text-sm text-zinc-400">
            {Object.values(permissions.contentTypes).filter(ct => ct.enabled).length} content types enabled
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
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
    <label className="flex items-start gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 mt-0.5"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
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
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-zinc-400" />
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
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center">
          <Icon className="w-5 h-5 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
          <input type="checkbox" defaultChecked={permissions.read} className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Read</p>
            <p className="text-xs text-zinc-400">View {title.toLowerCase()}</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
          <input type="checkbox" defaultChecked={permissions.create} className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Create</p>
            <p className="text-xs text-zinc-400">Add new items</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
          <input type="checkbox" defaultChecked={permissions.update} className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Update</p>
            <p className="text-xs text-zinc-400">Edit existing items</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
          <input type="checkbox" defaultChecked={permissions.delete} className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Delete</p>
            <p className="text-xs text-zinc-400">Remove items</p>
          </div>
        </label>
      </div>
    </div>
  );
}