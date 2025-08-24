import React, { useState, useEffect } from 'react';

// --- Component Imports ---
import Layout from '../components/Layout';
import LiveOrderFeed from '../components/LiveOrderFeed';
import TopSellingItems from '../components/TopSellingItems';
import OrderDetailModal from '../components/OrderDetailModal'; // Import the new modal

const DashboardPage = ({ onLogout, navigateTo, currentPage }) => {
  // Initialize with empty/default values (dummy data removed)
  const [dashboardData, setDashboardData] = useState({
    metrics: { todaySales: 0, todayOrders: 0, monthlySales: 0 },
    liveOrders: [],
    topSellingItems: []
  });
  const [selectedOrder, setSelectedOrder] = useState(null); // State for the selected order

  const handleSelectOrder = (order) => {
    // Normalize order for modal
    const normalized = {
      id: order.id,
  transactionId: order.transactionId ?? order.transaction_id ?? order.transaction ?? order.txnId ?? null,
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
  const handleUpdateOrderStatus = async (identifier, newStatus) => {
    // When marking completed, call backend to set paymentStatus to DELIVERED
    try {
      if (newStatus === 'Completed' || newStatus === 'Cancelled') {
        const base = import.meta.env.VITE_API_BASE_URL || '';
        const url = `${base}/api/Canteen/order/${encodeURIComponent(identifier)}/status`;
        const token = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) };

        const bodyPaymentStatus = newStatus === 'Completed' ? 'DELIVERED' : 'REFUNDED';

        const resp = await fetch(url, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ paymentStatus: bodyPaymentStatus }),
        });

        if (!resp.ok) {
          const text = await resp.text();
          console.error('Failed to update order status', resp.status, text);
          handleCloseModal();
          return;
        }

        // try to parse JSON response and use its values to update local state
        let respBody = null;
        try { respBody = await resp.json(); } catch (e) { respBody = null; }
        const returnedPaymentStatus = respBody?.paymentStatus ?? respBody?.payment_status ?? bodyPaymentStatus;
        const returnedTransactionId = respBody?.transactionId ?? respBody?.transaction_id ?? null;
        const returnedOrderId = respBody?.orderId ?? respBody?.order_id ?? null;

        // Update local state using returnedPaymentStatus and attach transactionId if available
        setDashboardData(prevData => ({
          ...prevData,
          liveOrders: prevData.liveOrders.map(order => {
            // match by transactionId first
            if (order.transactionId && (order.transactionId === identifier || order.transactionId === returnedTransactionId)) {
              return { ...order, status: newStatus, paymentStatus: returnedPaymentStatus, transactionId: returnedTransactionId || order.transactionId };
            }
            // then match by order display id
            if (order.id === identifier || order.id === `ORD-${identifier}`) {
              return { ...order, status: newStatus, paymentStatus: returnedPaymentStatus, transactionId: returnedTransactionId || order.transactionId };
            }
            // also consider numeric orderId mapping
            if (returnedOrderId && String(order.orderId || order.id) === String(returnedOrderId)) {
              return { ...order, status: newStatus, paymentStatus: returnedPaymentStatus };
            }
            return order;
          })
        }));

        handleCloseModal();
        return;
      }

      // update local UI state for non-patched statuses -- match by identifier
      setDashboardData(prevData => ({
        ...prevData,
        liveOrders: prevData.liveOrders.map(order => {
          if (order.transactionId && order.transactionId === identifier) {
            return { ...order, status: newStatus, paymentStatus: newStatus === 'Completed' ? 'DELIVERED' : (newStatus === 'Cancelled' ? 'REFUNDED' : order.paymentStatus) };
          }
          if (order.id === identifier || order.id === `ORD-${identifier}`) {
            return { ...order, status: newStatus, paymentStatus: newStatus === 'Completed' ? 'DELIVERED' : (newStatus === 'Cancelled' ? 'REFUNDED' : order.paymentStatus) };
          }
          return order;
        })
      }));
      handleCloseModal();
    } catch (err) {
      console.error('handleUpdateOrderStatus error', err);
      handleCloseModal();
    }
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

        // Collect unique itemIds to fetch item names in bulk
        const itemIdSet = new Set();
        list.forEach(o => {
          const rawItems = o.items ?? o.orderItems ?? o.order_items ?? o.cart ?? o.line_items ?? [];
          if (Array.isArray(rawItems)) rawItems.forEach(it => {
            const iid = it.itemId ?? it.id ?? it.ItemId ?? it.ItemID ?? null;
            if (iid !== undefined && iid !== null) itemIdSet.add(String(iid));
          });
        });

        const itemMap = new Map();
        if (itemIdSet.size) {
          await Promise.all(Array.from(itemIdSet).map(async (iid) => {
            try {
              const iurl = `${base}/api/explore/item?item_id=${encodeURIComponent(iid)}`;
              const r = await fetch(iurl, { headers });
              const t = await r.text();
              let b = null;
              try { b = t ? JSON.parse(t) : null; } catch { b = t; }
              let iname = null;
              if (b) {
                if (b.ItemName) iname = b.ItemName;
                else if (b.name) iname = b.name;
                else if (b.data && (b.data.ItemName || b.data.name)) iname = b.data.ItemName || b.data.name;
                else if (b.data && b.data.item && (b.data.item.ItemName || b.data.item.name)) iname = b.data.item.ItemName || b.data.item.name;
              }
              itemMap.set(String(iid), iname || `#${iid}`);
            } catch (err) {
              itemMap.set(String(iid), `#${iid}`);
            }
          }));
        }

        // Map and filter actionable orders (payment charged and not delivered/cancelled)
        const actionable = (list || []).map(o => {
          const orderId = o.orderId ?? o.id ?? o.order_id ?? (o.transactionId ? `ORD-${o.transactionId}` : null);
          const txn = o.transactionId ?? o.transaction_id ?? o.transaction ?? o.txnId ?? o.transactionId ?? null;
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
          // normalize items if present on the payload so modal can show them
          const rawItems = o.items ?? o.orderItems ?? o.order_items ?? o.cart ?? o.line_items ?? [];
          const items = Array.isArray(rawItems) ? rawItems.map(it => {
            const iid = it.itemId ?? it.id ?? it.ItemId ?? it.ItemID ?? Math.random().toString(36).slice(2,8);
            const key = String(iid);
            const resolvedName = it.name ?? it.ItemName ?? itemMap.get(key) ?? `#${iid}`;
            return {
              id: iid,
              name: resolvedName,
              price: parseFloat(it.price ?? it.Price ?? it.rate ?? 0) || 0,
              quantity: it.quantity ?? it.qty ?? it.Quantity ?? 1,
            };
          }) : [];

          return {
            id: orderId || `#${o.id || Math.random().toString(36).slice(2,8)}`,
            transactionId: txn,
            customer,
            status: displayStatus,
            type,
            deliveryTime,
            items,
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
            onComplete={() => handleUpdateOrderStatus(selectedOrder.transactionId ?? selectedOrder.id, 'Completed')}
            onCancel={() => handleUpdateOrderStatus(selectedOrder.transactionId ?? selectedOrder.id, 'Cancelled')}
        />
      )}
    </Layout>
  );
};

export default DashboardPage;
