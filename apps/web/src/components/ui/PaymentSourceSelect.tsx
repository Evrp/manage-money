import React from "react";
import { Landmark } from "lucide-react";
import { PaymentMethod } from "@moneyflow/shared";
import { useBankAccounts } from "../../hooks/useBankAccounts";
import { useCreditCards } from "../../hooks/useCreditCards";

type Props = {
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  creditCardId?: string;
  onChange: (value: Pick<Props, "paymentMethod" | "bankAccountId" | "creditCardId">) => void;
  onAddBankAccount?: () => void;
};

export default function PaymentSourceSelect({
  paymentMethod = PaymentMethod.CASH,
  bankAccountId = "",
  creditCardId = "",
  onChange,
  onAddBankAccount,
}: Props) {
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: creditCards = [] } = useCreditCards();
  const value =
    paymentMethod === PaymentMethod.BANK_TRANSFER
      ? `bank:${bankAccountId}`
      : paymentMethod === PaymentMethod.CREDIT_CARD
        ? `card:${creditCardId}`
        : "cash";

  return (
    <div className="min-w-0 space-y-2">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
        ชำระด้วย
      </label>
      <select
          value={value}
          onChange={(event) => {
            const selected = event.target.value;
            if (selected === "cash") {
              onChange({ paymentMethod: PaymentMethod.CASH, bankAccountId: "", creditCardId: "" });
              return;
            }
            const [kind, id] = selected.split(":");
            onChange({
              paymentMethod: kind === "bank" ? PaymentMethod.BANK_TRANSFER : PaymentMethod.CREDIT_CARD,
              bankAccountId: kind === "bank" ? id : "",
              creditCardId: kind === "card" ? id : "",
            });
          }}
          className="block min-h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="cash">เงินสด</option>
          {bankAccounts.length > 0 && (
            <optgroup label="บัญชีธนาคาร">
              {bankAccounts.map((account) => (
                <option key={account._id} value={`bank:${account._id}`}>
                  {account.name} · {account.bankName}{account.last4 ? ` ••••${account.last4}` : ""}
                </option>
              ))}
            </optgroup>
          )}
          {creditCards.length > 0 && (
            <optgroup label="บัตรเครดิต">
              {creditCards.map((card) => (
                <option key={card._id} value={`card:${card._id}`}>
                  {card.name} ••••{card.last4}
                </option>
              ))}
            </optgroup>
          )}
      </select>
      {paymentMethod === PaymentMethod.BANK_TRANSFER && !bankAccountId && (
        <p className="text-xs font-bold text-rose-600">กรุณาเลือกบัญชีที่ใช้ชำระ</p>
      )}
      {paymentMethod === PaymentMethod.CREDIT_CARD && !creditCardId && (
        <p className="text-xs font-bold text-rose-600">กรุณาเลือกบัตรเครดิตที่ใช้ชำระ</p>
      )}
      {bankAccounts.length === 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Landmark size={13} />
          <span>ยังไม่มีบัญชีธนาคาร</span>
          {onAddBankAccount && (
            <button
              type="button"
              onClick={onAddBankAccount}
              className="font-bold text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
            >
              เพิ่มบัญชีธนาคาร
            </button>
          )}
        </div>
      )}
    </div>
  );
}
