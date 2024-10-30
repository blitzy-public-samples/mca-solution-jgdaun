/**
 * PrivateRoute Component
 * Higher-order component that implements route protection using JWT-based authentication.
 * 
 * Requirements implemented:
 * - API Authentication (system_design/api_design/api_authentication)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 */

import React, { FC } from 'react'; // v18.2.0
import { Route, Redirect, RouteProps } from 'react-router-dom'; // v5.2.0
import useAuth from '../hooks/useAuth';
import { LOGIN_ROUTE } from '../constants/routes';

interface PrivateRouteProps extends Omit<RouteProps, 'component'> {
  component: React.ComponentType<any>;
}

/**
 * PrivateRoute component that ensures routes are only accessible to authenticated users.
 * Redirects unauthenticated users to the login page while preserving the intended destination.
 * 
 * @param component - The protected component to render if authenticated
 * @param rest - Additional route props to be passed to the Route component
 */
const PrivateRoute: FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  // Get authentication state from useAuth hook
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Route
      {...rest}
      render={props => {
        // Show nothing while authentication state is being determined
        // This prevents flash of incorrect content
        if (isLoading) {
          return null;
        }

        // If authenticated, render the protected component with all props
        if (isAuthenticated) {
          return <Component {...props} />;
        }

        // If not authenticated, redirect to login while preserving the intended destination
        return (
          <Redirect
            to={{
              pathname: LOGIN_ROUTE,
              state: { from: props.location }
            }}
          />
        );
      }}
    />
  );
};

export default PrivateRoute;