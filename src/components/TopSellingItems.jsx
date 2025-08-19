import React from 'react';

const TopSellingItems = ({ items }) => {
  const getTrophyIcon = (index) => {
    const icons = [
      <span role="img" aria-label="gold medal">🏆</span>, // Gold
      <span role="img" aria-label="silver medal">🥈</span>, // Silver
      <span role="img" aria-label="bronze medal">🥉</span>, // Bronze
    ];
    return icons[index] || null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Top Selling Items</h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center">
              <span className="text-lg w-6 text-center font-bold text-gray-400">{index + 1}</span>
              <p className="ml-4 font-medium text-gray-800">{item.name}</p>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-gray-700">{item.count} sold</span>
              <span className="w-6 text-center ml-2">{getTrophyIcon(index)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSellingItems;
