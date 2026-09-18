import React, { useState, useRef } from "react";
import { CategoryType, PaymentMethod } from "@moneyflow/shared";
import {
  Calendar as CalendarIcon,
  Tag,
  Plus,
  X,
  Image as ImageIcon,
  Loader2,
  Eye,
} from "lucide-react";
import Calendar from "./Calendar";
import { createCategory } from "../../services/categoriesService";
import { uploadSlipAttachment } from "../../services/slipsService";
import { useCategories } from "../../hooks/useCategories";
import CreateCategoryModal from "./CreateCategoryModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreditCards } from "../../hooks/useCreditCards";
import PaymentSourceSelect from "./PaymentSourceSelect";
import MonthPickerField from "./MonthPickerField";

interface TransactionFormProps {
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  title?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  initialData,
  onClose,
  onSubmit,
  title = "บันทึกรายการ",
}) => {
  const initialDate = initialData?.date?.split("T")[0] || new Date().toISOString().split("T")[0];
  const initialDateValue = new Date(`${initialDate}T12:00:00`);
  const defaultCycle = {
    month: initialDateValue.getMonth() + 1,
    year: initialDateValue.getFullYear(),
  };
  const [formData, setFormData] = useState({
    type: initialData?.type || CategoryType.EXPENSE,
    amount: initialData?.amount || "",
    categoryId: initialData?.categoryId || "",
    note: initialData?.note || "",
    date: initialDate,
    slipImageUrl: initialData?.slipImageUrl || "",
    paymentMethod: initialData?.paymentMethod || PaymentMethod.CASH,
    bankAccountId: initialData?.bankAccountId?._id || initialData?.bankAccountId || "",
    creditCardId: initialData?.creditCardId?._id || initialData?.creditCardId || "",
    statementDueDate: initialData?.statementDueDate ? new Date(initialData.statementDueDate).toISOString().slice(0, 10) : "",
    // month/year is the persisted accounting period used by Budget and Analytics.
    targetMonth: initialData?.month || initialData?.targetMonth || defaultCycle.month,
    targetYear: initialData?.year || initialData?.targetYear || defaultCycle.year,
  });
  const [cycleManuallySelected, setCycleManuallySelected] = useState(
    Boolean(
      initialData?.targetMonth ||
        initialData?.targetYear ||
        initialData?.isNextMonthCycle ||
        (initialData?.month && initialData.month !== defaultCycle.month) ||
        (initialData?.year && initialData.year !== defaultCycle.year),
    ),
  );

  const [isUploading, setIsUploading] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading: isCatsLoading } = useCategories();
  const { data: creditCards = [] } = useCreditCards();

  const filteredCategories =
    categories?.filter((c) => c.type === formData.type) || [];

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("ไฟล์มีขนาดเกิน 10MB กรุณาเลือกไฟล์ที่เล็กกว่า 10MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      // Use the reliable attachment endpoint for manual entries
      const data = await uploadSlipAttachment(file);

      setFormData({
        ...formData,
        slipImageUrl: data.imageUrl,
      });
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert(
        "อัพโหลดไฟล์ไม่สำเร็จ: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.categoryId) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    onSubmit({
      ...formData,
      amount: Number(formData.amount),
      isNextMonthCycle: false,
      ...(formData.type !== CategoryType.EXPENSE
        ? { paymentMethod: PaymentMethod.CASH, bankAccountId: undefined, creditCardId: undefined }
        : {}),
    });
  };

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const newCat = await createCategory({
        ...data,
        type: formData.type,
      });
      return newCat;
    },
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setFormData({ ...formData, categoryId: newCat._id });
      setShowCreateCategory(false);
    },
  });

  const handleCreateCategory = (data: any) => {
    createCategoryMutation.mutate(data);
  };

  const isPdfAttachment =
    formData.slipImageUrl?.toLowerCase().includes(".pdf") || false;

  return (
    <>
      {showCreateCategory && (
        <CreateCategoryModal
          onClose={() => setShowCreateCategory(false)}
          onSubmit={handleCreateCategory}
        />
      )}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-surface w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[95vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Slip/Attachment Preview & Upload */}
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
              {formData.slipImageUrl ? (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <button
                    type="button"
                    onClick={() => setShowAttachmentPreview(true)}
                    className="inline-flex min-w-0 items-center gap-2 text-left text-sm font-bold text-emerald-800"
                  >
                    <Eye size={18} />
                    <span>{isPdfAttachment ? "ดูเอกสารสลิป PDF" : "ดูสลิปที่แนบ"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, slipImageUrl: "" })}
                    aria-label="ลบไฟล์สลิปที่แนบ"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-rose-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-24 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                >
                  {isUploading ? (
                    <Loader2
                      size={24}
                      className="animate-spin text-indigo-500"
                    />
                  ) : (
                    <>
                      <ImageIcon size={24} />
                      <span className="text-xs font-bold">
                        แนบสลิปเพื่อบันทึกสีสัน
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Type Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                onClick={() =>
                  setFormData({
                    ...formData,
                    type: CategoryType.EXPENSE,
                    categoryId: "",
                  })
                }
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  formData.type === CategoryType.EXPENSE
                    ? "bg-surface text-red-500 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                รายจ่าย
              </button>
              <button
                onClick={() =>
                  setFormData({
                    ...formData,
                    type: CategoryType.INCOME,
                    categoryId: "",
                  })
                }
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  formData.type === CategoryType.INCOME
                    ? "bg-surface text-emerald-500 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                รายรับ
              </button>
            </div>

            {formData.type === CategoryType.EXPENSE && (
              <div className="space-y-3">
                <PaymentSourceSelect
                  paymentMethod={formData.paymentMethod}
                  bankAccountId={formData.bankAccountId}
                  creditCardId={formData.creditCardId}
                  onChange={({ paymentMethod, bankAccountId, creditCardId }) =>
                    setFormData({ ...formData, paymentMethod, bankAccountId: bankAccountId || "", creditCardId: creditCardId || "" })
                  }
                />
                {formData.paymentMethod === PaymentMethod.CREDIT_CARD && (
                  <div className="space-y-2"><select value={formData.creditCardId} onChange={(e) => setFormData({ ...formData, creditCardId: e.target.value })}
                    className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-700 border-none focus:ring-4 focus:ring-indigo-500/10">
                    <option value="">เลือกบัตรเครดิต</option>
                    {creditCards.map((card) => <option key={card._id} value={card._id}>{card.name} •••• {card.last4}</option>)}
                  </select><label className="block text-xs font-bold text-gray-400 px-1">วันครบกำหนดตามใบแจ้งยอด (ถ้ามี)</label><input type="date" value={formData.statementDueDate} onChange={(e) => setFormData({ ...formData, statementDueDate: e.target.value })} className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-700" /></div>
                )}
              </div>
            )}

            {/* Amount Input */}
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors">
                <span className="text-2xl font-bold font-sans">฿</span>
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full bg-gray-50 border-none rounded-3xl py-6 pl-16 pr-6 text-3xl font-black focus:ring-4 focus:ring-indigo-500/10 placeholder:text-gray-300 transition-all text-indigo-600"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                หมวดหมู่
              </label>
              {isCatsLoading ? (
                <div className="h-20 flex items-center justify-center text-gray-400 text-sm">
                  กำลังโหลด...
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() =>
                        setFormData({ ...formData, categoryId: cat._id })
                      }
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all border-2 ${
                        formData.categoryId === cat._id
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                          : "bg-surface border-gray-100 text-gray-400 hover:border-indigo-100 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-lg">{cat.icon || "📦"}</span>
                      <span className="text-[10px] font-bold truncate w-full text-center">
                        {cat.name}
                      </span>
                    </button>
                  ))}

                  {/* Add New Category Button */}
                  <button
                    onClick={() => setShowCreateCategory(true)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                  >
                    <Plus size={20} />
                    <span className="text-[10px] font-bold">เพิ่มใหม่</span>
                  </button>
                </div>
              )}
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  วันที่
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className="w-full bg-gray-50 border border-transparent p-4 rounded-2xl flex items-center justify-between group hover:bg-surface hover:border-indigo-100 transition-all font-bold text-gray-700 h-[56px]"
                  >
                    <span className="text-sm truncate">
                      {new Date(formData.date).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <CalendarIcon
                      size={18}
                      className="text-gray-300 group-hover:text-indigo-400 shrink-0 ml-1"
                    />
                  </button>

                  {showDatePicker && (
                    <div
                      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                      onClick={() => setShowDatePicker(false)}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Calendar
                          selectedDate={new Date(formData.date)}
                          onChange={(date) => {
                            const dateStr =
                              date.getFullYear() +
                              "-" +
                              String(date.getMonth() + 1).padStart(2, "0") +
                              "-" +
                              String(date.getDate()).padStart(2, "0");
                            const nextCycleDate = new Date(`${dateStr}T12:00:00`);
                            setFormData({
                              ...formData,
                              date: dateStr,
                              ...(cycleManuallySelected
                                ? {}
                                : {
                                    targetMonth: nextCycleDate.getMonth() + 1,
                                    targetYear: nextCycleDate.getFullYear(),
                                  }),
                            });
                          }}
                          onClose={() => setShowDatePicker(false)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  โน้ต
                </label>
                <div className="relative group">
                  <Tag
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-400 transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="โน้ต..."
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 placeholder:text-gray-300 transition-all text-gray-700 h-[56px]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
              <label className="block text-[11px] font-black text-indigo-950">
                นับในรอบบัญชีเดือน
              </label>
              <p className="mt-1 text-[11px] font-medium text-indigo-700/80">
                ใช้นับเป็นรายรับ/รายจ่ายของงบประมาณใน Analytics และ Budget
              </p>
              <div className="mt-2 flex items-center gap-3">
                <MonthPickerField
                  value={`${formData.targetYear}-${String(formData.targetMonth).padStart(2, "0")}`}
                  onChange={(value) => {
                    if (!value) {
                      const date = new Date(`${formData.date}T12:00:00`);
                      setFormData({
                        ...formData,
                        targetMonth: date.getMonth() + 1,
                        targetYear: date.getFullYear(),
                      });
                      setCycleManuallySelected(false);
                      return;
                    }
                    const [targetYear, targetMonth] = value.split("-").map(Number);
                    setFormData({ ...formData, targetMonth, targetYear });
                    setCycleManuallySelected(true);
                  }}
                  ariaLabel="เลือกเดือนรอบบัญชี"
                  className="min-w-0 flex-1"
                />
                <span className="hidden text-xs font-bold text-indigo-700 sm:block">
                  เลือกเดือนได้เอง
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95 mt-4"
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
      {showAttachmentPreview && formData.slipImageUrl && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={() => setShowAttachmentPreview(false)}
        >
          <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <strong className="text-sm text-slate-900">{isPdfAttachment ? "เอกสารสลิป" : "รูปสลิป"}</strong>
              <button type="button" onClick={() => setShowAttachmentPreview(false)} aria-label="ปิดไฟล์สลิป" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="min-h-0 overflow-auto bg-slate-100 p-3">
              {isPdfAttachment ? <iframe title="เอกสารสลิป" src={formData.slipImageUrl} className="h-[75dvh] w-full rounded-lg bg-white" /> : <img src={formData.slipImageUrl} alt="สลิปที่แนบ" className="mx-auto max-h-[75dvh] max-w-full object-contain" />}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionForm;
