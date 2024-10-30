/**
 * Settings Page Component
 * Implements a comprehensive interface for managing user preferences, security settings,
 * and notification configurations with role-based access control.
 * 
 * Requirements implemented:
 * - User Interface Design (system_design/user_interface_design/application_details_view)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 * - Security Settings Management (security_considerations/authentication_and_authorization/role-based_access_control)
 */

// React v18.2.0
import { useState, useEffect } from 'react';

// Material-UI v5.11.0
import { Tabs, Tab, Box, CircularProgress, Alert } from '@mui/material';

// Internal dependencies
import NotificationSettings from '../components/settings/NotificationSettings';
import ProfileSettings from '../components/settings/ProfileSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import useAuth from '../hooks/useAuth';
import useWebhooks from '../hooks/useWebhooks';

// Type definition for settings tab values
type SettingsTabValue = 'profile' | 'security' | 'notifications';

/**
 * SettingsPage component that provides a tabbed interface for managing various user settings
 * Implements role-based access control and secure settings management
 */
const SettingsPage: React.FC = () => {
  // State management
  const [selectedTab, setSelectedTab] = useState<SettingsTabValue>('profile');
  const [error, setError] = useState<string | null>(null);

  // Custom hooks
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { loading: webhooksLoading } = useWebhooks();

  // Effect to check authentication status
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setError('You must be authenticated to access settings');
    } else {
      setError(null);
    }
  }, [authLoading, isAuthenticated]);

  /**
   * Handles tab selection changes with role-based access validation
   * @param event - React synthetic event
   * @param newValue - New tab value
   */
  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: SettingsTabValue
  ): void => {
    event.preventDefault();

    // Validate access to security settings based on user role
    if (newValue === 'security' && user?.role !== 'admin') {
      setError('You need administrator privileges to access security settings');
      return;
    }

    setSelectedTab(newValue);
    setError(null);
  };

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show error if user is not authenticated
  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Please log in to access settings
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Settings navigation tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="settings navigation tabs"
        >
          <Tab
            label="Profile"
            value="profile"
            aria-controls="settings-tabpanel-profile"
          />
          <Tab
            label="Security"
            value="security"
            aria-controls="settings-tabpanel-security"
            disabled={user?.role !== 'admin'}
          />
          <Tab
            label="Notifications"
            value="notifications"
            aria-controls="settings-tabpanel-notifications"
          />
        </Tabs>
      </Box>

      {/* Error display */}
      {error && (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {/* Settings content */}
      <Box role="tabpanel" hidden={selectedTab !== 'profile'}>
        {selectedTab === 'profile' && (
          <ProfileSettings />
        )}
      </Box>

      <Box role="tabpanel" hidden={selectedTab !== 'security'}>
        {selectedTab === 'security' && user?.role === 'admin' && (
          <SecuritySettings />
        )}
      </Box>

      <Box role="tabpanel" hidden={selectedTab !== 'notifications'}>
        {selectedTab === 'notifications' && (
          <NotificationSettings />
        )}
      </Box>

      {/* Loading overlay for webhook operations */}
      {webhooksLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255, 255, 255, 0.7)"
          zIndex={1000}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default SettingsPage;