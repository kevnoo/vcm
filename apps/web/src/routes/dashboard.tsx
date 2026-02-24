import { useAuthStore } from '../stores/auth.store';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { OwnerDashboard } from '../components/dashboard/OwnerDashboard';

export function DashboardPage() {
  const { user, isInAdminView } = useAuthStore();

  if (!user) return null;

  if (isInAdminView()) {
    return <AdminDashboard user={user} />;
  }

  return <OwnerDashboard user={user} />;
}
