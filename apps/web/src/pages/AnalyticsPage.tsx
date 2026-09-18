import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import {
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Target,
  Loader2,
  Calendar as CalendarIcon,
  ArrowRight,
  PieChart,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsBasis, getCategoryChart, getDashboardSummary, getMonthlyChart } from "../services/dashboardService";

const AnalyticsPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeType, setActiveType] = useState<"expense" | "income">("expense");
  const [analyticsBasis, setAnalyticsBasis] = useState<AnalyticsBasis>("budget");
  const basisLabel = analyticsBasis === "budget" ? "รอบงบประมาณ" : "วันที่ทำรายการ";

  // Fetch Summary (Saving Rate, etc.)
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["dashboard-summary", selectedMonth, selectedYear, analyticsBasis],
    queryFn: () => getDashboardSummary({ month: selectedMonth, year: selectedYear, basis: analyticsBasis }),
  });

  // Fetch Monthly Trends
  const { data: trends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["dashboard-trends", selectedYear, analyticsBasis],
    queryFn: () => getMonthlyChart({ year: selectedYear, basis: analyticsBasis }),
  });

  // Fetch Category Breakdown
  const { data: responseData, isLoading: isBreakdownLoading } = useQuery({
    queryKey: ["dashboard-breakdown", selectedMonth, selectedYear, activeType, analyticsBasis],
    queryFn: () => getCategoryChart({ month: selectedMonth, year: selectedYear, type: activeType, basis: analyticsBasis }),
  });

  // Extremely robust extraction
  const breakdown = responseData?.data 
    ? responseData.data 
    : (Array.isArray(responseData) ? responseData : []);
  
  const debug = responseData?.debug;

  const isLoading = isSummaryLoading || isTrendsLoading || isBreakdownLoading;

  // Calculate highest value in breakdown for proper scaling
  const maxVal = Array.isArray(breakdown) ? Math.max(...breakdown.map((b: any) => b.value), 0) : 1;

  return (
    <Layout>
      <div className="analytics-grid">
        {/* Header with Picker */}
        <div className="flex justify-between items-center px-2">
          <div><span className="eyebrow">INSIGHTS & TRENDS</span><h1 className="text-2xl font-black text-gray-900">เข้าใจเงินของคุณ</h1><p className="text-sm text-gray-500 mt-2">แนวโน้มการใช้จ่ายและโอกาสในการออม</p></div>
          <div className="flex gap-2">
            <select aria-label="ปีที่ต้องการวิเคราะห์" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-surface border border-gray-200 rounded-xl px-3 text-sm">
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i).map((year) => <option key={year} value={year}>{year + 543}</option>)}
            </select>
            <div className="relative">
              <select 
                aria-label="เดือนที่ต้องการวิเคราะห์"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="appearance-none bg-surface border border-gray-100 shadow-sm rounded-xl text-xs font-bold py-2 pl-3 pr-8 focus:ring-0 focus:border-indigo-200"
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

        <section className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-800">วัดผลตามอะไร</p>
            <p className="text-xs text-slate-500">
              {analyticsBasis === "budget"
                ? "รวมตามเดือนที่เลือกให้นับในงบประมาณ เหมาะสำหรับเทียบค่าใช้จ่ายรายเดือน"
                : "รวมตามวันที่ทำรายการหรือวันที่จ่ายจริง เหมาะสำหรับตรวจเงินเข้าออก"}
            </p>
          </div>
          <div className="grid grid-cols-2 rounded-lg border border-emerald-100 bg-white p-1">
            {([
              ["budget", "รอบงบประมาณ"],
              ["transaction", "วันที่ทำรายการ"],
            ] as const).map(([basis, label]) => (
              <button
                key={basis}
                type="button"
                onClick={() => setAnalyticsBasis(basis)}
                className={`h-9 rounded-md px-3 text-xs font-bold transition-colors ${analyticsBasis === basis ? "bg-emerald-700 text-white" : "text-slate-500 hover:bg-emerald-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

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
                    +ยอดเยี่ยม
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

          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
          <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl group-hover:bg-indigo-400/30 transition-all duration-700" />
        </div>

        {/* Cashflow Summary Card */}
        <section className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden relative group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
              {analyticsBasis === "budget" ? "ภาพรวมรอบงบประมาณ" : "กระแสเงินสด"}
            </h3>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <TrendingUp size={18} className="text-indigo-600" />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
             <div className="flex-1 text-center p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">IN FLOW</p>
                <p className="text-lg font-black text-emerald-700">฿{summary?.totalIncome?.toLocaleString() || 0}</p>
             </div>
             
             <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg">
                  <ArrowRight size={16} />
                </div>
                <span className="text-[10px] font-black text-gray-400">
                  {summary?.totalIncome > 0 ? Math.floor((summary.totalExpense / summary.totalIncome) * 100) : 0}%
                </span>
             </div>

             <div className="flex-1 text-center p-4 bg-red-50 rounded-3xl border border-red-100">
                <p className="text-[10px] font-black text-red-600 uppercase mb-1">OUT FLOW</p>
                <p className="text-lg font-black text-red-700">฿{summary?.totalExpense?.toLocaleString() || 0}</p>
             </div>
          </div>
        </section>

        {/* Monthly Trends - Comparative */}
        <section className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="mb-8 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">เปรียบเทียบรายเดือน</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">ตาม{basisLabel}</span>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2 px-1">
            {isTrendsLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-200" size={32} />
              </div>
            ) : Array.isArray(trends) ? (
              trends.map((data: any) => {
                const maxVal = Math.max(...trends.flatMap((t: any) => [t.income, t.expense]), 1);
                const isCurrent = data.month === selectedMonth;
                
                return (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full relative flex items-end justify-center gap-[2px] h-32">
                      <div 
                        className={`w-1.5 rounded-full transition-all duration-700 ${isCurrent ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-100 group-hover:bg-emerald-300'}`}
                        style={{ height: `${(data.income / maxVal) * 100}%`, minHeight: data.income > 0 ? '4px' : '0px' }}
                      />
                      <div 
                        className={`w-1.5 rounded-full transition-all duration-700 ${isCurrent ? 'bg-red-500 shadow-sm' : 'bg-red-100 group-hover:bg-red-300'}`}
                        style={{ height: `${(data.expense / maxVal) * 100}%`, minHeight: data.expense > 0 ? '4px' : '0px' }}
                      />
                      
                      <div className="absolute -top-12 px-2 py-1 bg-gray-900 text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
                        In: ฿{data.income.toLocaleString()}<br/>
                        Out: ฿{data.expense.toLocaleString()}
                      </div>
                    </div>
                    <span className={`text-[9px] font-black ${isCurrent ? 'text-indigo-600' : 'text-gray-300'}`}>
                      {new Date(0, data.month - 1).toLocaleString('th-TH', { month: 'short' })}
                    </span>
                  </div>
                )
              })
            ) : null}
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">แบ่งตามหมวดหมู่ (100%)</h3>
              <p className="mt-1 text-xs font-medium text-gray-400">ตาม{basisLabel}ของเดือนที่เลือก</p>
            </div>
            
            <div className="flex p-1 bg-gray-100 rounded-2xl w-full sm:w-auto">
               <button 
                onClick={() => setActiveType("expense")}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${activeType === 'expense' ? 'bg-surface text-red-600 shadow-sm' : 'text-gray-400'}`}
               >
                 รายจ่าย
               </button>
               <button 
                onClick={() => setActiveType("income")}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${activeType === 'income' ? 'bg-surface text-emerald-600 shadow-sm' : 'text-gray-400'}`}
               >
                 รายรับ
               </button>
            </div>
          </div>

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
            ) : Array.isArray(breakdown) && breakdown.length > 0 ? (
              breakdown.map((item: any, idx: number) => {
                const totalBase = activeType === 'expense' ? summary?.totalExpense : summary?.totalIncome;
                const percentageOfTotal = totalBase > 0 ? Math.floor((item.value / totalBase) * 100) : 0;
                const scalePercentage = (item.value / maxVal) * 100;
                const barColor = activeType === 'expense' ? (item.color || '#ef4444') : (item.color || '#10b981');
                
                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {item.icon || "📦"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-800">{item.name}</span>
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${activeType === 'income' ? 'text-emerald-500' : 'text-red-400'}`}>
                            {percentageOfTotal}% ของ{activeType === 'income' ? 'รายรับ' : 'รายจ่าย'}ทั้งหมด
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-gray-900 tracking-tight">฿{item.value.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: barColor }} />
                           <span className="text-[10px] font-bold text-gray-300">Share</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ 
                          width: `${scalePercentage}%`,
                          backgroundColor: barColor
                        }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                  <PieChart size={24} className="text-gray-200" />
                </div>
                <p className="text-xs font-bold text-gray-400">ยังไม่มีข้อมูลในส่วนนี้</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
