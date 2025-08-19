import React from 'react';

// --- Icons for Sidebar ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const OrdersIconSidebar = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 9h.01" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m14-2v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m9-11V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2m14 0V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2m-3 7h3m-3 4h3m-3-4a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const MonthlySalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;


const Sidebar = ({ metrics, onLogout, navigateTo, currentPage }) => {
  const linkClasses = "flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-left";
  const activeLinkClasses = "flex items-center w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg font-semibold text-left";

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col h-full">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button onClick={() => navigateTo('dashboard')} className={currentPage === 'dashboard' ? activeLinkClasses : linkClasses}>
          <DashboardIcon />
          <span className="ml-3">Dashboard</span>
        </button>
        <button onClick={() => navigateTo('orders')} className={currentPage === 'orders' ? activeLinkClasses : linkClasses}>
          <OrdersIconSidebar />
          <span className="ml-3">All Orders</span>
        </button>
        <button onClick={() => navigateTo('menu')} className={currentPage === 'menu' ? activeLinkClasses : linkClasses}>
          <MenuIcon />
          <span className="ml-3">Menu Items</span>
        </button>
        <button onClick={() => navigateTo('reports')} className={currentPage === 'reports' ? activeLinkClasses : linkClasses}>
          <ReportsIcon />
          <span className="ml-3">Reports</span>
        </button>
      </nav>
      
      {/* Footer: Metrics and Logout */}
      <div className="px-4 py-6 border-t border-gray-200 mt-auto">
        {/* Metrics Section */}
        <div className="space-y-4 mb-4">
             <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</h3>
             <div className="flex items-center text-sm font-medium text-gray-600">
                <SalesIcon />
                <span>Today's Sales: <span className="font-bold text-gray-900">₹{metrics.todaySales.toLocaleString('en-IN')}</span></span>
            </div>
             <div className="flex items-center text-sm font-medium text-gray-600">
                <MonthlySalesIcon />
                <span>Monthly Sales: <span className="font-bold text-gray-900">₹{metrics.monthlySales.toLocaleString('en-IN')}</span></span>
            </div>
        </div>
        
        {/* Logout Button */}
        <div className="border-t border-gray-200 pt-4">
            <button
              onClick={onLogout}
              className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogoutIcon />
              <span className="ml-3">Logout</span>
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
