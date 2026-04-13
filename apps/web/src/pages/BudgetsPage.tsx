import React, { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import { Target, AlertCircle, Edit2, Calendar, X, Loader2, Save, Plus, Receipt } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import CreateCategoryModal from '../components/ui/CreateCategoryModal';
import MonthYearPicker from '../components/ui/MonthYearPicker';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLimit, setNewLimit] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (vars: any) => {
      await api.post('/categories', { ...vars, type: 'expense' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowCreateModal(false);
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
    if (!Array.isArray(budgets)) return { actualSpent: 0, budgetedSpent: 0, limit: 0, percent: 0 };
    
    const actualSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
    const budgetedItems = budgets.filter(b => b.limitAmount > 0);
    const budgetedSpent = budgetedItems.reduce((acc, b) => acc + b.spentAmount, 0);
    const limit = budgetedItems.reduce((acc, b) => acc + b.limitAmount, 0);
    const percent = limit > 0 ? (budgetedSpent / limit) * 100 : 0;
    
    return { actualSpent, budgetedSpent, limit, percent };
  }, [budgets]);

  const budgetedBudgets = Array.isArray(budgets) ? budgets.filter(b => b.limitAmount > 0) : [];
  const unbudgetedBudgets = Array.isArray(budgets) ? budgets.filter(b => b.limitAmount === 0) : [];

  const handleEditLimit = (budget: Budget) => {
    setEditingBudget(budget);
    setNewLimit(budget.limitAmount === 0 ? '' : budget.limitAmount.toString());
  };

  const onSaveLimit = () => {
    if (!editingBudget) return;
    updateLimitMutation.mutate({
      categoryId: editingBudget.categoryId._id,
      limit: parseFloat(newLimit) || 0, // Fallback to 0 if blank (Unlimited)
    });
  };

  const handleCreateCategory = (data: any) => {
    createCategoryMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center px-1">
          <h1 className="text-2xl font-black">งบประมาณ</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-90"
            >
              <Plus size={20} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowDatePicker(true)}
                className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
              >
                <Calendar size={20} />
              </button>
              
              {showDatePicker && (
                <div 
                  className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowDatePicker(false)}
                >
                  <div onClick={e => e.stopPropagation()}>
                    <MonthYearPicker 
                      selectedDate={dateObj}
                      onChange={(date) => {
                        const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
                        setSelectedDate(dateStr);
                      }}
                      onClose={() => setShowDatePicker(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Create Category Modal */}
        {showCreateModal && (
          <CreateCategoryModal 
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateCategory}
          />
        )}

        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Actual Spending Card (All Expenses) */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">รายจ่ายจริงทั้งหมดในเดือนนี้</p>
              <h3 className="text-3xl font-black text-gray-800">฿{totals.actualSpent.toLocaleString()}</h3>
            </div>
            <div className="absolute -right-4 -bottom-4 text-gray-50 group-hover:text-indigo-50/50 transition-colors">
              <Receipt size={120} />
            </div>
          </div>

          {/* 2. Budget Progress Card (Planned Expenses) */}
          <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-2">การใช้จ่ายเปรียบเทียบกับงบ</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-black font-sans">฿{totals.budgetedSpent.toLocaleString()}</span>
                {totals.limit > 0 && <span className="text-indigo-200 text-lg">/ ฿{totals.limit.toLocaleString()}</span>}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>
                    {totals.limit > 0 
                      ? `ใช้ไปแล้ว ${Math.round(totals.percent)}% ของงบประมาณที่ตั้งไว้`
                      : 'ยังไม่ได้ตั้งเป้าหมายงบประมาณ'}
                  </span>
                </div>
                {totals.limit > 0 && (
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${totals.percent > 90 ? 'bg-red-400' : 'bg-white'}`} 
                      style={{ width: `${Math.min(totals.percent, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            <Target className="absolute -right-4 -bottom-4 text-indigo-500/30" size={120} />
          </div>
        </section>

        {/* Category Budgets */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-bold text-lg">แยกตามหมวดหมู่</h2>
            <Target className="text-gray-300" size={18} />
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center py-20 opacity-30"><Loader2 className="animate-spin mb-2" /></div>
          ) : budgetedBudgets.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-gray-400 flex flex-col items-center gap-2">
              <AlertCircle size={32} strokeWidth={1.5} />
              <p className="font-bold">ยังไม่ได้ตั้งเป้าหมายหมวดหมู่</p>
              <p className="text-xs">เลือกหมวดหมู่ด้านล่างเพื่อกำหนดงบประมาณ</p>
            </div>
          ) : (
            budgetedBudgets.map((b) => {
              const hasLimit = b.limitAmount > 0;
              const percent = hasLimit ? (b.spentAmount / b.limitAmount) * 100 : 0;
              const isDanger = hasLimit && percent >= 90;
              
              return (
                <div key={b._id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-all">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${!hasLimit ? 'bg-gray-300' : isDanger ? 'bg-red-500' : 'bg-indigo-300'}`}></div>
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
                      <span className={`font-black ${hasLimit ? 'text-indigo-600' : 'text-gray-300 italic'}`}>
                        {hasLimit ? `฿${b.limitAmount.toLocaleString()}` : 'ไม่จำกัดงบ'}
                      </span>
                    </div>
                  </div>
                  
                  {hasLimit && (
                    <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-indigo-400'}`} 
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                    </div>
                  )}

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

          {/* Unbudgeted Categories */}
          {unbudgetedBudgets.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
               <div className="flex justify-between items-center mb-4 px-2">
                 <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest">หมวดหมู่ที่ยังไม่ได้ตั้งงบ</h3>
                 <span className="text-[10px] font-bold text-gray-300">{unbudgetedBudgets.length} หมวดหมู่</span>
               </div>
               <div className="grid grid-cols-2 gap-3 pb-8">
                  {unbudgetedBudgets.map((b) => (
                    <button 
                      key={b._id}
                      onClick={() => handleEditLimit(b)}
                      className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all group"
                    >
                      <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600 transition-colors truncate">
                        {b.categoryId?.name || 'อื่นๆ'}
                      </span>
                      <Edit2 size={12} className="text-gray-300 group-hover:text-indigo-400" />
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Limit Modal */}
      {editingBudget && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingBudget(null);
          }}
        >
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
