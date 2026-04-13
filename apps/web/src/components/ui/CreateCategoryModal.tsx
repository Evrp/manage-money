import React, { useState } from 'react';
import { X, Save, Box } from 'lucide-react';

interface CreateCategoryModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; icon: string; color: string; monthlyLimit: number }) => void;
}

const ICONS = ['🍔', '🚗', '🏠', '🛍️', '🎬', '🏥', '📚', '💡', '💰', '📦', '🎁', '🎮', '🏋️', '🐈', '☕'];
const COLORS = ['#FF9500', '#5856D6', '#AF52DE', '#FF2D55', '#FFCC00', '#34C759', '#007AFF', '#5AC8FA', '#8E8E93'];

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#8E8E93');
  const [limit, setLimit] = useState('');

  const handleSave = () => {
    if (!name) return alert('กรุณาระบุชื่อหมวดหมู่');
    onSubmit({
      name,
      icon,
      color,
      monthlyLimit: parseFloat(limit) || 0,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">สร้างหมวดหมู่ใหม่</span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Icon & Color Selector */}
            <div className="flex justify-center items-center gap-6 mb-8">
              <div 
                className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner transition-colors"
                style={{ backgroundColor: color + '15', color: color }}
              >
                {icon}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">ชื่อหมวดหมู่</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ค่าขนมแมว..."
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-gray-700"
              />
            </div>

            {/* Limit Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">งบประมาณต่อเดือน (฿)</label>
              <input 
                type="number" 
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="0.00"
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-gray-700"
              />
            </div>

            {/* Icons Grid */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">เลือกไอคอน</label>
              <div className="flex flex-wrap gap-2 justify-center">
                {ICONS.map(i => (
                  <button 
                    key={i} 
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${icon === i ? 'bg-indigo-600 shadow-lg scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

             {/* Colors Grid */}
             <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">เลือกสี</label>
              <div className="flex flex-wrap gap-2 justify-center">
                {COLORS.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full transition-all hover:scale-125"
                    style={{ backgroundColor: c, border: color === c ? '3px solid white' : 'none', boxShadow: color === c ? '0 0 10px ' + c : 'none' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            สร้างหมวดหมู่
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryModal;
