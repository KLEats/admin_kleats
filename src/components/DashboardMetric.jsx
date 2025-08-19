import React from 'react';

const DashboardMetric = ({ title, value, icon, description }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-indigo-100 rounded-xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {description && <p className="mt-4 text-xs text-gray-400">{description}</p>}
    </div>
  );
};

export default DashboardMetric;
