import React from 'react';

const CategoryCard = ({ category, onSelectCategory, onEdit }) => {
  return (
    <div className="relative group">
      <button
        onClick={() => onSelectCategory(category.name)}
        className="w-full bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md p-5 text-left transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300 focus:outline-none ring-1 ring-gray-200 hover:ring-indigo-300"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 relative">
            <img
              className="h-16 w-16 object-cover rounded-lg border border-gray-200"
              src={category.image || ''}
              alt={category.name}
              onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/E2E8F0/4A5568?text=Category'; }}
            />
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate flex items-center gap-2">
              {category.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 4a.75.75 0 00-1.5 0v4c0 .199.079.389.22.53l2.5 2.5a.75.75 0 101.06-1.06L10.75 9.19V6z"/></svg>
                {category.startTime || '--:--'} - {category.endTime || '--:--'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 000 2h1v1a1 1 0 002 0V4h2v1a1 1 0 002 0V4h1a1 1 0 100-2H6z"/><path fillRule="evenodd" d="M4 7a2 2 0 012-2h8a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 2a1 1 0 112 0v3a1 1 0 11-2 0V9zm5-1a1 1 0 00-2 0v5a1 1 0 102 0V8z" clipRule="evenodd" /></svg>
                {category.itemCount} item{category.itemCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEdit && onEdit(category); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-full p-1 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Edit category"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z"/><path d="M11.379 5.793L4 13.172V16h2.828l7.38-7.379-2.83-2.828z"/></svg>
      </button>
    </div>
  );
};

export default CategoryCard;
