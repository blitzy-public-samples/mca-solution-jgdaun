/**
 * PublicRoute Component
 * Implements route-level authentication protection for public routes.
 * 
 * Requirements implemented:
 * - User Interface Design: Ensures proper navigation flow for unauthenticated users
 * - Authentication Flow: Implements route-level authentication protection
 */

import React from 'react'; // ^18.2.0
import { Route, Redirect, RouteProps } from 'react-router-dom'; // ^5.2.0
import useAuth from '../hooks/useAuth';
import { DASHBOARD_ROUTE } from '../constants/routes';

interface PublicRouteProps extends Omit<RouteProps, 'component'> {
  component: React.ComponentType<any>;
}

/**
 * PublicRoute is a higher-order component that protects public routes (login, register, etc.)
 * by redirecting authenticated users to the dashboard while allowing unauthenticated users
 * to access the route.
 * 
 * @param {React.ComponentType} Component - The component to render if access is granted
 * @param {RouteProps} rest - Additional route props from React Router
 * @returns {JSX.Element} - Either renders the protected component or redirects to dashboard
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ component: Component, ...rest }) => {
  // Get authentication state from useAuth hook
  const { isAuthenticated, isLoading } = useAuth();

  // Show nothing while authentication state is being determined
  if (isLoading) {
    return null;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        !isAuthenticated ? (
          // Render the component for unauthenticated users
          <Component {...props} />
        ) : (
          // Redirect authenticated users to dashboard
          <Redirect
            to={{
              pathname: DASHBOARD_ROUTE,
              // Preserve the attempted location for potential future use
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
};

export default PublicRoute;