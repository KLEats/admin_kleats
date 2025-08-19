import React, { useState, useEffect } from 'react';

const CategoryEditModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', imageFile: null, imagePreview: '' });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        imageFile: null,
        imagePreview: category.image || ''
      });
    } else {
      setFormData({ name: '', imageFile: null, imagePreview: '' }); // Reset for adding new
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imageFile' && files) {
      const file = files[0];
      if (file) {
        const preview = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, imageFile: file, imagePreview: preview }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      imageFile: formData.imageFile,
      imagePreview: formData.imagePreview
    };
    onSave(payload);
    // Dummy category multipart upload example
    /*
    const fd = new FormData();
    fd.append('name', payload.name);
    if (payload.imageFile) fd.append('image', payload.imageFile);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/categories${category ? '/' + category.id : ''}`, {
      method: category ? 'PUT' : 'POST',
      body: fd
    });
    */
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

            {/* Image Upload */}
            <div>
              <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700">Category Image (upload)</label>
              <input
                type="file"
                id="imageFile"
                name="imageFile"
                accept="image/*"
                onChange={handleChange}
                className="mt-1 block w-full text-sm"
              />
              {formData.imagePreview && (
                <img src={formData.imagePreview} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded" />
              )}
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
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryEditModal;
