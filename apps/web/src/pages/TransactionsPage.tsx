import { useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Loader2,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useCategories } from "../hooks/useCategories";
import Calendar from "../components/ui/Calendar";
import TransactionForm from "../components/ui/TransactionForm";

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
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch transactions
  const dateObj = new Date(selectedDate);
  const { data: transactionsResponse, isLoading } = useQuery({
    queryKey: [
      "transactions",
      activeTab,
      dateObj.getMonth() + 1,
      dateObj.getFullYear(),
    ],
    queryFn: async () => {
      const typeParam = activeTab === "all" ? "" : `&type=${activeTab}`;
      const { data } = await api.get(
        `/transactions?month=${dateObj.getMonth() + 1}&year=${dateObj.getFullYear()}${typeParam}&limit=100`,
      );
      return data;
    },
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
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-summary"] });
      setSelectedTransaction(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/transactions/${id}`, data),
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
            <h1 className="text-2xl font-black text-gray-800">รายงาน</h1>
            <p className="text-gray-400 text-sm font-medium">
              ติดตามการไหลเวียนของเงิน
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowCalendar(true)}
              className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95"
            >
              <CalendarIcon size={20} />
            </button>

            {showCalendar && (
              <div
                className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
                      setSelectedDate(dateStr);
                    }}
                    onClose={() => setShowCalendar(false)}
                  />
                </div>
              </div>
            )}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารายการ..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowCategoryFilter(true)}
              className={`px-4 rounded-2xl border shadow-sm transition-all h-full ${
                selectedCategoryId
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
              }`}
            >
              <Filter size={20} />
            </button>

            {/* Category Filter Modal */}
            {showCategoryFilter && (
              <div
                className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowCategoryFilter(false)}
              >
                <div
                  className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-800">
                      ตัวกรองหมวดหมู่
                    </h3>
                    <button
                      onClick={() => setShowCategoryFilter(false)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedCategoryId(null);
                        setShowCategoryFilter(false);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all border-2 ${
                        selectedCategoryId === null
                          ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                          : "bg-white border-gray-50 text-gray-400"
                      }`}
                    >
                      <span className="text-lg">
                        <RotateCcw size={18} />
                      </span>
                      <span className="text-[10px] font-bold">ทั้งหมด</span>
                    </button>
                    {categories.map((cat: any) => (
                      <button
                        key={cat._id}
                        onClick={() => {
                          setSelectedCategoryId(cat._id);
                          setShowCategoryFilter(false);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all border-2 ${
                          selectedCategoryId === cat._id
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-gray-50 text-gray-400 hover:border-indigo-100"
                        }`}
                      >
                        <span className="text-lg">{cat.icon || "📦"}</span>
                        <span className="text-[10px] font-bold truncate w-full text-center">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowCategoryFilter(false)}
                    className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                  >
                    ตกลง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200/50 p-1 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-indigo-600 shadow-sm"
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
          <div className="space-y-6 pb-20">
            {Object.entries(groupedTransactions).map(([date, items]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                  {date}
                </h3>
                <div className="space-y-3">
                  {items.map((t: Transaction) => (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTransaction(t)}
                      className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:translate-x-1 transition-transform cursor-pointer"
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
            <div className="bg-white w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 scrollbar-hide">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold uppercase text-gray-400">
                    รายละเอียดรายการ
                  </span>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {selectedTransaction.slipImageUrl &&
                  selectedTransaction.slipImageUrl.length > 0 && (
                    <div className="mb-6 rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                      <img
                        src={selectedTransaction.slipImageUrl}
                        alt="Receipt"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}

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
                    <span className="font-bold uppercase text-[10px] bg-white px-2 py-0.5 rounded border border-gray-100">
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
                  className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all flex items-center justify-center gap-2"
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
        </div>
      )}
    </Layout>
  );
};

export default TransactionsPage;
