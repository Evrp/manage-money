import React, { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import { Target, AlertCircle, Edit2, Calendar, X, Loader2, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface Category {
  _id: string;
  name: string;
}

interface Budget {
  _id: string;
  categoryId: Category;
  limitAmount: number;
  spentAmount: number;
  month: number;
  year: number;
}

const BudgetsPage = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newLimit, setNewLimit] = useState<string>('');

  const dateObj = new Date(selectedDate);
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  // Fetch budgets
  const { data: budgets, isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets', month, year],
    queryFn: async () => {
      const { data } = await api.get(`/budgets?month=${month}&year=${year}`);
      return data;
    },
  });

  // Update limit mutation
  const updateLimitMutation = useMutation({
    mutationFn: async (vars: { categoryId: string; limit: number }) => {
      await api.put('/budgets/limit', {
        categoryId: vars.categoryId,
        month,
        year,
        limitAmount: vars.limit,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setEditingBudget(null);
    },
  });

  const totals = useMemo(() => {
    if (!budgets) return { spent: 0, limit: 0, percent: 0 };
    const spent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
    const limit = budgets.reduce((acc, b) => acc + b.limitAmount, 0);
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    return { spent, limit, percent };
  }, [budgets]);

  const handleEditLimit = (budget: Budget) => {
    setEditingBudget(budget);
    setNewLimit(budget.limitAmount.toString());
  };

  const onSaveLimit = () => {
    if (!editingBudget || !newLimit) return;
    updateLimitMutation.mutate({
      categoryId: editingBudget.categoryId._id,
      limit: parseFloat(newLimit),
    });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">งบประมาณ</h1>
          <div className="relative">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
            <button className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm text-gray-500 transition-colors pointer-events-none">
              <Calendar size={20} />
            </button>
          </div>
        </header>

        {/* Global Progress Card */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-50/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">การใช้จ่ายทั้งหมด</h2>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl">
              {dateObj.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-indigo-300" /></div>
          ) : (
            <>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-3xl font-black">฿{totals.spent.toLocaleString()}</p>
                    <p className="text-gray-300 font-bold mb-1">/</p>
                    <p className="text-gray-400 font-bold text-sm mb-1">฿{totals.limit.toLocaleString()}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tight">ใช้ไปแล้ว {Math.round(totals.percent)}% ของงบทั้งหมด</p>
                </div>
              </div>
              <div className="w-full h-4 bg-gray-100/50 rounded-full overflow-hidden p-1">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${totals.percent > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'}`} 
                  style={{ width: `${Math.min(totals.percent, 100)}%` }}
                ></div>
              </div>
            </>
          )}
        </section>

        {/* Category Budgets */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-bold text-lg">แยกตามหมวดหมู่</h2>
            <Target className="text-gray-300" size={18} />
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center py-20 opacity-30"><Loader2 className="animate-spin mb-2" /></div>
          ) : budgets?.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm">ไม่พบงบประมาณในเดือนนี้</div>
          ) : (
            budgets?.map((b) => {
              const percent = b.limitAmount > 0 ? (b.spentAmount / b.limitAmount) * 100 : 0;
              const isDanger = percent >= 90;
              
              return (
                <div key={b._id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-all">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isDanger ? 'bg-red-500' : 'bg-indigo-300'}`}></div>
                      <span className="font-bold text-gray-700">{b.categoryId?.name || 'อื่นๆ'}</span>
                    </div>
                    <button 
                      onClick={() => handleEditLimit(b)}
                      className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end mb-3 text-sm">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-0.5 uppercase tracking-tighter">ใช้ไปแล้ว</span>
                      <span className="font-black text-gray-700">฿{b.spentAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 block mb-0.5 uppercase tracking-tighter">งบประมาณ</span>
                      <span className="font-black text-indigo-600">฿{b.limitAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-indigo-400'}`} 
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    ></div>
                  </div>

                  {isDanger && (
                    <div className="flex items-center gap-2 mt-4 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                      <AlertCircle size={12} />
                      <span>เกินงบประมาณที่กำหนด!</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Limit Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">แก้ไขงบประมาณ</span>
                <button 
                  onClick={() => setEditingBudget(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-10 text-center">
                <h3 className="text-2xl font-black mb-2">{editingBudget.categoryId?.name}</h3>
                <p className="text-sm text-gray-400 font-medium">ตั้งเป้างบประมาณที่คุณต้องการต่อเดือน</p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-200">฿</span>
                  <input 
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    autoFocus
                    className="w-full pl-12 pr-6 py-6 bg-gray-50 rounded-3xl border-none focus:ring-4 focus:ring-indigo-100 transition-all text-2xl font-black text-center"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex gap-3">
              <button 
                onClick={() => setEditingBudget(null)}
                className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={onSaveLimit}
                disabled={updateLimitMutation.isPending}
                className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updateLimitMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BudgetsPage;
