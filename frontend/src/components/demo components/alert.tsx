// src/components/demo components/Alert.tsx
import React, { useState } from 'react';

// Define the possible alert types
type AlertType = 'success' | 'info' | 'warning' | 'danger';

// Define the props for the Alert component
interface AlertProps {
  type: AlertType;
  message: React.ReactNode; // Allow string or other React nodes
  dismissible?: boolean;
  onClose?: () => void; // Optional callback when closed
  className?: string; // Allow passing additional classes
}

// Helper object to map types to styles and icons
const alertConfig: Record<AlertType, { alertClass: string; bgClass: string; iconClass: string }> = {
  success: { alertClass: 'alert-success', bgClass: 'bg-success', iconClass: 'fa-check-circle' },
  info: { alertClass: 'alert-info', bgClass: 'bg-info', iconClass: 'fa-info-circle' },
  warning: { alertClass: 'alert-warning', bgClass: 'bg-warning', iconClass: 'fa-exclamation-circle' },
  danger: { alertClass: 'alert-danger', bgClass: 'bg-danger', iconClass: 'fa-times-circle' },
};

const Alert: React.FC<AlertProps> = ({
  type,
  message,
  dismissible = false, // Default to not dismissible
  onClose,
  className = '', // Default to empty string
}) => {
  // State to manage the visibility of the alert
  const [isVisible, setIsVisible] = useState(true);
  // Get the configuration based on the alert type
  const config = alertConfig[type];

  // Handler for the close button
  const handleClose = () => {
    setIsVisible(false); // Hide the alert
    if (onClose) {
      onClose(); // Call the callback function if provided
    }
  };

  // If the alert is not visible, render nothing
  if (!isVisible) {
    return null;
  }

  return (
    <div
      // Combine base classes, type-specific class, and any additional classes passed via props
      className={`alert ${config.alertClass} border-0 d-flex align-items-center ${className}`}
      role="alert"
    >
      {/* Icon Section */}
      <div className={`${config.bgClass} me-3 icon-item`}>
        {/* Ensure Font Awesome is loaded in your project */}
        <span className={`fas ${config.iconClass} text-white fs-6`}></span>
      </div>

      {/* Message Section */}
      <p className="mb-0 flex-1">{message}</p>

      {/* Close Button (Rendered only if dismissible is true) */}
      {dismissible && (
        <button
          className="btn-close"
          type="button"
          data-bs-dismiss="alert" // Standard Bootstrap attribute (useful if Bootstrap JS is also active)
          aria-label="Close"
          onClick={handleClose} // React's way to handle the click event
        ></button>
      )}
    </div>
  );
};


// --- Example Usage Component (Optional - Demonstrates how to use Alert) ---
// You would typically import and use the Alert component in other files.
// To use this example, you could render <AlertExamples /> somewhere in your app.
export const AlertExamples: React.FC = () => {
    const handleAlertClose = (type: string) => {
        console.log(`${type} alert closed!`);
    }

    return (
        <div className="p-3"> {/* Add some padding for visual separation */}
            <h4>Alert Examples</h4>
            <Alert
                type="success"
                message="A simple success alert—check it out!"
                dismissible
                onClose={() => handleAlertClose('Success')}
            />
            <Alert
                type="info"
                message={<span>A simple <b>info</b> alert—check it out!</span>} // Example with JSX message
                dismissible
                onClose={() => handleAlertClose('Info')}
                className="mt-2" // Add margin between alerts
            />
            <Alert
                type="warning"
                message="A simple warning alert—check it out!"
                dismissible={false} // Example: Not dismissible
                className="mt-2"
            />
            <Alert
                type="danger"
                message="A simple danger alert—check it out!"
                dismissible
                onClose={() => handleAlertClose('Danger')}
                className="mt-2" // Example: Adding custom margin top
            />
        </div>
    );
}


export default Alert; // Export the main Alert component