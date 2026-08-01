import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Receipt,
  Sparkles,
  ZoomIn,
  Eye,
  FileText,
} from "lucide-react";
import api from "../../services/api";
import { useCategories } from "../../hooks/useCategories";
import { useQueryClient } from "@tanstack/react-query";
import CreateCategoryModal from "./CreateCategoryModal";

export interface SlipItemState {
  id: string; // unique local ID
  file: File;
  previewUrl: string;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
  slipId?: string;
  formData: {
    type: "income" | "expense";
    amount: string;
    categoryId: string;
    note: string;
    date: string;
    isNextMonthCycle?: boolean;
    suggestedCategory?: string;
    slipImageUrl?: string;
  };
}

interface BulkSlipUploadModalProps {
  initialFiles: File[];
  onClose: () => void;
  onSuccess: () => void;
}

const BulkSlipUploadModal: React.FC<BulkSlipUploadModalProps> = ({
  initialFiles,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<SlipItemState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [activeItemForCategory, setActiveItemForCategory] = useState<string | null>(null);
  
  // State for Full-Screen Image Lightbox
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Initialize items and process OCR
  useEffect(() => {
    if (initialFiles.length > 0) {
      const newItems: SlipItemState[] = initialFiles.map((file, index) => ({
        id: `slip_${Date.now()}_${index}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
        formData: {
          type: "expense",
          amount: "",
          categoryId: "",
          note: "",
          date: new Date().toISOString().split("T")[0],
          isNextMonthCycle: false,
        },
      }));

      setItems(newItems);

      // Trigger upload for each file in parallel
      newItems.forEach((item) => {
        uploadAndExtractSlip(item);
      });
    }
  }, [initialFiles]);

  // Upload single slip and run OCR
  const uploadAndExtractSlip = async (item: SlipItemState) => {
    const formData = new FormData();
    formData.append("file", item.file);

    try {
      const { data } = await api.post("/slips/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Match suggested category with existing categories
      let matchedCategoryId = "";
      const suggested = data.extractedData?.suggestedCategory;
      if (suggested && categories.length > 0) {
        const matched = categories.find(
          (c) => c.name.includes(suggested) || suggested.includes(c.name),
        );
        if (matched) matchedCategoryId = matched._id;
      }

      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== item.id) return i;
          const extracted = data.extractedData || {};
          const isIncome = extracted.transactionType === "income";
          const slipDate = extracted.transactionDate || i.formData.date;
          const isEndOfMonth = slipDate ? new Date(slipDate).getDate() >= 25 : false;

          return {
            ...i,
            status: "success",
            slipId: data.id,
            formData: {
              ...i.formData,
              amount: extracted.amount ? String(extracted.amount) : "",
              date: slipDate,
              note: extracted.toName || extracted.toBank || "",
              type: isIncome ? "income" : "expense",
              isNextMonthCycle: isEndOfMonth,
              suggestedCategory: suggested,
              categoryId: matchedCategoryId || i.formData.categoryId,
              slipImageUrl: data.imageUrl,
            },
          };
        }),
      );
    } catch (error: any) {
      console.error(`OCR Error for ${item.file.name}:`, error);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: "error",
                errorMessage:
                  error.response?.data?.message || "วิเคราะห์สลิปล้มเหลว",
              }
            : i,
        ),
      );
    }
  };

  // Match category when categories load if not matched yet
  useEffect(() => {
    if (categories.length > 0) {
      setItems((prev) =>
        prev.map((item) => {
          if (
            !item.formData.categoryId &&
            item.formData.suggestedCategory
          ) {
            const matched = categories.find(
              (c) =>
                c.name.includes(item.formData.suggestedCategory!) ||
                item.formData.suggestedCategory!.includes(c.name),
            );
            if (matched) {
              return {
                ...item,
                formData: { ...item.formData, categoryId: matched._id },
              };
            }
          }
          return item;
        }),
      );
    }
  }, [categories]);

  // Add more files dynamically
  const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    // Check 10MB limit per file
    const MAX_SIZE = 10 * 1024 * 1024;
    const oversizedFiles = selected.filter((f) => f.size > MAX_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`มีบางไฟล์ขนาดเกิน 10MB (ไฟล์: ${oversizedFiles.map((f) => f.name).join(", ")}) กรุณาเลือกไฟล์ที่เล็กกว่า 10MB`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newItems: SlipItemState[] = selected.map((file, index) => ({
      id: `slip_${Date.now()}_${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
      formData: {
        type: "expense",
        amount: "",
        categoryId: "",
        note: "",
        date: new Date().toISOString().split("T")[0],
      },
    }));

    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadAndExtractSlip(item));

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Remove individual item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update form data for single item
  const handleUpdateItemForm = (
    id: string,
    field: keyof SlipItemState["formData"],
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          formData: {
            ...item.formData,
            [field]: value,
          },
        };
      }),
    );
  };

  // Calculate totals
  const totalExpense = items.reduce((acc, item) => {
    if (item.status === "success" && item.formData.type === "expense") {
      return acc + (Number(item.formData.amount) || 0);
    }
    return acc;
  }, 0);

  const totalIncome = items.reduce((acc, item) => {
    if (item.status === "success" && item.formData.type === "income") {
      return acc + (Number(item.formData.amount) || 0);
    }
    return acc;
  }, 0);

  const validSuccessItems = items.filter(
    (item) =>
      item.status === "success" &&
      item.slipId &&
      item.formData.amount &&
      item.formData.categoryId,
  );

  const uploadingCount = items.filter((i) => i.status === "uploading").length;

  // Batch Submit All Confirmed Items
  const handleSubmitAll = async () => {
    if (validSuccessItems.length === 0) {
      alert("กรุณากรอกยอดเงินและเลือกหมวดหมู่ให้ครบถ้วนอย่างน้อย 1 รายการ");
      return;
    }

    setIsSubmitting(true);
    try {
      const confirmPayload = validSuccessItems.map((item) => ({
        slipId: item.slipId!,
        transactionData: {
          amount: Number(item.formData.amount),
          type: item.formData.type,
          categoryId: item.formData.categoryId,
          note: item.formData.note,
          date: item.formData.date,
          isNextMonthCycle: item.formData.isNextMonthCycle,
          slipImageUrl: item.formData.slipImageUrl,
        },
      }));

      await api.post("/slips/batch-confirm", { items: confirmPayload });

      // Invalidate queries to refresh dashboard & transactions page
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Batch confirm failed:", error);
      alert(
        "บันทึกล้มเหลว: " + (error.response?.data?.message || error.message),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Create Category Modal */}
      {showCreateCategory && (
        <CreateCategoryModal
          onClose={() => setShowCreateCategory(false)}
          onSubmit={async (data) => {
            try {
              const { data: newCat } = await api.post("/categories", {
                ...data,
                type: activeItemForCategory
                  ? items.find((i) => i.id === activeItemForCategory)?.formData
                      .type || "expense"
                  : "expense",
              });
              queryClient.invalidateQueries({ queryKey: ["categories"] });
              if (activeItemForCategory) {
                handleUpdateItemForm(
                  activeItemForCategory,
                  "categoryId",
                  newCat._id,
                );
              }
              setShowCreateCategory(false);
            } catch (err: any) {
              alert("สร้างหมวดหมู่ไม่สำเร็จ");
            }
          }}
        />
      )}

      {/* Full-Screen Image Lightbox Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
          >
            <X size={28} />
          </button>
          <img
            src={zoomedImage}
            alt="Full Slip Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) onClose();
        }}
      >
        <div className="bg-slate-50 w-full max-w-4xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  อัพโหลดสลิปหลายรายการ
                </h2>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1">
                ระบบกำลังวิเคราะห์สลิปด้วย AI ({items.length} รายการ) • คลิกที่รูปเพื่อซูมดูสลิปขนาดใหญ่
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
            >
              <X size={24} />
            </button>
          </div>

          {/* Hidden File Input for Add More */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAddMoreFiles}
            accept="image/*,application/pdf"
            multiple
            className="hidden"
          />

          {/* List of Slips */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 custom-scrollbar">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Receipt size={48} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold">ยังไม่มีสลิปที่เลือก</p>
              </div>
            ) : (
              items.map((item, index) => {
                const filteredCats = categories.filter(
                  (c) => c.type === item.formData.type,
                );

                const isPdf =
                  item.file?.type === "application/pdf" ||
                  item.file?.name.toLowerCase().endsWith(".pdf") ||
                  item.formData.slipImageUrl?.toLowerCase().includes(".pdf");

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-sm relative transition-all hover:shadow-md"
                  >
                    {/* Main Flex Layout: Image Prominent on Left/Top, Form on Right */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-5">
                      {/* Prominent Slip Image or PDF Container */}
                      <div className="sm:w-48 shrink-0 flex flex-col gap-2">
                        {isPdf ? (
                          <div className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden bg-rose-50 border-2 border-rose-200 shadow-inner flex flex-col items-center justify-center p-4 text-rose-600 gap-2 text-center group">
                            <div className="bg-rose-100 p-4 rounded-2xl text-rose-500 group-hover:scale-110 transition-transform">
                              <FileText size={40} />
                            </div>
                            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                              PDF Document
                            </span>
                            <span
                              className="text-xs font-bold text-gray-700 truncate w-full px-2"
                              title={item.file?.name}
                            >
                              {item.file?.name || "เอกสาร PDF"}
                            </span>
                            {item.file?.size && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            onClick={() => setZoomedImage(item.previewUrl)}
                            className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-100 shadow-inner group cursor-pointer"
                          >
                            <img
                              src={item.previewUrl}
                              alt={`Slip ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Slip Badge Number */}
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-black px-2.5 py-1 rounded-xl backdrop-blur-md">
                              ใบที่ #{index + 1}
                            </div>

                            {/* Hover Overlay with Zoom Button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white backdrop-blur-[2px]">
                              <ZoomIn size={28} />
                              <span className="text-xs font-bold">
                                ดูภาพใหญ่
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (isPdf) {
                              window.open(
                                item.previewUrl || item.formData.slipImageUrl,
                                "_blank",
                              );
                            } else {
                              setZoomedImage(item.previewUrl);
                            }
                          }}
                          className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Eye size={16} />
                          <span>
                            {isPdf ? "เปิดไฟล์ PDF" : "ซูมสลิปขนาดเต็ม"}
                          </span>
                        </button>
                      </div>

                      {/* Details & Form Controls */}
                      <div className="flex-1 min-w-0 space-y-4">
                        {/* Top Status & Remove Bar */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          {/* Status Badge */}
                          {item.status === "uploading" && (
                            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3.5 py-1.5 rounded-full text-xs font-bold animate-pulse">
                              <Loader2 size={16} className="animate-spin" />
                              <span>กำลังวิเคราะห์ด้วย AI...</span>
                            </div>
                          )}
                          {item.status === "success" && (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-full text-xs font-bold">
                              <CheckCircle2 size={16} />
                              <span>อ่านสลิปเรียบร้อย</span>
                            </div>
                          )}
                          {item.status === "error" && (
                            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3.5 py-1.5 rounded-full text-xs font-bold">
                              <AlertCircle size={16} />
                              <span>{item.errorMessage || "อ่านสลิปไม่สำเร็จ"}</span>
                            </div>
                          )}

                          {/* Delete Item Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                            title="ลบสลิปนี้"
                          >
                            <Trash2 size={18} />
                            <span className="hidden sm:inline">ลบ</span>
                          </button>
                        </div>

                        {/* Amount & Type Input Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Type Selector */}
                          <div className="flex bg-gray-100 p-1 rounded-2xl">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemForm(
                                  item.id,
                                  "type",
                                  "expense",
                                )
                              }
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                item.formData.type === "expense"
                                  ? "bg-white text-red-500 shadow-sm"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              รายจ่าย
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemForm(
                                  item.id,
                                  "type",
                                  "income",
                                )
                              }
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                item.formData.type === "income"
                                  ? "bg-white text-emerald-500 shadow-sm"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              รายรับ
                            </button>
                          </div>

                          {/* Amount Input */}
                          <div className="relative sm:col-span-2">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 text-base font-black">
                              ฿
                            </span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={item.formData.amount}
                              onChange={(e) =>
                                handleUpdateItemForm(
                                  item.id,
                                  "amount",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2 pl-9 pr-4 text-lg font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Category Selector Chips */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                            หมวดหมู่
                          </label>
                          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                            {filteredCats.map((cat) => {
                              const isSelected =
                                item.formData.categoryId === cat._id;
                              return (
                                <button
                                  key={cat._id}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateItemForm(
                                      item.id,
                                      "categoryId",
                                      cat._id,
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                                    isSelected
                                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                                      : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  <span>{cat.icon || "📦"}</span>
                                  <span>{cat.name}</span>
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveItemForCategory(item.id);
                                setShowCreateCategory(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-dashed border-gray-300 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 flex items-center gap-1"
                            >
                              <Plus size={14} />
                              <span>เพิ่มใหม่</span>
                            </button>
                          </div>
                        </div>

                        {/* Date & Note Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                              วันที่
                            </label>
                            <input
                              type="date"
                              value={item.formData.date}
                              onChange={(e) =>
                                handleUpdateItemForm(
                                  item.id,
                                  "date",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                              โน้ต / คำอธิบาย
                            </label>
                            <input
                              type="text"
                              placeholder="โน้ต..."
                              value={item.formData.note}
                              onChange={(e) =>
                                handleUpdateItemForm(
                                  item.id,
                                  "note",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-700 placeholder:text-gray-300"
                            />
                          </div>
                        </div>

                        {/* Monthly Cycle Cutoff Switch */}
                        {(() => {
                          const slipDate = item.formData.date ? new Date(item.formData.date) : new Date();
                          let m = slipDate.getMonth();
                          let y = slipDate.getFullYear();
                          if (item.formData.isNextMonthCycle) {
                            m += 1;
                            if (m > 11) { m = 0; y += 1; }
                          }
                          const cycleText = new Date(y, m, 1).toLocaleDateString("th-TH", { month: "short", year: "numeric" });

                          return (
                            <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 flex items-center justify-between gap-2">
                              <div className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5 flex-wrap">
                                <span>ตัดรอบเป็นเดือนถัดไป</span>
                                <span className="bg-indigo-200 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full">
                                  นับในรอบ: {cycleText}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateItemForm(
                                    item.id,
                                    "isNextMonthCycle",
                                    !item.formData.isNextMonthCycle,
                                  )
                                }
                                className={`w-10 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors ${
                                  item.formData.isNextMonthCycle
                                    ? "bg-indigo-600 justify-end"
                                    : "bg-gray-300 justify-start"
                                }`}
                              >
                                <span className="bg-white w-4 h-4 rounded-full shadow" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Add More Files Card */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-indigo-200 rounded-3xl p-4 flex items-center justify-center gap-2 text-indigo-600 hover:bg-indigo-50/50 transition-all font-bold text-sm"
            >
              <Plus size={20} />
              <span>เพิ่มสลิปอื่น ๆ</span>
            </button>
          </div>

          {/* Footer Summary & Action Bar */}
          <div className="pt-4 border-t border-gray-200 shrink-0 space-y-4">
            {/* Totals Summary */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-xs space-y-0.5">
                <span className="text-gray-400 font-medium block">
                  สรุปสลิปที่จะบันทึก ({validSuccessItems.length}/{items.length}{" "}
                  รายการพร้อมใช้งาน)
                </span>
                {uploadingCount > 0 && (
                  <span className="text-indigo-500 font-bold block animate-pulse">
                    กำลังวิเคราะห์อีก {uploadingCount} ใบ...
                  </span>
                )}
              </div>

              <div className="flex gap-4 text-right">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">
                    รายจ่ายรวม
                  </span>
                  <span className="text-base font-black text-red-500">
                    ฿{totalExpense.toLocaleString()}
                  </span>
                </div>
                {totalIncome > 0 && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">
                      รายรับรวม
                    </span>
                    <span className="text-base font-black text-emerald-500">
                      ฿{totalIncome.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Save All Button */}
            <button
              onClick={handleSubmitAll}
              disabled={
                isSubmitting ||
                validSuccessItems.length === 0 ||
                uploadingCount > 0
              }
              className={`w-full py-4 rounded-2xl font-black text-base transition-all shadow-lg ${
                validSuccessItems.length > 0 && uploadingCount === 0
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </div>
              ) : (
                `บันทึกทั้งหมด (${validSuccessItems.length} รายการ)`
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkSlipUploadModal;
