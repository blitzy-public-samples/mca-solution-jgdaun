// React 18.2.0
import React from 'react';
import { Link } from 'react-router-dom'; // v6.4.0
import ErrorBoundary from '../components/common/ErrorBoundary';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { HOME_ROUTE, DASHBOARD_ROUTE } from '../constants/routes';

/**
 * NotFound Component
 * Provides a user-friendly interface when a user navigates to a non-existent route.
 * Maintains consistent layout with header and footer while offering clear navigation options.
 * 
 * Requirements implemented:
 * - User Interface Design: Maintains consistent layout structure
 * - Core System Components: Handles non-existent route navigation gracefully
 */
const NotFound: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        {/* Consistent Header Navigation */}
        <Header />

        {/* Main Content */}
        <main className="flex-grow flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            {/* 404 Error Message */}
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-blue-600">404</h1>
              <h2 className="mt-4 text-3xl font-semibold text-gray-900">Page Not Found</h2>
              <p className="mt-2 text-gray-600">
                Sorry, we couldn't find the page you're looking for.
              </p>
            </div>

            {/* Navigation Options */}
            <div className="space-y-4">
              {/* Primary Action */}
              <Link
                to={HOME_ROUTE}
                className="block w-full rounded-md bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Return to Home
              </Link>

              {/* Secondary Action */}
              <Link
                to={DASHBOARD_ROUTE}
                className="block w-full rounded-md bg-white px-4 py-3 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Go to Dashboard
              </Link>

              {/* Help Text */}
              <p className="mt-6 text-sm text-gray-600">
                If you believe this is an error, please contact our{' '}
                <a
                  href="mailto:support@docuflow.com"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  support team
                </a>
              </p>
            </div>
          </div>
        </main>

        {/* Consistent Footer */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default NotFound;