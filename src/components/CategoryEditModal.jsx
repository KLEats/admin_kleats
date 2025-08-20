import React, { useState, useEffect } from 'react';

// Modal now supports adding/editing a category with fields: name, startTime, endTime
// Backend endpoint: POST /api/Canteen/item/add-category body: { category: { name, startTime, endTime } }
// Times are HH:MM (seconds trimmed if provided)
const CategoryEditModal = ({ category, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({ name: '', startTime: '', endTime: '' });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        startTime: category.startTime || '',
        endTime: category.endTime || ''
      });
    } else {
      setFormData({ name: '', startTime: '', endTime: '' });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData });
  };

  return (
    // Modal Overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {category ? 'Edit Category' : 'Add New Category'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Category Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Time Range</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <span className="text-gray-500 font-medium">to</span>
                <div className="flex-1">
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Set the daily availability window (24h format).</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryEditModal;
