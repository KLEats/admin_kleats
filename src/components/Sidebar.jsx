import React, { useEffect, useState } from 'react';
import { getToken } from '../api/auth';

// --- Icons for Sidebar ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const OrdersIconSidebar = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 9h.01" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m14-2v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m9-11V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2m14 0V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2m-3 7h3m-3 4h3m-3-4a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const MonthlySalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;


const Sidebar = ({ metrics, onLogout, navigateTo, currentPage }) => {
  const [liveMetrics, setLiveMetrics] = useState(null);
  const linkClasses = "flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-left";
  const activeLinkClasses = "flex items-center w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg font-semibold text-left";

  // helper to parse items and compute totals (copied tolerant logic)
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

  // Determine whether an order should be considered "delivered".
  // Check several common fields and names returned by different backend shapes.
  const isDeliveredOrder = (o) => {
    if (!o) return false;
    // Prefer explicit delivery-related fields when present
    const deliveryFields = [o.deliveryStatus, o.delivery_status, o.delivery_state, o.order_state, o.state, o.deliveryStatusText];
    for (const df of deliveryFields) {
      if (df === undefined || df === null) continue;
      const v = String(df).toLowerCase();
      if (/deliv|deliver|delivered/.test(v)) return true;
      if (/completed/.test(v)) return true; // some backends use 'completed' to mean delivered
    }

    // Fallback to general status fields but be conservative: exclude payment-only statuses
    const statusCandidates = [o.status, o.orderStatus, o.order_status, o.statusText, o.paymentStatus, o.payment_status];
    const raw = statusCandidates.find(c => c !== undefined && c !== null);
    if (!raw) return false;
    const s = String(raw).toLowerCase();
    // exclude statuses that indicate payment but not delivery
    if (/charg|paid|captur|payment_pending|pending_payment/.test(s)) return false;
    // accept delivered/completed/confirmed/order_confirmed as delivered indicators
    if (/deliv|deliver|delivered|order_confirmed|completed|confirmed/.test(s)) return true;
    return false;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL || '';
        const url = `${base}/api/Canteen/order/list?offset=0&limit=1000`;
        const token = getToken();
        const headers = token ? { Authorization: token } : {};
        const res = await fetch(url, { headers });
        const text = await res.text();
        let body = null;
        try { body = text ? JSON.parse(text) : null; } catch { body = text; }
        if (!res.ok) {
          console.debug('Sidebar metrics fetch failed', res.status, res.statusText, body);
          return;
        }

        // tolerant extraction
        let list = [];
        if (Array.isArray(body)) list = body;
        else if (Array.isArray(body?.orders)) list = body.orders;
        else if (Array.isArray(body?.data)) list = body.data;
        else {
          const arr = Object.values(body || {}).find(v => Array.isArray(v));
          if (arr) list = arr;
        }

        // compute totals
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        let todaySales = 0;
        let monthlySales = 0;
        let todayOrders = 0;

        list.forEach(o => {
          // only include delivered orders in the sales totals
          if (!isDeliveredOrder(o)) return;

          const t = o.orderTime ?? o.order_time ?? o.createdAt ?? null;
          const date = t ? new Date(t) : null;
          const items = parseItemsField(o.items ?? o.orderItems ?? o.itemsJson);
          const parcel = parseFloat(o.parcelPrice ?? o.parcel_price ?? o.deliveryCharge ?? 0) || 0;
          const total = parseFloat(o.totalAmount ?? o.total ?? computeTotalFromItems(items, parcel)) || 0;

          if (date) {
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (key === todayKey) {
              todaySales += total;
              todayOrders += 1;
            }
            if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
              monthlySales += total;
            }
          }
        });

        if (mounted) setLiveMetrics({ todaySales, monthlySales, todayOrders });
      } catch (err) {
        console.debug('Failed to compute live metrics', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col h-full">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button onClick={() => navigateTo('dashboard')} className={currentPage === 'dashboard' ? activeLinkClasses : linkClasses}>
          <DashboardIcon />
          <span className="ml-3">Dashboard</span>
        </button>
        <button onClick={() => navigateTo('orders')} className={currentPage === 'orders' ? activeLinkClasses : linkClasses}>
          <OrdersIconSidebar />
          <span className="ml-3">All Orders</span>
        </button>
        <button onClick={() => navigateTo('menu')} className={currentPage === 'menu' ? activeLinkClasses : linkClasses}>
          <MenuIcon />
          <span className="ml-3">Menu Items</span>
        </button>
  {/* Reports removed - export available from Orders page */}
      </nav>
      
      {/* Footer: Metrics and Logout */}
      <div className="px-4 py-6 border-t border-gray-200 mt-auto">
        {/* Metrics Section */}
        <div className="space-y-4 mb-4">
             <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</h3>
       <div className="flex items-center text-sm font-medium text-gray-600">
        <SalesIcon />
        <span>Today's Sales: <span className="font-bold text-gray-900">₹{Number((liveMetrics?.todaySales ?? metrics.todaySales) || 0).toLocaleString('en-IN')}</span></span>
      </div>
       <div className="flex items-center text-sm font-medium text-gray-600">
        <MonthlySalesIcon />
        <span>Monthly Sales: <span className="font-bold text-gray-900">₹{Number((liveMetrics?.monthlySales ?? metrics.monthlySales) || 0).toLocaleString('en-IN')}</span></span>
      </div>
        </div>
        
        {/* Logout Button */}
        <div className="border-t border-gray-200 pt-4">
            <button
              onClick={onLogout}
              className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogoutIcon />
              <span className="ml-3">Logout</span>
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
