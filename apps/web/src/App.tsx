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
import { DisputesPage } from './routes/admin/disputes';
import { ReferenceDataPage } from './routes/admin/reference-data';
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

        <Route
          path="admin/disputes"
          element={
            <AdminRoute>
              <DisputesPage />
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
      </Route>
    </Routes>
  );
}
