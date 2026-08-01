import React, { useState, useRef } from "react";
import { CategoryType } from "@moneyflow/shared";
import {
  Calendar as CalendarIcon,
  Tag,
  Plus,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import Calendar from "./Calendar";
import api from "../../services/api";
import { useCategories } from "../../hooks/useCategories";
import CreateCategoryModal from "./CreateCategoryModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  const [formData, setFormData] = useState({
    type: initialData?.type || CategoryType.EXPENSE,
    amount: initialData?.amount || "",
    categoryId: initialData?.categoryId || "",
    note: initialData?.note || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    slipImageUrl: initialData?.slipImageUrl || "",
  });

  const [isNextMonthCycle, setIsNextMonthCycle] = useState(
    initialData?.isNextMonthCycle !== undefined
      ? initialData.isNextMonthCycle
      : false,
  );

  const [isUploading, setIsUploading] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading: isCatsLoading } = useCategories();

  const filteredCategories =
    categories?.filter((c) => c.type === formData.type) || [];

  // Auto-detect end of month date (>= 25th) to suggest next month cycle
  React.useEffect(() => {
    if (formData.date && initialData?.isNextMonthCycle === undefined) {
      const d = new Date(formData.date);
      if (d.getDate() >= 25) {
        setIsNextMonthCycle(true);
      }
    }
  }, [formData.date, initialData?.isNextMonthCycle]);

  // Compute Target Cycle Month Name
  const targetCycleText = React.useMemo(() => {
    if (!formData.date) return "";
    const d = new Date(formData.date);
    let m = d.getMonth();
    let y = d.getFullYear();
    if (isNextMonthCycle) {
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    const cycleDate = new Date(y, m, 1);
    return cycleDate.toLocaleDateString("th-TH", {
      month: "long",
      year: "numeric",
    });
  }, [formData.date, isNextMonthCycle]);

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
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      // Use the reliable attachment endpoint for manual entries
      const { data } = await api.post("/slips/attachment", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
      isNextMonthCycle,
    });
  };

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: newCat } = await api.post("/categories", {
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
        <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[95vh] overflow-y-auto">
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
                <div className="relative w-full rounded-3xl overflow-hidden mb-4 border-2 border-dashed border-gray-100 bg-gray-50">
                  {isPdfAttachment ? (
                    <div className="p-6 flex items-center justify-between bg-rose-50 text-rose-700">
                      <div className="flex items-center gap-3">
                        <span className="bg-rose-200 p-3 rounded-2xl text-rose-600 font-bold">
                          PDF
                        </span>
                        <div>
                          <p className="font-bold text-sm">เอกสารสลิป PDF</p>
                          <a
                            href={formData.slipImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold underline text-rose-500 hover:text-rose-700"
                          >
                            เปิดดูเอกสาร PDF
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setFormData({ ...formData, slipImageUrl: "" })
                        }
                        className="bg-black/10 text-gray-700 p-2 rounded-full hover:bg-black/20 transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <img
                        src={formData.slipImageUrl}
                        alt="Slip"
                        className="w-full h-auto block"
                      />
                      <button
                        onClick={() =>
                          setFormData({ ...formData, slipImageUrl: "" })
                        }
                        className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-all"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
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
                    ? "bg-white text-red-500 shadow-sm"
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
                    ? "bg-white text-emerald-500 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                รายรับ
              </button>
            </div>

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
                          : "bg-white border-gray-100 text-gray-400 hover:border-indigo-100 hover:bg-gray-50"
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
                    className="w-full bg-gray-50 border border-transparent p-4 rounded-2xl flex items-center justify-between group hover:bg-white hover:border-indigo-100 transition-all font-bold text-gray-700 h-[56px]"
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
                            setFormData({ ...formData, date: dateStr });
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

            {/* Monthly Cycle Cutoff Toggle */}
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-indigo-950">
                    ตัดรอบเป็นเดือนถัดไป
                  </span>
                  <span className="bg-indigo-200 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    รอบบัญชี: {targetCycleText}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700/80 font-medium">
                  ใช้นับเป็นรายรับ/รายจ่ายของงบประมาณเดือน {targetCycleText}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNextMonthCycle(!isNextMonthCycle)}
                className={`w-12 h-7 shrink-0 flex items-center rounded-full p-1 transition-colors duration-300 ${
                  isNextMonthCycle ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"
                }`}
              >
                <span className="bg-white w-5 h-5 rounded-full shadow-md" />
              </button>
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
    </>
  );
};

export default TransactionForm;
