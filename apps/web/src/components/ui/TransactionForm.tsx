import React, { useState } from 'react';
import { CategoryType } from '@moneyflow/shared';
import { X, Calendar, DollarSign, Tag } from 'lucide-react';

interface TransactionFormProps {
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  title?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ initialData, onClose, onSubmit, title = 'บันทึกรายการ' }) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || CategoryType.EXPENSE,
    amount: initialData?.amount || '',
    categoryId: initialData?.categoryId || '',
    note: initialData?.note || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setFormData({ ...formData, type: CategoryType.EXPENSE })}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                formData.type === CategoryType.EXPENSE ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              รายจ่าย
            </button>
            <button
              onClick={() => setFormData({ ...formData, type: CategoryType.INCOME })}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                formData.type === CategoryType.INCOME ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              รายรับ
            </button>
          </div>

          {/* Amount Input */}
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors">
              <DollarSign size={24} />
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-gray-50 border-none rounded-3xl py-6 pl-16 pr-6 text-3xl font-black focus:ring-4 focus:ring-indigo-500/10 placeholder:text-gray-300 transition-all text-indigo-600"
            />
          </div>

          {/* Category Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">หมวดหมู่</label>
            <div className="grid grid-cols-4 gap-3">
              {['อาหาร', 'เดินทาง', 'ช้อปปิ้ง', 'อื่นๆ'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormData({ ...formData, categoryId: cat })}
                  className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${
                    formData.categoryId === cat 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-0"
              />
            </div>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="โน้ต..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-0"
              />
            </div>
          </div>

          <button
            onClick={() => onSubmit(formData)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95 mt-4"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
