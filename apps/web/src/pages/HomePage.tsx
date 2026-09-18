import React, { useRef, useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import {
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  Target,
  ShieldCheck,
  Upload,
  ArrowDownLeft,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../services/dashboardService";
import { createTransaction, getRecentTransactions } from "../services/transactionsService";
import { confirmSlip, getPendingSlips } from "../services/slipsService";
import TransactionForm from "../components/ui/TransactionForm";
import BulkSlipUploadModal, {
  type PendingSlipUpload,
} from "../components/ui/BulkSlipUploadModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCategories } from "../hooks/useCategories";
import Calendar from "../components/ui/Calendar";
import { useAuthStore } from "../store/auth.store";

const HomePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);
  const [showManualForm, setShowManualForm] = useState(false);
  const [bulkUploadFiles, setBulkUploadFiles] = useState<File[]>([]);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [showCalendar, setShowCalendar] = useState(false);

  const dateObj = new Date(selectedDate);
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  // Fetch Summary
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["dashboard-summary", month, year],
    queryFn: () => getDashboardSummary({ month, year }),
  });

  // Fetch Recent Transactions
  const {
    data: recentTransactions,
    isLoading: isRecentLoading,
    isError: recentError,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => (await getRecentTransactions()).data,
  });

  const { data: categories = [] } = useCategories();
  const { data: pendingSlips = [] } = useQuery<PendingSlipUpload[]>({
    queryKey: ["pending-slips"],
    queryFn: getPendingSlips,
  });

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
    if (bulkUploadFiles.length > 0) {
      setIsBulkUploadOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAddNewManual = () => {
    setShowManualForm(false);
    setOcrResult(null);
    setShowManualForm(true);
  };

  const handleViewAll = () => {
    navigate("/transactions");
  };

  const [ocrResult, setOcrResult] = useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check 10MB limit per file
    const MAX_SIZE = 10 * 1024 * 1024;
    const oversizedFiles = files.filter((f) => f.size > MAX_SIZE);
    if (oversizedFiles.length > 0) {
      alert(
        `มีบางไฟล์ขนาดเกิน 10MB (ไฟล์: ${oversizedFiles.map((f) => f.name).join(", ")}) กรุณาเลือกไฟล์ที่เล็กกว่า 10MB`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setBulkUploadFiles(files);
    setIsBulkUploadOpen(true);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleManualSubmit = async (formData: any) => {
    try {
      if (ocrResult) {
        // If coming from OCR, use the confirm endpoint
        await confirmSlip({ slipId: ocrResult.id, transactionData: formData });
      } else {
        // Regular manual entry
        await createTransaction(formData);
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

  const money = (value: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(value || 0);
  const monthLabel = dateObj.toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });
  return (
    <Layout>
      <header className="page-heading">
        <div>
          <span className="eyebrow">YOUR FINANCIAL PICTURE</span>
          <h1>ทุกเรื่องเงิน ในมุมเดียว</h1>
          <p>
            สวัสดี{user?.displayName ? ` คุณ${user.displayName}` : ""}{" "}
            ดูภาพรวมและจัดการการเงินของคุณได้ที่นี่
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => setShowCalendar(true)}
        >
          <CalendarIcon size={17} />
          {monthLabel}
        </button>
      </header>
      {showCalendar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          onClick={() => setShowCalendar(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Calendar
              selectedDate={dateObj}
              onChange={(date) => {
                setSelectedDate(
                  date.getFullYear() +
                    "-" +
                    String(date.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(date.getDate()).padStart(2, "0"),
                );
                setShowCalendar(false);
              }}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        </div>
      )}
      {(bulkUploadFiles.length > 0 || pendingSlips.length > 0) && (
        <BulkSlipUploadModal
          initialFiles={bulkUploadFiles}
          pendingUploads={pendingSlips}
          isOpen={isBulkUploadOpen}
          onOpen={() => setIsBulkUploadOpen(true)}
          onMinimize={() => setIsBulkUploadOpen(false)}
          onClose={() => {
            setBulkUploadFiles([]);
            setIsBulkUploadOpen(false);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["recent-transactions"],
            });
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            queryClient.invalidateQueries({ queryKey: ["pending-slips"] });
          }}
        />
      )}
      {showManualForm && (
        <TransactionForm
          onClose={() => {
            setShowManualForm(false);
            setOcrResult(null);
          }}
          onSubmit={handleManualSubmit}
          title="บันทึกรายการ"
          initialData={null}
        />
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        multiple
        className="hidden"
      />
      {summaryError && (
        <div role="alert" className="panel mb-5">
          โหลดภาพรวมไม่สำเร็จ{" "}
          <button className="text-link" onClick={() => refetchSummary()}>
            ลองอีกครั้ง
          </button>
        </div>
      )}
      <div className="overview-grid">
        <section className="balance-card">
          <span className="eyebrow">MONTHLY BALANCE</span>
          <p className="text-sm">เงินคงเหลือ · {monthLabel}</p>
          <div className="balance-value">
            {isSummaryLoading
              ? "กำลังโหลด…"
              : summaryError
                ? "—"
                : money(summary?.netSaving)}
          </div>
          <span className="text-sm opacity-80">รายรับ หัก รายจ่าย</span>
          <div className="balance-footer">
            <ShieldCheck size={16} />
            คำนวณจากรายการที่คุณบันทึกในเดือนนี้
          </div>
        </section>
        <section
          className="overview-stats"
          aria-label="รายรับ รายจ่าย และบันทึกรายการ"
        >
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">
                <TrendingUp size={18} className="income" />
                รายรับทั้งหมด
              </div>
              <strong>
                {isSummaryLoading || summaryError
                  ? "—"
                  : money(summary?.totalIncome)}
              </strong>
              <small>เดือน{monthLabel}</small>
            </div>
            <div className="stat-card">
              <div className="stat-label">
                <TrendingDown size={18} className="expense" />
                รายจ่ายทั้งหมด
              </div>
              <strong>
                {isSummaryLoading || summaryError
                  ? "—"
                  : money(summary?.totalExpense)}
              </strong>
              <small>เดือน{monthLabel}</small>
            </div>
          </div>
          <div className="quick-actions">
            <button className="action-tile" onClick={handleAddNewManual}>
              <Plus size={22} />
              <span>
                <strong>บันทึกใหม่</strong>
                <small>เพิ่มรายรับหรือรายจ่าย</small>
              </span>
            </button>
            <button className="action-tile" onClick={handleUploadClick}>
              <Upload size={22} />
              <span>
                <strong>อัปโหลดสลิป</strong>
                <small>อ่านข้อมูลจากสลิป</small>
              </span>
            </button>
          </div>
        </section>
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h2>รายการล่าสุด</h2>
            </div>
            <button className="text-link" onClick={handleViewAll}>
              ดูทั้งหมด <ArrowUpRight size={16} />
            </button>
          </div>
          {isRecentLoading ? (
            <p className="empty-panel" role="status">
              กำลังโหลดรายการ…
            </p>
          ) : recentError ? (
            <div className="empty-panel" role="alert">
              <p>โหลดรายการไม่สำเร็จ</p>
              <button
                className="secondary-button"
                onClick={() => refetchRecent()}
              >
                ลองอีกครั้ง
              </button>
            </div>
          ) : enrichedRecentTransactions.length === 0 ? (
            <div className="empty-panel">
              <Receipt size={32} strokeWidth={1.4} />
              <p>
                เริ่มบันทึกรายการแรก
                <br />
                แล้วมองเห็นการเงินของคุณชัดขึ้น
              </p>
              <button className="primary-button" onClick={handleAddNewManual}>
                <Plus size={16} />
                บันทึกรายการแรก
              </button>
            </div>
          ) : (
            enrichedRecentTransactions.map((t: any) => (
              <button
                key={t._id}
                className="transaction-row"
                onClick={() => navigate("/transactions")}
              >
                <span className="transaction-symbol">
                  {t.type === "income" ? (
                    <ArrowDownLeft size={19} className="income" />
                  ) : (
                    <ArrowUpRight size={19} className="expense" />
                  )}
                </span>
                <span className="transaction-copy">
                  <strong className="truncate">
                    {t.note || t.description || "ไม่มีคำอธิบาย"}
                  </strong>
                  <small>
                    {typeof t.categoryId === "object"
                      ? t.categoryId?.name || "อื่นๆ"
                      : "อื่นๆ"}{" "}
                    ·{" "}
                    {new Date(t.date).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                    })}
                  </small>
                </span>
                <span
                  className={`amount ${t.type === "income" ? "income" : "expense"}`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {money(t.amount)}
                </span>
              </button>
            ))
          )}
        </section>
        <aside className="panel plan-panel">
          <Target size={28} strokeWidth={1.4} />
          <span className="eyebrow mt-5">A LITTLE PLAN, A BIG DIFFERENCE</span>
          <h2>
            ใช้จ่ายอย่างมีแผน
            <br />
            เก็บเงินอย่างมีเป้าหมาย
          </h2>
          <p>
            กำหนดงบแยกตามหมวดหมู่ แล้วติดตามว่าเดือนนี้คุณใช้ไปเท่าไร
            เหลืออีกเท่าไร
          </p>
          <button
            className="secondary-button"
            onClick={() => navigate("/budgets")}
          >
            จัดการงบประมาณ <ArrowUpRight size={17} />
          </button>
        </aside>
      </div>
    </Layout>
  );
};
export default HomePage;
