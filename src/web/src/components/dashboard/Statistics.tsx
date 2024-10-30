/**
 * Statistics Component
 * Displays key metrics and statistics related to documents on the dashboard.
 * Implements requirements from system_design.user_interface_design.main_dashboard_components
 */

// React imports - v18.2.0
import { useState, useEffect, useMemo } from 'react';
// Chart.js imports - v4.3.0
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Internal imports
import useDocuments from '../../hooks/useDocuments';
import useFilters from '../../hooks/useFilters';
import usePagination from '../../hooks/usePagination';
import { Document, DocumentStatus } from '../../types/document';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Interface definitions
interface StatisticsProps {
  className?: string;
  timeRange?: string;
}

interface DocumentStats {
  totalDocuments: number;
  statusDistribution: Record<DocumentStatus, number>;
  averageProcessingTime: number;
  successRate: number;
}

/**
 * Calculates the distribution of documents across different processing statuses
 */
const calculateStatusDistribution = (documents: Document[]): Record<DocumentStatus, number> => {
  const distribution: Record<DocumentStatus, number> = {
    [DocumentStatus.UPLOADED]: 0,
    [DocumentStatus.PROCESSING]: 0,
    [DocumentStatus.PROCESSED]: 0,
    [DocumentStatus.FAILED]: 0,
    [DocumentStatus.ARCHIVED]: 0,
  };

  documents.forEach((doc) => {
    distribution[doc.status]++;
  });

  return distribution;
};

/**
 * Calculates processing time and success rate metrics for documents
 */
const calculateProcessingMetrics = (documents: Document[]) => {
  const completedDocs = documents.filter(
    (doc) => doc.status === DocumentStatus.PROCESSED || doc.status === DocumentStatus.FAILED
  );

  const successfulDocs = documents.filter(
    (doc) => doc.status === DocumentStatus.PROCESSED
  );

  const processingTimes = completedDocs
    .filter((doc) => doc.processedAt && doc.uploadedAt)
    .map((doc) => {
      const processTime = new Date(doc.processedAt!).getTime() - new Date(doc.uploadedAt).getTime();
      return processTime / 1000; // Convert to seconds
    });

  const averageProcessingTime = processingTimes.length
    ? processingTimes.reduce((acc, time) => acc + time, 0) / processingTimes.length
    : 0;

  const successRate = completedDocs.length
    ? (successfulDocs.length / completedDocs.length) * 100
    : 0;

  return {
    averageProcessingTime,
    successRate,
  };
};

/**
 * Statistics Component
 * Displays document processing statistics and metrics on the dashboard
 */
const Statistics: React.FC<StatisticsProps> = ({ className = '', timeRange }) => {
  // Initialize hooks
  const { documents, loading } = useDocuments();
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    statusDistribution: {
      [DocumentStatus.UPLOADED]: 0,
      [DocumentStatus.PROCESSING]: 0,
      [DocumentStatus.PROCESSED]: 0,
      [DocumentStatus.FAILED]: 0,
      [DocumentStatus.ARCHIVED]: 0,
    },
    averageProcessingTime: 0,
    successRate: 0,
  });

  // Calculate statistics when documents change
  useEffect(() => {
    if (documents.length > 0) {
      const statusDistribution = calculateStatusDistribution(documents);
      const { averageProcessingTime, successRate } = calculateProcessingMetrics(documents);

      setStats({
        totalDocuments: documents.length,
        statusDistribution,
        averageProcessingTime,
        successRate,
      });
    }
  }, [documents]);

  // Prepare chart data for status distribution
  const statusChartData = useMemo(() => ({
    labels: Object.keys(stats.statusDistribution),
    datasets: [
      {
        data: Object.values(stats.statusDistribution),
        backgroundColor: [
          '#4F46E5', // Uploaded
          '#F59E0B', // Processing
          '#10B981', // Processed
          '#EF4444', // Failed
          '#6B7280', // Archived
        ],
        borderWidth: 1,
      },
    ],
  }), [stats.statusDistribution]);

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Document Status Distribution',
      },
    },
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Total Documents</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {stats.totalDocuments.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {stats.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Avg. Processing Time</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {stats.averageProcessingTime.toFixed(1)}s
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Active Processing</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {stats.statusDistribution[DocumentStatus.PROCESSING]}
              </p>
            </div>
          </div>

          {/* Status Distribution Chart */}
          <div className="h-64 mb-8">
            <Doughnut data={statusChartData} options={chartOptions} />
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(stats.statusDistribution).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-600">{status}</span>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({((count / stats.totalDocuments) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;