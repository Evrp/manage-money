import React from 'react';
import Layout from '../components/layout/Layout';
import { Target, AlertCircle, Edit2 } from 'lucide-react';

const BudgetsPage = () => {
  const budgets = [
    { category: 'อาหาร', spent: 4500, limit: 6000, color: 'bg-orange-500' },
    { category: 'ขนส่ง', spent: 1200, limit: 2000, color: 'bg-indigo-500' },
    { category: 'ช้อปปิ้ง', spent: 3800, limit: 4000, color: 'bg-pink-500' },
    { category: 'สุขภาพ', spent: 500, limit: 1500, color: 'bg-emerald-500' },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">งบประมาณ</h1>
          <button className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm text-gray-500 hover:text-indigo-600 transition-colors">
            <Target size={20} />
          </button>
        </header>

        {/* Global Progress Card */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-400 text-sm uppercase">ภาพรวมเดือนนี้</h2>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">เมษายน</span>
          </div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-2xl font-black">฿10,000 / ฿13,500</p>
              <p className="text-xs text-gray-400 mt-1">ใช้ไปแล้ว 74% ของงบทั้งหมด</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: '74%' }}></div>
          </div>
        </section>

        {/* Category Budgets */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg px-1">แยกตามหมวดหมู่</h2>
          {budgets.map((b) => {
            const percent = (b.spent / b.limit) * 100;
            const isDanger = percent >= 90;
            
            return (
              <div key={b.category} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${b.color}`}></div>
                    <span className="font-bold">{b.category}</span>
                  </div>
                  <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                    <Edit2 size={16} />
                  </button>
                </div>
                
                <div className="flex justify-between items-end mb-2 text-sm">
                  <span className="font-medium text-gray-500">฿{b.spent.toLocaleString()}</span>
                  <span className="font-bold">฿{b.limit.toLocaleString()}</span>
                </div>
                
                <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-red-500' : b.color}`} 
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  ></div>
                </div>

                {isDanger && (
                  <div className="flex items-center gap-2 mt-3 text-red-500 text-[10px] font-bold uppercase tracking-tight">
                    <AlertCircle size={10} />
                    <span>ใกล้เกินงบประมาณที่ตั้งไว้!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default BudgetsPage;
