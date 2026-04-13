import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import {
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Target,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

const AnalyticsPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Fetch Summary (Saving Rate, etc.)
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["dashboard-summary", selectedMonth, selectedYear],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/summary", {
        params: { month: selectedMonth, year: selectedYear },
      });
      return data;
    },
  });

  // Fetch Monthly Trends
  const { data: trends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["dashboard-trends", selectedYear],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/chart/monthly", {
        params: { year: selectedYear },
      });
      return data;
    },
  });

  // Fetch Category Breakdown
  const { data: breakdown, isLoading: isBreakdownLoading } = useQuery({
    queryKey: ["dashboard-breakdown", selectedMonth, selectedYear],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/chart/category", {
        params: { month: selectedMonth, year: selectedYear },
      });
      return data;
    },
  });

  const isLoading = isSummaryLoading || isTrendsLoading || isBreakdownLoading;

  // Calculate top expense for scaling progress bars
  const maxExpense = breakdown ? Math.max(...breakdown.map((b: any) => b.value), 0) : 0;

  return (
    <Layout>
      <div className="pb-24 px-4 pt-4 space-y-6">
        {/* Header with Picker */}
        <div className="flex justify-between items-center px-2">
          <h1 className="text-2xl font-black text-gray-900">วิเคราะห์ผล</h1>
          <div className="flex gap-2">
            <div className="relative">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-100 shadow-sm rounded-xl text-xs font-bold py-2 pl-3 pr-8 focus:ring-0 focus:border-indigo-200"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('th-TH', { month: 'short' })}
                  </option>
                ))}
              </select>
              <CalendarIcon size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Saving Rate Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Target size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                Saving Rate
              </span>
            </div>
            
            <div className="flex items-end gap-3 mb-4">
              <span className="text-6xl font-black">
                {isLoading ? "..." : Math.floor(summary?.savingRate || 0)}%
              </span>
              <div className="pb-2">
                {summary?.savingRate > 0 ? (
                  <div className="flex items-center text-[10px] font-bold bg-emerald-400/30 text-emerald-100 px-2.5 py-1 rounded-full backdrop-blur-md">
                    <ArrowUpRight size={12} className="mr-0.5" />
                    +12% ยอดเยี่ยม
                  </div>
                ) : (
                  <div className="flex items-center text-[10px] font-bold bg-red-400/30 text-red-100 px-2.5 py-1 rounded-full backdrop-blur-md">
                     ต้องวางแผนใหม่
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm font-medium opacity-80 leading-relaxed max-w-[220px]">
              {summary?.savingRate > 50 
                ? "คุณเก็บเงินได้ยอดเยี่ยมมาก! รักษาวินัยแบบนี้ต่อไปนะ" 
                : "รายจ่ายยังถือว่าสูงอยู่ ลองลดค่าใช้จ่ายที่ไม่จำเป็นดูนะ"}
            </p>
          </div>

          {/* Abstract background shapes */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
          <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl group-hover:bg-indigo-400/30 transition-all duration-700" />
        </div>

        {/* Expense Trends */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">เทรนด์รายจ่าย</h3>
            </div>
            <div className="p-2 bg-gray-50 rounded-xl">
              <TrendingUp size={18} className="text-indigo-500" />
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-1 px-1">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-200" size={32} />
              </div>
            ) : (
              trends?.map((data: any) => {
                const height = data.expense > 0 ? (data.expense / Math.max(...trends.map((t: any) => t.expense), 1)) * 100 : 0;
                const isCurrent = data.month === selectedMonth;
                
                return (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full relative flex flex-col items-center justify-end h-32">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                        ฿{data.expense.toLocaleString()}
                      </div>
                      <div 
                        className={`w-full max-w-[12px] rounded-full transition-all duration-700 ${isCurrent ? 'bg-indigo-600 shadow-md shadow-indigo-100' : 'bg-gray-100 group-hover:bg-indigo-300'}`}
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${isCurrent ? 'text-indigo-600' : 'text-gray-300'}`}>
                      {new Date(0, data.month - 1).toLocaleString('th-TH', { month: 'short' })}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">แบ่งตามหมวดหมู่</h3>

          <div className="space-y-8">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-50 rounded-full w-1/2" />
                    <div className="h-1.5 bg-gray-50 rounded-full w-3/4" />
                  </div>
                </div>
              ))
            ) : breakdown?.length > 0 ? (
              breakdown.slice(0, 5).map((item: any, idx: number) => {
                const percentage = (item.value / maxExpense) * 100;
                
                return (
                  <div key={idx} className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2 h-8 rounded-full transition-all group-hover:w-3"
                          style={{ backgroundColor: item.color || '#6366f1' }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{item.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {Math.floor((item.value / summary.totalExpense) * 100)}% ของจ่ายทั้งหมด
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 tracking-tight">฿{item.value.toLocaleString()}</span>
                        <ChevronRight size={16} className="text-gray-200 group-hover:text-indigo-300 transition-colors" />
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: item.color || '#6366f1'
                        }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                  <Target size={24} className="text-gray-200" />
                </div>
                <p className="text-xs font-bold text-gray-400">ยังไม่มีข้อมูลในเดือนนี้</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
