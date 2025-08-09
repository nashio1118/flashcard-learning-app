import React from 'react';

const LoadingSpinner = ({ size = 'large', text = '読み込み中...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="glass-morphism rounded-2xl p-8 text-center">
        <div className={`${sizeClasses[size]} border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
        <p className="text-white font-medium text-lg">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;