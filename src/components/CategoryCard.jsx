import React from 'react';

const CategoryCard = ({ category, onSelectCategory }) => {
  return (
    <button
      onClick={() => onSelectCategory(category.name)}
      className="w-full bg-white rounded-lg shadow-md p-6 text-left transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <img
            className="h-16 w-16 object-cover rounded-lg"
            src={category.image || ''}
            alt={category.name}
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/E2E8F0/4A5568?text=Category'; }}
          />
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{category.itemCount} items</p>
        </div>
      </div>
    </button>
  );
};

export default CategoryCard;
