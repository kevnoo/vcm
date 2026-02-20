import { Routes, Route } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { LoginPage } from './routes/login';
import { AuthCallbackPage } from './routes/auth-callback';
import { DashboardPage } from './routes/dashboard';
import { TeamsPage } from './routes/teams/index';
import { CreateTeamPage } from './routes/teams/create';
import { TeamDetailPage } from './routes/teams/detail';
import { CompetitionsPage } from './routes/competitions/index';
import { CreateCompetitionPage } from './routes/competitions/create';
import { CompetitionDetailPage } from './routes/competitions/detail';
import { PlayersPage } from './routes/players/index';
import { CreatePlayerPage } from './routes/players/create';
import { PlayerDetailPage } from './routes/players/detail';
import { TransfersPage } from './routes/transfers/index';
import { CreateTradePage } from './routes/transfers/create-trade';
import { TradeDetailPage } from './routes/transfers/trade-detail';
import { DisputesPage } from './routes/admin/disputes';
import { PendingTradesPage } from './routes/admin/pending-trades';
import { LeagueSettingsPage } from './routes/admin/league-settings';
import { ReferenceDataPage } from './routes/admin/reference-data';
import { ItemManagementPage } from './routes/admin/items';
import { BundleManagementPage } from './routes/admin/bundles';
import { PosPage } from './routes/admin/pos';
import { ShopPage } from './routes/shop/index';
import { InventoryPage } from './routes/shop/inventory';
import { ScheduleGeneratorPage } from './routes/tools/schedule-generator';
import { useCurrentUser } from './hooks/useAuth';

export function App() {
  // Fetch current user on app load if token exists
  useCurrentUser();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/tools/schedule-generator" element={<ScheduleGeneratorPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        <Route path="teams" element={<TeamsPage />} />
        <Route
          path="teams/create"
          element={
            <AdminRoute>
              <CreateTeamPage />
            </AdminRoute>
          }
        />
        <Route path="teams/:id" element={<TeamDetailPage />} />

        <Route path="players" element={<PlayersPage />} />
        <Route
          path="players/create"
          element={
            <AdminRoute>
              <CreatePlayerPage />
            </AdminRoute>
          }
        />
        <Route path="players/:id" element={<PlayerDetailPage />} />

        <Route path="transfers" element={<TransfersPage />} />
        <Route path="transfers/create-trade" element={<CreateTradePage />} />
        <Route path="transfers/trades/:id" element={<TradeDetailPage />} />

        <Route path="competitions" element={<CompetitionsPage />} />
        <Route
          path="competitions/create"
          element={
            <AdminRoute>
              <CreateCompetitionPage />
            </AdminRoute>
          }
        />
        <Route path="competitions/:id" element={<CompetitionDetailPage />} />

        <Route path="shop" element={<ShopPage />} />
        <Route path="shop/inventory" element={<InventoryPage />} />

        <Route
          path="admin/disputes"
          element={
            <AdminRoute>
              <DisputesPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/pending-trades"
          element={
            <AdminRoute>
              <PendingTradesPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/league-settings"
          element={
            <AdminRoute>
              <LeagueSettingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/reference-data"
          element={
            <AdminRoute>
              <ReferenceDataPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/items"
          element={
            <AdminRoute>
              <ItemManagementPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/bundles"
          element={
            <AdminRoute>
              <BundleManagementPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/pos"
          element={
            <AdminRoute>
              <PosPage />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}
