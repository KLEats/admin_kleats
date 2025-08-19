import React, { useState, useEffect } from 'react';
import { addItem } from '../api/items.js';
import Layout from '../components/Layout';
import MenuItemCard from '../components/MenuItemCard';
import EditMenuItemModal from '../components/EditMenuItemModal';
import CategoryCard from '../components/CategoryCard';
import CategoryEditModal from '../components/CategoryEditModal';

// --- DUMMY DATA using backend schema ---
const initialMenuItems = [
  { id: 1, ItemName: 'Masala Dosa', tags: ['Tiffins','South Indian','Veg'], Description: 'Crispy dosa stuffed with spicy potato filling.', Price: 60.00, ava: true, category: 'Tiffins', image: 'https://images.unsplash.com/photo-1626786425719-a3b7dc5b8cb3?q=80&w=2070&auto=format&fit=crop' },
  { id: 2, ItemName: 'Samosa', tags: ['Snacks','Veg'], Description: 'Classic Indian snack with spicy potato filling.', Price: 15.00, ava: true, category: 'Snacks', image: 'https://images.unsplash.com/photo-1601050690594-716e1d9b9b09?q=80&w=1935&auto=format&fit=crop' },
  { id: 3, ItemName: 'Veg Biryani', tags: ['Main Course','Rice','Veg'], Description: 'Aromatic rice dish with mixed vegetables and spices.', Price: 120.00, ava: true, category: 'Main Course', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1974&auto=format&fit=crop' },
  { id: 4, ItemName: 'Paneer Tikka', tags: ['Starters','Paneer','Veg'], Description: 'Grilled paneer cubes marinated in spices.', Price: 150.00, ava: false, category: 'Starters', image: 'https://images.unsplash.com/photo-1567188040759-fb8a873dc6d8?q=80&w=1917&auto=format&fit=crop' },
  { id: 5, ItemName: 'Filter Coffee', tags: ['Beverages','Coffee'], Description: 'South Indian style filter coffee.', Price: 25.00, ava: true, category: 'Beverages', image: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=1974&auto=format&fit=crop' },
  { id: 6, ItemName: 'Chole Bhature', tags: ['Main Course','North Indian','Veg'], Description: 'Spicy chickpeas served with fried bread.', Price: 100.00, ava: true, category: 'Main Course', image: 'https://images.unsplash.com/photo-1606694242547-5a3e1d6ac238?q=80&w=2070&auto=format&fit=crop' },
  { id: 7, ItemName: 'Idli', tags: ['Tiffins','South Indian','Veg'], Description: 'Steamed rice cakes, soft and fluffy.', Price: 40.00, ava: true, category: 'Tiffins', image: 'https://images.unsplash.com/photo-1595235334239-ab620a30f4a4?q=80&w=1974&auto=format&fit=crop' },
  { id: 8, ItemName: 'Veg Noodles', tags: ['Chinese','Noodles','Veg'], Description: 'Stir-fried noodles with vegetables.', Price: 90.00, ava: true, category: 'Chinese', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=1892&auto=format&fit=crop' }
];

const dummyMetrics = { todaySales: 7550.5, todayOrders: 125, monthlySales: 185750.0 };

const MenuPage = ({ onLogout, navigateTo, currentPage }) => {
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [categories, setCategories] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    const derived = menuItems.reduce((acc, item) => {
      const found = acc.find(c => c.name === item.category);
      if (found) { found.itemCount++; }
      else { acc.push({ name: item.category, itemCount: 1, image: item.imagePreview || item.image || '' }); }
      return acc;
    }, []);
    setCategories(derived);
  }, [menuItems]);

  const handleSelectCategory = (name) => setSelectedCategory(name);
  const handleBackToCategories = () => setSelectedCategory(null);
  const handleCloseAllModals = () => { setEditingItem(null); setIsAddingNew(false); setIsCategoryModalOpen(false); };
  const handleAddNewItem = () => { setIsAddingNew(true); setEditingItem({ ItemName: '', tags: [], Description: '', Price: 0, ava: true, category: selectedCategory, image: '' }); };
  const handleEditItem = (item) => { setIsAddingNew(false); setEditingItem(item); };

  const handleSaveItem = async (payload) => {
    if (isAddingNew) {
      try {
        // Build item JSON excluding id and imageFile fields; category may be optional depending on backend
        const itemJson = {
          ItemName: payload.ItemName,
          tags: payload.tags,
          Description: payload.Description,
          Price: payload.Price,
          ava: payload.ava,
          category: payload.category
        };
        const apiData = await addItem({ imageFile: payload.imageFile, itemJson });
        const newItem = {
          id: apiData.ItemId,
          ItemName: apiData.ItemName,
            tags: apiData.tags,
            Description: apiData.Description,
            Price: apiData.Price,
            ava: apiData.ava,
            category: apiData.category,
            image: apiData.ImagePath,
            imagePreview: payload.imagePreview
        };
        setMenuItems(prev => [...prev, newItem]);
      } catch (err) {
        alert('Add item failed: ' + err.message);
        return;
      }
    } else {
      // Local update only for now (update API logic as needed)
      setMenuItems(prev => prev.map(i => i.id === payload.id ? { ...i, ...payload } : i));
    }
    handleCloseAllModals();
  };

  const handleStockToggle = (id) => {
    setMenuItems(prev => prev.map(i => i.id === id ? { ...i, ava: !i.ava } : i));
  };

  const handleDeleteItem = (id) => {
    // Dummy delete
    /*
    fetch(`${import.meta.env.VITE_API_BASE_URL}/menu-items/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(data => console.log('Deleted', data))
      .catch(err => console.error('Delete failed', err));
    */
    setMenuItems(prev => prev.filter(i => i.id !== id));
    handleCloseAllModals();
  };

  const handleSaveCategory = (catData) => {
    if (categories.some(c => c.name.toLowerCase() === catData.name.toLowerCase())) { alert('Category exists'); return; }
    setCategories(prev => [...prev, { ...catData, itemCount: 0 }]);
    handleCloseAllModals();
  };

  const itemsToShow = selectedCategory ? menuItems.filter(i => i.category === selectedCategory) : [];

  return (
    <Layout metrics={dummyMetrics} onLogout={onLogout} navigateTo={navigateTo} currentPage={currentPage}>
      {!selectedCategory ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Menu Categories</h1>
            <button onClick={() => setIsCategoryModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700">+ Add New Category</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map(cat => <CategoryCard key={cat.name} category={cat} onSelectCategory={handleSelectCategory} />)}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <button onClick={handleBackToCategories} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Back to Categories
            </button>
            <button onClick={handleAddNewItem} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700">+ Add New Item</button>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">{selectedCategory}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {itemsToShow.map(item => <MenuItemCard key={item.id} item={item} onEdit={handleEditItem} onStockToggle={handleStockToggle} />)}
          </div>
        </>
      )}
      {editingItem && <EditMenuItemModal item={editingItem} isAddingNew={isAddingNew} onClose={handleCloseAllModals} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
      {isCategoryModalOpen && <CategoryEditModal onClose={handleCloseAllModals} onSave={handleSaveCategory} />}
    </Layout>
  );
};

export default MenuPage;
