import { Navigate } from "react-router";
import { useAuth } from "../api/AuthContext";

const ADMIN_ROLES = new Set(["super_admin", "admin"]);

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-stone-100 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 dark:border-zinc-700 border-t-zinc-100" />
      </div>
    );
  }

  if (!user || !ADMIN_ROLES.has(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
