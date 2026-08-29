import { useState } from 'react';

interface CreditCardInterestDetailsProps {
  annualRate: number;
  daysOverdue: number;
  principal: number;
  interest: number;
  totalDue: number;
}

const money = (value: number) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

export default function CreditCardInterestDetails({ annualRate, daysOverdue, principal, interest, totalDue }: CreditCardInterestDetailsProps) {
  const [open, setOpen] = useState(false);
  return <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
    <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left text-sm font-black text-amber-900">
      <span>ดูรายละเอียดดอกเบี้ยโดยประมาณ</span><span aria-hidden>{open ? '−' : '+'}</span>
    </button>
    {open && <div className="mt-3 space-y-2 text-xs text-amber-900">
      <div className="flex justify-between"><span>อัตราดอกเบี้ยต่อปี</span><strong>{annualRate}%</strong></div>
      <div className="flex justify-between"><span>วันที่ค้างชำระ</span><strong>{daysOverdue} วัน</strong></div>
      <div className="flex justify-between"><span>ยอดต้นคงค้าง</span><strong>{money(principal)}</strong></div>
      <div className="flex justify-between"><span>ดอกเบี้ยสะสม</span><strong>{money(interest)}</strong></div>
      <div className="border-t border-amber-200 pt-2 flex justify-between font-black"><span>ยอดที่ควรชำระ</span><strong>{money(totalDue)}</strong></div>
      <p className="pt-1 leading-relaxed text-amber-800/80">คำนวณประมาณการจากยอดคงค้าง × ({annualRate}% ÷ 365) × จำนวนวันที่ค้างชำระ ยอดจริงอาจแตกต่างตามธนาคาร</p>
    </div>}
  </div>;
}
