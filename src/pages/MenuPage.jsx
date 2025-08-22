import React, { useState, useEffect, useRef } from 'react';
import { addItem, fetchItemsByCategory, fetchCategories, addCategory, updateCategory, updateItem } from '../api/items.js';
import Layout from '../components/Layout';
import MenuItemCard from '../components/MenuItemCard';
import EditMenuItemModal from '../components/EditMenuItemModal';
import CategoryCard from '../components/CategoryCard';
import CategoryEditModal from '../components/CategoryEditModal';

// --- DUMMY DATA using backend schema ---
const initialMenuItems = [];

const dummyMetrics = { todaySales: 7550.5, todayOrders: 125, monthlySales: 185750.0 };

const MenuPage = ({ onLogout, navigateTo, currentPage }) => {
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [prefetchedCounts, setPrefetchedCounts] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const fetchedCountsRef = useRef(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingCategories(true);
      try {
        const cats = await fetchCategories({});
        if (!active) return;
        if (!cats || !cats.length) {
          setCategories([]);
          return;
        }
        // Fetch item counts for all categories in parallel and apply in one update
        try {
          const counts = await Promise.all(cats.map(async (c) => {
            try {
              const items = await fetchItemsByCategory(c.name);
              return Array.isArray(items) ? items.length : 0;
            } catch (e) { return 0; }
          }));
          if (!active) return;
          const catsWithCounts = cats.map((c, i) => ({ ...c, itemCount: counts[i] }));
          setCategories(catsWithCounts);
          // mark fetched counts
          counts.forEach((_, i) => fetchedCountsRef.current.add(cats[i].name));
        } catch (countErr) {
          // If counts fetch fails, still set categories without counts
          setCategories(cats);
        }
      } catch (err) {
        console.warn('Fetch categories failed:', err.message);
        if (active) setCategories([]);
      } finally {
        if (active) setLoadingCategories(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // counts are fetched in initial load to avoid per-category race updates

  const handleSelectCategory = async (name) => {
    setSelectedCategory(name);
    setLoadingItems(true);
    try {
      const items = await fetchItemsByCategory(name);
      setMenuItems(prev => {
        // Remove old items of this category then add fresh ones
        const others = prev.filter(i => i.category !== name);
        return [...others, ...items];
      });
  // update count for this category
  setCategories(prev => prev.map(c => c.name === name ? { ...c, itemCount: items.length } : c));
    } catch (err) {
      alert('Fetch items failed: ' + err.message);
    } finally {
      setLoadingItems(false);
    }
  };
  const handleBackToCategories = () => setSelectedCategory(null);
  const handleCloseAllModals = () => { setEditingItem(null); setIsAddingNew(false); setIsCategoryModalOpen(false); setEditingCategory(null); };
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
        // increment category count if known
        if (newItem.category) {
          setCategories(prev => prev.map(c => c.name === newItem.category ? { ...c, itemCount: (c.itemCount || 0) + 1 } : c));
        }
      } catch (err) {
        alert('Add item failed: ' + err.message);
        return;
      }
    } else {
      try {
        const prev = menuItems.find(i => i.id === payload.id);
        const prevCategory = prev?.category;
        const itemJson = {
          ItemName: payload.ItemName,
          tags: payload.tags,
          Description: payload.Description,
          Price: payload.Price,
          ava: payload.ava,
          category: payload.category
        };
        const apiData = await updateItem({ id: payload.id, imageFile: payload.imageFile, itemJson });
        const updated = {
          id: apiData.ItemId ?? payload.id,
          ItemName: apiData.ItemName ?? payload.ItemName,
          tags: apiData.tags ?? payload.tags,
          Description: apiData.Description ?? payload.Description,
          Price: apiData.Price ?? payload.Price,
          ava: apiData.ava ?? payload.ava,
          category: apiData.category ?? payload.category,
          image: apiData.ImagePath ?? payload.image,
          imagePreview: payload.imagePreview || apiData.ImagePath
        };
        setMenuItems(prev => prev.map(i => i.id === payload.id ? { ...i, ...updated } : i));
        // If category changed, adjust counts
        const newCategory = updated.category;
        if (prevCategory && newCategory && prevCategory !== newCategory) {
          setCategories(prevCats => prevCats.map(c => {
            if (c.name === prevCategory) return { ...c, itemCount: Math.max(0, (c.itemCount || 0) - 1) };
            if (c.name === newCategory) return { ...c, itemCount: (c.itemCount || 0) + 1 };
            return c;
          }));
        }
      } catch (err) {
        alert('Update item failed: ' + err.message);
        return;
      }
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

  const handleSaveCategory = async (catData) => {
    // Editing existing
    if (editingCategory) {
      setAddingCategory(true);
      try {
        // Try to update on server and capture response
        let apiResp = null;
        try {
          apiResp = await updateCategory(editingCategory.name, { name: catData.name, startTime: catData.startTime, endTime: catData.endTime });
        } catch (apiErr) {
          console.warn('Update category API failed (will attempt refetch or local fallback):', apiErr.message);
        }

        // If server returned updated category, apply it locally. Otherwise try to refetch list.
        if (apiResp) {
          const norm = (t) => {
            if (!t) return '';
            const parts = String(t).split(':');
            if (parts.length >= 2) return parts[0].padStart(2,'0') + ':' + parts[1].padStart(2,'0');
            return String(t);
          };
          const updatedCat = {
            name: apiResp.name || catData.name || editingCategory.name,
            startTime: norm(apiResp.startTime || apiResp.start_time || catData.startTime),
            endTime: norm(apiResp.endTime || apiResp.end_time || catData.endTime),
          };
          setCategories(prev => {
            const newCats = prev.map(c => c.name === editingCategory.name ? { ...c, ...updatedCat } : c);
            try { localStorage.setItem('kleats:categories', JSON.stringify(newCats)); } catch (e) { /* ignore */ }
            return newCats;
          });
        } else {
          // Always refetch to ensure persisted times reflect backend normalization
          try {
            setLoadingCategories(true);
            const refreshed = await fetchCategories({});
            setCategories(refreshed);
          } catch (err) {
            // fallback to local update if refetch fails
            setCategories(prev => prev.map(c => c.name === editingCategory.name ? { ...c, name: catData.name, startTime: catData.startTime, endTime: catData.endTime } : c));
          } finally {
            setLoadingCategories(false);
          }
        }

        handleCloseAllModals();
      } catch (err) {
        alert('Update category failed: ' + err.message);
      } finally {
        setAddingCategory(false);
      }
      return;
    }
    // Adding new
    if (categories.some(c => c.name.toLowerCase() === catData.name.toLowerCase())) { alert('Category exists'); return; }
    setAddingCategory(true);
    try {
      await addCategory({ name: catData.name, startTime: catData.startTime, endTime: catData.endTime });
      try {
        setLoadingCategories(true);
        const refreshed = await fetchCategories({});
        setCategories(refreshed);
      } catch (err) {
        setCategories(prev => [...prev, { ...catData, itemCount: 0 }]);
      } finally {
        setLoadingCategories(false);
      }
      handleCloseAllModals();
    } catch (err) {
      alert('Add category failed: ' + err.message);
    } finally {
      setAddingCategory(false);
    }
  };

  const itemsToShow = selectedCategory ? menuItems.filter(i => i.category === selectedCategory) : [];

  const [loadingItems, setLoadingItems] = useState(false);

  return (
    <Layout metrics={dummyMetrics} onLogout={onLogout} navigateTo={navigateTo} currentPage={currentPage}>
      {!selectedCategory ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Menu Categories</h1>
            <button onClick={() => setIsCategoryModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700">+ Add New Category</button>
          </div>
          {loadingCategories ? (
            <p className="text-sm text-gray-500">Loading categories...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map(cat => <CategoryCard key={cat.name} category={cat} onSelectCategory={handleSelectCategory} onEdit={(c) => { setEditingCategory(c); setIsCategoryModalOpen(true); }} />)}
            </div>
          )}
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
          {loadingItems ? (
            <p className="text-sm text-gray-500">Loading items...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {itemsToShow.map(item => <MenuItemCard key={item.id} item={item} onEdit={handleEditItem} onStockToggle={handleStockToggle} />)}
            </div>
          )}
        </>
      )}
  {editingItem && <EditMenuItemModal item={editingItem} isAddingNew={isAddingNew} onClose={handleCloseAllModals} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
  {isCategoryModalOpen && (
    <CategoryEditModal
      category={editingCategory}
      onClose={handleCloseAllModals}
      onSave={handleSaveCategory}
      loading={addingCategory}
      categoryNames={categories.map(c => c.name)}
    />
  )}
    </Layout>
  );
};

export default MenuPage;
