import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../../stores/auth.store';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/teams', label: 'Teams' },
  { to: '/players', label: 'Players' },
  { to: '/transfers', label: 'Transfers' },
  { to: '/competitions', label: 'Competitions' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop/inventory', label: 'Inventory' },
];

const adminItems = [
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/pending-trades', label: 'Pending Trades' },
  { to: '/admin/items', label: 'Item Management' },
  { to: '/admin/league-settings', label: 'League Settings' },
  { to: '/admin/reference-data', label: 'Reference Data' },
];

export function AppShell() {
  const { user, clearAuth, isAdmin } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">VCM</h1>
        <p className="text-sm text-gray-400">Virtual Career Mode</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={closeSidebar}
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
                onClick={closeSidebar}
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
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden bg-gray-900 text-white p-2 rounded-lg"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={closeSidebar} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
