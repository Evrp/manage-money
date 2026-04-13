import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onChange, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const renderDays = () => {
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
      const isSelected = 
        day === selectedDate.getDate() && 
        month === selectedDate.getMonth() && 
        year === selectedDate.getFullYear();
      
      const isToday = 
        day === new Date().getDate() && 
        month === new Date().getMonth() && 
        year === new Date().getFullYear();

      days.push(
        <button
          key={day}
          onClick={() => {
            onChange(new Date(year, month, day));
            onClose();
          }}
          className={`h-10 w-10 flex items-center justify-center rounded-2xl text-sm font-bold transition-all
            ${isSelected 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' 
              : isToday 
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-gray-100 w-full max-w-[320px] animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h3 className="font-black text-gray-800 text-lg leading-tight">{monthNames[month]}</h3>
          <p className="text-gray-400 text-xs font-bold">{year + 543}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={handlePrevMonth} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNextMonth} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-[10px] font-black text-gray-300 uppercase letter tracking-widest">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>

      <button 
        onClick={() => {
          onChange(new Date());
          onClose();
        }}
        className="w-full mt-6 py-3 bg-gray-50 text-gray-400 text-xs font-bold rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
      >
        กลับไปวันปัจจุบัน
      </button>
    </div>
  );
};

export default Calendar;
