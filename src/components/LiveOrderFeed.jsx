import React, { useState, useEffect } from 'react';

const TimeLeftDisplay = ({ deliveryTime }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  const calculateTimeLeft = () => {
    if (!deliveryTime) return { text: '-', color: 'text-gray-500' };
    const difference = new Date(deliveryTime) - currentTime;
    if (difference <= 0) return { text: 'Due Now', color: 'text-red-500' };
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    let text = '';
    if (hours > 0) text += `${hours}hr `;
    if (minutes > 0 || hours === 0) text += `${minutes}min`;
    const color = hours === 0 && minutes < 5 ? 'text-red-500' : (hours === 0 && minutes < 15 ? 'text-orange-500' : 'text-gray-700');
    return { text: `${text.trim()} left`, color };
  };

  const { text, color } = calculateTimeLeft();
  return <p className={`text-sm font-semibold ${color}`}>{text}</p>;
};

const LiveOrderFeed = ({ orders, onSelectOrder }) => {
  const pendingOrders = (orders || [])
    .filter(order => String(order.status).toLowerCase() === 'preparing')
    .sort((a, b) => new Date(a.deliveryTime) - new Date(b.deliveryTime));

  const getTypePillStyle = (type) => {
    return type === 'Dine-in'
      ? 'bg-white border border-purple-200 text-purple-800'
      : 'bg-white border border-orange-200 text-orange-800';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Actionable Orders (Pending)</h2>
      <div className="space-y-4">
        {pendingOrders.length > 0 ? (
          pendingOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => onSelectOrder && onSelectOrder(order)}
              className="w-full text-left p-0 bg-transparent hover:shadow-sm rounded-lg focus:outline-none"
            >
              <div className="w-full bg-indigo-50 rounded-lg p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-lg md:text-xl font-semibold text-gray-800 truncate">{order.id} <span className="font-normal text-gray-700">- {order.customer}</span></p>
                  <div className="mt-2">
                    <TimeLeftDisplay deliveryTime={order.deliveryTime} />
                  </div>
                </div>

                <div className="flex flex-col items-end ml-4 space-y-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white border border-blue-200 text-blue-800 shadow-sm">Preparing</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTypePillStyle(order.type)}`}>{order.type}</span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">All Caught Up!</h3>
            <p className="mt-1 text-sm text-gray-500">No orders are currently pending.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveOrderFeed;
