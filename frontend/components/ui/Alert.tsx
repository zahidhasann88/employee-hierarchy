import React from 'react';
import { FaInfoCircle, FaExclamationCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';

interface AlertProps {
  type?: 'info' | 'success' | 'error' | 'warning';
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type = 'info', message, onClose }) => {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };

  const icons = {
    info: <FaInfoCircle className="h-5 w-5 text-blue-400" />,
    success: <FaCheckCircle className="h-5 w-5 text-green-400" />,
    error: <FaExclamationCircle className="h-5 w-5 text-red-400" />,
    warning: <FaExclamationCircle className="h-5 w-5 text-yellow-400" />,
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`rounded-lg shadow-lg border ${styles[type]} flex items-start p-4 min-w-[300px] max-w-md`}>
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <FaTimes className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert; 