/**
 * Header Component
 * Implements the main navigation header with responsive design and user controls
 * 
 * Requirements implemented:
 * - User Interface Design - Main Dashboard Components
 * - Core System Components - Web UI Layer
 */

import React, { useState } from 'react'; // v18.2.0
import { Link } from 'react-router-dom'; // v6.4.0
import {
  HOME_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  DASHBOARD_ROUTE,
  DOCUMENTS_ROUTE,
  WEBHOOKS_ROUTE,
  SETTINGS_ROUTE,
  REPORTS_ROUTE
} from '../../constants/routes';
import useAuth from '../../hooks/useAuth';

// SVG icons for navigation items
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Header: React.FC = () => {
  // Authentication state and actions
  const { user, isAuthenticated, logout } = useAuth();
  
  // State for mobile menu and user dropdown
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Navigation items based on authentication state
  const navigationItems = isAuthenticated ? [
    { path: DASHBOARD_ROUTE, label: 'Dashboard' },
    { path: DOCUMENTS_ROUTE, label: 'Documents' },
    { path: WEBHOOKS_ROUTE, label: 'Webhooks' },
    { path: REPORTS_ROUTE, label: 'Reports' },
    { path: SETTINGS_ROUTE, label: 'Settings' }
  ] : [
    { path: HOME_ROUTE, label: 'Home' },
    { path: LOGIN_ROUTE, label: 'Login' },
    { path: REGISTER_ROUTE, label: 'Register' }
  ];

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    setIsUserDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to={HOME_ROUTE} className="text-xl font-bold text-gray-800">
              DocuFlow
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {navigationItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Profile Section */}
          {isAuthenticated && (
            <div className="hidden sm:flex sm:items-center">
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <UserIcon />
                  <span className="text-sm font-medium">{user?.firstName || user?.email}</span>
                </button>

                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        to={SETTINGS_ROUTE}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;