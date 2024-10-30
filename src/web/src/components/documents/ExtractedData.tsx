// React 18.2.0
import React, { useState, useEffect } from 'react';
// Third-party imports
import classNames from 'classnames'; // v2.3.2

// Internal imports
import { Document, DocumentStatus } from '../../types/document';
import { capitalizeFirstLetter, formatPercentage } from '../../utils/format';
import Table from '../common/Table';
import Card from '../common/Card';

interface ExtractedDataProps {
  document: Document;
  isLoading?: boolean;
}

/**
 * ExtractedData component displays processed document information in a structured format
 * Implements requirements from:
 * - Document Processing Flow: Displays extracted data from documents
 * - Main Dashboard Components: Standardized data presentation
 */
const ExtractedData: React.FC<ExtractedDataProps> = ({ document, isLoading = false }) => {
  // State for table data derived from document metadata
  const [tableData, setTableData] = useState<Array<{ key: string; value: string; confidence: number }>>([]);
  
  // Process document metadata into table format when document changes
  useEffect(() => {
    if (document?.metadata?.extractedData) {
      const processedData = Object.entries(document.metadata.extractedData).map(([key, value]) => ({
        key: key,
        value: String(value),
        confidence: document.metadata.ocrConfidence || 0
      }));
      setTableData(processedData);
    }
  }, [document]);

  // Table column definitions
  const columns = [
    {
      key: 'key',
      header: 'Field',
      width: '30%',
      formatter: (value: string) => capitalizeFirstLetter(value)
    },
    {
      key: 'value',
      header: 'Extracted Value',
      width: '50%'
    },
    {
      key: 'confidence',
      header: 'Confidence',
      width: '20%',
      formatter: (value: number) => formatPercentage(value / 100)
    }
  ];

  // Render validation errors if present
  const renderValidationErrors = () => {
    if (!document.metadata.validationErrors?.length) {
      return null;
    }

    return (
      <Card
        title="Validation Errors"
        variant="outline"
        className="mt-4"
      >
        <ul className="list-disc list-inside text-red-600">
          {document.metadata.validationErrors.map((error, index) => (
            <li key={index} className="mb-2">{error}</li>
          ))}
        </ul>
      </Card>
    );
  };

  // Render document metadata card
  const renderMetadataCard = () => {
    const metadataItems = [
      { label: 'Document Type', value: document.type },
      { label: 'Classification', value: document.classification },
      { label: 'Status', value: document.status },
      { label: 'Upload Date', value: document.uploadedAt.toLocaleDateString() },
      { label: 'Pages', value: document.pageCount.toString() }
    ];

    return (
      <Card
        title="Document Information"
        isLoading={isLoading}
        className="mb-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metadataItems.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-sm text-gray-600">{label}</span>
              <span className={classNames('font-medium', {
                'text-green-600': value === DocumentStatus.PROCESSED,
                'text-yellow-600': value === DocumentStatus.PROCESSING,
                'text-red-600': value === DocumentStatus.FAILED
              })}>
                {capitalizeFirstLetter(value)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // Render tags if present
  const renderTags = () => {
    if (!document.metadata.tags?.length) {
      return null;
    }

    return (
      <div className="mb-4">
        <h4 className="text-sm text-gray-600 mb-2">Tags</h4>
        <div className="flex flex-wrap gap-2">
          {document.metadata.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Document metadata section */}
      {renderMetadataCard()}

      {/* Tags section */}
      {renderTags()}

      {/* Extracted data table */}
      <Card
        title="Extracted Data"
        isLoading={isLoading}
      >
        <Table
          columns={columns}
          data={tableData}
          loading={isLoading}
          pageSize={10}
          className="w-full"
        />
      </Card>

      {/* Validation errors section */}
      {renderValidationErrors()}
    </div>
  );
};

export default ExtractedData;