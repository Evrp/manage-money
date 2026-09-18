import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  ariaLabel: string;
  clearable?: boolean;
  className?: string;
};

const toDate = (value?: string) =>
  value ? new Date(`${value}T12:00:00`) : undefined;

const toValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const sameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

export default function DatePickerField({
  value = "",
  onChange,
  min,
  max,
  placeholder = "เลือกวันที่",
  ariaLabel,
  clearable = true,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = toDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selected || new Date());

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [viewDate]);

  const minDate = toDate(min);
  const maxDate = toDate(max);
  const monthLabel = new Intl.DateTimeFormat("th-TH", {
    month: "long",
    year: "numeric",
  }).format(viewDate);
  const selectedLabel = selected
    ? new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(selected)
    : placeholder;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => {
          setViewDate(selected || new Date());
          setIsOpen((open) => !open);
        }}
        className={`flex h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm font-bold outline-none transition-colors focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100 ${selected ? "border-slate-200 bg-slate-50 text-slate-800" : "border-dashed border-slate-300 bg-white text-slate-400 hover:border-indigo-300"}`}
      >
        <CalendarDays size={16} className={selected ? "text-indigo-600" : "text-slate-400"} />
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[170] w-[min(320px,calc(100vw-32px))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/15">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="เดือนก่อน"><ChevronLeft size={19} /></button>
            <strong className="text-sm text-slate-900">{monthLabel}</strong>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="เดือนถัดไป"><ChevronRight size={19} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day, index) => <span key={`${day}-${index}`} className="grid h-8 place-items-center">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const isCurrentMonth = date.getMonth() === viewDate.getMonth();
              const disabled = (minDate && date < minDate) || (maxDate && date > maxDate);
              const isSelected = selected && sameDay(date, selected);
              const isToday = sameDay(date, new Date());
              return (
                <button
                  key={toValue(date)}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(toValue(date));
                    setIsOpen(false);
                  }}
                  className={`grid h-9 place-items-center rounded-lg text-sm font-bold transition-colors ${isSelected ? "bg-indigo-600 text-white shadow-sm" : isToday ? "bg-indigo-50 text-indigo-700" : isCurrentMonth ? "text-slate-800 hover:bg-slate-100" : "text-slate-400 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-bold">
            {clearable ? <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className="text-slate-500 hover:text-rose-600">ล้าง</button> : <span />}
            <button type="button" onClick={() => { const today = new Date(); if ((!minDate || today >= minDate) && (!maxDate || today <= maxDate)) { onChange(toValue(today)); setIsOpen(false); } }} className="text-indigo-700 hover:text-indigo-900">วันนี้</button>
          </div>
        </div>
      )}
    </div>
  );
}
