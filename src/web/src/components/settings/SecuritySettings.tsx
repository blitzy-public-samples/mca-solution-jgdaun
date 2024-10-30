/**
 * SecuritySettings Component
 * Provides user interface for managing security preferences including password changes,
 * two-factor authentication settings, and session management.
 * 
 * Requirements implemented:
 * - User Interface Design (system_design/user_interface_design/application_details_view)
 * - Authentication Methods (security_considerations/authentication_and_authorization/authentication_methods)
 * - Role-Based Access Control (security_considerations/authentication_and_authorization/role-based_access_control)
 */

import React, { useState, useEffect, useCallback } from 'react'; // v18.2.0
import {
  Box,
  Typography,
  TextField,
  Switch,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Grid,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'; // v5.11.0
import * as yup from 'yup'; // v0.32.11
import useAuth from '../../hooks/useAuth';
import { User, UserRole } from '../../types/user';

// Form validation schemas
const passwordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(12, 'Password must be at least 12 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

interface SecurityPreferences {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  notifyOnNewLogin: boolean;
}

const SecuritySettings: React.FC = () => {
  // Auth context
  const { user, isLoading: authLoading } = useAuth();

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [securityPreferences, setSecurityPreferences] = useState<SecurityPreferences>({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    notifyOnNewLogin: true,
  });

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Load current security preferences
  useEffect(() => {
    const loadSecurityPreferences = async () => {
      try {
        setIsLoading(true);
        // Implementation would fetch current security settings from backend
        // Simulated delay for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Demo data - in production, this would come from API
        setSecurityPreferences({
          twoFactorEnabled: user?.role === UserRole.ADMIN,
          sessionTimeout: 60,
          notifyOnNewLogin: true,
        });
      } catch (err) {
        setError('Failed to load security preferences');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadSecurityPreferences();
    }
  }, [user]);

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate password form
      await passwordSchema.validate(passwordForm);
      
      // Implementation would call auth service to update password
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setError(err.message);
      } else {
        setError('Failed to update password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 2FA toggle
  const handleTwoFactorToggle = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      setError(null);

      if (enabled) {
        // Implementation would generate QR code URL from backend
        const mockQrCode = 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth://totp/Example:user@example.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=Example';
        setQrCodeUrl(mockQrCode);
        setShowTwoFactorDialog(true);
      } else {
        // Implementation would disable 2FA on backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSecurityPreferences(prev => ({
          ...prev,
          twoFactorEnabled: false,
        }));
        setSuccess('Two-factor authentication disabled');
      }
    } catch (err) {
      setError('Failed to update two-factor authentication settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle session timeout change
  const handleSessionTimeoutChange = async (timeout: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Implementation would update session timeout on backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSecurityPreferences(prev => ({
        ...prev,
        sessionTimeout: timeout,
      }));
      setSuccess('Session timeout updated');
    } catch (err) {
      setError('Failed to update session timeout');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Password Change Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <form onSubmit={handlePasswordChange}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({
                    ...prev,
                    currentPassword: e.target.value
                  }))}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                  margin="normal"
                  helperText="Must be at least 12 characters with uppercase, lowercase, number, and special character"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                  margin="normal"
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                  sx={{ mt: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Two-Factor Authentication Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Two-Factor Authentication
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={securityPreferences.twoFactorEnabled}
                    onChange={(e) => handleTwoFactorToggle(e.target.checked)}
                    disabled={isLoading || user?.role !== UserRole.ADMIN}
                  />
                }
                label="Enable Two-Factor Authentication"
              />
              {user?.role !== UserRole.ADMIN && (
                <Typography variant="caption" color="textSecondary" display="block">
                  Only administrators can enable two-factor authentication
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Session Management Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Management
              </Typography>
              <TextField
                type="number"
                label="Session Timeout (minutes)"
                value={securityPreferences.sessionTimeout}
                onChange={(e) => handleSessionTimeoutChange(Number(e.target.value))}
                InputProps={{ inputProps: { min: 15, max: 480 } }}
                margin="normal"
                disabled={isLoading}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={securityPreferences.notifyOnNewLogin}
                    onChange={(e) => setSecurityPreferences(prev => ({
                      ...prev,
                      notifyOnNewLogin: e.target.checked
                    }))}
                    disabled={isLoading}
                  />
                }
                label="Notify me of new login attempts"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 2FA Setup Dialog */}
      <Dialog
        open={showTwoFactorDialog}
        onClose={() => setShowTwoFactorDialog(false)}
      >
        <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Scan this QR code with your authenticator app:
          </Typography>
          {qrCodeUrl && (
            <Box sx={{ textAlign: 'center', my: 2 }}>
              <img src={qrCodeUrl} alt="2FA QR Code" />
            </Box>
          )}
          <Typography variant="caption" color="textSecondary">
            After scanning, enter the verification code from your authenticator app to complete setup.
          </Typography>
          <TextField
            fullWidth
            label="Verification Code"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTwoFactorDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSecurityPreferences(prev => ({
                ...prev,
                twoFactorEnabled: true,
              }));
              setShowTwoFactorDialog(false);
              setSuccess('Two-factor authentication enabled');
            }}
          >
            Verify and Enable
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecuritySettings;