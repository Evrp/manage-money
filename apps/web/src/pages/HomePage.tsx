import React from 'react';
import Layout from '../components/layout/Layout';
import { Plus, Receipt, TrendingDown, TrendingUp } from 'lucide-react';

const HomePage = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header Summary */}
        <section className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-100 text-sm opacity-80">ยอดคงเหลือเดือนนี้</p>
              <h1 className="text-3xl font-bold mt-1">฿14,250.00</h1>
            </div>
            <button className="bg-white/20 p-2 rounded-xl backdrop-blur-md hover:bg-white/30 transition-colors">
              <Plus size={24} />
            </button>
          </div>
          
          <div className="flex gap-4 mt-6">
            <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-xs text-indigo-100 mb-1">
                <TrendingUp size={12} />
                <span>รายรับ</span>
              </div>
              <p className="font-semibold">฿25,000</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-xs text-indigo-100 mb-1">
                <TrendingDown size={12} />
                <span>รายจ่าย</span>
              </div>
              <p className="font-semibold">฿10,750</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 transition-all">
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
              <Plus size={24} />
            </div>
            <span className="text-sm font-semibold">บันทึกใหม่</span>
          </button>
          <button className="flex flex-col items-center gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/50 transition-all">
            <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
              <Receipt size={24} />
            </div>
            <span className="text-sm font-semibold">อัพโหลดสลิป</span>
          </button>
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="font-bold text-lg">รายการล่าสุด</h2>
            <button className="text-indigo-600 text-sm font-semibold">ดูทั้งหมด</button>
          </div>
          
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:translate-x-1 transition-transform cursor-pointer">
                <div className="bg-orange-100 p-2.5 rounded-2xl text-orange-600">
                  <Receipt size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">อาหารเที่ยง - กะเพรา</p>
                  <p className="text-xs text-gray-400">วันนี้, 12:30 น.</p>
                </div>
                <p className="font-bold text-red-500">- ฿85</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;
