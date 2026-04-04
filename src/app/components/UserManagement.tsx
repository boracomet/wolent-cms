import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  Shield,
  Mail,
  Phone,
  Calendar,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Author" | "Viewer";
  status: "active" | "inactive";
  phone?: string;
  createdAt: string;
  lastLogin: string;
  avatar?: string;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "active",
    phone: "+1 234 567 8901",
    createdAt: "2026-01-15",
    lastLogin: "2 hours ago",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "Editor",
    status: "active",
    phone: "+1 234 567 8902",
    createdAt: "2026-01-20",
    lastLogin: "5 hours ago",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
  },
  {
    id: "3",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    role: "Author",
    status: "active",
    createdAt: "2026-02-10",
    lastLogin: "1 day ago",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
  },
  {
    id: "4",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "Author",
    status: "inactive",
    createdAt: "2026-02-15",
    lastLogin: "1 week ago",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
  },
];

export function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const roles = ["Admin", "Editor", "Author", "Viewer"];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">User Management</h1>
            <p className="text-zinc-400">{users.length} users</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/50 rounded-md hover:bg-zinc-700/70 transition-colors">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Last Login</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Created</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/30 backdrop-blur-sm transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-zinc-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-300">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-zinc-400">{user.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create/Edit User Modal */}
        {(showCreateModal || selectedUser) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold">
                  {selectedUser ? "Edit User" : "Create New User"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-2 hover:bg-zinc-800/50 backdrop-blur-sm rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedUser?.name}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      defaultValue={selectedUser?.email}
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      defaultValue={selectedUser?.phone}
                      placeholder="+1 234 567 8900"
                      className="w-full px-3 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      defaultValue={selectedUser?.role}
                      className="w-full px-3 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!selectedUser && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100">
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        defaultChecked={selectedUser?.status === "active" || !selectedUser}
                        className="w-4 h-4"
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        defaultChecked={selectedUser?.status === "inactive"}
                        className="w-4 h-4"
                      />
                      <span>Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/50">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
                  {selectedUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}