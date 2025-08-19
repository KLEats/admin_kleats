import React, { useState } from 'react';
import Sidebar from './Sidebar';

// --- Icons for Mobile Top Bar ---
const HamburgerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;

const Layout = ({ children, metrics, onLogout, navigateTo, currentPage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (page) => {
    navigateTo(page);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* --- Sidebar --- */}
      {/* It is fixed on mobile and becomes part of the layout on desktop */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30`}
      >
        <Sidebar 
            metrics={metrics} 
            onLogout={onLogout} 
            navigateTo={handleNavigate} 
            currentPage={currentPage} 
        />
      </div>
      
      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Top Bar with Hamburger */}
        <div className="md:hidden bg-white shadow-md flex items-center justify-between h-16 px-4 flex-shrink-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <HamburgerIcon />
            </button>
            <span className="text-xl font-bold">Admin Panel</span>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* --- Overlay for Mobile --- */}
      {/* This now correctly sits on top of the content but below the sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
        ></div>
      )}
    </div>
  );
};

export default Layout;
