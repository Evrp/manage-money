import React from 'react';
import Layout from '../components/layout/Layout';
import { BarChart3, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
// Note: In real setup, import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
// For now, illustrating the structure and premium design.

const AnalyticsPage = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-6 pb-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">วิเคราะห์ผล</h1>
          <button className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm text-gray-500">
            <Calendar size={20} />
          </button>
        </header>

        {/* Highlight Card */}
        <section className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <TrendingUp size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Saving Rate</span>
            </div>
            <h2 className="text-4xl font-black text-indigo-900">32%</h2>
            <p className="text-sm text-indigo-700/70 mt-2">ประหยัดได้มากกว่าเดือนที่แล้ว 5%</p>
          </div>
          <BarChart3 size={120} className="absolute -right-4 -bottom-4 text-indigo-200/40 group-hover:scale-110 transition-transform duration-700" />
        </section>

        {/* Chart Section Placeholder */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm text-gray-400 uppercase">เทรนด์รายจ่าย</h3>
            <select className="text-xs border-none bg-gray-50 rounded-lg p-1 focus:ring-0 font-bold text-indigo-600">
              <option>6 เดือนย้อนหลัง</option>
              <option>12 เดือนย้อนหลัง</option>
            </select>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2 px-1">
            {[ 40, 70, 45, 90, 65, 80 ].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-indigo-100 group-hover:bg-indigo-600 transition-all duration-500 rounded-xl"
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-[10px] font-bold text-gray-400">M{i+1}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-sm text-gray-400 uppercase mb-6">แบ่งตามหมวดหมู่</h3>
          
          <div className="flex flex-col gap-5">
            {[
              { label: 'อาหาร', amount: '฿4,500', percent: '45%', color: 'bg-orange-500' },
              { label: 'ช้อปปิ้ง', amount: '฿3,800', percent: '38%', color: 'bg-pink-500' },
              { label: 'อื่นๆ', amount: '฿1,700', percent: '17%', color: 'bg-gray-400' },
            ].map((cat) => (
              <div key={cat.label} className="flex items-center gap-4">
                <div className={`w-2 h-8 rounded-full ${cat.color}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold">{cat.label}</span>
                    <span className="text-sm font-black">{cat.amount}</span>
                  </div>
                  <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color}`} style={{ width: cat.percent }}></div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-200" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
