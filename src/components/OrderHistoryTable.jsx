import React, { useState } from 'react';
import { getToken } from '../api/auth';

// Simple in-memory cache for usernames
const usernameCache = new Map();

const UserIdCell = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(() => usernameCache.get(userId) || null);

  const fetchName = async () => {
    if (usernameCache.has(userId)) {
      setName(usernameCache.get(userId));
      setOpen(true);
      return;
    }
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const token = getToken();
      const headers = token ? { Authorization: token } : {};
      // heuristic endpoint — adjust if your API differs
      const url = `${base}/api/user/details?user_id=${encodeURIComponent(userId)}`;
      const res = await fetch(url, { headers });
      const text = await res.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      let found = null;
      if (body) {
        if (body.name) found = body.name;
        else if (body.username) found = body.username;
        else if (body.data && (body.data.name || body.data.username)) found = body.data.name || body.data.username;
      }
      usernameCache.set(userId, found || `#${userId}`);
      setName(found || `#${userId}`);
      setOpen(true);
    } catch (err) {
      console.warn('failed to fetch username', err);
      usernameCache.set(userId, `#${userId}`);
      setName(`#${userId}`);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button className="text-blue-600 underline text-sm" onClick={() => { if (!open) fetchName(); else setOpen(false); }}>
        {userId}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 bg-white border rounded shadow p-2 text-sm w-48">
          {loading ? 'Loading...' : (name || 'Unknown')}
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
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canteen ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Time</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
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
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.transactionId || '-'}</td>
                {/* Status column removed as requested */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{Array.isArray(order.canteenId) ? order.canteenId.join(', ') : (order.canteenId ?? '-')}</td>
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
