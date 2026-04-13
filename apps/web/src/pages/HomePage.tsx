import React, { useRef, useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import {
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Loader2,
  ArrowDownLeft,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import TransactionForm from "../components/ui/TransactionForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCategories } from "../hooks/useCategories";
import Calendar from "../components/ui/Calendar";

const HomePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [showCalendar, setShowCalendar] = useState(false);

  const dateObj = new Date(selectedDate);
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  // Fetch Summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["dashboard-summary", month, year],
    queryFn: async () => {
      const { data } = await api.get(
        `/dashboard/summary?month=${month}&year=${year}`,
      );
      return data;
    },
  });

  // Fetch Recent Transactions
  const { data: recentTransactions, isLoading: isRecentLoading } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data } = await api.get("/transactions?limit=5");
      return data.data;
    },
  });

  const { data: categories = [] } = useCategories();

  const enrichedRecentTransactions = useMemo(() => {
    if (!recentTransactions) return [];
    return recentTransactions.map((t: any) => {
      if (typeof t.categoryId === "string") {
        const cat = categories.find((c: any) => c._id === t.categoryId);
        if (cat) {
          return {
            ...t,
            categoryId: { _id: cat._id, name: cat.name, icon: cat.icon },
          };
        }
      }
      return t;
    });
  }, [recentTransactions, categories]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddNewManual = () => {
    setShowManualForm(true);
  };

  const handleViewAll = () => {
    navigate("/transactions");
  };

  const [ocrResult, setOcrResult] = useState<any>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    // Clear input immediately to prevent double-selection issues
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const { data } = await api.post("/slips/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // AI analyzed success, set result to show in form
      setOcrResult(data);
      setShowManualForm(true);
    } catch (error: any) {
      console.error("Upload failed:", error);
      const msg = error.response?.data?.message || error.message;
      alert("อัพโหลดสลิปล้มเหลว: " + msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (formData: any) => {
    try {
      if (ocrResult) {
        // If coming from OCR, use the confirm endpoint
        await api.post("/slips/confirm", {
          slipId: ocrResult.id,
          transactionData: formData,
        });
      } else {
        // Regular manual entry
        await api.post("/transactions", formData);
      }

      setShowManualForm(false);
      setOcrResult(null);

      // Refresh summaries, transactions and budgets
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    } catch (error: any) {
      console.error("Submission failed:", error);
      alert(
        "บันทึกไม่สำเร็จ: " + (error.response?.data?.message || error.message),
      );
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Manual Entry Modal */}
        {showManualForm && (
          <TransactionForm
            onClose={() => {
              setShowManualForm(false);
              setOcrResult(null);
            }}
            onSubmit={handleManualSubmit}
            title={ocrResult ? "ยืนยันข้อมูลจากสลิป" : "บันทึกรายการ"}
            initialData={
              ocrResult
                ? {
                    amount: ocrResult.extractedData.amount,
                    date:
                      ocrResult.extractedData.transactionDate ||
                      new Date(
                        new Date().getTime() -
                          new Date().getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .split("T")[0],
                    note:
                      ocrResult.extractedData.toName ||
                      ocrResult.extractedData.toBank ||
                      "",
                    type:
                      ocrResult.extractedData.transactionType === "income"
                        ? "income"
                        : "expense",
                    suggestedCategory:
                      ocrResult.extractedData.suggestedCategory,
                    slipImageUrl: ocrResult.imageUrl,
                  }
                : null
            }
          />
        )}

        {/* Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Header Summary */}
        <section className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-100 text-sm opacity-80">
                ยอดคงเหลือเดือนนี้
              </p>
              <div className="relative mt-2">
                <button
                  onClick={() => setShowCalendar(true)}
                  className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-all"
                >
                  <CalendarIcon size={16} />
                  <span className="text-sm font-bold">
                    {dateObj.toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </button>

                {showCalendar && (
                  <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowCalendar(false)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Calendar
                        selectedDate={dateObj}
                        onChange={(date) => {
                          const dateStr =
                            date.getFullYear() +
                            "-" +
                            String(date.getMonth() + 1).padStart(2, "0") +
                            "-" +
                            String(date.getDate()).padStart(2, "0");
                          setShowCalendar(false);
                          setSelectedDate(dateStr);
                        }}
                        onClose={() => setShowCalendar(false)}
                      />
                    </div>
                  </div>
                )}
              </div>
              {isSummaryLoading ? (
                <div className="h-10 w-32 bg-white/10 animate-pulse rounded-lg mt-1" />
              ) : (
                <h1 className="text-3xl font-bold mt-1">
                  ฿{(summary?.netSaving || 0).toLocaleString()}
                </h1>
              )}
            </div>
            <button
              onClick={handleAddNewManual}
              className="bg-white/20 p-2 rounded-xl backdrop-blur-md hover:bg-white/30 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="flex gap-4 mt-6">
            <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-xs text-indigo-100 mb-1">
                <TrendingUp size={12} />
                <span>รายรับ</span>
              </div>
              <p className="font-semibold">
                ฿{(summary?.totalIncome || 0).toLocaleString()}
              </p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-xs text-indigo-100 mb-1">
                <TrendingDown size={12} />
                <span>รายจ่าย</span>
              </div>
              <p className="font-semibold">
                ฿{(summary?.totalExpense || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button
            onClick={handleAddNewManual}
            className="flex flex-col items-center gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
          >
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
              <Plus size={24} />
            </div>
            <span className="text-sm font-semibold">บันทึกใหม่</span>
          </button>
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className={`flex flex-col items-center gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm transition-all ${
              isUploading
                ? "opacity-70 cursor-not-allowed"
                : "hover:border-emerald-200 hover:bg-emerald-50/50"
            }`}
          >
            <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
              {isUploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Receipt size={24} />
              )}
            </div>
            <span className="text-sm font-semibold">
              {isUploading ? "กำลังวิเคราะห์..." : "อัพโหลดสลิป"}
            </span>
          </button>
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="font-bold text-lg">รายการล่าสุด</h2>
            <button
              onClick={handleViewAll}
              className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 hover:underline"
            >
              ดูทั้งหมด
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {isRecentLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-50 animate-pulse rounded-3xl"
                />
              ))
            ) : enrichedRecentTransactions?.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-3xl">
                ยังไม่มีรายการบันทึก
              </div>
            ) : (
              enrichedRecentTransactions?.map((t: any) => (
                <div
                  key={t._id}
                  onClick={() => navigate("/transactions")}
                  className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:translate-x-1 transition-transform cursor-pointer"
                >
                  <div
                    className={`h-11 w-11 flex items-center justify-center rounded-2xl text-xl ${t.type === "income" ? "bg-emerald-50" : "bg-gray-50"}`}
                  >
                    {t.categoryId?.icon ||
                      (t.type === "income" ? (
                        <ArrowDownLeft size={20} className="text-emerald-500" />
                      ) : (
                        <Receipt size={20} className="text-gray-400" />
                      ))}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm truncate">
                      {t.note || t.description || "ไม่มีคำอธิบาย"}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-gray-400 font-medium">
                        {new Date(t.date).toLocaleDateString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <span className="h-1 w-1 rounded-full bg-gray-200" />
                      <p className="text-[10px] text-indigo-500 font-bold">
                        {typeof t.categoryId === "object"
                          ? t.categoryId?.name
                          : t.categoryId || "อื่นๆ"}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-bold ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {t.type === "income" ? "+" : "-"} ฿
                    {t.amount.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;
