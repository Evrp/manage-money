import { useEffect, useState } from "react";
import { CreditCard as CardIcon, Landmark, Plus, Save, WalletCards } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/layout/Layout";
import api from "../services/api";
import { CreditCard, useCreditCards } from "../hooks/useCreditCards";
import { CreditCardPaymentMode } from "@moneyflow/shared";
import CreditCardInterestDetails from "../components/ui/CreditCardInterestDetails";
import { useBankAccounts } from "../hooks/useBankAccounts";
import CreateBankAccountModal from "../components/ui/CreateBankAccountModal";

interface Statement {
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  availableCredit: number;
  dueDate: string;
  status: string;
  annualInterestRate: number;
  daysOverdue: number;
  accruedInterest: number;
  totalDue: number;
}

const money = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;

const CreditCardsPage = () => {
  const queryClient = useQueryClient();
  const { data: cards = [], isLoading, isError } = useCreditCards();
  const { data: bankAccounts = [], isLoading: isBankAccountsLoading } = useBankAccounts();
  const [selectedId, setSelectedId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showBankAccountForm, setShowBankAccountForm] = useState(false);
  const defaultForm = {
    name: "",
    issuer: "",
    last4: "",
    creditLimit: "",
    statementClosingDay: "25",
    paymentDueDay: "10",
    annualInterestRate: "25",
    color: "#1A1F36",
  };
  const [form, setForm] = useState(defaultForm);
  const current = new Date();
  const selected = cards.find((card) => card._id === selectedId) || cards[0];
  const { data: statement } = useQuery<Statement>({
    queryKey: [
      "credit-card-statement",
      selected?._id,
      current.getMonth() + 1,
      current.getFullYear(),
    ],
    enabled: Boolean(selected),
    queryFn: async () =>
      (
        await api.get(
          `/credit-cards/${selected._id}/statements?month=${current.getMonth() + 1}&year=${current.getFullYear()}`,
        )
      ).data,
  });
  useEffect(() => {
    setStatementDueDate("");
  }, [selected?._id, current.getMonth(), current.getFullYear()]);
  const create = useMutation({
    mutationFn: async () =>
      api.post("/credit-cards", {
        ...form,
        creditLimit: Number(form.creditLimit),
        statementClosingDay: Number(form.statementClosingDay),
        paymentDueDay: Number(form.paymentDueDay),
        annualInterestRate: Number(form.annualInterestRate),
      }),
    onSuccess: (response) => {
      const created = response.data;
      queryClient.setQueryData<CreditCard[]>(["credit-cards"], (old = []) =>
        old.some((card) => card._id === created._id) ? old : [...old, created],
      );
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      setShowForm(false);
      setForm(defaultForm);
    },
  });
  const [payment, setPayment] = useState("");
  const [statementDueDate, setStatementDueDate] = useState("");
  const [paymentMode, setPaymentMode] = useState<CreditCardPaymentMode>(
    CreditCardPaymentMode.FULL,
  );
  const pay = useMutation({
    mutationFn: async () =>
      api.post(`/credit-cards/${selected._id}/payments`, {
        statementMonth: current.getMonth() + 1,
        statementYear: current.getFullYear(),
        amount: Number(payment),
        mode: paymentMode,
        paidAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      setPayment("");
      queryClient.invalidateQueries({ queryKey: ["credit-card-statement"] });
    },
  });
  const updateDueDate = useMutation({
    mutationFn: async () =>
      api.put(
        `/credit-cards/${selected._id}/statements/${current.getFullYear()}/${current.getMonth() + 1}`,
        { dueDate: statementDueDate },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-statement"] });
    },
  });

  return (
    <Layout>
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Payment instruments
            </p>
            <h1 className="text-2xl font-black">ช่องทางชำระเงิน</h1>
            <p className="text-sm text-gray-500 mt-2">
              จัดการบัญชีธนาคาร บัตรเครดิต และการชำระเงินในที่เดียว
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBankAccountForm(true)}
              aria-label="เพิ่มบัญชีธนาคาร"
              title="เพิ่มบัญชีธนาคาร"
              className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <Landmark size={20} />
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              aria-label={showForm ? "ปิดฟอร์มเพิ่มบัตร" : "เพิ่มบัตรเครดิต"}
              aria-expanded={showForm}
              title="เพิ่มบัตรเครดิต"
              className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>
        {showBankAccountForm && (
          <CreateBankAccountModal
            onClose={() => setShowBankAccountForm(false)}
            onCreated={() => setShowBankAccountForm(false)}
          />
        )}
        {showForm && (
          <div className="bg-surface rounded-3xl p-5 space-y-3 shadow-sm">
            <h2 className="font-black">เพิ่มบัตร (เก็บเฉพาะเลขท้าย 4 ตัว)</h2>
            {[
              ["name", "ชื่อบัตร"],
              ["issuer", "ธนาคาร/ผู้ออกบัตร"],
              ["last4", "เลขท้าย 4 ตัว"],
              ["creditLimit", "วงเงิน"],
              ["annualInterestRate", "ดอกเบี้ยต่อปี (%)"],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm text-gray-600">
                <span className="block mb-2">{label}</span>
                <input
                  placeholder={label}
                  value={(form as any)[key]}
                  maxLength={key === "last4" ? 4 : undefined}
                  type={
                    key === "creditLimit" || key === "annualInterestRate"
                      ? "number"
                      : "text"
                  }
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-gray-50 rounded-2xl p-3 font-bold"
                />
              </label>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                aria-label="วันตัดรอบ"
                min="1"
                max="31"
                value={form.statementClosingDay}
                onChange={(e) =>
                  setForm({ ...form, statementClosingDay: e.target.value })
                }
                className="bg-gray-50 rounded-2xl p-3"
                placeholder="วันตัดรอบ"
              />
              <input
                type="number"
                min="1"
                max="31"
                value={form.paymentDueDay}
                aria-label="วันครบกำหนด"
                onChange={(e) =>
                  setForm({ ...form, paymentDueDay: e.target.value })
                }
                className="bg-gray-50 rounded-2xl p-3"
                placeholder="วันครบกำหนด"
              />
            </div>
            <button
              disabled={create.isPending}
              onClick={() => create.mutate()}
              className="w-full bg-indigo-600 text-white rounded-2xl p-3 font-black"
            >
              <Save size={16} className="inline mr-2" />
              บันทึกบัตร
            </button>
          </div>
        )}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-black text-slate-900">บัญชีธนาคาร</h2>
              <p className="mt-1 text-sm text-slate-500">เลือกบัญชีนี้ได้เมื่อบันทึกรายจ่าย</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBankAccountForm(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-emerald-700 hover:bg-emerald-50"
              aria-label="เพิ่มบัญชีธนาคาร"
              title="เพิ่มบัญชีธนาคาร"
            >
              <Plus size={18} />
            </button>
          </div>
          {isBankAccountsLoading ? (
            <p className="text-sm text-slate-400">กำลังโหลดบัญชี...</p>
          ) : bankAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
              ยังไม่มีบัญชีธนาคาร
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {bankAccounts.map((account) => (
                <div key={account._id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Landmark size={19} /></span>
                  <span className="min-w-0"><strong className="block truncate text-sm text-slate-900">{account.name}</strong><small className="block truncate text-slate-500">{account.bankName}{account.last4 ? ` · ••••${account.last4}` : ""}</small></span>
                </div>
              ))}
            </div>
          )}
        </section>
        {isLoading && <p className="text-gray-400">กำลังโหลด...</p>}
        {isError && (
          <p className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
            โหลดข้อมูลบัตรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </p>
        )}
        {!isLoading && !isError && cards.length === 0 && (
          <div className="bg-surface rounded-3xl p-8 text-center text-gray-400">
            <WalletCards className="mx-auto mb-2" />
            ยังไม่มีบัตรเครดิต
            <p className="text-sm mt-2 mb-4">
              เพิ่มบัตรเพื่อดูวงเงิน ยอดค้าง และวันครบกำหนด
            </p>
            <button
              className="primary-button"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              เพิ่มบัตรใบแรก
            </button>
          </div>
        )}
        {cards.length > 0 && (
          <>
            <div className="credit-card-grid">
              {cards.map((card: CreditCard) => (
                <button
                  key={card._id}
                  onClick={() => setSelectedId(card._id)}
                  aria-pressed={selected?._id === card._id}
                  className={`min-w-[220px] text-left rounded-3xl p-5 text-white shadow-lg ${selected?._id === card._id ? "ring-4 ring-indigo-200" : ""}`}
                  style={{ backgroundColor: card.color }}
                >
                  <CardIcon size={22} />
                  <p className="mt-5 font-black">{card.name}</p>
                  <p className="text-sm opacity-80">
                    {card.issuer} •••• {card.last4}
                  </p>
                </button>
              ))}
            </div>
            {statement && (
              <div className="bg-surface rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-bold">
                      ยอดรอบปัจจุบัน
                    </p>
                    <p className="text-2xl font-black">
                      {money(statement.totalDue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ต้นเงิน {money(statement.outstandingAmount)} + ดอกเบี้ย{" "}
                      {money(statement.accruedInterest)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold">ครบกำหนด</p>
                    <p className="font-bold">
                      {new Date(statement.dueDate).toLocaleDateString("th-TH")}
                    </p>
                    <p className="text-xs text-amber-600">
                      ค้าง {statement.daysOverdue} วัน · APR{" "}
                      {statement.annualInterestRate}%
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    วันครบกำหนดจากใบแจ้งยอด
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      aria-label="วันครบกำหนดจากใบแจ้งยอด"
                      value={
                        statementDueDate ||
                        new Date(statement.dueDate).toISOString().slice(0, 10)
                      }
                      onChange={(e) => setStatementDueDate(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl bg-surface p-2 text-sm"
                    />
                    <button
                      onClick={() => updateDueDate.mutate()}
                      disabled={updateDueDate.isPending}
                      className="rounded-xl bg-gray-900 px-3 text-xs font-bold text-white"
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
                <CreditCardInterestDetails
                  annualRate={statement.annualInterestRate}
                  daysOverdue={statement.daysOverdue}
                  principal={statement.outstandingAmount}
                  interest={statement.accruedInterest}
                  totalDue={statement.totalDue}
                />
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600"
                    style={{
                      width: `${Math.min(100, (statement.outstandingAmount / (selected.creditLimit || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  ใช้ได้อีก {money(statement.availableCredit)} · ชำระแล้ว{" "}
                  {money(statement.paidAmount)}
                </p>
                {statement.outstandingAmount > 0 && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setPaymentMode(CreditCardPaymentMode.FULL);
                          setPayment(String(statement.totalDue.toFixed(2)));
                        }}
                        className={`rounded-2xl p-3 text-sm font-bold border-2 ${paymentMode === CreditCardPaymentMode.FULL ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-100 text-gray-500"}`}
                      >
                        จ่ายเต็ม
                      </button>
                      <button
                        onClick={() => {
                          setPaymentMode(CreditCardPaymentMode.PARTIAL);
                          setPayment("");
                        }}
                        className={`rounded-2xl p-3 text-sm font-bold border-2 ${paymentMode === CreditCardPaymentMode.PARTIAL ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-100 text-gray-500"}`}
                      >
                        แบ่งชำระ
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0.01"
                        max={statement.totalDue}
                        value={payment}
                        onChange={(e) => setPayment(e.target.value)}
                        placeholder="จำนวนเงินที่ชำระ"
                        className="flex-1 bg-gray-50 rounded-2xl p-3"
                      />
                      <button
                        disabled={!payment || pay.isPending}
                        onClick={() => pay.mutate()}
                        className="px-4 rounded-2xl bg-emerald-600 text-white font-black"
                      >
                        ชำระ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default CreditCardsPage;
