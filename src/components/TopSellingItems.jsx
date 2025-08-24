import React from 'react';

const TopSellingItems = ({ items }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Top Selling Items</h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.name} className="flex items-center p-3 bg-gray-50 rounded-xl">
            <span className="text-lg w-6 text-center font-bold text-gray-400">{index + 1}</span>
            <p className="ml-4 font-medium text-gray-800 truncate">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSellingItems;
