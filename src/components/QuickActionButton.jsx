import React from 'react';

const QuickActionButton = ({ text, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <button
      className={`flex-1 flex flex-col items-center justify-center p-6 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${colorClasses[color] || 'bg-gray-600 hover:bg-gray-700'}`}
    >
      {icon}
      <span className="mt-2 text-lg font-semibold">{text}</span>
    </button>
  );
};

export default QuickActionButton;
