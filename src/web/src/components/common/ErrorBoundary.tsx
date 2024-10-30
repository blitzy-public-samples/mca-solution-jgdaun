// React 18.2.0
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * Implements system-wide error handling strategy for React components
 * Catches runtime errors in component tree and provides standardized error visualization
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null
    };
  }

  /**
   * Lifecycle method to catch errors in child components
   * Implements error logging strategy defined in system architecture
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Format error according to system-wide error response structure
    const formattedError = {
      error: {
        code: 'UI_RUNTIME_ERROR',
        message: error.message,
        details: {
          field: errorInfo.componentStack,
          reason: error.name
        },
        request_id: crypto.randomUUID() // Generate unique error ID for tracking
      }
    };

    // Log error details in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', formattedError);
      console.error('Component Stack:', errorInfo.componentStack);
    }

    // Update component state with error information
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring system (as specified in system_architecture.monitoring_&_logging)
    try {
      // Send error to logging service
      // This could be CloudWatch, ELK, or other configured logging service
      const logError = async () => {
        await fetch('/api/logs/error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedError)
        });
      };
      
      logError().catch(console.error);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      // Render fallback UI if provided, otherwise render default error component
      return this.props.fallback || (
        <div className="error-boundary-fallback" role="alert" aria-live="assertive">
          <div className="error-boundary-content">
            <h2>Something went wrong</h2>
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="error-boundary-retry"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;