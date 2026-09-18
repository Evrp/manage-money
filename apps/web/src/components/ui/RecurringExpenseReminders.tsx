import React, { useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  WalletCards,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";

type Category = { _id: string; name: string; icon?: string };
type Reminder = {
  _id: string;
  name: string;
  amount: number;
  dueDay: number;
  enabled: boolean;
  categoryId?: Category;
};

const defaultForm = {
  name: "",
  amount: "",
  dueDay: "1",
  categoryId: "",
};

const money = (amount: number) =>
  `฿${amount.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;

export default function RecurringExpenseReminders({
  categories,
}: {
  categories: Category[];
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const {
    data: reminders = [],
    isLoading,
    isError,
  } = useQuery<Reminder[]>({
    queryKey: ["recurring-expenses"],
    queryFn: async () => {
      const { data } = await api.get("/recurring-expenses");
      if (!Array.isArray(data)) {
        throw new Error("Recurring expenses response must be an array");
      }
      return data;
    },
  });
  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/recurring-expenses", {
        name: form.name.trim(),
        amount: Number(form.amount),
        dueDay: Number(form.dueDay),
        ...(form.categoryId ? { categoryId: form.categoryId } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      setForm(defaultForm);
      setError("");
      setShowForm(false);
    },
    onError: () => setError("บันทึก reminder ไม่สำเร็จ โปรดลองอีกครั้ง"),
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.put(`/recurring-expenses/${id}`, { enabled }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] }),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const dueDay = Number(form.dueDay);
    const amount = Number(form.amount);
    if (!form.name.trim())
      return setError("กรุณาระบุชื่อรายการ เช่น ค่าเช่าห้อง");
    if (!Number.isFinite(amount) || amount < 0)
      return setError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)
      return setError("วันครบกำหนดต้องอยู่ระหว่าง 1–31");
    setError("");
    createMutation.mutate();
  };

  return (
    <section className="panel recurring-reminders">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RECURRING BILLS</span>
          <h2>บิลที่ต้องจ่ายทุกเดือน</h2>
          <p>
            ระบบจะแจ้ง LINE Flex Message
            ทุกวันครบกำหนด เวลา 09:00 น. (เวลาไทย)
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setShowForm(true);
            setError("");
          }}
        >
          <Plus size={17} />
          เพิ่มบิล
        </button>
      </div>
      {isLoading ? (
        <div className="reminder-empty">
          <Loader2 className="animate-spin" />
          <span>กำลังโหลด reminder…</span>
        </div>
      ) : isError ? (
        <div className="reminder-empty" role="alert">
          <span>โหลด reminder ไม่สำเร็จ</span>
        </div>
      ) : reminders.length === 0 ? (
        <div className="reminder-empty">
          <WalletCards size={30} strokeWidth={1.4} />
          <p>ยังไม่มีบิลประจำ</p>
          <span>
            เพิ่มค่าเช่า ค่าไฟ ค่าน้ำ ค่าโทรศัพท์ หรือค่างวดต่าง ๆ เพื่อให้ LINE
            เตือนตรงเวลา
          </span>
        </div>
      ) : (
        <div className="reminder-list">
          {reminders.map((reminder) => (
            <article
              key={reminder._id}
              className={`reminder-row ${reminder.enabled ? "" : "is-paused"}`}
            >
              <span className="reminder-icon">
                {reminder.categoryId?.icon || <Bell size={19} />}
              </span>
              <div className="reminder-copy">
                <strong>{reminder.name}</strong>
                <span>
                  {money(reminder.amount)} · ทุกวันที่ {reminder.dueDay}
                </span>
                <small>
                  <Clock3 size={13} />
                  แจ้งเวลา 09:00 น. (เวลาไทย)
                </small>
              </div>
              <button
                type="button"
                aria-label={`${reminder.enabled ? "พัก" : "เปิด"} reminder ${reminder.name}`}
                aria-pressed={reminder.enabled}
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: reminder._id,
                    enabled: !reminder.enabled,
                  })
                }
                className={`reminder-toggle ${reminder.enabled ? "is-on" : ""}`}
              >
                <span />
                {reminder.enabled ? "เปิด" : "พัก"}
              </button>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/55 p-0 sm:p-4"
          onClick={() => !createMutation.isPending && setShowForm(false)}
        >
          <form
            className="reminder-form"
            onSubmit={submit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="form-header">
              <div>
                <span className="eyebrow">NEW RECURRING BILL</span>
                <h2>เพิ่มบิลประจำ</h2>
              </div>
              <button
                type="button"
                aria-label="ปิดฟอร์มเพิ่มบิล"
                className="icon-button"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="form-helper">
              <CalendarDays size={16} />
              LINE จะแจ้งในวันครบกำหนด เวลา 09:00 น. (เวลาไทย)
            </p>
            <label>
              ชื่อรายการ
              <input
                autoFocus
                maxLength={80}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="เช่น ค่าเช่าห้อง"
              />
            </label>
            <div className="form-grid">
              <label>
                จำนวนเงิน (บาท)
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                  placeholder="0.00"
                />
              </label>
              <label>
                วันครบกำหนด
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.dueDay}
                  onChange={(event) =>
                    setForm({ ...form, dueDay: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-grid">
              <label className="col-span-full">
                หมวดหมู่ (ไม่บังคับ)
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({ ...form, categoryId: event.target.value })
                  }
                >
                  <option value="">ไม่ระบุหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={createMutation.isPending}
                onClick={() => setShowForm(false)}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                {createMutation.isPending ? "กำลังบันทึก" : "บันทึก reminder"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
