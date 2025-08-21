// Item API helpers
import { getToken } from './auth';

function getBase() {
  return (import.meta.env.NEXT_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
}

// Add new item with multipart: image file + JSON blob (without category if backend auto-assigns)
export async function addItem({ imageFile, itemJson }) {
  if (!imageFile) throw new Error('Image file is required');
  // Build JSON payload; backend sample shows key 'ava'.
  const payload = { ...itemJson };
  // Category may be optional; if empty remove it.
  if (!payload.category) delete payload.category;
  const form = new FormData();
  form.append('images', imageFile); // field name per curl: images
  form.append('json', JSON.stringify(payload)); // backend expects a JSON string field named json

  const token = getToken();
  const res = await fetch(getBase() + '/api/Canteen/item/add', {
    method: 'POST',
    headers: {
      // Curl example shows raw token (no Bearer prefix)
      Authorization: token || ''
    },
    body: form
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Invalid JSON: ' + text); }
  if (!res.ok || data.code !== 1) {
    const detail = `Add item failed: status=${res.status} code=${data.code} message=${data.message || 'N/A'} body=${text.slice(0,300)}`;
    throw new Error(detail);
  }
  return data.data;
}

export function buildImageUrl(path) {
  if (!path) return '';
  const base = (import.meta.env.NEXT_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  return path.startsWith('http') ? path : base + path;
}

export async function fetchItemsByCategory(category) {
  const base = getBase();
  const token = getToken();
  const url = base + '/api/explore/get/items-by-category/' + encodeURIComponent(category);
  const res = await fetch(url, {
    headers: token ? { Authorization: token } : {}
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Invalid JSON: ' + text); }
  if (!res.ok || data.code !== 1) {
    throw new Error(data?.message || 'Fetch items failed');
  }
  return (data.data || []).map(it => ({
    id: it.ItemId,
    ItemName: it.ItemName,
    tags: it.tags || [],
    Description: it.Description,
    Price: it.Price,
    ava: it.ava,
    category: it.category,
    image: it.ImagePath,
    imagePreview: buildImageUrl(it.ImagePath),
    startTime: it.startTime,
    endTime: it.endTime,
    canteenId: it.canteenId
  }));
}

// Update an existing item via multipart form as per backend curl
// PATCH /api/Canteen/item/updateData?id={id}
// headers: { Authorization: <token> }
// form: images (file, optional), json (stringified JSON with fields e.g. { Price, category, ... })
export async function updateItem({ id, imageFile, itemJson }) {
  if (!id && id !== 0) throw new Error('Item id is required');
  const form = new FormData();
  if (imageFile) form.append('images', imageFile);
  // Keep only defined fields to avoid backend rejecting unknowns
  const allowed = ['ItemName', 'Description', 'Price', 'ava', 'category', 'tags', 'startTime', 'endTime'];
  const payload = {};
  for (const k of allowed) {
    if (typeof itemJson?.[k] !== 'undefined' && itemJson[k] !== null) payload[k] = itemJson[k];
  }
  form.append('json', JSON.stringify(payload));

  const token = getToken();
  const res = await fetch(getBase() + `/api/Canteen/item/updateData?id=${encodeURIComponent(id)}` , {
    method: 'PATCH',
    headers: {
      Authorization: token || ''
    },
    body: form
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Invalid JSON: ' + text); }
  if (!res.ok || data.code !== 1) {
    const detail = `Update item failed: status=${res.status} code=${data.code} message=${data.message || 'N/A'} body=${text.slice(0,300)}`;
    throw new Error(detail);
  }
  return data.data;
}

// Attempt to fetch categories from backend. Tries a list of possible endpoints.
export async function fetchCategories() {
  const base = getBase();
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = token;
  const res = await fetch(base + '/api/explore/categories', { headers });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Invalid JSON: ' + text); }
  if (!res.ok || data.code !== 1) throw new Error(data?.message || 'Fetch categories failed');
  const arr = data.data || [];
  return arr.map(c => ({
    name: c.name || c.CategoryName || c.category || c.Category || '',
    image: buildImageUrl(c.image || c.ImagePath || c.icon || ''),
    itemCount: c.itemCount ?? c.count ?? c.ItemCount ?? 0,
  startTime: c.startTime || c.StartTime || '',
  endTime: c.endTime || c.EndTime || '',
    raw: c
  }));
}

// Add a category: POST /api/Canteen/item/add-category with body { "category": { name, startTime, endTime } }
export async function addCategory({ name, startTime, endTime }) {
  if (!name) throw new Error('Category name required');
  // Normalize times to HH:MM (drop seconds if user agent adds) and ensure 2-digit padding
  const norm = (t) => {
    if (!t) return '';
    // Accept formats: HH:MM, HH:MM:SS
    const parts = t.split(':');
    if (parts.length >= 2) return parts[0].padStart(2,'0') + ':' + parts[1].padStart(2,'0');
    return t; // fallback
  };
  const payload = {
    category: {
      name: name.trim(),
      startTime: norm(startTime),
      endTime: norm(endTime)
    }
  };
  const token = getToken();
  const res = await fetch(getBase() + '/api/Canteen/item/add-category', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token || ''
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Invalid JSON: ' + text); }
  if (!res.ok || data.code !== 1) {
    throw new Error(`Add category failed: status=${res.status} code=${data.code} message=${data.message || 'N/A'} body=${text.slice(0,200)}`);
  }
  return data.data;
}

// Update a category (name or times). Assumed endpoint; adjust if backend differs.
export async function updateCategory(originalName, { name, startTime, endTime }) {
  if (!originalName) throw new Error('Original category name required');
  const norm = (t) => {
    if (!t) return '';
    const p = t.split(':');
    if (p.length >= 2) return p[0].padStart(2,'0') + ':' + p[1].padStart(2,'0');
    return t;
  };
  const newNameTrimmed = name?.trim();
  const newData = {
    startTime: norm(startTime),
    endTime: norm(endTime)
  };
  // Include name only if changed (in case backend supports renaming via this endpoint)
  if (newNameTrimmed && newNameTrimmed !== originalName) newData.name = newNameTrimmed;
  const payload = {
    categoryName: originalName,
    newData
  };
  const token = getToken();
  const res = await fetch(getBase() + '/api/canteen/item/edit-category', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token || ''
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Invalid JSON: ' + text); }
  if (!res.ok || data.code !== 1) {
    throw new Error(`Update category failed: status=${res.status} code=${data.code} message=${data.message || 'N/A'} body=${text.slice(0,200)}`);
  }
  return data.data;
}
