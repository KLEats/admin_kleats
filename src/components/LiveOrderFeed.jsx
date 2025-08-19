import React, { useState, useEffect } from 'react';

const TimeLeftDisplay = ({ deliveryTime }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  const calculateTimeLeft = () => {
    const difference = new Date(deliveryTime) - currentTime;
    if (difference <= 0) return { text: "Due Now", color: "text-red-600 animate-pulse" };
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    let text = '';
    if (hours > 0) text += `${hours}hr `;
    if (minutes > 0 || hours === 0) text += `${minutes}min`;
    let color = "text-green-600";
    if (hours === 0 && minutes < 15) color = "text-orange-500";
    if (hours === 0 && minutes < 5) color = "text-red-600";
    return { text: `${text.trim()} left`, color };
  };

  const { text, color } = calculateTimeLeft();
  return <p className={`text-sm font-bold ${color}`}>{text}</p>;
};

const LiveOrderFeed = ({ orders, onSelectOrder }) => {
  const pendingOrders = orders
    .filter(order => order.status === 'Preparing')
    .sort((a, b) => new Date(a.deliveryTime) - new Date(b.deliveryTime));

  const getTypePillStyle = (type) => {
    return type === 'Dine-in'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Actionable Orders (Pending)</h2>
      <div className="space-y-4">
        {pendingOrders.length > 0 ? (
          pendingOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="w-full text-left flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div>
                <p className="font-semibold text-gray-800">{order.id} - <span className="font-normal">{order.customer}</span></p>
                <TimeLeftDisplay deliveryTime={order.deliveryTime} />
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className="px-3 py-1 text-xs font-bold rounded-full ring-1 ring-inset bg-blue-100 text-blue-800">
                  Preparing
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ring-1 ring-inset ${getTypePillStyle(order.type)}`}>
                  {order.type}
                </span>
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
