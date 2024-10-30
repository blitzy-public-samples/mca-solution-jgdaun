// React 18.2.0
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom'; // React-DOM 18.2.0
import Button from './Button';
import ErrorBoundary from './ErrorBoundary';

interface ModalProps {
  /** Controls the visibility of the modal */
  isOpen: boolean;
  /** Callback function to handle modal closing */
  onClose: () => void;
  /** Modal title for accessibility and display */
  title: string;
  /** Modal content to be rendered */
  children: React.ReactNode;
  /** Modal size variant - 'sm', 'md', or 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A reusable Modal component that provides a consistent interface for displaying modal dialogs
 * across the application. Implements accessibility features, keyboard navigation, and responsive
 * design patterns according to the system's UI requirements.
 * 
 * @implements Main Dashboard Components requirement for modal functionality
 * @implements Frontend Layer requirement for core UI component
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  // State for managing modal mount/unmount animations
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Refs for managing focus trap and modal content
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  
  // Get all focusable elements within the modal
  const getFocusableElements = (): HTMLElement[] => {
    if (!modalRef.current) return [];
    
    return Array.from(
      modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
  };

  // Handle modal size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  // Set up event listeners and manage focus when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      previousActiveElement.current = document.activeElement;
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Focus first focusable element
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    } else {
      setIsAnimating(false);
      document.body.style.overflow = '';
      
      // Restore focus to previous element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard events for accessibility
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) return;

    // Close on escape key
    if (event.key === 'Escape') {
      onClose();
      return;
    }

    // Trap focus within modal
    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      }
      // Tab
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  // Handle click outside modal
  const handleOutsideClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Don't render anything if modal is not open
  if (!isOpen && !isAnimating) return null;

  // Create portal for modal
  return createPortal(
    <ErrorBoundary>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleOutsideClick}
        role="presentation"
      >
        {/* Modal Container */}
        <div
          ref={modalRef}
          className={`relative w-full ${sizeClasses[size]} transform rounded-lg bg-white shadow-xl transition-all duration-300 ${
            isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              {title}
            </h2>
            <Button
              label="Close"
              onClick={onClose}
              variant="outline"
              size="small"
              className="!p-1"
              aria-label="Close modal"
            />
          </div>

          {/* Modal Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </ErrorBoundary>,
    document.body
  );
};

export default Modal;