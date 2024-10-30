/**
 * @file OwnerInformation.tsx
 * Component for displaying and managing owner-related information of a document
 * within the frontend application. Implements the owner information section of
 * the application details view.
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react'; // v18.2.0
import { Document, DocumentMetadata } from '../types/document';
import { validateDocument } from '../../utils/validation';
import useDocuments from '../../hooks/useDocuments';
import Input from '../common/Input';

interface OwnerInformationProps {
  document: Document;
}

/**
 * Component that renders and manages owner information fields with validation
 * and real-time updates.
 * 
 * Implements requirements from:
 * - Application Details View (system_design.user_interface_design.application_details_view)
 */
const OwnerInformation: React.FC<OwnerInformationProps> = ({ document }) => {
  // Initialize document management hook
  const { processDocument } = useDocuments();

  // Local state for owner information fields
  const [ownerData, setOwnerData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    department: ''
  });

  // Validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading state for async operations
  const [isLoading, setIsLoading] = useState(false);

  // Initialize owner data from document metadata
  useEffect(() => {
    if (document?.metadata?.extractedData?.owner) {
      setOwnerData(document.metadata.extractedData.owner);
    }
  }, [document]);

  /**
   * Handles changes to owner information fields
   * @param field - The field being updated
   * @param value - The new value for the field
   */
  const handleChange = (field: string) => (value: string) => {
    setOwnerData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for the field being updated
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Validates a specific field on blur
   * @param field - The field to validate
   */
  const handleBlur = (field: string) => () => {
    const fieldErrors: Record<string, string> = {};

    switch (field) {
      case 'email':
        if (ownerData.email && !validateEmail(ownerData.email)) {
          fieldErrors.email = 'Please enter a valid email address';
        }
        break;
      case 'name':
        if (!ownerData.name.trim()) {
          fieldErrors.name = 'Owner name is required';
        }
        break;
      case 'phone':
        if (ownerData.phone && !/^\+?[\d\s-()]+$/.test(ownerData.phone)) {
          fieldErrors.phone = 'Please enter a valid phone number';
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      ...fieldErrors
    }));
  };

  /**
   * Updates document metadata with new owner information
   */
  const updateOwnerInformation = async () => {
    setIsLoading(true);
    try {
      // Validate all fields before submission
      const validationResult = validateDocument({
        ...document,
        metadata: {
          ...document.metadata,
          extractedData: {
            ...document.metadata.extractedData,
            owner: ownerData
          }
        }
      });

      if (!validationResult.success) {
        throw new Error('Validation failed');
      }

      // Process document with updated owner information
      await processDocument(document.id);
    } catch (error) {
      console.error('Failed to update owner information:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to update owner information'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900">Owner Information</h2>
      
      {/* Owner name field */}
      <Input
        id="owner-name"
        name="name"
        type="text"
        label="Owner Name"
        value={ownerData.name}
        onChange={handleChange('name')}
        onBlur={handleBlur('name')}
        error={errors.name}
        required
        validationRule={{
          type: 'required',
          message: 'Owner name is required'
        }}
      />

      {/* Owner email field */}
      <Input
        id="owner-email"
        name="email"
        type="email"
        label="Email Address"
        value={ownerData.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        error={errors.email}
        validationRule={{
          type: 'email',
          message: 'Please enter a valid email address'
        }}
      />

      {/* Owner phone field */}
      <Input
        id="owner-phone"
        name="phone"
        type="tel"
        label="Phone Number"
        value={ownerData.phone}
        onChange={handleChange('phone')}
        onBlur={handleBlur('phone')}
        error={errors.phone}
        placeholder="+1 (555) 555-5555"
      />

      {/* Company name field */}
      <Input
        id="owner-company"
        name="company"
        type="text"
        label="Company Name"
        value={ownerData.company}
        onChange={handleChange('company')}
        error={errors.company}
      />

      {/* Job title field */}
      <Input
        id="owner-title"
        name="title"
        type="text"
        label="Job Title"
        value={ownerData.title}
        onChange={handleChange('title')}
        error={errors.title}
      />

      {/* Department field */}
      <Input
        id="owner-department"
        name="department"
        type="text"
        label="Department"
        value={ownerData.department}
        onChange={handleChange('department')}
        error={errors.department}
      />

      {/* Error message display */}
      {errors.submit && (
        <div className="text-red-600 text-sm mt-2" role="alert">
          {errors.submit}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={updateOwnerInformation}
        disabled={isLoading || Object.keys(errors).length > 0}
        className={`
          w-full px-4 py-2 text-sm font-medium text-white rounded-md
          ${isLoading || Object.keys(errors).length > 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }
        `}
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

export default OwnerInformation;