import React, { useState } from "react";
import { Landmark, Loader2, X } from "lucide-react";
import { useCreateBankAccount } from "../../hooks/useBankAccounts";

export default function CreateBankAccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (accountId: string) => void;
}) {
  const [form, setForm] = useState({ name: "", bankName: "", last4: "" });
  const create = useCreateBankAccount();
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.bankName.trim()) {
      setError("กรอกชื่อบัญชีและธนาคารให้ครบ");
      return;
    }
    if (form.last4 && !/^\d{4}$/.test(form.last4)) {
      setError("เลขท้ายบัญชีต้องเป็นตัวเลข 4 หลัก");
      return;
    }
    create.mutate(
      { name: form.name.trim(), bankName: form.bankName.trim(), last4: form.last4 || undefined },
      { onSuccess: (account) => onCreated(account._id), onError: () => setError("เพิ่มบัญชีไม่สำเร็จ") },
    );
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end bg-black/55 p-0 sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <form className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Landmark size={20} /></span><h2 className="font-black text-slate-900">เพิ่มบัญชีธนาคาร</h2></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="ปิด"><X size={19} /></button>
        </div>
        <div className="space-y-3">
          <input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="ชื่อเรียกบัญชี เช่น เงินเดือน" maxLength={60} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-indigo-500" />
          <input value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} placeholder="ธนาคาร เช่น KBank" maxLength={60} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-indigo-500" />
          <input value={form.last4} onChange={(event) => setForm({ ...form, last4: event.target.value.replace(/\D/g, "").slice(0, 4) })} inputMode="numeric" placeholder="เลขท้ายบัญชี 4 หลัก (ไม่บังคับ)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-indigo-500" />
        </div>
        {error && <p className="mt-3 text-xs font-bold text-rose-600">{error}</p>}
        <button type="submit" disabled={create.isPending} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{create.isPending && <Loader2 size={17} className="animate-spin" />}บันทึกบัญชี</button>
      </form>
    </div>
  );
}
