import { useState, useEffect } from "react";
import { useConfirm } from "./ConfirmDialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Shield,
  X,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { api, ApiClientError } from "../api/client";

function formatRoleLabel(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
  isActive: boolean;
}

const ROLES = ["super_admin", "admin", "editor", "author", "viewer"];

function emptyForm(user?: User | null): UserForm {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "editor",
    password: "",
    isActive: user?.isActive ?? true,
  };
}

export function UserManagement() {
  const confirmDialog = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    api.users.list()
      .then(res => setUsers(res.data as User[]))
      .catch(err => {
        if (err instanceof ApiClientError && err.status === 403) {
          // Not admin — show empty (viewer/author can't list users)
          setUsers([]);
        } else {
          setError("Failed to load users");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setSelectedUser(null);
    setForm(emptyForm());
    setFormError(null);
    setShowPassword(false);
    setShowCreateModal(true);
  }

  function openEdit(user: User) {
    setSelectedUser(user);
    setForm(emptyForm(user));
    setFormError(null);
    setShowPassword(false);
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
    setSelectedUser(null);
    setFormError(null);
  }

  async function handleSave() {
    setFormSaving(true);
    setFormError(null);
    try {
      if (selectedUser) {
        const res = await api.users.update(selectedUser.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
          isActive: form.isActive,
          ...(form.password ? { password: form.password } : {}),
        });
        const updated = res.data as User;
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      } else {
        const res = await api.users.create({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
          password: form.password,
          isActive: form.isActive,
        });
        setUsers(prev => [...prev, res.data as User]);
      }
      closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save user.");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirmDialog({
      title: "Kullanıcı Sil",
      message: "Bu kullanıcıyı silmek istediğine emin misin? Bu işlem geri alınamaz.",
      confirmLabel: "Evet, Sil",
      variant: "danger",
    });
    if (!ok) return;
    setDeleteError(null);
    try {
      await api.users.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete user.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-stone-500 dark:text-zinc-500" />
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    const matchesStatus = !filterStatus || (filterStatus === "active" ? u.isActive : !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">User Management</h1>
            <p className="text-stone-600 dark:text-zinc-400">{filteredUsers.length} users</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {deleteError && <p className="mb-4 text-sm text-red-400">{deleteError}</p>}

        {/* Filters */}
        <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 dark:text-zinc-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="relative w-full min-w-[10rem] sm:w-44 shrink-0">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="h-9 w-full cursor-pointer appearance-none rounded-md border border-stone-200/85 dark:border-zinc-800/50 bg-white/75 dark:bg-zinc-950/50 py-1.5 pl-3 pr-9 text-sm text-stone-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
              >
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-600 dark:text-zinc-400"
                aria-hidden
              />
            </div>
            <div className="relative w-full min-w-[10rem] sm:w-44 shrink-0">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="h-9 w-full cursor-pointer appearance-none rounded-md border border-stone-200/85 dark:border-zinc-800/50 bg-white/75 dark:bg-zinc-950/50 py-1.5 pl-3 pr-9 text-sm text-stone-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-600 dark:text-zinc-400"
                aria-hidden
              />
            </div>
            {(filterRole || filterStatus) && (
              <button onClick={() => { setFilterRole(""); setFilterStatus(""); }} className="text-xs text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-stone-200/85 dark:border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600 dark:text-zinc-400">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600 dark:text-zinc-400">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600 dark:text-zinc-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600 dark:text-zinc-400">Last Login</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600 dark:text-zinc-400">Created</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-stone-600 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-zinc-800/50">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-stone-500 dark:text-zinc-500 text-sm">
                    {error ? error : users.length === 0 ? "No users yet." : "No users match the current filters."}
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-stone-300 dark:hover:bg-zinc-800/30 backdrop-blur-sm transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-300 dark:bg-zinc-700 flex items-center justify-center font-semibold text-sm shrink-0">
                        {user.firstName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-stone-600 dark:text-zinc-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                      <span className="text-stone-700 dark:text-zinc-300">{formatRoleLabel(user.role)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive
                          ? "bg-green-500/10 text-green-400"
                          : "bg-stone-500/10 dark:bg-zinc-500/10 text-stone-600 dark:text-zinc-400"
                      }`}
                    >
                      {user.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-stone-600 dark:text-zinc-400">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-4 text-stone-600 dark:text-zinc-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                      </button>
                      <button
                        onClick={() => openEdit(user)}
                        title="Edit user"
                        className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create/Edit User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/94 dark:bg-zinc-900/90 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-6 border-b border-stone-200/85 dark:border-zinc-800/50">
                <h2 className="text-xl font-semibold">
                  {selectedUser ? "Edit User" : "Create New User"}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 backdrop-blur-sm rounded transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      placeholder="John"
                      className="w-full px-3 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      placeholder="Doe"
                      className="w-full px-3 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {selectedUser ? "New Password (leave blank to keep)" : "Password"} {!selectedUser && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm border border-stone-200/85 dark:border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100">
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="isActive" checked={form.isActive} onChange={() => setForm(f => ({ ...f, isActive: true }))} className="w-4 h-4" />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="isActive" checked={!form.isActive} onChange={() => setForm(f => ({ ...f, isActive: false }))} className="w-4 h-4" />
                      <span>Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200/85 dark:border-zinc-800/50">
                {formError && <span className="text-sm text-red-400 mr-auto">{formError}</span>}
                <button onClick={closeModal} className="px-4 py-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={formSaving}
                  className="px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium disabled:opacity-60"
                >
                  {formSaving ? "Saving..." : selectedUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}