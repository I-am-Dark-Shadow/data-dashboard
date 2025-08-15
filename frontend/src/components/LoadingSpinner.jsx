import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'default',
  showIcon = true,
  className = ''
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {showIcon && (
        <div className="flex items-center justify-center mb-4">
          <Loader2 className={`${sizeClasses[size]} text-primary-600 animate-spin`} />
        </div>
      )}
      
      {message && (
        <p className={`text-gray-600 text-center ${textSizeClasses[size]}`}>
          {message}
          <span className="loading-dots"></span>
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;