import React from 'react';

const OrderFilters = ({ filters, onFilterChange }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  const renderStatusChecklist = () => {
    const options = ['All', 'charged', 'delivered', 'refunded'];
    const current = filters.status;
    const isAll = !current || current === 'All' || (Array.isArray(current) && current.length === 0);

    return (
      <div className="bg-white p-2">
        <div className="flex flex-row items-center space-x-2">
          {options.map(opt => {
            const label = opt === 'All' ? 'All' : (opt.charAt(0).toUpperCase() + opt.slice(1));
            const checked = isAll ? (opt === 'All') : (Array.isArray(current) ? current.includes(opt) : current === opt);
            const pillBase = 'inline-flex items-center px-3 py-1 rounded-full border cursor-pointer select-none';
            const pillChecked = opt === 'All'
              ? (checked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200')
              : (checked ? 'bg-green-50 text-green-800 border-green-200' : 'bg-white text-gray-700 border-gray-200');
            return (
              <label key={opt} className={`${pillBase} ${pillChecked}`}> 
                <input
                  type="checkbox"
                  value={opt}
                  checked={checked}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'All') {
                      onFilterChange('status', 'All');
                      return;
                    }
                    const arr = Array.isArray(current) && current.length ? [...current] : [];
                    if (e.target.checked) {
                      if (!arr.includes(val)) arr.push(val);
                      onFilterChange('status', arr);
                    } else {
                      const next = arr.filter(x => x !== val);
                      if (!next.length) onFilterChange('status', 'All');
                      else onFilterChange('status', next);
                    }
                  }}
                  className="sr-only"
                  aria-checked={checked}
                />
                <span className="text-sm leading-none">{label}</span>
              </label>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-1">Select one or more statuses. Toggle 'All' to reset selection.</div>
      </div>
    );
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        {renderStatusChecklist()}
      </div>

      {/* Start Date Filter */}
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={filters.startDate}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* End Date Filter */}
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          value={filters.endDate}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* Type Filter */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          id="type"
          name="type"
          value={filters.type || 'All'}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="All">All</option>
          <option value="pickup">pickup</option>
          <option value="dinein">dinein</option>
        </select>
      </div>
    </div>
  );
};

export default OrderFilters;
