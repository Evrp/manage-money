import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthYearPickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ selectedDate, onChange, onClose }) => {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  
  const monthNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const handlePrevYear = () => setViewYear(prev => prev - 1);
  const handleNextYear = () => setViewYear(prev => prev + 1);

  return (
    <div className="bg-white rounded-[2.5rem] p-7 shadow-2xl border border-gray-100 w-full max-w-[320px] animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-8 px-1">
        <h3 className="font-black text-gray-800 text-xl leading-tight">เลือกเดือน</h3>
        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button onClick={handlePrevYear} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl transition-all">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-black text-gray-700 w-16 text-center">{viewYear + 543}</span>
          <button onClick={handleNextYear} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {monthNames.map((name, index) => {
          const isSelected = index === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();
          const isCurrentMonth = index === new Date().getMonth() && viewYear === new Date().getFullYear();

          return (
            <button
              key={name}
              onClick={() => {
                onChange(new Date(viewYear, index, 1));
                onClose();
              }}
              className={`h-14 rounded-2xl text-sm font-bold transition-all border-2
                ${isSelected 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' 
                  : isCurrentMonth 
                    ? 'bg-white border-indigo-100 text-indigo-600 font-black' 
                    : 'bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-100'
                }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      <button 
        onClick={onClose}
        className="w-full mt-8 py-4 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
      >
        ยกเลิก
      </button>
    </div>
  );
};

export default MonthYearPicker;
