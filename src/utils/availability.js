// Helper utilities to handle time-window and availability decisions.
// Exported functions:
// - isCurrentWithinWindow(startTimeHHMM, endTimeHHMM) -> boolean
// - itemAvailability(item, category) -> { available: boolean, reason: string }

function parseHM(t) {
  if (!t || typeof t !== 'string') return null;
  const parts = t.split(':').map(p => p.trim());
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}

export function isCurrentWithinWindow(start, end) {
  // If either start or end is not provided or malformed, treat it as always available.
  if (!start || !end) return true;
  const s = parseHM(start);
  const e = parseHM(end);
  if (!s || !e) return true;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = s.h * 60 + s.m;
  const endMinutes = e.h * 60 + e.m;
  // Normal window (same day)
  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }
  // Overnight window (e.g., 22:00 - 02:00)
  return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
}

export function itemAvailability(item, category) {
  // category: { startTime, endTime }
  // item: { ava }
  if (!item) return { available: false, reason: 'no_item' };
  // If item is explicitly unavailable, report out_of_stock
  if (item.ava === false) return { available: false, reason: 'out_of_stock' };
  // Check category window
  const within = isCurrentWithinWindow(category?.startTime, category?.endTime);
  if (!within) return { available: false, reason: 'out_of_hours' };
  return { available: true, reason: 'available' };
}
