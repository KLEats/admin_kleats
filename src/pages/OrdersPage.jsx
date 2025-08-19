import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import OrderFilters from '../components/OrderFilters';
import OrderHistoryTable from '../components/OrderHistoryTable';

// Helper function to format a Date object into a 'YYYY-MM-DD' string
const formatDateForInput = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// --- DUMMY DATA ---
const initialOrderHistory = [
  { id: 'ORD-125', customer: 'Ankit S.', status: 'Completed', type: 'Dine-in', date: new Date(), total: 140.00 },
  { id: 'ORD-123', customer: 'Rohan K.', status: 'Completed', type: 'Parcel', date: new Date(), total: 160.00 },
  { id: 'ORD-122', customer: 'Sneha P.', status: 'Cancelled', type: 'Dine-in', date: new Date(), total: 240.00 },
  { id: 'ORD-118', customer: 'Manoj D.', status: 'Completed', type: 'Parcel', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), total: 250.00 },
  { id: 'ORD-117', customer: 'Priya M.', status: 'Completed', type: 'Dine-in', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), total: 85.00 },
  { id: 'ORD-112', customer: 'Kavita L.', status: 'Completed', type: 'Parcel', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), total: 120.00 },
  { id: 'ORD-111', customer: 'Ravi B.', status: 'Cancelled', type: 'Dine-in', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), total: 90.00 },
  { id: 'ORD-105', customer: 'Sunita G.', status: 'Completed', type: 'Dine-in', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), total: 500.00 },
];

const dummyMetrics = {
    todaySales: 7550.50,
    todayOrders: 125,
    monthlySales: 185750.00,
};

const OrdersPage = ({ onLogout, navigateTo, currentPage }) => {
  const [orders] = useState(initialOrderHistory);
  const [filters, setFilters] = useState({
    status: 'All',
    startDate: formatDateForInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    endDate: formatDateForInput(new Date()),
  });

  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // --- THE CORRECTED FILTERING LOGIC IS HERE ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter (this was already correct)
      if (filters.status !== 'All' && order.status !== filters.status) {
        return false;
      }

      // --- NEW, ROBUST DATE FILTERING ---
      // Convert the order's date to the same 'YYYY-MM-DD' string format for reliable comparison.
      const orderDateString = formatDateForInput(order.date);

      // Compare the date strings directly. This avoids all timezone issues.
      if (filters.startDate && orderDateString < filters.startDate) {
        return false;
      }
      if (filters.endDate && orderDateString > filters.endDate) {
        return false;
      }
      
      return true;
    });
  }, [orders, filters]);

  return (
    <Layout 
        metrics={dummyMetrics} 
        onLogout={onLogout}
        navigateTo={navigateTo}
        currentPage={currentPage}
    >
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Order History</h1>
        
        <OrderFilters filters={filters} onFilterChange={handleFilterChange} />
        
        <OrderHistoryTable orders={filteredOrders} />
      </div>
    </Layout>
  );
};

export default OrdersPage;
