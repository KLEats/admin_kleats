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
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(null);
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
    // reset to first page when filters change
    setPage(0);
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

    const fetchOrdersForStatus = async (statusKey, startDate, endDate, offset = 0, limit = 50) => {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const token = getToken();
      const headers = token ? { Authorization: token } : {};
      if (!STATUS_ENDPOINTS[statusKey]) return [];
      let url = '';
      if (statusKey === 'charged') {
        // charged endpoint supports start/end query params in some backends
        url = `${base}${STATUS_ENDPOINTS[statusKey]}?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}&offset=${offset}&limit=${limit}`;
      } else {
        url = `${base}${STATUS_ENDPOINTS[statusKey]}?offset=${offset}&limit=${limit}`;
      }
      const res = await fetch(url, { headers });
      const text = await res.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (!res.ok) throw new Error(`${statusKey} fetch failed: ${res.status}`);
      // tolerant extraction
      let list = [];
      let meta = null;
      if (Array.isArray(body)) list = body;
      else if (Array.isArray(body?.orders)) list = body.orders;
      else if (Array.isArray(body?.data)) list = body.data;
      else if (Array.isArray(body?.result)) list = body.result;
      else if (Array.isArray(body?.data?.orders)) list = body.data.orders;
      else {
        const arr = Object.values(body || {}).find(v => Array.isArray(v));
        if (arr) list = arr;
      }
      // try to extract meta/totalCount if present
      meta = body?.meta || body?.pagination || body?.paging || null;
      const count = meta?.totalCount ?? meta?.total ?? body?.totalCount ?? body?.meta?.totalCount ?? null;
      return { orders: list.map(normalizeOrder), meta: { totalCount: count } };
    };

    const fetchAllOrdersList = async (startDate, endDate, offset = 0, limit = 20) => {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const token = getToken();
      const headers = token ? { Authorization: token } : {};
      // Format start and end as 'YYYY-MM-DD HH:mm' (URL encoded)
      const start = encodeURIComponent(startDate);
      const end = encodeURIComponent(endDate);
      const url = `${base}/api/Canteen/order/list?offset=${offset}&limit=${limit}&start=${start}&end=${end}`;
      const res = await fetch(url, { headers });
      const text = await res.text();
      let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (!res.ok) throw new Error(`list fetch failed: ${res.status}`);
      let list = [];
      let meta = null;
      if (Array.isArray(body)) list = body;
      else if (Array.isArray(body?.orders)) list = body.orders;
      else if (Array.isArray(body?.data)) list = body.data;
      else if (Array.isArray(body?.result)) list = body.result;
      else if (Array.isArray(body?.data?.orders)) list = body.data.orders;
      else {
        const arr = Object.values(body || {}).find(v => Array.isArray(v));
        if (arr) list = arr;
      }
      meta = body?.meta || body?.pagination || body?.paging || null;
      const count = meta?.totalCount ?? meta?.total ?? body?.totalCount ?? body?.meta?.totalCount ?? null;
      return { orders: list.map(normalizeOrder), meta: { totalCount: count } };
    };

  (async () => {
      setLoading(true);
      setError(null);
      try {
  // allow filters.status to be string or array (from checkbox list)
  const statusRaw = filters.status ?? 'All';
  const statusSel = Array.isArray(statusRaw) ? statusRaw.map(s => String(s).toLowerCase()) : [String(statusRaw).toLowerCase()];
        let normalizedAll = [];
        if (statusSel.length === 1 && statusSel[0] === 'all') {
          // fetch all orders with date filtering (paged)
          const start = filters.startDate ? `${filters.startDate} 00:00` : '';
          const end = filters.endDate ? `${filters.endDate} 23:59` : '';
          const resp = await fetchAllOrdersList(start, end, page * pageSize, pageSize);
          normalizedAll = resp.orders;
          if (resp.meta && resp.meta.totalCount != null) setTotalCount(resp.meta.totalCount);
        } else if (statusSel && !(statusSel.length === 1 && statusSel[0] === 'all')) {
          // For specific status filters (e.g. 'delivered' or 'charged'),
          // fetch a larger set from the list endpoint and apply strict client-side
          // filtering so the first page contains matching items. This avoids
          // relying on the backend page order which may mix statuses.
          const start = filters.startDate ? `${filters.startDate} 00:00` : '';
          const end = filters.endDate ? `${filters.endDate} 23:59` : '';
          // fetch a reasonably large window (try to cover many matches)
          const largeLimit = 1000;
          const resp = await fetchAllOrdersList(start, end, 0, largeLimit);
          let allFetched = resp.orders || [];
          // canonicalize selected filter
          // canonicalize selected filters into a set
          const selectedCanonSet = new Set(statusSel.map(s => canonicalizeStatus(s) || s));
          // keep orders where either paymentStatus or order status matches any selected
          const matching = allFetched.filter(o => {
            const payCanon = canonicalizeStatus(o.paymentStatus ?? o.raw?.paymentStatus ?? o.raw?.payment_status ?? o.raw?.payment ?? '');
            const statCanon = canonicalizeStatus(o.status ?? o.raw?.status ?? '');
            return selectedCanonSet.has(payCanon) || selectedCanonSet.has(statCanon);
          });
          // set totalCount to number of matching orders
          setTotalCount(matching.length);
          // take page slice after filtering
          normalizedAll = matching.slice(page * pageSize, (page + 1) * pageSize);
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

        if (mounted) {
          setOrders(enriched);
          // If backend did not provide totalCount, try to infer: if returned less than pageSize,
          // we can estimate total as currentOffset + returnedCount.
          if (totalCount === null || typeof totalCount === 'undefined') {
            if (enriched.length < pageSize) {
              setTotalCount(page * pageSize + enriched.length);
            }
          }
          // If page returned empty and we're beyond page 0, go back one page and re-fetch
          if (enriched.length === 0 && page > 0) {
            setPage(p => Math.max(0, p - 1));
          }
        }
      } catch (err) {
        if (mounted) { setError(String(err.message || err)); setOrders([]); setTotalCount(null); }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  // include inputs that should re-trigger the fetch
  }, [filters.status, filters.startDate, filters.endDate, filters.type, page, pageSize]);

  // Manual GET removed — fetching occurs automatically when filters/page/pageSize change

  // --- THE CORRECTED FILTERING LOGIC IS HERE ---
  const filteredOrders = useMemo(() => {
    // Support filters.status being either a string ('All'|'delivered'|...) or an array of strings
    const statusRaw = filters.status ?? 'All';
    let selectedSet = null; // null means 'All'
    if (Array.isArray(statusRaw)) {
      const arr = statusRaw.length ? statusRaw : ['All'];
      if (arr.length === 1 && String(arr[0]).toLowerCase() === 'all') selectedSet = null;
      else selectedSet = new Set(arr.map(s => (canonicalizeStatus(s) || String(s).toLowerCase())));
    } else {
      const s = String(statusRaw).toLowerCase();
      if (s === 'all') selectedSet = null;
      else selectedSet = new Set([canonicalizeStatus(s) || s]);
    }

    const typeFilter = String(filters.type || 'All').toLowerCase();

    const filtered = orders.filter(order => {
      const paymentRaw = order.paymentStatus ?? order.raw?.paymentStatus ?? order.raw?.payment_status ?? order.raw?.payment ?? '';
      const statusRawOrder = order.status ?? order.raw?.status ?? '';
      const paymentCanon = canonicalizeStatus(paymentRaw) || '';
      const statusCanon = canonicalizeStatus(statusRawOrder) || '';

      // If a set of statuses is selected, require either PAYMENT STATUS or ORDER STATUS (canonicalized) to be in the set.
      if (selectedSet !== null) {
        if (!selectedSet.has(paymentCanon) && !selectedSet.has(statusCanon)) return false;
      }

      const orderType = String(order.orderType || order.raw?.orderType || order.raw?.type || '').toLowerCase();
      if (typeFilter !== 'all' && orderType !== typeFilter) return false;

      return true;
    });

    // Sort by ascending date and time
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
        <div className="flex items-center justify-between my-3">
          <div>
            <label className="mr-2">Page size:</label>
            <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }} className="border px-2 py-1">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {typeof totalCount === 'number' ? `Showing page ${page + 1} of ${Math.max(1, Math.ceil(totalCount / pageSize))} — ${totalCount} orders` : `Page ${page + 1}`}
          </div>
        </div>

        <OrderHistoryTable orders={filteredOrders} />
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">{loading ? 'Loading...' : ''}</div>
          <div className="space-x-2">
            <button disabled={page <= 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))} className="px-3 py-1 bg-gray-100 border rounded disabled:opacity-50">Previous</button>
            <button disabled={(typeof totalCount === 'number' && (page + 1) * pageSize >= totalCount) || loading} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-100 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrdersPage;
