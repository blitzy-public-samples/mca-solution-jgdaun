// React 18.2.0
import React, { useState, useEffect } from 'react';

// Internal dependencies
import { Document, DocumentMetadata } from '../types/document';
import { capitalizeFirstLetter } from '../../utils/format';
import useDocuments from '../../hooks/useDocuments';
import Card from '../common/Card';

interface MerchantDetailsProps {
  documentId: string;
}

/**
 * MerchantDetails component displays detailed merchant information within the document
 * processing application's application details view.
 * 
 * @implements Application Details View requirement for displaying merchant information
 */
const MerchantDetails: React.FC<MerchantDetailsProps> = ({ documentId }) => {
  // State for merchant data
  const [merchantData, setMerchantData] = useState<DocumentMetadata['extractedData'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get document data using the useDocuments hook
  const { getDocument, loading } = useDocuments();

  // Fetch document data when component mounts or documentId changes
  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const document = await getDocument(documentId);
        if (document?.metadata?.extractedData) {
          setMerchantData(document.metadata.extractedData);
          setError(null);
        } else {
          setError('No merchant data available');
        }
      } catch (err) {
        setError('Failed to load merchant details');
        console.error('Error fetching merchant details:', err);
      }
    };

    if (documentId) {
      fetchMerchantData();
    }
  }, [documentId, getDocument]);

  /**
   * Renders a merchant detail field with proper formatting
   */
  const renderDetailField = (label: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return (
      <div className="flex flex-col space-y-1">
        <span className="text-sm font-medium text-gray-500">
          {capitalizeFirstLetter(label)}
        </span>
        <span className="text-base text-gray-900">
          {typeof value === 'string' ? capitalizeFirstLetter(value) : value}
        </span>
      </div>
    );
  };

  return (
    <Card
      title="Merchant Details"
      isLoading={loading}
      className="mb-6"
      variant="default"
    >
      {error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : merchantData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Information */}
          <div className="space-y-4">
            {renderDetailField('Business Name', merchantData.businessName)}
            {renderDetailField('DBA Name', merchantData.dbaName)}
            {renderDetailField('Tax ID', merchantData.taxId)}
            {renderDetailField('Industry Type', merchantData.industryType)}
            {renderDetailField('Business Type', merchantData.businessType)}
          </div>

          {/* Contact and Address Information */}
          <div className="space-y-4">
            {renderDetailField('Phone Number', merchantData.phoneNumber)}
            {renderDetailField('Email', merchantData.email)}
            {renderDetailField('Website', merchantData.website)}
            
            {/* Address Block */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-500">Business Address</span>
              <div className="text-base text-gray-900">
                {merchantData.address?.street && (
                  <div>{capitalizeFirstLetter(merchantData.address.street)}</div>
                )}
                {merchantData.address?.city && merchantData.address?.state && (
                  <div>
                    {capitalizeFirstLetter(merchantData.address.city)}, {merchantData.address.state.toUpperCase()}
                  </div>
                )}
                {merchantData.address?.postalCode && (
                  <div>{merchantData.address.postalCode}</div>
                )}
                {merchantData.address?.country && (
                  <div>{capitalizeFirstLetter(merchantData.address.country)}</div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Business Details */}
          <div className="space-y-4 md:col-span-2">
            {renderDetailField('Years in Business', merchantData.yearsInBusiness)}
            {renderDetailField('Annual Revenue', merchantData.annualRevenue)}
            {renderDetailField('Number of Employees', merchantData.employeeCount)}
            {renderDetailField('Business Description', merchantData.businessDescription)}
          </div>

          {/* Compliance Information */}
          <div className="space-y-4 md:col-span-2">
            {renderDetailField('License Number', merchantData.licenseNumber)}
            {renderDetailField('Registration Date', merchantData.registrationDate)}
            {merchantData.certifications && merchantData.certifications.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-500">Certifications</span>
                <div className="flex flex-wrap gap-2">
                  {merchantData.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">Loading merchant details...</div>
      )}
    </Card>
  );
};

export default MerchantDetails;