import React, { useState, useEffect } from 'react';

// Backend schema fields: ItemName, tags[], Description, Price, ava, category, image
// Category is provided automatically from parent (selectedCategory)
// Tags edited as comma separated string in UI.
const EditMenuItemModal = ({ item, isAddingNew, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    ItemName: item?.ItemName || '',
    Description: item?.Description || '',
    tags: item?.tags ? item.tags.join(', ') : '',
    Price: item?.Price || 0,
    ava: item?.ava ?? true,
    category: item?.category || '',
    imageFile: null,          // File object
    imagePreview: item?.image || '', // Existing preview / legacy URL / object URL
    id: item?.id
  });

  useEffect(() => {
    setFormData({
      ItemName: item?.ItemName || '',
      Description: item?.Description || '',
      tags: item?.tags ? item.tags.join(', ') : '',
      Price: item?.Price || 0,
      ava: item?.ava ?? true,
      category: item?.category || '',
      imageFile: null,
      imagePreview: item?.image || '',
      id: item?.id
    });
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'imageFile' && files) {
      const file = files[0];
      if (file) {
        const preview = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, imageFile: file, imagePreview: preview }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ItemName: formData.ItemName.trim(),
      Description: formData.Description.trim(),
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      Price: parseFloat(formData.Price) || 0,
      ava: !!formData.ava,
      category: formData.category,
      id: formData.id,
      // Store preview so UI can render immediately
      imagePreview: formData.imagePreview,
      // Keep file separately (not serializable to JSON) - parent can decide handling
      imageFile: formData.imageFile
    };
    onSave(payload); // Parent can decide to build FormData

    // Dummy multipart API integration example: replace with real endpoint
    /*
    const form = new FormData();
    form.append('ItemName', payload.ItemName);
    form.append('Description', payload.Description);
    form.append('Price', String(payload.Price));
    form.append('ava', String(payload.ava));
    form.append('category', payload.category);
    payload.tags.forEach(t => form.append('tags[]', t));
    if (payload.imageFile) form.append('image', payload.imageFile); // backend field name 'image'

    fetch(`${import.meta.env.VITE_API_BASE_URL}/menu-items${isAddingNew ? '' : '/' + payload.id}`, {
      method: isAddingNew ? 'POST' : 'PUT',
      body: form
    })
      .then(r => r.json())
      .then(data => console.log('Saved item', data))
      .catch(err => console.error('Save failed', err));
    */
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      onDelete(formData.id);
      /*
      fetch(`${import.meta.env.VITE_API_BASE_URL}/menu-items/${formData.id}`, {
        method: 'DELETE'
      })
        .then(r => r.json())
        .then(data => console.log('Deleted', data))
        .catch(err => console.error('Delete failed', err));
      */
    }
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{isAddingNew ? 'Add New Menu Item' : 'Edit Menu Item'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="ItemName" className="block text-sm font-medium text-gray-700">Item Name</label>
              <input id="ItemName" name="ItemName" type="text" value={formData.ItemName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="Description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="Description" name="Description" value={formData.Description} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
              <input id="tags" name="tags" type="text" value={formData.tags} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="Price" className="block text-sm font-medium text-gray-700">Price</label>
              <input id="Price" name="Price" type="number" step="0.01" value={formData.Price} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex items-center">
              <input id="ava" name="ava" type="checkbox" checked={formData.ava} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              <label htmlFor="ava" className="ml-2 block text-sm font-medium text-gray-700">Available</label>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category (auto)</label>
              <input id="category" name="category" type="text" value={formData.category} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 sm:text-sm" />
              <p className="mt-1 text-xs text-gray-400">Automatically set from selected category; not sent if backend assigns by route.</p>
            </div>
            <div>
              <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700">Image (upload)</label>
              <input id="imageFile" name="imageFile" type="file" accept="image/*" onChange={handleChange} className="mt-1 block w-full text-sm text-gray-700" />
              {formData.imagePreview && (
                <img src={formData.imagePreview} alt="Preview" className="mt-2 h-32 w-full object-cover rounded border" onError={(e)=>{e.target.style.display='none';}} />
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div>
              {!isAddingNew && (
                <button type="button" onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Delete</button>
              )}
            </div>
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{isAddingNew ? 'Add Item' : 'Save Changes'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMenuItemModal;
