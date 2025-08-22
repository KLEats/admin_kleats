import React, { useState, useMemo, useEffect } from 'react';
import { getToken } from '../api/auth';
import Layout from '../components/Layout';
import OrderFilters from '../components/OrderFilters';
import OrderHistoryTable from '../components/OrderHistoryTable';

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
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.VITE_API_BASE_URL || '';
        const url = `${base}/api/Canteen/order/list?offset=0&limit=50`;
  const token = getToken();
  const headers = token ? { Authorization: token } : {};
        const res = await fetch(url, { method: 'GET', headers });
        const text = await res.text();
        let body = null;
        try { body = text ? JSON.parse(text) : null; } catch { body = text; }
        if (!res.ok) throw new Error(`Fetch orders failed: ${res.status} ${res.statusText}`);

        // tolerant extraction of list
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

        const normalized = list.map(normalizeOrder);
        if (mounted) setOrders(normalized);
      } catch (err) {
        console.error('orders fetch error', err);
        if (mounted) {
          setError(String(err.message || err));
          setOrders([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // --- THE CORRECTED FILTERING LOGIC IS HERE ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter: treat 'Completed' selection as matching 'Completed' or backend 'order_confirmed'
        if (filters.status !== 'All') {
          if (filters.status === 'Completed') {
            const rawStatus = String(order.raw?.status || '').toLowerCase();
            const normalized = String(order.status || '').toLowerCase();
            if (!(normalized === 'completed' || rawStatus === 'order_confirmed')) return false;
          } else {
            if (String(order.status || '').toLowerCase() !== String(filters.status || '').toLowerCase()) return false;
          }
        }

      // --- NEW, ROBUST DATE FILTERING ---
      // Convert the order's date to the same 'YYYY-MM-DD' string format for reliable comparison.
      const orderDateString = formatDateForInput(order.date);

      // Compare the date strings directly. This avoids all timezone issues.
      if (filters.startDate && orderDateString < filters.startDate) {
        return false;
      }
      if (filters.endDate && orderDateString > filters.endDate) {
        return false;
      }
      
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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Order History</h1>
        
        <OrderFilters filters={filters} onFilterChange={handleFilterChange} />
        
        <OrderHistoryTable orders={filteredOrders} />
      </div>
    </Layout>
  );
};

export default OrdersPage;
