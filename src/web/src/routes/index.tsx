/**
 * Main Routing Configuration
 * Implements code-split architecture with React.lazy() for dynamic imports
 * and authentication-based route protection.
 * 
 * Requirements implemented:
 * - User Interface Design: Main dashboard components navigation
 * - Authentication Flow: Route protection with PrivateRoute/PublicRoute
 * - System Components: Frontend routing structure connecting to API Gateway
 */

import React, { Suspense } from 'react'; // ^18.2.0
import { BrowserRouter, Switch, Route } from 'react-router-dom'; // ^5.2.0
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import { ROUTES } from '../constants/routes';

// Common loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

/**
 * Higher-order function for implementing dynamic component importing
 * @param componentPath - Path to the component to be lazy loaded
 * @returns Promise resolving to the dynamically imported component
 */
const lazyLoad = (componentPath: string) => {
  const Component = React.lazy(() => 
    import(`../pages/${componentPath}`).catch(error => {
      console.error(`Error loading component ${componentPath}:`, error);
      return { default: () => <div>Error loading component</div> };
    })
  );
  return Component;
};

// Lazy-loaded page components
const Dashboard = lazyLoad('Dashboard');
const Documents = lazyLoad('Documents');
const DocumentDetails = lazyLoad('DocumentDetails');
const Webhooks = lazyLoad('Webhooks');
const Settings = lazyLoad('Settings');
const Reports = lazyLoad('Reports');
const Login = lazyLoad('Login');
const Register = lazyLoad('Register');
const ForgotPassword = lazyLoad('ForgotPassword');
const NotFound = lazyLoad('NotFound');

/**
 * Main routing configuration component that manages navigation and authentication protection
 * @returns Complete routing configuration with protected and public routes
 */
const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          {/* Public Routes - Accessible without authentication */}
          <PublicRoute 
            exact 
            path={ROUTES.LOGIN_ROUTE} 
            component={Login} 
          />
          <PublicRoute 
            exact 
            path={ROUTES.REGISTER_ROUTE} 
            component={Register} 
          />
          <PublicRoute 
            exact 
            path={ROUTES.FORGOT_PASSWORD_ROUTE} 
            component={ForgotPassword} 
          />

          {/* Protected Routes - Require authentication */}
          <PrivateRoute 
            exact 
            path={ROUTES.HOME_ROUTE} 
            component={Dashboard} 
          />
          <PrivateRoute 
            exact 
            path={ROUTES.DASHBOARD_ROUTE} 
            component={Dashboard} 
          />
          <PrivateRoute 
            exact 
            path={ROUTES.DOCUMENTS_ROUTE} 
            component={Documents} 
          />
          <PrivateRoute 
            exact 
            path={ROUTES.DOCUMENT_DETAILS_ROUTE} 
            component={DocumentDetails} 
          />
          <PrivateRoute 
            exact 
            path={ROUTES.WEBHOOKS_ROUTE} 
            component={Webhooks} 
          />
          <PrivateRoute 
            exact 
            path={ROUTES.SETTINGS_ROUTE} 
            component={Settings} 
          />
          <PrivateRoute 
            exact 
            path={ROUTES.REPORTS_ROUTE} 
            component={Reports} 
          />

          {/* Catch-all route for undefined paths */}
          <Route 
            path={ROUTES.NOT_FOUND_ROUTE} 
            component={NotFound} 
          />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRoutes;