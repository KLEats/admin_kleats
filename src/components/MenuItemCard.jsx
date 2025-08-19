import React from 'react';

// Displays item using backend schema fields.
const MenuItemCard = ({ item, onEdit, onStockToggle }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      <img
        src={item.imagePreview || item.image || ''}
        alt={item.ItemName}
        className="w-full h-48 object-cover"
        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/E2E8F0/4A5568?text=No+Image'; }}
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900">{item.ItemName}</h3>
        <p className="text-gray-700 font-semibold mt-1">₹{item.Price.toFixed(2)}</p>
        {item.Description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.Description}</p>}
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags && item.tags.map((t,i) => <span key={i} className="bg-gray-200 text-xs px-2 py-0.5 rounded">{t}</span>)}
        </div>
        <div className="flex-grow" />
        <div className="flex items-center justify-between mt-4">
          <span className={`text-sm font-semibold ${item.ava ? 'text-green-600' : 'text-red-600'}`}>{item.ava ? 'In Stock' : 'Out of Stock'}</span>
          <button onClick={() => onStockToggle(item.id)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${item.ava ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${item.ava ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="mt-4 border-t pt-4">
          <button onClick={() => onEdit(item)} className="w-full text-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Edit Item</button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
