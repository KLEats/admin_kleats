import React, { useState } from 'react';

// --- Component Imports ---
import Layout from '../components/Layout';
import LiveOrderFeed from '../components/LiveOrderFeed';
import TopSellingItems from '../components/TopSellingItems';
import OrderDetailModal from '../components/OrderDetailModal'; // Import the new modal

// --- UPDATED DUMMY DATA with order types ---
const initialDashboardData = {
  metrics: {
    todaySales: 7550.50,
    todayOrders: 125,
    monthlySales: 185750.00,
  },
  liveOrders: [
    { 
      id: 'ORD-125', customer: 'Ankit S.', status: 'Preparing', type: 'Dine-in', deliveryTime: new Date(Date.now() + 15 * 60000),
      items: [
        { id: 8, name: 'Veg Noodles', price: 90.00, quantity: 1 },
        { id: 5, name: 'Filter Coffee', price: 25.00, quantity: 2 },
      ]
    },
    { 
      id: 'ORD-124', customer: 'Priya M.', status: 'Completed', type: 'Parcel', deliveryTime: new Date(Date.now() - 5 * 60000),
      items: [{ id: 1, name: 'Masala Dosa', price: 60.00, quantity: 1 }]
    },
    { 
      id: 'ORD-123', customer: 'Rohan K.', status: 'Preparing', type: 'Parcel', deliveryTime: new Date(Date.now() + 8 * 60000),
      items: [
        { id: 2, name: 'Samosa', price: 15.00, quantity: 4 },
        { id: 6, name: 'Chole Bhature', price: 100.00, quantity: 1 },
      ]
    },
    { 
      id: 'ORD-122', customer: 'Sneha P.', status: 'Cancelled', type: 'Dine-in', deliveryTime: new Date(Date.now() - 10 * 60000),
      items: [{ id: 3, name: 'Veg Biryani', price: 120.00, quantity: 2 }]
    },
    { 
      id: 'ORD-121', customer: 'Vikram B.', status: 'Preparing', type: 'Dine-in', deliveryTime: new Date(Date.now() + 25 * 60000),
      items: [{ id: 4, name: 'Paneer Tikka', price: 150.00, quantity: 1 }]
    },
  ],
  topSellingItems: [
    { name: 'Samosa', count: 85 },
    { name: 'Masala Dosa', count: 62 },
    { name: 'Veg Biryani', count: 55 },
    { name: 'Filter Coffee', count: 48 },
    { name: 'Paneer Tikka', count: 32 },
  ]
};

const DashboardPage = ({ onLogout, navigateTo, currentPage }) => {
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [selectedOrder, setSelectedOrder] = useState(null); // State for the selected order

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  // --- Handlers for Modal Actions ---
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setDashboardData(prevData => ({
      ...prevData,
      liveOrders: prevData.liveOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    }));
    handleCloseModal();
  };

  return (
    <Layout 
        metrics={dashboardData.metrics} 
        onLogout={onLogout} 
        navigateTo={navigateTo} 
        currentPage={currentPage}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
              <LiveOrderFeed 
                orders={dashboardData.liveOrders} 
                onSelectOrder={handleSelectOrder}
              />
          </div>
          <div className="lg:col-span-1">
              <TopSellingItems items={dashboardData.topSellingItems} />
          </div>
      </div>

      {/* Conditionally render the modal */}
      {selectedOrder && (
        <OrderDetailModal 
            order={selectedOrder}
            onClose={handleCloseModal}
            onComplete={() => handleUpdateOrderStatus(selectedOrder.id, 'Completed')}
            onCancel={() => handleUpdateOrderStatus(selectedOrder.id, 'Cancelled')}
        />
      )}
    </Layout>
  );
};

export default DashboardPage;
