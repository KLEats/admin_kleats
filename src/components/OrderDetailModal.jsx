import React from 'react';

const OrderDetailModal = ({ order, onClose, onComplete, onCancel }) => {
  if (!order) return null;

  const totalCost = order.items.reduce((total, item) => total + item.price * item.quantity, 0);

  const getTypePillStyle = (type) => {
    return type === 'Dine-in'
      ? 'bg-purple-100 text-purple-800 ring-purple-600/20'
      : 'bg-orange-100 text-orange-800 ring-orange-600/20';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col">
        {/* --- MODAL HEADER --- */}
        <div className="flex justify-between items-start p-4 border-b">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
                <p className="font-semibold text-gray-600">{order.id}</p>
            </div>
            <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-bold rounded-full ring-1 ring-inset ${getTypePillStyle(order.type)}`}>
                    {order.type}
                </span>
                {/* --- THE 'X' CLOSE BUTTON IS BACK --- */}
                <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
        
        {/* --- MODAL BODY --- */}
        <div className="p-6 flex-grow max-h-[60vh] overflow-y-auto">
            <div className="mb-6">
                <p className="text-sm text-gray-500">Customer Name</p>
                <p className="font-bold text-gray-900">{order.customer}</p>
            </div>

            <h3 className="font-semibold text-gray-700 mb-2">Items Ordered</h3>
            <div className="space-y-2 border-t border-b py-4">
                {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                        <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-lg font-bold text-gray-900">Total</p>
                <p className="text-xl font-bold text-indigo-600">₹{totalCost.toFixed(2)}</p>
            </div>
        </div>
        
        {/* --- MODAL FOOTER --- */}
        <div className="p-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onComplete(order.id)}
            className="flex-1 px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700"
          >
            Complete Order
          </button>
          <button
            onClick={() => onCancel(order.id)}
            className="flex-1 px-6 py-3 text-lg font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700"
          >
            Refund Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
