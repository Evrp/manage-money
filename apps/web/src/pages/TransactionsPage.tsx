import { useState, useMemo, useRef } from "react";
import Layout from "../components/layout/Layout";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Loader2,
  Trash2,
  RotateCcw,
  Receipt,
  ChevronDown,
  Eye,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTransaction, getTransactions, updateTransaction } from "../services/transactionsService";
import { useCategories } from "../hooks/useCategories";
import Calendar from "../components/ui/Calendar";
import TransactionForm from "../components/ui/TransactionForm";
import BulkSlipUploadModal from "../components/ui/BulkSlipUploadModal";
import DatePickerField from "../components/ui/DatePickerField";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  note?: string;
  categoryId?: {
    _id: string;
    name: string;
    icon: string;
  };
  categoryName?: string; // Fallback
  date: string;
  month: number;
  year: number;
  slipImageUrl?: string;
}

const TransactionsPage = () => {
  const queryClient = useQueryClient();
  const now = new Date();
  const toDateValue = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const defaultDateFrom = toDateValue(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultDateTo = toDateValue(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionDateFrom, setTransactionDateFrom] = useState(defaultDateFrom);
  const [transactionDateTo, setTransactionDateTo] = useState(defaultDateTo);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [uploadDateFilter, setUploadDateFilter] = useState<string>("");
  const [slipsOnlyFilter, setSlipsOnlyFilter] = useState<boolean>(false);
  const [sortByUpload, setSortByUpload] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSlipViewerOpen, setIsSlipViewerOpen] = useState(false);
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Fetch transactions
  const { data: transactionsResponse, isLoading } = useQuery({
    queryKey: [
      "transactions",
      activeTab,
      transactionDateFrom,
      transactionDateTo,
      order,
      uploadDateFilter,
      slipsOnlyFilter,
      sortByUpload,
    ],
    queryFn: () => getTransactions({
      limit: 100,
      ...(activeTab === "all" ? {} : { type: activeTab }),
      ...(transactionDateFrom ? { dateFrom: transactionDateFrom } : {}),
      ...(transactionDateTo ? { dateTo: transactionDateTo } : {}),
      ...(uploadDateFilter ? { uploadDate: uploadDateFilter } : {}),
      ...(slipsOnlyFilter ? { slipsOnly: true } : {}),
      ...(sortByUpload ? { sortByUpload: true } : {}),
      order,
    }),
  });

  const transactions = useMemo(() => transactionsResponse?.data || [], [transactionsResponse?.data]);

  const { data: categories = [] } = useCategories();

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    // Enrich transactions with local category mapping if populate failed
    const enriched = transactions.map((t: Transaction) => {
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

    // Filter by category if selected
    const categoryFiltered = selectedCategoryId
      ? enriched.filter(
          (t: Transaction) =>
            (typeof t.categoryId === "object"
              ? t.categoryId?._id
              : t.categoryId) === selectedCategoryId,
        )
      : enriched;

    if (!searchTerm) return categoryFiltered;
    const lowerSearch = searchTerm.toLowerCase();
    return categoryFiltered.filter((t: Transaction) => {
      const descMatch = (t.description || "")
        .toLowerCase()
        .includes(lowerSearch);
      const noteMatch = (t.note || "").toLowerCase().includes(lowerSearch);
      const catNameMatch = (
        typeof t.categoryId === "object"
          ? t.categoryId?.name || ""
          : t.categoryId || ""
      )
        .toLowerCase()
        .includes(lowerSearch);
      return descMatch || noteMatch || catNameMatch;
    });
  }, [transactions, searchTerm, categories, selectedCategoryId]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach((t: Transaction) => {
      const dateStr = new Date(t.date).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-summary"] });
      setSelectedTransaction(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateTransaction({ id, payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-summary"] });
      setSelectedTransaction(null);
      setIsEditing(false);
    },
  });

  const tabs = [
    { id: "all", label: "ทั้งหมด" },
    { id: "income", label: "รายรับ" },
    { id: "expense", label: "รายจ่าย" },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center px-1">
          <div>
            <span className="eyebrow">MONEY IN, MONEY OUT</span>
            <h1 className="text-2xl font-black text-gray-800">ทุกรายการของคุณ</h1>
            <p className="text-gray-400 text-sm font-medium">
              ติดตามการไหลเวียนของเงิน
            </p>
          </div>
        </header>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              aria-label="ค้นหารายการ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารายการ..."
              className="w-full pl-12 pr-4 py-4 bg-surface rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowCategoryFilter(true)}
              aria-label="เปิดตัวกรองรายการ"
              className={`px-4 rounded-2xl border shadow-sm transition-all h-full flex items-center justify-center gap-1.5 ${
                selectedCategoryId || uploadDateFilter || slipsOnlyFilter || sortByUpload
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-surface border-gray-100 text-gray-400 hover:bg-gray-50"
              }`}
            >
              <Filter size={20} />
              {(uploadDateFilter || slipsOnlyFilter || sortByUpload) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Filter Modal */}
            {showCategoryFilter && (
              <div
                className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowCategoryFilter(false)}
              >
                <div
                  className="bg-surface w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="text-xl font-black text-gray-800">
                        กรองรายการ
                      </h3>
                      <p className="mt-1 text-xs font-medium text-gray-400">
                        เลือกช่วงเวลาและหมวดหมู่ที่ต้องการดู
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(null);
                        setUploadDateFilter("");
                        setSlipsOnlyFilter(false);
                        setSortByUpload(false);
                        setTransactionDateFrom(defaultDateFrom);
                        setTransactionDateTo(defaultDateTo);
                      }}
                      className="mr-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      รีเซ็ต
                    </button>
                    <button
                      onClick={() => setShowCategoryFilter(false)}
                      aria-label="ปิดตัวกรอง"
                      className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">ช่วงวันที่รายการ</span>
                        {(transactionDateFrom || transactionDateTo) && (
                          <button type="button" onClick={() => { setTransactionDateFrom(""); setTransactionDateTo(""); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">ทุกช่วงเวลา</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <DatePickerField value={transactionDateFrom} onChange={setTransactionDateFrom} max={transactionDateTo || undefined} ariaLabel="เลือกวันเริ่มต้นของรายการ" placeholder="ตั้งแต่วันที่" />
                        <DatePickerField value={transactionDateTo} onChange={setTransactionDateTo} min={transactionDateFrom || undefined} ariaLabel="เลือกวันสิ้นสุดของรายการ" placeholder="ถึงวันที่" />
                      </div>
                    </div>

                    {/* Category Filter Grid */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        หมวดหมู่
                      </label>
                      <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        <button
                          onClick={() => setSelectedCategoryId(null)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all border-2 ${
                            selectedCategoryId === null
                              ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                              : "bg-surface border-gray-100 text-gray-400 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-base">
                            <RotateCcw size={16} />
                          </span>
                          <span className="text-[10px] font-bold">ทั้งหมด</span>
                        </button>
                        {categories.map((cat: any) => (
                          <button
                            key={cat._id}
                            onClick={() => setSelectedCategoryId(cat._id)}
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all border-2 ${
                              selectedCategoryId === cat._id
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-surface border-gray-100 text-gray-400 hover:border-indigo-100"
                            }`}
                          >
                            <span className="text-base">{cat.icon || "📦"}</span>
                            <span className="text-[10px] font-bold truncate w-full text-center">
                              {cat.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedFilters((show) => !show)}
                        className="flex w-full items-center justify-between text-left text-xs font-bold text-gray-600"
                        aria-expanded={showAdvancedFilters}
                      >
                        ตัวเลือกเพิ่มเติม
                        <ChevronDown size={17} className={`transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
                      </button>
                      {showAdvancedFilters && (
                        <div className="mt-3 space-y-4 rounded-lg bg-gray-50 p-3">
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-gray-700">วันที่อัปโหลดสลิป</span>
                            <DatePickerField
                              value={uploadDateFilter}
                              onChange={setUploadDateFilter}
                              ariaLabel="เลือกวันที่อัปโหลดสลิป"
                              placeholder="ทุกวันที่อัปโหลด"
                            />
                          </div>
                          <label className="flex cursor-pointer items-center justify-between gap-3">
                            <span>
                              <span className="block text-xs font-bold text-gray-800">เฉพาะรายการที่มีสลิป</span>
                              <span className="block text-[11px] text-gray-400">แสดงเฉพาะรายการที่มีไฟล์แนบ</span>
                            </span>
                            <input type="checkbox" checked={slipsOnlyFilter} onChange={(event) => setSlipsOnlyFilter(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                          </label>
                          <label className="flex cursor-pointer items-center justify-between gap-3">
                            <span>
                              <span className="block text-xs font-bold text-gray-800">เรียงตามเวลาอัปโหลดล่าสุด</span>
                              <span className="block text-[11px] text-gray-400">ใช้เวลาอัปโหลดแทนวันที่รายการ</span>
                            </span>
                            <input type="checkbox" checked={sortByUpload} onChange={(event) => setSortByUpload(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                          </label>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCategoryFilter(false)}
                      className="h-11 w-full rounded-lg bg-indigo-600 text-sm font-black text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                      ดูรายการ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
            className={`px-4 rounded-2xl border shadow-sm transition-all h-full bg-surface border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 flex items-center justify-center`}
            title={order === "desc" ? "เรียงจากใหม่ไปเก่า" : "เรียงจากเก่าไปใหม่"}
          >
            {order === "desc" ? (
              <ArrowDownWideNarrow size={20} />
            ) : (
              <ArrowUpNarrowWide size={20} />
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200/50 p-1 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-surface text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm font-medium">กำลังดึงข้อมูล...</p>
          </div>
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <p className="font-bold mb-1">ไม่พบรายการ</p>
            <p className="text-xs">ลองเปลี่ยนวันที่หรือคำค้นหาดูนะครับ</p>
          </div>
        ) : (
          <div className="transaction-ledger">
            {Object.entries(groupedTransactions).map(([date, items]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                  {date}
                </h3>
                <div className="space-y-3">
                  {items.map((t: Transaction) => (
                    <div
                      key={t._id}
                      role="button"
                      tabIndex={0}
                      aria-label={`ดูรายละเอียด ${t.description || t.note || 'รายการ'}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTransaction(t); } }}
                      onClick={() => setSelectedTransaction(t)}
                      className="flex items-center gap-4 bg-surface p-4 rounded-3xl border border-gray-100 shadow-sm hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      <div
                        className={`p-2.5 rounded-2xl ${t.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
                      >
                        {t.type === "income" ? (
                          <ArrowDownLeft size={20} />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">
                          {t.description || t.note || "ไม่มีคำอธิบาย"}
                        </p>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <span className="text-[10px]">
                            {typeof t.categoryId === "object"
                              ? t.categoryId?.icon
                              : "📦"}
                          </span>
                          <p className="text-[10px] font-bold">
                            {typeof t.categoryId === "object"
                              ? t.categoryId?.name
                              : t.categoryId || t.categoryName || "อื่นๆ"}
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedTransaction(null);
                setIsEditing(false);
                setIsSlipViewerOpen(false);
            }
          }}
        >
          {isEditing ? (
            <div
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <TransactionForm
                initialData={{
                  ...selectedTransaction,
                  categoryId:
                    typeof selectedTransaction.categoryId === "object"
                      ? selectedTransaction.categoryId._id
                      : selectedTransaction.categoryId,
                  date: selectedTransaction.date.split("T")[0],
                }}
                title="แก้ไขรายการ"
                onClose={() => setIsEditing(false)}
                onSubmit={(data) => {
                  updateMutation.mutate({
                    id: (selectedTransaction as any)._id,
                    data,
                  });
                }}
              />
            </div>
          ) : (
            <div className="bg-surface w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 scrollbar-hide">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold uppercase text-gray-400">
                    รายละเอียดรายการ
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTransaction(null);
                      setIsSlipViewerOpen(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center mb-8">
                  <div
                    className={`p-4 rounded-[2rem] mb-4 ${selectedTransaction.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
                  >
                    {selectedTransaction.type === "income" ? (
                      <ArrowDownLeft size={32} />
                    ) : (
                      <ArrowUpRight size={32} />
                    )}
                  </div>
                  <h2
                    className={`text-3xl font-black ${selectedTransaction.type === "income" ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {selectedTransaction.type === "income" ? "+" : "-"} ฿
                    {selectedTransaction.amount.toLocaleString()}
                  </h2>
                  <p className="font-bold text-lg mt-1">
                    {selectedTransaction.description ||
                      selectedTransaction.note ||
                      "ไม่มีคำอธิบาย"}
                  </p>
                  {selectedTransaction.slipImageUrl && (
                    <button
                      type="button"
                      onClick={() => setIsSlipViewerOpen(true)}
                      className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                    >
                      <Eye size={17} />
                      ดูสลิป
                    </button>
                  )}
                </div>

                <div className="space-y-4 bg-gray-50 p-6 rounded-3xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">วันที่</span>
                    <span className="font-bold">
                      {new Date(selectedTransaction.date).toLocaleDateString(
                        "th-TH",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-400">หมวดหมู่</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {typeof selectedTransaction.categoryId === "object"
                          ? selectedTransaction.categoryId?.icon
                          : "📦"}
                      </span>
                      <span className="font-bold underline decoration-indigo-200 decoration-2 underline-offset-4">
                        {typeof selectedTransaction.categoryId === "object"
                          ? selectedTransaction.categoryId?.name
                          : selectedTransaction.categoryId ||
                            selectedTransaction.categoryName ||
                            "อื่นๆ"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">ประเภท</span>
                    <span className="font-bold uppercase text-[10px] bg-surface px-2 py-0.5 rounded border border-gray-100">
                      {selectedTransaction.type === "income"
                        ? "รายรับ"
                        : "รายจ่าย"}
                    </span>
                  </div>
                  {selectedTransaction.note &&
                    selectedTransaction.note !==
                      selectedTransaction.description && (
                      <div className="flex flex-col gap-1 pt-3 border-t border-gray-200 text-sm">
                        <span className="text-gray-400 font-medium">
                          หมายเหตุ
                        </span>
                        <span className="font-bold">
                          {selectedTransaction.note}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(true);
                  }}
                  className="flex-1 py-4 bg-surface border border-gray-200 rounded-2xl font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => {
                    deleteMutation.mutate((selectedTransaction as any)._id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex-[0.6] py-4 bg-red-50 text-red-500 border border-red-100 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  ลบ
                </button>
              </div>
            </div>
          )}

          {isSlipViewerOpen && selectedTransaction.slipImageUrl && (
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
              onClick={() => setIsSlipViewerOpen(false)}
            >
              <div
                className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <strong className="text-sm text-slate-900">รูปสลิป</strong>
                  <button
                    type="button"
                    onClick={() => setIsSlipViewerOpen(false)}
                    aria-label="ปิดรูปสลิป"
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="min-h-0 overflow-auto bg-slate-100 p-3">
                  {selectedTransaction.slipImageUrl.toLowerCase().includes(".pdf") ? (
                    <iframe title="เอกสารสลิป" src={selectedTransaction.slipImageUrl} className="h-[75dvh] w-full rounded-lg bg-white" />
                  ) : (
                    <img src={selectedTransaction.slipImageUrl} alt="สลิปของรายการ" className="mx-auto max-h-[75dvh] max-w-full object-contain" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default TransactionsPage;
