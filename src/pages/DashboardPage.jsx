import React, { useState, useEffect } from 'react';

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
    // Normalize order for modal
    const normalized = {
      id: order.id,
      customer: order.customer,
      type: order.type,
      deliveryTime: order.deliveryTime,
      items: Array.isArray(order.items) ? order.items.map(it => ({
        id: it.itemId ?? it.id ?? Math.random().toString(36).slice(2,8),
        name: it.name ?? it.ItemName ?? `#${it.itemId ?? it.id}`,
        price: it.price ?? it.Price ?? 0,
        quantity: it.quantity ?? it.qty ?? 1,
      })) : [],
    };
    setSelectedOrder(normalized);
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

  useEffect(() => {
    const fetchPaidOrders = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL || '';
        const url = `${base}/api/Canteen/order/paid?offset=0&limit=50`;
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: token } : {};

        const res = await fetch(url, { method: 'GET', headers });
        const text = await res.text();
        let body = null;
        try { body = text ? JSON.parse(text) : null; } catch { body = text; }

        const list = Array.isArray(body?.orders) ? body.orders : (Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []));

        // collect unique userIds to fetch names in bulk
        const userIdSet = new Set();
        list.forEach(o => {
          const uid = o.userId ?? o.user_id ?? (o.user && (o.user.id || o.userId));
          if (uid !== undefined && uid !== null) userIdSet.add(uid);
        });

        const userMap = new Map();
        if (userIdSet.size) {
          await Promise.all(Array.from(userIdSet).map(async (uid) => {
            try {
              const uurl = `${base}/api/Canteen/user/get-user-details?userId=${encodeURIComponent(uid)}`;
              const r = await fetch(uurl, { headers });
              const t = await r.text();
              let b = null;
              try { b = t ? JSON.parse(t) : null; } catch { b = t; }
              let name = null;
              if (b) {
                if (b.name) name = b.name;
                else if (b.username) name = b.username;
                else if (b.data && (b.data.name || b.data.username)) name = b.data.name || b.data.username;
                else if (b.data && b.data.user && (b.data.user.name || b.data.user.username)) name = b.data.user.name || b.data.user.username;
              }
              userMap.set(uid, name || `#${uid}`);
            } catch (err) {
              userMap.set(uid, `#${uid}`);
            }
          }));
        }

        // Map and filter actionable orders (payment charged and not delivered/cancelled)
        const actionable = (list || []).map(o => {
          const orderId = o.orderId ?? o.id ?? o.order_id ?? (o.transactionId ? `ORD-${o.transactionId}` : null);
          const uid = o.userId ?? o.user_id ?? (o.user && (o.user.id || o.userId));
          const customerFromPayload = (o.user && (o.user.name || o.user.username)) || o.customerName || o.userName || o.customer || 'Guest';
          const customer = (uid && userMap.has(uid)) ? userMap.get(uid) : customerFromPayload;
          const statusRaw = String(o.status ?? o.orderStatus ?? o.statusText ?? '').toLowerCase();
          const paymentStatus = String(o.paymentStatus ?? o.payment_status ?? '').toLowerCase();

          const isCharged = /charg|paid|success|settled/.test(paymentStatus);
          const isDeliveredLike = /deliv|deliver|delivered|completed|cancel|refun|refunded/.test(statusRaw);
          const actionableFlag = isCharged && !isDeliveredLike;

          const displayStatus = actionableFlag ? 'Preparing' : statusRaw || '';
          const type = /parcel|pickup|takeaway|takeway/i.test(o.orderType || o.type || '') ? 'Parcel' : 'Dine-in';
          const deliveryTime = o.deliveryTime ?? o.expectedDeliveryTime ?? o.orderTime ?? o.updatedAt ?? null;
          return {
            id: orderId || `#${o.id || Math.random().toString(36).slice(2,8)}`,
            customer,
            status: displayStatus,
            type,
            deliveryTime,
            _actionable: actionableFlag,
          };
        }).filter(o => o._actionable);

        setDashboardData(prev => ({ ...prev, liveOrders: actionable }));
      } catch (err) {
        console.error('fetchPaidOrders error', err);
      }
    };

    fetchPaidOrders();
    const interval = setInterval(fetchPaidOrders, 15000);
    return () => clearInterval(interval);
  }, []);

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
