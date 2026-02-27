import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/auth.store';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/teams', label: 'Teams', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { to: '/players', label: 'Players', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to: '/transfers', label: 'Transfers', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { to: '/competitions', label: 'Competitions', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { to: '/shop', label: 'Shop', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { to: '/shop/inventory', label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
];

const adminItems = [
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/pending-trades', label: 'Pending Trades' },
  { to: '/admin/items', label: 'Item Management' },
  { to: '/admin/bundles', label: 'Bundle Management' },
  { to: '/admin/pos', label: 'Point of Sale' },
  { to: '/admin/league-settings', label: 'League Settings' },
  { to: '/admin/reference-data', label: 'Reference Data' },
  { to: '/admin/csv-import', label: 'CSV Import' },
];

// Check if a nav item should be active for the current path
function isNavActive(itemTo: string, pathname: string) {
  if (itemTo === '/') return pathname === '/';
  return pathname === itemTo || pathname.startsWith(itemTo + '/');
}

// Get the current page title from the path
function usePageTitle() {
  const location = useLocation();
  const allItems = [...navItems, ...adminItems];
  const match = allItems.find((item) => item.to === location.pathname);
  if (match) return match.label;
  // Fallback for nested routes
  if (location.pathname.startsWith('/admin')) return 'Admin';
  if (location.pathname.startsWith('/teams')) return 'Teams';
  if (location.pathname.startsWith('/players')) return 'Players';
  if (location.pathname.startsWith('/transfers')) return 'Transfers';
  if (location.pathname.startsWith('/competitions')) return 'Competitions';
  if (location.pathname.startsWith('/matches')) return 'Match';
  if (location.pathname.startsWith('/shop')) return 'Shop';
  return 'VCM';
}

export function AppShell() {
  const { user, clearAuth, isAdmin, isInAdminView, switchView } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitle = usePageTitle();

  const closeSidebar = () => setSidebarOpen(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">VCM</h1>
          <p className="text-sm text-gray-400">Virtual Career Mode</p>
        </div>
        {/* Close button - visible on mobile only */}
        <button
          onClick={closeSidebar}
          className="md:hidden p-2 -mr-2 text-gray-400 hover:text-white rounded-lg"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isNavActive(item.to, location.pathname)
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {item.label}
          </Link>
        ))}

        {isInAdminView() && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs text-gray-500 uppercase tracking-wider">
              Admin
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isNavActive(item.to, location.pathname)
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
            <p className="text-xs text-gray-400">
              {isAdmin() ? (isInAdminView() ? 'Admin View' : 'Owner View') : user?.role}
            </p>
          </div>
        </div>
        {isAdmin() && (
          <button
            onClick={() => {
              const newView = isInAdminView() ? 'owner' : 'admin';
              switchView(newView);
              navigate('/');
              closeSidebar();
            }}
            className="mt-2 w-full text-sm text-indigo-400 hover:text-indigo-300 text-left flex items-center gap-2 py-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {isInAdminView() ? 'Switch to Owner View' : 'Switch to Admin View'}
          </button>
        )}
        <button
          onClick={clearAuth}
          className="mt-2 w-full text-sm text-gray-400 hover:text-white text-left py-1.5"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 md:hidden bg-gray-900 text-white">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-800 active:bg-gray-700"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 font-semibold text-base truncate">{pageTitle}</span>
          {user?.discordAvatar && (
            <img
              src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=32`}
              alt=""
              className="w-8 h-8 rounded-full ml-auto"
            />
          )}
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="fixed inset-0 bg-black/50" onClick={closeSidebar} />
        <aside
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-gray-900 text-white flex flex-col z-50 transition-transform duration-300 ease-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
