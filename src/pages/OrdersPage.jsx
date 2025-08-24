import React, { useState, useMemo, useEffect } from 'react';
import { getToken } from '../api/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Export helpers (PDF + CSV) ---
const generatePdfFromOrders = async (orders, statusLabel = 'All') => {
  try {
    const doc = new jsPDF();
    const tableColumn = ['Order ID', 'Date', 'Customer', 'Status', 'Total (INR)'];
    const tableRows = [];

    orders.forEach(order => {
      tableRows.push([
        String(order.id),
        String(new Date(order.date).toLocaleDateString()),
        String(order.customer),
        String(order.status),
        String((order.total || 0).toFixed(2))
      ]);
    });

    // draw logo like ReportsPage
    const logoUrl = import.meta.env.VITE_LOGO_URL || '/KL-eats.png';
    let logoHeight = 0;
    try {
      const res = await fetch(logoUrl);
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const img = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.crossOrigin = 'anonymous';
          i.src = objectUrl;
        });
        const renderWidth = 80;
        const aspect = img.naturalHeight / img.naturalWidth || 0.25;
        logoHeight = renderWidth * aspect;
        try { doc.addImage(img, 'PNG', 14, 10, renderWidth, logoHeight); }
        catch {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          doc.addImage(dataUrl, 'PNG', 14, 10, renderWidth, logoHeight);
        }
        URL.revokeObjectURL(objectUrl);
      }
    } catch (e) {
      console.debug('Logo fetch failed', e);
    }

    const titleY = logoHeight ? 10 + logoHeight + 6 : 15;
    doc.text(`Order Report (${statusLabel})`, 14, titleY);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: titleY + 6,
    });

    doc.save(`orders-report-${Date.now()}.pdf`);
  } catch (err) {
    console.error('PDF export failed', err);
    alert('Failed to export PDF. See console.');
  }
};

