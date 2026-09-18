import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
};

const monthNames = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const parseMonth = (value?: string) => {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  return match ? { year: Number(match[1]), month: Number(match[2]) - 1 } : undefined;
};

export default function MonthPickerField({
  value = "",
  onChange,
  ariaLabel,
  placeholder = "เลือกเดือน",
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = parseMonth(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.year || new Date().getFullYear());
  const selectedLabel = selected
    ? new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(selected.year, selected.month, 1))
    : placeholder;

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => {
          setViewYear(selected?.year || new Date().getFullYear());
          setIsOpen((open) => !open);
        }}
        className="flex h-11 w-full items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 text-left text-sm font-bold text-indigo-950 outline-none transition-colors hover:border-indigo-300 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100"
      >
        <CalendarDays size={16} className="text-indigo-700" />
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[170] w-[min(320px,calc(100vw-32px))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/15">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => setViewYear((year) => year - 1)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="ปีก่อน"><ChevronLeft size={19} /></button>
            <strong className="text-sm text-slate-900">พ.ศ. {viewYear + 543}</strong>
            <button type="button" onClick={() => setViewYear((year) => year + 1)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="ปีถัดไป"><ChevronRight size={19} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((monthName, month) => {
              const isSelected = selected?.year === viewYear && selected.month === month;
              const isCurrent = new Date().getFullYear() === viewYear && new Date().getMonth() === month;
              return (
                <button
                  key={monthName}
                  type="button"
                  onClick={() => {
                    onChange(`${viewYear}-${String(month + 1).padStart(2, "0")}`);
                    setIsOpen(false);
                  }}
                  className={`h-11 rounded-lg text-sm font-bold transition-colors ${isSelected ? "bg-indigo-600 text-white shadow-sm" : isCurrent ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {monthName}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-sm font-bold">
            <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className="text-slate-500 hover:text-rose-600">ล้าง</button>
            <button type="button" onClick={() => { const today = new Date(); onChange(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`); setIsOpen(false); }} className="text-indigo-700 hover:text-indigo-900">เดือนนี้</button>
          </div>
        </div>
      )}
    </div>
  );
}
