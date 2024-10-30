/**
 * MainContent Component
 * Implements the main content area of the dashboard, integrating various components
 * for document management and user interaction.
 * 
 * Requirements implemented:
 * - User Interface Design - Main Dashboard Components
 * - Dashboard Layout
 */

import React from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.2

// Layout Components
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

// Dashboard Components
import ActionButtons from '../dashboard/ActionButtons';
import DocumentList from '../dashboard/DocumentList';
import SearchBar from '../dashboard/SearchBar';
import StatusFilters from '../dashboard/StatusFilters';

const MainContent: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Handle sidebar collapse state changes
  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Component */}
      <Sidebar onCollapse={handleSidebarCollapse} />

      {/* Main Content Area */}
      <div
        className={classNames(
          'flex flex-col flex-1 transition-all duration-300',
          {
            'ml-64': !isSidebarCollapsed,
            'ml-20': isSidebarCollapsed
          }
        )}
      >
        {/* Header Component */}
        <Header />

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Top Section - Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Search Bar */}
                <div className="flex-1">
                  <SearchBar />
                </div>
                
                {/* Action Buttons */}
                <div className="flex-shrink-0">
                  <ActionButtons />
                </div>
              </div>

              {/* Status Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <StatusFilters />
              </div>
            </div>

            {/* Document List Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <DocumentList />
            </div>
          </div>
        </main>

        {/* Footer Component */}
        <Footer />
      </div>
    </div>
  );
};

// Prop Types for child components
interface SidebarProps {
  onCollapse: (collapsed: boolean) => void;
}

// Default export
export default MainContent;