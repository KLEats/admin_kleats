import React, { useState } from 'react';
import Layout from '../components/Layout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Corrected import

// --- Helper function to format date ---
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
const allOrders = [
  { id: 'ORD-125', customer: 'Ankit S.', status: 'Completed', type: 'Dine-in', date: new Date(), total: 140.00 },
  { id: 'ORD-123', customer: 'Rohan K.', status: 'Completed', type: 'Parcel', date: new Date(), total: 160.00 },
  { id: 'ORD-122', customer: 'Sneha P.', status: 'Cancelled', type: 'Dine-in', date: new Date(), total: 240.00 },
  { id: 'ORD-118', customer: 'Manoj D.', status: 'Completed', type: 'Parcel', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), total: 250.00 },
  { id: 'ORD-111', customer: 'Ravi B.', status: 'Cancelled', type: 'Dine-in', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), total: 90.00 },
  { id: 'ORD-105', customer: 'Sunita G.', status: 'Completed', type: 'Dine-in', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), total: 500.00 },
];

const dummyMetrics = {
    todaySales: 7550.50,
    todayOrders: 125,
    monthlySales: 185750.00,
};

const ReportsPage = ({ onLogout, navigateTo, currentPage }) => {
  const [reportOptions, setReportOptions] = useState({
    format: 'pdf',
    status: 'All',
    startDate: formatDateForInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    endDate: formatDateForInput(new Date()),
  });

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setReportOptions(prev => ({ ...prev, [name]: value }));
  };

  const generateReport = () => {
    const filteredData = allOrders.filter(order => {
      if (reportOptions.status !== 'All' && order.status !== reportOptions.status) return false;
      const orderDateString = formatDateForInput(order.date);
      if (reportOptions.startDate && orderDateString < reportOptions.startDate) return false;
      if (reportOptions.endDate && orderDateString > reportOptions.endDate) return false;
      return true;
    });

    if (filteredData.length === 0) {
      alert("No data found for the selected filters. Cannot generate report.");
      return;
    }

    if (reportOptions.format === 'pdf') {
      generatePdf(filteredData);
    } else {
      generateCsv(filteredData);
    }
  };

  const generatePdf = (data) => {
    try {
        const doc = new jsPDF();
        const tableColumn = ['Order ID', 'Date', 'Customer', 'Status', 'Total (INR)'];
        const tableRows = [];

        data.forEach(order => {
          const orderData = [
            String(order.id),
            String(new Date(order.date).toLocaleDateString()),
            String(order.customer),
            String(order.status),
            String(order.total.toFixed(2))
          ];
          tableRows.push(orderData);
        });

        doc.text(`Order Report (${reportOptions.status}) - ${reportOptions.startDate} to ${reportOptions.endDate}`, 14, 15);
        
        // --- CORRECTED FUNCTION CALL ---
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 22,
        });

        doc.save(`report-${Date.now()}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("An error occurred while generating the PDF. Please check the console for details.");
    }
  };

  const generateCsv = (data) => {
    const headers = ['OrderID', 'Date', 'Customer', 'Status', 'Total'];
    const csvContent = [
      headers.join(','),
      ...data.map(order => [
        order.id,
        new Date(order.date).toLocaleDateString(),
        order.customer,
        order.status,
        order.total.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout 
        metrics={dummyMetrics} 
        onLogout={onLogout}
        navigateTo={navigateTo}
        currentPage={currentPage}
    >
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Generate Reports</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 border rounded-lg bg-gray-50">
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select name="format" id="format" value={reportOptions.format} onChange={handleOptionChange} className="w-full p-2 border border-gray-300 rounded-md">
              <option value="pdf">PDF</option>
              <option value="csv">Excel (CSV)</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" id="status" value={reportOptions.status} onChange={handleOptionChange} className="w-full p-2 border border-gray-300 rounded-md">
              <option value="All">All Orders</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" name="startDate" id="startDate" value={reportOptions.startDate} onChange={handleOptionChange} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" name="endDate" id="endDate" value={reportOptions.endDate} onChange={handleOptionChange} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="mt-6 text-center">
            <button 
                onClick={generateReport}
                className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
            >
                Download Report
            </button>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
