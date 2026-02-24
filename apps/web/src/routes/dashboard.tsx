import { useAuthStore } from '../stores/auth.store';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { OwnerDashboard } from '../components/dashboard/OwnerDashboard';

export function DashboardPage() {
  const { user, isAdmin } = useAuthStore();

  if (!user) return null;

  if (isAdmin()) {
    return <AdminDashboard user={user} />;
  }

  return <OwnerDashboard user={user} />;
}
