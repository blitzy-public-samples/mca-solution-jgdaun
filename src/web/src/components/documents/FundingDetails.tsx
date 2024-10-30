// React 18.2.0
import React, { useState, useEffect } from 'react';
// Third-party imports
import { formatCurrency } from '../../utils/format';
import { makeApiRequest } from '../../utils/api';
import Card from '../common/Card';
import Table from '../common/Table';
import type { Document, DocumentMetadata } from '../../types/document';
import type { ApiResponse } from '../../types/api';

// Interface for funding details data structure
interface FundingData {
  loanAmount: number;
  interestRate: number;
  termLength: number;
  monthlyPayment: number;
  totalPayment: number;
  paymentSchedule: PaymentScheduleItem[];
}

// Interface for payment schedule items
interface PaymentScheduleItem {
  paymentNumber: number;
  dueDate: string;
  principal: number;
  interest: number;
  totalPayment: number;
  remainingBalance: number;
}

// Props interface for the FundingDetails component
interface FundingDetailsProps {
  document: Document;
}

/**
 * FundingDetails Component
 * Displays detailed funding information for a specific document within the application.
 * Implements the Application Details View requirement for presenting comprehensive
 * financial data in an organized format within the right panel.
 */
const FundingDetails: React.FC<FundingDetailsProps> = ({ document }) => {
  // State for funding details data
  const [fundingData, setFundingData] = useState<FundingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Table columns configuration for payment schedule
  const paymentScheduleColumns = [
    {
      key: 'paymentNumber',
      header: 'Payment #',
      width: '10%',
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      width: '20%',
    },
    {
      key: 'principal',
      header: 'Principal',
      width: '20%',
      formatter: (value: number) => formatCurrency(value),
    },
    {
      key: 'interest',
      header: 'Interest',
      width: '20%',
      formatter: (value: number) => formatCurrency(value),
    },
    {
      key: 'totalPayment',
      header: 'Total Payment',
      width: '15%',
      formatter: (value: number) => formatCurrency(value),
    },
    {
      key: 'remainingBalance',
      header: 'Remaining Balance',
      width: '15%',
      formatter: (value: number) => formatCurrency(value),
    },
  ];

  // Fetch funding details when document changes
  useEffect(() => {
    const fetchFundingDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Make API request to fetch funding details
        const response = await makeApiRequest<FundingData>(
          `/api/v1/documents/${document.id}/funding`,
          'GET'
        );

        if (response.success && response.data) {
          setFundingData(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch funding details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if document is processed
    if (document.status === 'PROCESSED' && document.metadata?.extractedData) {
      fetchFundingDetails();
    } else {
      setFundingData(null);
      setIsLoading(false);
    }
  }, [document]);

  // Render funding summary section
  const renderFundingSummary = () => {
    if (!fundingData) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500">Loan Amount</h4>
          <p className="text-xl font-semibold text-gray-900">
            {formatCurrency(fundingData.loanAmount)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500">Interest Rate</h4>
          <p className="text-xl font-semibold text-gray-900">
            {fundingData.interestRate.toFixed(2)}%
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500">Term Length</h4>
          <p className="text-xl font-semibold text-gray-900">
            {fundingData.termLength} months
          </p>
        </div>
      </div>
    );
  };

  // Render payment details section
  const renderPaymentDetails = () => {
    if (!fundingData) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-primary-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-primary-700">Monthly Payment</h4>
            <p className="text-xl font-semibold text-primary-900">
              {formatCurrency(fundingData.monthlyPayment)}
            </p>
          </div>
          <div className="bg-primary-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-primary-700">Total Payment</h4>
            <p className="text-xl font-semibold text-primary-900">
              {formatCurrency(fundingData.totalPayment)}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Schedule</h4>
          <Table
            columns={paymentScheduleColumns}
            data={fundingData.paymentSchedule}
            className="w-full"
            pageSize={5}
          />
        </div>
      </div>
    );
  };

  // Render error state
  if (error) {
    return (
      <Card
        title="Funding Details"
        className="bg-red-50 border-red-200"
      >
        <div className="text-red-600">
          {error}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Funding Details"
      isLoading={isLoading}
    >
      {!isLoading && !fundingData && (
        <div className="text-gray-500 text-center py-4">
          No funding details available for this document.
        </div>
      )}
      {fundingData && (
        <div className="space-y-6">
          {renderFundingSummary()}
          {renderPaymentDetails()}
        </div>
      )}
    </Card>
  );
};

export default FundingDetails;