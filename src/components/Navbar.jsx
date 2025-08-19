import React, { useState } from 'react';

// --- Helper Icons for Navbar ---
const SalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const OrdersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const MonthlySalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const HamburgerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

const Navbar = ({ onLogout, metrics }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-30 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          >
            <HamburgerIcon />
          </button>
          <span className="text-2xl font-bold text-gray-900">Canteen Portal</span>
        </div>
      </header>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ minWidth: '16rem' }}
      >
        <div className="flex flex-col h-full">
          {/* Header with Close */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Canteen Portal</h1>
            <button
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Metrics */}
          <div className="flex-1 px-4 py-6 space-y-4">
            <div className="flex items-center text-sm font-medium text-gray-600">
              <SalesIcon />
              <span>Today's Sales: <span className="font-bold text-gray-900">₹{metrics.todaySales.toLocaleString('en-IN')}</span></span>
            </div>
            <div className="flex items-center text-sm font-medium text-gray-600">
              <OrdersIcon />
              <span>Today's Orders: <span className="font-bold text-gray-900">{metrics.todayOrders}</span></span>
            </div>
            <div className="flex items-center text-sm font-medium text-gray-600">
              <MonthlySalesIcon />
              <span>Monthly Sales: <span className="font-bold text-gray-900">₹{metrics.monthlySales.toLocaleString('en-IN')}</span></span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-6 space-y-3">
            <button className="w-full text-left text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
              All Orders
            </button>
            <button className="w-full text-left text-sm font-medium text-white bg-green-600 px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors">
              + Add Item
            </button>
            <button
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="w-full text-left text-sm font-medium text-white bg-red-600 px-4 py-2 rounded-lg shadow-sm hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
