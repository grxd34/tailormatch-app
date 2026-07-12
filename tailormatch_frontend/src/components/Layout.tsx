import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { 
  HomeIcon, 
  MapIcon, 
  UserIcon, 
  BellIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const { totalUnreadCount, hasAnyUnread } = useUnreadMessages();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, showIndicator: false },
    { name: 'Find Tailors', href: '/tailors', icon: MapIcon, showIndicator: false },
    { name: 'My Requests', href: '/requests', icon: UserIcon, showIndicator: hasAnyUnread },
    { name: 'Notifications', href: '/notifications', icon: BellIcon, showIndicator: false },
    { name: 'Settings', href: '/settings', icon: CogIcon, showIndicator: false },
  ];

  const tailorNavigation = [
    { name: 'Dashboard', href: '/tailor', icon: HomeIcon, showIndicator: false },
    { name: 'Requests', href: '/tailor/requests', icon: UserIcon, showIndicator: hasAnyUnread },
    { name: 'Notifications', href: '/notifications', icon: BellIcon, showIndicator: false },
    { name: 'Profile', href: '/tailor/profile', icon: CogIcon, showIndicator: false },
    { name: 'Settings', href: '/settings', icon: CogIcon, showIndicator: false },
  ];

  const currentNavigation = user?.is_tailor ? tailorNavigation : navigation;

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">TailorMatch</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h1 className="text-lg font-semibold text-gray-900">TailorMatch</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-2 py-4 space-y-1">
                {currentNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md relative ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                      {item.showIndicator && (
                        <div className="ml-auto">
                          {totalUnreadCount > 0 ? (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-medium">
                              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                            </span>
                          ) : (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-gray-200 p-4">
                <div className="group block w-full flex-shrink-0">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                        {user?.is_tailor ? 'Tailor' : 'Customer'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setSidebarOpen(false);
                    }}
                    className="mt-2 flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeftOnRectangleIcon className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col transition-all duration-300 ${hideSidebar ? 'lg:-translate-x-full' : ''}`}>
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow-sm">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">TailorMatch</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {currentNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md relative ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                    {item.showIndicator && (
                      <div className="ml-auto">
                        {totalUnreadCount > 0 ? (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-medium">
                            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                          </span>
                        ) : (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                    {user?.is_tailor ? 'Tailor' : 'Customer'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-2 flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftOnRectangleIcon className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop header with sidebar toggle */}
      <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setHideSidebar(!hideSidebar)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
              title={hideSidebar ? 'Show Sidebar' : 'Hide Sidebar'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">TailorMatch</h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`${hideSidebar ? 'lg:pl-0' : 'lg:pl-64'}`}>
        <main className="py-4 lg:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;