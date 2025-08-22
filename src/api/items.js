// Item API helpers
import { getToken } from './auth';

function getBase() {
  return (import.meta.env.NEXT_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
}

// Add new item with multipart: image file + JSON blob (without category if backend auto-assigns)
export async function addItem({ imageFile, itemJson }) {
  if (!imageFile) throw new Error('Image file is required');
  // Defensive: ensure the file is an image
  if (!(imageFile.type && imageFile.type.startsWith('image/'))) {
    throw new Error('Selected file is not an image. Please choose a JPG, PNG, WebP, SVG, etc.');
  }
  // Build JSON payload; backend sample shows key 'ava'.
  const payload = { ...itemJson };
  // Category may be optional; if empty remove it.
  if (!payload.category) delete payload.category;
  const form = new FormData();
  // Append with explicit filename to preserve extension metadata
  form.append('images', imageFile, imageFile.name || 'upload'); // field name per curl: images
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
  if (imageFile) {
    if (!(imageFile.type && imageFile.type.startsWith('image/'))) {
      throw new Error('Selected file is not an image. Please choose a JPG, PNG, WebP, SVG, etc.');
    }
    form.append('images', imageFile, imageFile.name || 'upload');
  }
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
  // Try the canteen-specific endpoint first (requested), then fall back to explore/categories
  const endpoints = ['/api/canteen/item/categories', '/api/explore/categories'];
  let res = null;
  let text = '';
  let data = null;
  let arr = [];
  for (const ep of endpoints) {
    try {
      res = await fetch(base + ep, { headers, cache: 'no-store' });
      text = await res.text();
      try { data = text ? JSON.parse(text) : {}; } catch { data = null; }
      // If server returned 304 (not modified) and there is no body, try local cache
      if (res.status === 304 && (!data || !data.data)) {
        try {
          const cached = localStorage.getItem('kleats:categories');
          if (cached) {
            const parsed = JSON.parse(cached);
            return parsed;
          }
        } catch (e) { /* ignore */ }
        // try next endpoint
        continue;
      }
      if (!res.ok || data?.code !== 1) {
        // try next endpoint
        continue;
      }
      arr = data.data || [];
      // success — break loop
      break;
    } catch (err) {
      // network or parse error — try next endpoint
      continue;
    }
  }
  if (!arr.length) throw new Error('Fetch categories failed or returned empty');
  const normTime = (t) => {
    if (!t) return '';
    // Accept HH:MM or HH:MM:SS and return HH:MM
    try {
      const s = String(t).trim();
      const parts = s.split(':');
      if (parts.length >= 2) return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
      return s;
    } catch { return '' }
  };

  const mapped = arr.map(c => ({
    name: c.name || c.CategoryName || c.category || c.Category || '',
    image: buildImageUrl(c.image || c.ImagePath || c.icon || ''),
    itemCount: c.itemCount ?? c.count ?? c.ItemCount ?? 0,
    startTime: normTime(c.startTime || c.StartTime || c.start_time || c.Start_Time || ''),
    endTime: normTime(c.endTime || c.EndTime || c.end_time || c.End_Time || ''),
    raw: c
  }));

  // Cache the normalized categories so a 304 response can fall back to this data
  try {
    localStorage.setItem('kleats:categories', JSON.stringify(mapped));
  } catch (e) {
    // ignore storage errors (e.g., quota, private mode)
  }

  return mapped;
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
    endTime: norm(endTime),
    // some backends expect snake_case
    start_time: norm(startTime),
    end_time: norm(endTime)
  };
  // Include name only if changed (in case backend supports renaming via this endpoint)
  if (newNameTrimmed && newNameTrimmed !== originalName) newData.name = newNameTrimmed;
  const payload = {
    categoryName: originalName,
    newData
  };
  const token = getToken();
  // Use same Canteen casing as other endpoints to avoid case-sensitive 404s
  const res = await fetch(getBase() + '/api/Canteen/item/edit-category', {
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
