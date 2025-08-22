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
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canteen ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Time</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Type</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcel Price</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order.id || order.orderId || order.transactionId} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId ?? order.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.transactionId || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillStyle(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{Array.isArray(order.canteenId) ? order.canteenId.join(', ') : (order.canteenId ?? '-')}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.orderTime ? new Date(order.orderTime).toLocaleString() : '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.deliveryTime ? new Date(order.deliveryTime).toLocaleString() : '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.userId ?? '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 max-w-xs">
                  {order.items && order.items.length ? (
                    <pre className="whitespace-pre-wrap max-h-40 overflow-auto text-xs">{JSON.stringify(order.items, null, 2)}</pre>
                  ) : (
                    <span className="text-xs text-gray-500">No items</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.orderType}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">₹{(parseFloat(order.parcelPrice || 0) || 0).toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.paymentStatus}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="px-6 py-12 text-center text-sm text-gray-500">
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
