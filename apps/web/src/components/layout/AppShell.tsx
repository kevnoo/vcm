import { Link, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../../stores/auth.store';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/teams', label: 'Teams' },
  { to: '/players', label: 'Players' },
  { to: '/transfers', label: 'Transfers' },
  { to: '/competitions', label: 'Competitions' },
];

const adminItems = [
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/pending-trades', label: 'Pending Trades' },
  { to: '/admin/league-settings', label: 'League Settings' },
  { to: '/admin/reference-data', label: 'Reference Data' },
];

export function AppShell() {
  const { user, clearAuth, isAdmin } = useAuthStore();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">VCM</h1>
          <p className="text-sm text-gray-400">Virtual Career Mode</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2 rounded text-sm ${
                location.pathname === item.to
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {isAdmin() && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs text-gray-500 uppercase tracking-wider">
                Admin
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block px-3 py-2 rounded text-sm ${
                    location.pathname === item.to
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            {user?.discordAvatar && (
              <img
                src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=32`}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{user?.discordUsername}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={clearAuth}
            className="mt-3 w-full text-sm text-gray-400 hover:text-white text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
