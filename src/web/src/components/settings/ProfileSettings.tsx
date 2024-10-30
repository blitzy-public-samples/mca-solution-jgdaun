/**
 * ProfileSettings Component
 * A secure interface for users to view and update their profile information.
 * Implements form validation, secure API communication, and real-time feedback.
 * 
 * Requirements implemented:
 * - User Profile Management (system_design/user_interface_design/application_details_view)
 * - Authentication Flow (security_considerations/authentication_and_authorization/authentication_flow)
 */

// React v18.2.0
import { useState, useEffect } from 'react';
// React-Redux v8.0.5
import { useDispatch } from 'react-redux';
// Internal dependencies
import Input from '../common/Input';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';
import { makeApiRequest } from '../../services/api';
import { actions } from '../../store/slices/authSlice';

// Interface for profile form data
interface ProfileFormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
}

// Initial form state
const initialFormState: ProfileFormData = {
  username: '',
  email: '',
  currentPassword: '',
  newPassword: '',
};

/**
 * ProfileSettings component for managing user profile information
 * Implements secure profile update functionality within authenticated session
 */
const ProfileSettings: React.FC = () => {
  // Local state management
  const [formData, setFormData] = useState<ProfileFormData>(initialFormState);
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Hooks
  const { user } = useAuth();
  const dispatch = useDispatch();

  // Populate form with current user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  /**
   * Validates form input fields
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to set new password';
      }
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'New password must be at least 8 characters long';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles input field changes
   * @param field - The form field being updated
   * @param value - The new value for the field
   */
  const handleInputChange = (field: keyof ProfileFormData) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    // Clear success message when form is modified
    setUpdateSuccess(false);
  };

  /**
   * Handles form submission
   * Implements secure profile update with validation and error handling
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare update payload
      const updatePayload: Partial<ProfileFormData> = {
        username: formData.username,
        email: formData.email,
      };

      // Include password update if new password is provided
      if (formData.newPassword) {
        updatePayload.currentPassword = formData.currentPassword;
        updatePayload.newPassword = formData.newPassword;
      }

      // Make API request to update profile
      const response = await makeApiRequest('/api/v1/users/profile', 'PUT', updatePayload);

      if (response.success) {
        // Update Redux store with new user data
        dispatch(actions.setUser(response.data.user));
        
        // Clear password fields and show success message
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
        }));
        setUpdateSuccess(true);
      }
    } catch (error) {
      // Handle specific API errors
      if (error instanceof Error) {
        if (error.message.includes('password')) {
          setErrors(prev => ({
            ...prev,
            currentPassword: 'Current password is incorrect'
          }));
        } else if (error.message.includes('email')) {
          setErrors(prev => ({
            ...prev,
            email: 'Email is already in use'
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            username: 'Failed to update profile. Please try again.'
          }));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Profile Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username field */}
        <Input
          id="username"
          name="username"
          type="text"
          label="Username"
          value={formData.username}
          onChange={handleInputChange('username')}
          error={errors.username}
          required
        />

        {/* Email field */}
        <Input
          id="email"
          name="email"
          type="email"
          label="Email Address"
          value={formData.email}
          onChange={handleInputChange('email')}
          error={errors.email}
          required
        />

        {/* Current password field */}
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          label="Current Password"
          value={formData.currentPassword}
          onChange={handleInputChange('currentPassword')}
          error={errors.currentPassword}
          placeholder="Required to change password"
        />

        {/* New password field */}
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          label="New Password"
          value={formData.newPassword}
          onChange={handleInputChange('newPassword')}
          error={errors.newPassword}
          placeholder="Leave blank to keep current password"
        />

        {/* Success message */}
        {updateSuccess && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
            Profile updated successfully
          </div>
        )}

        {/* Submit button */}
        <Button
          label="Update Profile"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full mt-6"
        />
      </form>
    </div>
  );
};

export default ProfileSettings;