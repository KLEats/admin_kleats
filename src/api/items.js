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
