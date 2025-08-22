import React from 'react';

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
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.userId ?? '-'}</td>
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