const generateCsvFromOrders = (orders) => {
  const headers = ['OrderID', 'Date', 'Customer', 'Status', 'Total'];
  const csvContent = [
    headers.join(','),
    ...orders.map(o => [
      o.id,
      new Date(o.date).toLocaleDateString(),
      o.customer,
      o.status,
      (o.total || 0).toFixed(2)
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `orders-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ExportControl = ({ filteredOrders }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-block text-right">
      <button onClick={() => setOpen(o => !o)} className="px-3 py-2 bg-gray-100 border rounded">Export</button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow p-2 z-50">
          <button onClick={async () => { await generatePdfFromOrders(filteredOrders, 'Filtered'); setOpen(false); }} className="w-full text-left px-2 py-1 hover:bg-gray-100">PDF</button>
          <button onClick={() => { generateCsvFromOrders(filteredOrders); setOpen(false); }} className="w-full text-left px-2 py-1 hover:bg-gray-100">Excel (CSV)</button>
        </div>
      )}
    </div>
  );
};
import Layout from '../components/Layout';
import OrderFilters from '../components/OrderFilters';
import OrderHistoryTable, { usernameCache as sharedUsernameCache } from '../components/OrderHistoryTable';

// Helper function to format a Date object into a 'YYYY-MM-DD' string
const formatDateForInput = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// --- DUMMY DATA ---
// kept as a tiny fallback only
const initialOrderHistory = [];

const dummyMetrics = {
    todaySales: 7550.50,
    todayOrders: 125,
    monthlySales: 185750.00,
};

const OrdersPage = ({ onLogout, navigateTo, currentPage }) => {
  const [orders, setOrders] = useState(initialOrderHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: 'All',
  startDate: formatDateForInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  endDate: formatDateForInput(new Date()),
  type: 'All'
  });

  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const parseItemsField = (itemsField) => {
    if (!itemsField) return [];
    if (Array.isArray(itemsField)) return itemsField;
    if (typeof itemsField === 'string') {
      try { return JSON.parse(itemsField); } catch { return []; }
    }
    return [];
  };

  const computeTotalFromItems = (items, parcelPrice) => {
    if (!Array.isArray(items)) return parseFloat(parcelPrice || 0) || 0;
    const sum = items.reduce((s, it) => {
      const price = parseFloat(it.Price ?? it.price ?? it.rate ?? 0) || 0;
      const qty = parseFloat(it.qty ?? it.quantity ?? it.count ?? 1) || 1;
      return s + price * qty;
    }, 0);
    return sum + (parseFloat(parcelPrice || 0) || 0);
  };

  // Convert various backend status/payment representations into canonical labels
  // Returns one of: 'delivered', 'charged', 'pending', 'refunded' or '' when unknown
  const canonicalizeStatus = (val) => {
    if (val === null || typeof val === 'undefined') return '';
    // numeric codes
    if (typeof val === 'number') {
      // common heuristics: 2 -> delivered, 1 -> charged/paid, 0 -> pending, 3 -> refunded
      if (val === 2) return 'delivered';
      if (val === 1) return 'charged';
      if (val === 0) return 'pending';
      if (val === 3) return 'refunded';
      return '';
    }
    const s = String(val).trim().toLowerCase();
    if (!s) return '';
    // handle numeric strings
    if (/^\d+$/.test(s)) {
      const n = parseInt(s, 10);
      if (n === 2) return 'delivered';
      if (n === 1) return 'charged';
      if (n === 0) return 'pending';
      if (n === 3) return 'refunded';
    }
    // textual heuristics
    if (/deliver|complete|served|fulfilled/.test(s)) return 'delivered';
    if (/paid|charge|charged|success|settled/.test(s)) return 'charged';
    if (/pending|wait|created|initiated|inprogress|processing/.test(s)) return 'pending';
    if (/refund|refunded|reversed|cancel|cancelled|canceled/.test(s)) return 'refunded';
    return '';
  };

  const normalizeOrder = (o) => {
    const now = new Date();
    const orderId = o.orderId ?? o.order_id ?? o.id ?? null;
    const transactionId = o.transactionId ?? o.txnId ?? o.transaction_id ?? null;
    const status = (o.status ?? 'pending');
    const canteenId = o.canteenId ?? o.canteen_id ?? o.canteen ?? null;
    const orderTime = o.orderTime ?? o.order_time ?? o.createdAt ?? now.toISOString();
    const deliveryTime = o.deliveryTime ?? o.delivery_time ?? o.updatedAt ?? null;
    const userId = o.userId ?? o.user_id ?? (o.user && (o.user.id || o.userId)) ?? null;
    const items = parseItemsField(o.items ?? o.orderItems ?? o.itemsJson);
    const orderType = o.orderType ?? o.type ?? 'dinein';
    const parcelPrice = parseFloat(o.parcelPrice ?? o.parcel_price ?? o.deliveryCharge ?? 0) || 0;
    const paymentStatus = o.paymentStatus ?? (o.payment_status ?? 'PENDING');

    const customerName = (o.user && (o.user.name || o.user.fullName)) || o.customerName || o.userName || 'Guest';
    const total = parseFloat(o.totalAmount ?? o.total ?? computeTotalFromItems(items, parcelPrice)) || 0;

    return {
      orderId,
      transactionId,
      status,
      canteenId,
      orderTime,
      deliveryTime,
      userId,
      items,
      orderType,
      parcelPrice,
      paymentStatus,
      // UI fields
      id: orderId ? String(orderId) : (transactionId ? String(transactionId) : `ORD-${Math.random().toString(36).substr(2,8)}`),
      customer: customerName,
      date: orderTime ? new Date(orderTime) : now,
      total,
      raw: o
    };
  };

  useEffect(() => {
    let mounted = true;
    const STATUS_ENDPOINTS = {
      charged: '/api/Canteen/order/paid',
      delivered: '/api/Canteen/order/delivered'
    };

    const fetchOrdersForStatus = async (statusKey) => {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const token = getToken();
      const headers = token ? { Authorization: token } : {};
      if (!STATUS_ENDPOINTS[statusKey]) return [];
      const url = `${base}${STATUS_ENDPOINTS[statusKey]}?offset=0&limit=50`;
      const res = await fetch(url, { headers });
      const text = await res.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (!res.ok) throw new Error(`${statusKey} fetch failed: ${res.status}`);
      // tolerant extraction
      let list = [];
      if (Array.isArray(body)) list = body;
      else if (Array.isArray(body?.orders)) list = body.orders;
      else if (Array.isArray(body?.data)) list = body.data;
      else if (Array.isArray(body?.result)) list = body.result;
      else if (Array.isArray(body?.data?.orders)) list = body.data.orders;
      else {
        const arr = Object.values(body || {}).find(v => Array.isArray(v));
        if (arr) list = arr;
      }
      return list.map(normalizeOrder);
    };

    const fetchAllOrdersList = async () => {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const token = getToken();
      const headers = token ? { Authorization: token } : {};
      const url = `${base}/api/Canteen/order/list?offset=0&limit=50`;
      const res = await fetch(url, { headers });
      const text = await res.text();
      let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (!res.ok) throw new Error(`list fetch failed: ${res.status}`);
      let list = [];
      if (Array.isArray(body)) list = body;
      else if (Array.isArray(body?.orders)) list = body.orders;
      else if (Array.isArray(body?.data)) list = body.data;
      else if (Array.isArray(body?.result)) list = body.result;
      else if (Array.isArray(body?.data?.orders)) list = body.data.orders;
      else {
        const arr = Object.values(body || {}).find(v => Array.isArray(v));
        if (arr) list = arr;
      }
      return list.map(normalizeOrder);
    };

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const statusSel = String(filters.status || 'All').toLowerCase();
        let normalizedAll = [];
        if (statusSel === 'all') {
          // fetch unified list endpoint to include all (including refunded)
          normalizedAll = await fetchAllOrdersList();
        } else if (['charged','delivered'].includes(statusSel)) {
          normalizedAll = await fetchOrdersForStatus(statusSel);
        } else if (statusSel === 'refunded') {
          // fetch unified list then filter refunded later by existing filtering logic
          normalizedAll = await fetchAllOrdersList();
        } else {
          normalizedAll = []; // unknown status
        }

        // Enrich item names (reuse prior logic)
        const idSet = new Set();
        normalizedAll.forEach(o => Array.isArray(o.items) && o.items.forEach(it => {
          const iid = it.ItemId ?? it.itemId ?? it.id ?? it.ItemID ?? null;
          if (iid !== null && typeof iid !== 'undefined') idSet.add(iid);
        }));
        const idArray = Array.from(idSet);
        const nameCache = new Map();
        const fetchItemName = async (itemId) => {
          if (nameCache.has(itemId)) return nameCache.get(itemId);
          try {
            const baseInner = import.meta.env.VITE_API_BASE_URL || '';
            const tokenInner = getToken();
            const headersInner = tokenInner ? { Authorization: tokenInner } : {};
            const urlInner = `${baseInner}/api/explore/item?item_id=${encodeURIComponent(itemId)}`;
            const r = await fetch(urlInner, { headers: headersInner });
            const t = await r.text();
            let b = null; try { b = t ? JSON.parse(t) : null; } catch { b = t; }
            let name = null;
            if (b) {
              if (b.ItemName) name = b.ItemName; else if (b.name) name = b.name;
              else if (b.data && b.data.ItemName) name = b.data.ItemName; else if (b.data && b.data.name) name = b.data.name;
              else if (Array.isArray(b) && b[0]) name = b[0].ItemName || b[0].name;
              else if (b.data && Array.isArray(b.data) && b.data[0]) name = b.data[0].ItemName || b.data[0].name;
            }
            nameCache.set(itemId, name || null);
            return name || null;
          } catch { nameCache.set(itemId, null); return null; }
        };
        if (idArray.length) await Promise.all(idArray.map(id => fetchItemName(id)));
        const enriched = normalizedAll.map(o => ({
          ...o,
          items: Array.isArray(o.items) ? o.items.map(it => {
            const iid = it.ItemId ?? it.itemId ?? it.id ?? it.ItemID ?? null;
            const name = iid != null ? nameCache.get(iid) : null;
            return { ...it, name: name || it.ItemName || it.name || null };
          }) : []
        }));

        // Bulk user detail fetch
        const userIdSet = new Set();
        enriched.forEach(o => { if (o.userId) userIdSet.add(o.userId); });
        const userIdsToFetch = Array.from(userIdSet).filter(uid => !sharedUsernameCache.has(uid));
        if (userIdsToFetch.length) {
          await Promise.all(userIdsToFetch.map(async (uid) => {
            try {
              const baseU = import.meta.env.VITE_API_BASE_URL || '';
              const tokenU = getToken();
              const headersU = tokenU ? { Authorization: tokenU } : {};
              const uurl = `${baseU}/api/Canteen/user/get-user-details?userId=${encodeURIComponent(uid)}`;
              const r = await fetch(uurl, { headers: headersU });
              const t = await r.text();
              let b = null; try { b = t ? JSON.parse(t) : null; } catch { b = t; }
              let details = null;
              if (b) {
                const src = b.data || b;
                details = {
                  name: src.name || src.username || `#${uid}`,
                  email: src.email || null,
                  phoneNo: src.phoneNo || src.phone || null,
                  role: src.role || null,
                  DayOrHos: src.DayOrHos || null
                };
              }
              if (!details) details = { name: `#${uid}` };
              sharedUsernameCache.set(uid, details);
            } catch { sharedUsernameCache.set(uid, `#${uid}`); }
          }));
        }

        if (mounted) setOrders(enriched);
      } catch (err) {
        if (mounted) { setError(String(err.message || err)); setOrders([]); }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [filters.status]);

  // --- THE CORRECTED FILTERING LOGIC IS HERE ---
  const filteredOrders = useMemo(() => {
    // Use canonicalized statuses so UI "Delivered" matches whatever shape backend uses.
    const rawStatusFilter = String(filters.status || 'All').toLowerCase();
    const statusFilterCanon = rawStatusFilter === 'all' ? null : (canonicalizeStatus(rawStatusFilter) || rawStatusFilter);
    const priority = ['charged', 'delivered', 'pending', 'refunded'];

    const typeFilter = String(filters.type || 'All').toLowerCase();

    const filtered = orders.filter(order => {
      const paymentRaw = order.paymentStatus ?? order.raw?.paymentStatus ?? order.raw?.payment_status ?? order.raw?.payment ?? '';
      const statusRaw = order.status ?? order.raw?.status ?? '';
      const paymentCanon = canonicalizeStatus(paymentRaw) || '';
      const statusCanon = canonicalizeStatus(statusRaw) || '';

      // If a status is selected, require PAYMENT STATUS (canonicalized) to match.
      if (statusFilterCanon !== null) {
        if (paymentCanon !== statusFilterCanon) return false;
      }

      const orderType = String(order.orderType || order.raw?.orderType || order.raw?.type || '').toLowerCase();
      if (typeFilter !== 'all' && orderType !== typeFilter) return false;

      return true;
    });

    // Sort using canonicalized statuses
    filtered.sort((a, b) => {
      const aRaw = a.paymentStatus ?? a.raw?.paymentStatus ?? a.raw?.payment_status ?? a.status ?? a.raw?.status ?? '';
      const bRaw = b.paymentStatus ?? b.raw?.paymentStatus ?? b.raw?.payment_status ?? b.status ?? b.raw?.status ?? '';
      const aCanon = canonicalizeStatus(aRaw) || '';
      const bCanon = canonicalizeStatus(bRaw) || '';
      const ia = priority.indexOf(aCanon);
      const ib = priority.indexOf(bCanon);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    // Date filtering still applies
    return filtered.filter(order => {
      const orderDateString = formatDateForInput(order.date);
      if (filters.startDate && orderDateString < filters.startDate) return false;
      if (filters.endDate && orderDateString > filters.endDate) return false;
      return true;
    });
  }, [orders, filters]);

  return (
    <Layout 
        metrics={dummyMetrics} 
        onLogout={onLogout}
        navigateTo={navigateTo}
        currentPage={currentPage}
    >
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
          <div className="relative">
            <ExportControl filteredOrders={filteredOrders} />
          </div>
        </div>

        <OrderFilters filters={filters} onFilterChange={handleFilterChange} />

        <OrderHistoryTable orders={filteredOrders} />
      </div>
    </Layout>
  );
};

export default OrdersPage;
