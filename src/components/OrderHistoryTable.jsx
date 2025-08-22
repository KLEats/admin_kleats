import React, { useState } from 'react';
import { getToken } from '../api/auth';

// Simple in-memory cache for usernames
export const usernameCache = new Map();

const UserIdCell = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // cache value may be a string or an object with details
  const [name, setName] = useState(() => {
    const v = usernameCache.get(userId);
    if (!v) return null;
    return typeof v === 'string' ? v : (v.name || `#${userId}`);
  });

  const fetchName = async () => {
    if (usernameCache.has(userId)) {
      const cached = usernameCache.get(userId);
      // cached may be an object; extract display name
      const display = (typeof cached === 'string') ? cached : (cached?.name || `#${userId}`);
      setName(display);
      return cached;
    }
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const token = getToken();
      const headers = token ? { Authorization: token } : {};
      const url = `${base}/api/Canteen/user/get-user-details?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url, { headers });
      const text = await res.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      let found = null;
      if (body) {
        // backend may return { code, data: { name, username } } or { name }
        if (body.name) found = body.name;
        else if (body.username) found = body.username;
        else if (body.data && (body.data.name || body.data.username)) found = body.data.name || body.data.username;
        else if (body.data && body.data.user && (body.data.user.name || body.data.user.username)) found = body.data.user.name || body.data.user.username;
      }
  const finalName = found || `#${userId}`;
  const details = (body && body.data) ? { name: (body.data.name || found), email: body.data.email || body.email || null, phoneNo: body.data.phoneNo || body.phoneNo || body.data.phone || null, role: body.data.role || body.role || null, DayOrHos: body.data.DayOrHos || body.DayOrHos || null } : { name: finalName, email: body?.email || null, phoneNo: body?.phoneNo || null, role: body?.role || null, DayOrHos: body?.DayOrHos || null };
  usernameCache.set(userId, details);
  setName(details.name || finalName);
      return final;
    } catch (err) {
      console.warn('failed to fetch username', err);
  const fallback = `#${userId}`;
  const details = { name: fallback };
  usernameCache.set(userId, details);
  setName(fallback);
  return fallback;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch name on mount so the User ID column shows the person's name directly
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!name && userId) {
        await fetchName();
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  return (
    <div className="relative inline-block">
      <button className="text-blue-600 underline text-sm" onClick={() => {
        if (!open) {
          setOpen(true);
          if (!usernameCache.has(userId)) fetchName();
        } else {
          setOpen(false);
        }
      }}>
        {name || `#${userId}`}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 bg-white border rounded shadow p-2 text-sm w-64">
          {loading ? 'Loading...' : (
            (() => {
              const cached = usernameCache.get(userId);
              if (!cached) return 'Unknown';
              const details = typeof cached === 'string' ? { name: cached } : cached;
              return (
                <div className="text-sm">
                  <div className="font-semibold">{details.name || `#${userId}`}</div>
                  {details.email && <div className="text-xs text-gray-600">{details.email}</div>}
                  {details.phoneNo && <div className="text-xs text-gray-600">{details.phoneNo}</div>}
                  {details.role && <div className="text-xs text-gray-600">Role: {details.role}</div>}
                  {details.DayOrHos && <div className="text-xs text-gray-600">{details.DayOrHos === 'hostel' ? 'Hosteller' : (details.DayOrHos === 'day' ? 'Day Scholar' : details.DayOrHos)}</div>}
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};

const OrderHistoryTable = ({ orders }) => {

  const getStatusPillStyle = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white divide-y divide-gray-200">
        <thead className="bg-gray-50">
            <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Time</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USER</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Type</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order.id || order.orderId || order.transactionId} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId ?? order.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.orderTime ? new Date(order.orderTime).toLocaleString() : '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.deliveryTime ? new Date(order.deliveryTime).toLocaleString() : '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {order.userId ? (
                    <UserIdCell userId={order.userId} />
                  ) : ('-')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 max-w-xs">
                  {order.items && order.items.length ? (
                    <div className="max-h-40 overflow-auto text-xs space-y-1">
                      {order.items.map((it, idx) => {
                        const name = it.name ?? it.ItemName ?? it.itemName ?? it.Item_Name ?? (`#${it.itemId ?? it.ItemId ?? it.id ?? idx}`);
                        const qty = parseFloat(it.quantity ?? it.qty ?? it.count ?? 1) || 1;
                        const unit = parseFloat(it.price ?? it.Price ?? it.rate ?? 0) || 0;
                        const total = unit * qty;
                        return (
                          <div key={idx} className="text-xs text-gray-700 flex justify-between">
                            <div className="truncate pr-4">{name} x {qty}</div>
                            <div className="text-gray-600">₹{Number(total).toFixed(2)}</div>
                          </div>
                        );
                      })}
                      {/* show parcel as its own line when order type indicates pickup/takeaway/parcel */}
                      {(() => {
                        const t = String(order.orderType || '') || '';
                        const isPickup = /pick|pickup|takeaway|parcel/i.test(t);
                        const parcel = parseFloat(order.parcelPrice || 0) || 0;
                        if (isPickup && parcel > 0) {
                          return (
                            <div className="mt-1 text-xs text-gray-700 flex justify-between">
                              <div className="truncate pr-4">Parcel x 1</div>
                              <div className="text-gray-600">₹{parcel.toFixed(2)}</div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {/* items subtotal removed as requested */}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No items</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.orderType}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{
                  (() => {
                    const itemsSubtotal = (order.items || []).reduce((s, it) => {
                      const qty = parseFloat(it.quantity ?? it.qty ?? it.count ?? 1) || 1;
                      const unit = parseFloat(it.price ?? it.Price ?? it.rate ?? 0) || 0;
                      return s + unit * qty;
                    }, 0);
                    const parcel = parseFloat(order.parcelPrice || 0) || 0;
                    const total = Number(order.total || itemsSubtotal + parcel);
                    return `₹${total.toFixed(2)}`;
                  })()
                }</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.paymentStatus}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" className="px-6 py-12 text-center text-sm text-gray-500">
                No orders found for the selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderHistoryTable;