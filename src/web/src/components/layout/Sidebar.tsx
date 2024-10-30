/**
 * Sidebar Component
 * Implements the main navigation sidebar for the application dashboard
 * 
 * Requirements implemented:
 * - User Interface Design - Main Dashboard Components
 * - Dashboard Layout
 */

import React, { useState, useCallback } from 'react'; // v18.2.0
import { Link, useLocation } from 'react-router-dom'; // v6.11.0
import classNames from 'classnames'; // v2.3.2
import {
  HOME_ROUTE,
  DASHBOARD_ROUTE,
  DOCUMENTS_ROUTE,
  WEBHOOKS_ROUTE,
  SETTINGS_ROUTE,
  REPORTS_ROUTE
} from '../../constants/routes';
import useAuth from '../../hooks/useAuth';

// Navigation item interface
interface NavItem {
  path: string;
  label: string;
  icon: string;
  requiredRole?: string[];
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Navigation items with role-based access control
  const navigationItems: NavItem[] = [
    {
      path: DASHBOARD_ROUTE,
      label: 'Dashboard',
      icon: 'grid',
    },
    {
      path: DOCUMENTS_ROUTE,
      label: 'Documents',
      icon: 'document',
      requiredRole: ['user', 'admin']
    },
    {
      path: WEBHOOKS_ROUTE,
      label: 'Webhooks',
      icon: 'webhook',
      requiredRole: ['admin']
    },
    {
      path: SETTINGS_ROUTE,
      label: 'Settings',
      icon: 'settings',
    },
    {
      path: REPORTS_ROUTE,
      label: 'Reports',
      icon: 'chart',
      requiredRole: ['admin', 'analyst']
    }
  ];

  // Toggle sidebar collapse state
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Check if user has access to a navigation item
  const hasAccess = useCallback((requiredRole?: string[]) => {
    if (!requiredRole || !user) return true;
    return requiredRole.includes(user.role);
  }, [user]);

  // Check if a route is active
  const isActiveRoute = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }, [location]);

  return (
    <aside
      className={classNames(
        'fixed left-0 top-0 z-40 h-screen bg-white transition-all duration-300 ease-in-out',
        'border-r border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700',
        {
          'w-64': !isCollapsed,
          'w-20': isCollapsed
        }
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <Link 
          to={HOME_ROUTE}
          className={classNames(
            'flex items-center',
            { 'justify-center w-full': isCollapsed }
          )}
        >
          <img
            src="/logo.svg"
            alt="Logo"
            className={classNames(
              'h-8 w-auto transition-all duration-300',
              { 'w-8': isCollapsed }
            )}
          />
          {!isCollapsed && (
            <span className="ml-2 text-xl font-semibold dark:text-white">
              Dashboard
            </span>
          )}
        </Link>
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg
            className="w-6 h-6 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isCollapsed ? 'M13 5l7 7-7 7' : 'M11 19l-7-7 7-7'}
            />
          </svg>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="mt-4 px-2">
        {isAuthenticated && (
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              hasAccess(item.requiredRole) && (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={classNames(
                      'flex items-center px-4 py-2 rounded-lg transition-colors duration-200',
                      {
                        'bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-white':
                          isActiveRoute(item.path),
                        'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700':
                          !isActiveRoute(item.path),
                        'justify-center': isCollapsed
                      }
                    )}
                  >
                    <i className={`icon-${item.icon} w-6 h-6`} />
                    {!isCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </Link>
                </li>
              )
            ))}
          </ul>
        )}
      </nav>

      {/* User Section */}
      {isAuthenticated && user && (
        <div className={classNames(
          'absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700',
          'p-4 bg-gray-50 dark:bg-gray-800'
        )}>
          <div className={classNames(
            'flex items-center',
            { 'justify-center': isCollapsed }
          )}>
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.firstName?.[0] || user.email[0].toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;