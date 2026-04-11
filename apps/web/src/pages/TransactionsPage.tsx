import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Search, Filter, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const TransactionsPage = () => {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'income', label: 'รายรับ' },
    { id: 'expense', label: 'รายจ่าย' },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">รายการล่าสุด</h1>
          <button className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm text-gray-500 hover:text-indigo-600 transition-colors">
            <Calendar size={20} />
          </button>
        </header>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหารายการ..." 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
            />
          </div>
          <button className="bg-white px-4 rounded-2xl border border-gray-100 shadow-sm text-gray-500">
            <Filter size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200/50 p-1 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions List Grouped by Date */}
        <div className="space-y-6">
          {[ 'วันนี้, 11 เม.ย.', 'เมื่อวาน, 10 เม.ย.' ].map((date) => (
            <div key={date} className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">{date}</h3>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:translate-x-1 transition-transform cursor-pointer">
                    <div className={`p-2.5 rounded-2xl ${i % 2 === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {i % 2 === 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{i % 2 === 0 ? 'เงินเดือน' : 'GrabFood'}</p>
                      <p className="text-xs text-gray-400">หมวดหมู่: {i % 2 === 0 ? 'รายได้' : 'อาหาร'}</p>
                    </div>
                    <p className={`font-bold ${i % 2 === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {i % 2 === 0 ? '+ ฿45,000' : '- ฿240'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default TransactionsPage;
