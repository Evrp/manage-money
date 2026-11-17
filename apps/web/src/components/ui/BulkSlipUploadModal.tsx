import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Receipt,
  ZoomIn,
  FileText,
  ShoppingBag,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  CalendarDays,
  ArrowDownUp,
} from "lucide-react";
import { confirmSlips, deletePendingSlip, getPendingSlipView, setPendingSlipReady, uploadSlip } from "../../services/slipsService";
import { createCategory } from "../../services/categoriesService";
import { useCategories } from "../../hooks/useCategories";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateCategoryModal from "./CreateCategoryModal";
import CreateBankAccountModal from "./CreateBankAccountModal";
import { useCreditCards } from "../../hooks/useCreditCards";
import { PaymentMethod } from "@moneyflow/shared";
import { useAuthStore } from "../../store/auth.store";
import PaymentSourceSelect from "./PaymentSourceSelect";
import DatePickerField from "./DatePickerField";
import MonthPickerField from "./MonthPickerField";

export interface SlipItemState {
  id: string; // unique local ID
  file: File;
  previewUrl: string;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
  requiresManualEntry?: boolean;
  readyForSave?: boolean;
  slipId?: string;
  formData: {
    type: "income" | "expense";
    amount: string;
    categoryId: string;
    note: string;
    date: string;
    isNextMonthCycle?: boolean;
    targetMonth?: number;
    targetYear?: number;
    cycleManuallySelected?: boolean;
    suggestedCategory?: string;
    slipImageUrl?: string;
    documentType?: string;
    paymentMethod?: PaymentMethod;
    bankAccountId?: string;
    creditCardId?: string;
    creditCardLast4?: string;
    feeAmount?: string;
    receiptInterestRate?: string;
    minimumPaymentRate?: string;
    minimumPaymentAmount?: string;
    statementDueDate?: string;
    referenceNumber?: string;
  };
}

export interface PendingSlipUpload {
  id: string;
  imageUrl: string | null;
  fileName: string;
  status: "success" | "failed";
  extractedData: Record<string, any> | null;
  errorMessage: string | null;
  readyForSave?: boolean;
}

const getDefaultCycle = (dateString?: string) => {
  const date = dateString ? new Date(`${dateString}T12:00:00`) : new Date();
  return { targetMonth: date.getMonth() + 1, targetYear: date.getFullYear() };
};

const slipDateFormat = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit" });
const cycleFormat = new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit" });

const cycleInputValue = (month?: number, year?: number) =>
  month && year ? `${year}-${String(month).padStart(2, "0")}` : "";

interface BulkSlipUploadModalProps {
  initialFiles: File[];
  pendingUploads: PendingSlipUpload[];
  isOpen: boolean;
  onOpen: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkSlipUploadModal: React.FC<BulkSlipUploadModalProps> = ({
  initialFiles,
  pendingUploads,
  isOpen,
  onOpen,
  onMinimize,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null);
  const { data: categories = [] } = useCategories();
  const { data: creditCards = [] } = useCreditCards();
  const lineUserId = useAuthStore((state) => state.user?.lineUserId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trayButtonRef = useRef<HTMLButtonElement>(null);
  const trayDragRef = useRef<{ startX: number; startY: number; left: number; top: number; moved: boolean } | null>(null);
  const suppressTrayClickRef = useRef(false);
  const [trayDragging, setTrayDragging] = useState(false);
  const [trayPosition, setTrayPosition] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const keepTrayVisible = () => {
      const button = trayButtonRef.current;
      if (!button) return;
      setTrayPosition((position) => position && ({
        left: position.left < window.innerWidth / 2 ? 0 : Math.max(0, window.innerWidth - button.offsetWidth),
        top: Math.max(0, Math.min(position.top, window.innerHeight - button.offsetHeight)),
      }));
    };
    window.addEventListener("resize", keepTrayVisible);
    return () => window.removeEventListener("resize", keepTrayVisible);
  }, []);
  const swipeStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const hasHydratedPendingUploads = useRef(false);
  const draftStorageKey = `moneyflow-slip-drafts:${lineUserId || "anonymous"}`;

  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number | null>(null);
  const [items, setItems] = useState<SlipItemState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [activeItemForCategory, setActiveItemForCategory] = useState<string | null>(null);
  const [activeItemForBankAccount, setActiveItemForBankAccount] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const [readinessFilter, setReadinessFilter] = useState<"all" | "ready" | "needs-review">("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [readyUpdatingItemId, setReadyUpdatingItemId] = useState<string | null>(null);
  const [readinessErrors, setReadinessErrors] = useState<Record<string, string[]>>({});
  
  // State for Full-Screen Image Lightbox
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(min-width: 640px)").matches) setIsFilterPanelOpen(true);
  }, []);

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
          ...getDefaultCycle(),
        },
      }));

      setItems((currentItems) => [...currentItems, ...newItems]);

      // Trigger upload for each file in parallel
      newItems.forEach((item) => {
        uploadAndExtractSlip(item);
      });
    }
  }, [initialFiles]);

  useEffect(() => {
    if (hasHydratedPendingUploads.current || pendingUploads.length === 0) {
      return;
    }

    hasHydratedPendingUploads.current = true;
    let savedDrafts: Record<string, SlipItemState["formData"]> = {};
    try {
      savedDrafts = JSON.parse(localStorage.getItem(draftStorageKey) || "{}");
    } catch {
      localStorage.removeItem(draftStorageKey);
    }

    const restoredItems: SlipItemState[] = pendingUploads.map((upload) => {
      const extracted = upload.extractedData || {};
      const isCreditReceipt = ["credit_card_statement", "cash_advance"].includes(
        extracted.documentType,
      );
      const isIncome = extracted.transactionType === "income" && !isCreditReceipt;
      const isPdf = upload.fileName.toLowerCase().endsWith(".pdf");
      const extractedForm: SlipItemState["formData"] = {
        type: isIncome ? "income" : "expense",
        amount: extracted.cashAdvanceAmount || extracted.amount
          ? String(extracted.cashAdvanceAmount || extracted.amount)
          : "",
        categoryId: "",
        note: extracted.toName || extracted.toBank || "",
        date: extracted.transactionDate || new Date().toISOString().split("T")[0],
        isNextMonthCycle: false,
        ...getDefaultCycle(extracted.transactionDate),
        suggestedCategory: extracted.suggestedCategory,
        slipImageUrl: upload.imageUrl || undefined,
        documentType: extracted.documentType,
        creditCardLast4: extracted.creditCardLast4 || "",
        feeAmount: extracted.feeAmount != null ? String(extracted.feeAmount) : "",
        receiptInterestRate:
          extracted.receiptInterestRate != null
            ? String(extracted.receiptInterestRate)
            : "",
        minimumPaymentRate:
          extracted.minimumPaymentRate != null
            ? String(extracted.minimumPaymentRate)
            : "",
        minimumPaymentAmount:
          extracted.minimumPaymentAmount != null
            ? String(extracted.minimumPaymentAmount)
            : "",
        statementDueDate: extracted.statementDueDate || "",
        referenceNumber: extracted.referenceNo || "",
      };
      const savedDraft = savedDrafts[upload.id];
      const draftDate = savedDraft?.date || extractedForm.date;

      return {
        id: `restored_${upload.id}`,
        file: new File([], upload.fileName, {
          type: isPdf ? "application/pdf" : "image/webp",
        }),
        previewUrl: upload.imageUrl || "",
        status: "success",
        slipId: upload.id,
        requiresManualEntry: upload.status === "failed",
        readyForSave: Boolean(upload.readyForSave),
        errorMessage: upload.errorMessage || undefined,
        formData: {
          ...extractedForm,
          ...savedDraft,
          ...(savedDraft?.cycleManuallySelected
            ? {}
            : getDefaultCycle(draftDate)),
        },
      };
    });

    setItems((currentItems) => {
      const restoredIds = new Set(restoredItems.map((item) => item.slipId));
      return [
        ...restoredItems,
        ...currentItems.filter((item) => !item.slipId || !restoredIds.has(item.slipId)),
      ];
    });
  }, [draftStorageKey, pendingUploads]);

  useEffect(() => {
    const drafts = items.reduce<Record<string, SlipItemState["formData"]>>(
      (saved, item) => {
        if (item.slipId) saved[item.slipId] = item.formData;
        return saved;
      },
      {},
    );

    if (Object.keys(drafts).length > 0) {
      localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
    }
  }, [draftStorageKey, items]);

  // Upload single slip and run OCR
  const uploadAndExtractSlip = async (item: SlipItemState) => {
    try {
      const data = await uploadSlip(item.file);

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
          const isCreditReceipt = ["credit_card_statement", "cash_advance"].includes(extracted.documentType) || extracted.transactionType === "cash_advance";
          const matchedCard = isCreditReceipt && extracted.creditCardLast4
            ? creditCards.find((card: any) => card.last4 === String(extracted.creditCardLast4).slice(-4))
            : undefined;
          const isIncome = extracted.transactionType === "income" && !isCreditReceipt;
          const slipDate = extracted.transactionDate || i.formData.date;

          return {
            ...i,
            status: "success",
            slipId: data.id,
            readyForSave: Boolean(data.readyForSave),
            requiresManualEntry: Boolean(data.requiresManualEntry),
            formData: {
              ...i.formData,
              amount: (extracted.cashAdvanceAmount || extracted.amount) ? String(extracted.cashAdvanceAmount || extracted.amount) : "",
              date: slipDate,
              note: extracted.toName || extracted.toBank || "",
              type: isIncome ? "income" : "expense",
              documentType: extracted.documentType,
              paymentMethod: matchedCard ? PaymentMethod.CREDIT_CARD : PaymentMethod.CASH,
              creditCardId: matchedCard?._id || "",
              creditCardLast4: extracted.creditCardLast4 || "",
              feeAmount: extracted.feeAmount != null ? String(extracted.feeAmount) : "",
              receiptInterestRate: extracted.receiptInterestRate != null ? String(extracted.receiptInterestRate) : "",
              minimumPaymentRate: extracted.minimumPaymentRate != null ? String(extracted.minimumPaymentRate) : "",
              minimumPaymentAmount: extracted.minimumPaymentAmount != null ? String(extracted.minimumPaymentAmount) : "",
              statementDueDate: extracted.statementDueDate || "",
              referenceNumber: extracted.referenceNo || "",
              isNextMonthCycle: false,
              ...(i.formData.cycleManuallySelected
                ? {}
                : getDefaultCycle(slipDate)),
              suggestedCategory: suggested,
              categoryId: matchedCategoryId || i.formData.categoryId,
              slipImageUrl: data.imageUrl,
            },
          };
        }),
      );
      queryClient.invalidateQueries({ queryKey: ["pending-slips"] });
      queryClient.invalidateQueries({ queryKey: ["pending-slip-view"] });
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
        isNextMonthCycle: false,
        ...getDefaultCycle(),
      },
    }));

    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadAndExtractSlip(item));

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Remove individual item
  const handleRemoveItem = async (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return;

    try {
      if (item.slipId) {
        await deletePendingSlip(item.slipId);
        queryClient.invalidateQueries({ queryKey: ["pending-slips"] });
        queryClient.invalidateQueries({ queryKey: ["pending-slip-view"] });
      }
      URL.revokeObjectURL(item.previewUrl);
      setItems((prev) => prev.filter((candidate) => candidate.id !== id));
      setSelectedItemIds((selected) => {
        const next = new Set(selected);
        next.delete(id);
        return next;
      });
    } catch (error: any) {
      alert(
        "ลบสลิปไม่สำเร็จ: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  // Update form data for single item
  const handleUpdateItemForm = (
    id: string,
    field: keyof SlipItemState["formData"],
    value: any,
  ) => {
    const existingItem = items.find((item) => item.id === id);
    if (existingItem?.readyForSave && existingItem.slipId) {
      void setPendingSlipReady({ id: existingItem.slipId, readyForSave: false });
    }
    setReadinessErrors((current) => ({ ...current, [id]: [] }));
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          formData: {
            ...item.formData,
            [field]: value,
          },
          readyForSave: false,
        };
      }),
    );
  };

  const getReadinessErrors = (item: SlipItemState) => [
    !item.formData.amount && "amount",
    !item.formData.categoryId && "category",
    item.formData.paymentMethod === PaymentMethod.BANK_TRANSFER && !item.formData.bankAccountId && "payment",
    item.formData.paymentMethod === PaymentMethod.CREDIT_CARD && !item.formData.creditCardId && "payment",
  ].filter(Boolean) as string[];

  const isReadyCandidate = (item: SlipItemState) =>
      item.status === "success" &&
      item.slipId &&
      getReadinessErrors(item).length === 0;

  const validSuccessItems = items.filter(
    (item) => item.readyForSave && isReadyCandidate(item),
  );

  const uploadingCount = items.filter((i) => i.status === "uploading").length;
  const pendingCount = items.length - validSuccessItems.length;
  const errorCount = items.filter((item) => item.status === "error").length;
  const { data: pendingView, isLoading: isPendingViewLoading } = useQuery({
    queryKey: ["pending-slip-view", fromDate, toDate, dateSort],
    enabled: isOpen,
    queryFn: () =>
      getPendingSlipView({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sort: dateSort,
      }),
  });
  const visibleItems = (pendingView?.ids || [])
    .map((slipId) => items.find((item) => item.slipId === slipId))
    .filter((item): item is SlipItemState => Boolean(item));
  const readyItemIds = new Set(validSuccessItems.map((item) => item.id));
  const readyVisibleCount = visibleItems.filter((item) => readyItemIds.has(item.id)).length;
  const needsReviewVisibleCount = visibleItems.length - readyVisibleCount;
  const filteredVisibleItems = visibleItems.filter((item) =>
    readinessFilter === "all"
      ? true
      : readinessFilter === "ready"
        ? readyItemIds.has(item.id)
        : !readyItemIds.has(item.id),
  );
  const readyFilteredItems = filteredVisibleItems.filter((item) => readyItemIds.has(item.id));
  const selectedVisibleItems = filteredVisibleItems.filter((item) => selectedItemIds.has(item.id));
  const selectedReadyItems = readyFilteredItems.filter((item) => selectedItemIds.has(item.id));
  const submissionItems = selectedVisibleItems.length > 0 ? selectedReadyItems : readyFilteredItems;
  const isAllFilteredSelected = filteredVisibleItems.length > 0 && selectedVisibleItems.length === filteredVisibleItems.length;
  const totalExpense = filteredVisibleItems.reduce((total, item) => {
    return item.status === "success" && item.formData.type === "expense"
      ? total + (Number(item.formData.amount) || 0)
      : total;
  }, 0);
  const totalIncome = filteredVisibleItems.reduce((total, item) => {
    return item.status === "success" && item.formData.type === "income"
      ? total + (Number(item.formData.amount) || 0)
      : total;
  }, 0);

  // Batch Submit All Confirmed Items
  const handleSubmitAll = async () => {
    if (submissionItems.length === 0) {
      alert("กรุณากรอกยอดเงินและเลือกหมวดหมู่ให้ครบถ้วนอย่างน้อย 1 รายการ");
      return;
    }

    setIsSubmitting(true);
    try {
      const confirmPayload = submissionItems.map((item) => ({
        slipId: item.slipId!,
        transactionData: {
          amount: Number(item.formData.amount),
          type: item.formData.type,
          categoryId: item.formData.categoryId,
          note: item.formData.note,
          date: item.formData.date,
          isNextMonthCycle: false,
          targetMonth: item.formData.targetMonth,
          targetYear: item.formData.targetYear,
          slipImageUrl: item.formData.slipImageUrl,
          ...(item.formData.creditCardId ? {
            paymentMethod: PaymentMethod.CREDIT_CARD,
            creditCardId: item.formData.creditCardId,
            statementDueDate: item.formData.statementDueDate || undefined,
          } : item.formData.paymentMethod === PaymentMethod.BANK_TRANSFER ? {
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            bankAccountId: item.formData.bankAccountId,
          } : { paymentMethod: PaymentMethod.CASH }),
          documentType: item.formData.documentType,
          cashAdvanceAmount: item.formData.documentType === "cash_advance" ? Number(item.formData.amount) : undefined,
          feeAmount: item.formData.feeAmount ? Number(item.formData.feeAmount) : undefined,
          receiptInterestRate: item.formData.receiptInterestRate ? Number(item.formData.receiptInterestRate) : undefined,
          minimumPaymentRate: item.formData.minimumPaymentRate ? Number(item.formData.minimumPaymentRate) : undefined,
          minimumPaymentAmount: item.formData.minimumPaymentAmount ? Number(item.formData.minimumPaymentAmount) : undefined,
          referenceNumber: item.formData.referenceNumber || undefined,
        },
      }));

      await confirmSlips({ items: confirmPayload });

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

  const handleReadyForSave = async (item: SlipItemState, readyForSave: boolean) => {
    if (!item.slipId) return;
    const errors = getReadinessErrors(item);
    if (readyForSave && (!isReadyCandidate(item) || errors.length > 0)) {
      setReadinessErrors((current) => ({ ...current, [item.id]: errors }));
      setExpandedItemId(item.id);
      window.setTimeout(() => document.getElementById(`slip-field-${item.id}-${errors[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }
    setReadyUpdatingItemId(item.id);
    try {
      await setPendingSlipReady({ id: item.slipId, readyForSave });
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, readyForSave } : currentItem));
    } catch (error: any) {
      alert("เปลี่ยนสถานะไม่สำเร็จ: " + (error.response?.data?.message || error.message));
    } finally {
      setReadyUpdatingItemId(null);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((selected) => {
      const next = new Set(selected);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllFilteredSelection = () => {
    setSelectedItemIds((selected) => {
      const next = new Set(selected);
      if (isAllFilteredSelected) {
        filteredVisibleItems.forEach((item) => next.delete(item.id));
      } else {
        filteredVisibleItems.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedVisibleItems.length === 0) return;
    if (!window.confirm(`ลบสลิปที่เลือก ${selectedVisibleItems.length} รายการหรือไม่?`)) return;

    await Promise.all(selectedVisibleItems.map((item) => handleRemoveItem(item.id)));
  };

  return (
    <>
      {!isOpen && items.length > 0 && (
        <button
          type="button"
          ref={trayButtonRef}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            const rect = event.currentTarget.getBoundingClientRect();
            trayDragRef.current = { startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = trayDragRef.current;
            if (!drag) return;
            const dx = event.clientX - drag.startX;
            const dy = event.clientY - drag.startY;
            if (!drag.moved && Math.hypot(dx, dy) < 6) return;
            drag.moved = true;
            setTrayDragging(true);
            setTrayPosition({
              left: Math.max(0, Math.min(drag.left + dx, window.innerWidth - event.currentTarget.offsetWidth)),
              top: Math.max(0, Math.min(drag.top + dy, window.innerHeight - event.currentTarget.offsetHeight)),
            });
          }}
          onPointerUp={(event) => {
            const drag = trayDragRef.current;
            suppressTrayClickRef.current = Boolean(drag?.moved);
            if (drag?.moved) {
              const width = event.currentTarget.offsetWidth;
              const left = Math.max(0, Math.min(drag.left + event.clientX - drag.startX, window.innerWidth - width));
              setTrayPosition({
                left: left + width / 2 < window.innerWidth / 2 ? 0 : Math.max(0, window.innerWidth - width),
                top: Math.max(0, Math.min(drag.top + event.clientY - drag.startY, window.innerHeight - event.currentTarget.offsetHeight)),
              });
            }
            trayDragRef.current = null;
            setTrayDragging(false);
          }}
          onPointerCancel={(event) => {
            trayDragRef.current = null;
            setTrayDragging(false);
            setTrayPosition((position) => position && ({ ...position, left: position.left + event.currentTarget.offsetWidth / 2 < window.innerWidth / 2 ? 0 : Math.max(0, window.innerWidth - event.currentTarget.offsetWidth) }));
          }}
          onClick={() => {
            if (suppressTrayClickRef.current) { suppressTrayClickRef.current = false; return; }
            onOpen();
          }}
          style={{ ...(trayPosition ? { left: trayPosition.left, top: trayPosition.top, right: "auto", bottom: "auto" } : {}), touchAction: "none", transition: trayDragging || reduceMotion ? "none" : "left 220ms ease-out, top 220ms ease-out" }}
          className="fixed bottom-5 right-0 z-[90] flex min-h-14 items-center gap-3 rounded-2xl bg-indigo-600 px-4 py-3 text-left text-white shadow-xl shadow-indigo-950/25 transition-transform hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-95"
          aria-label={`เปิดถาดอัปโหลดสลิป มี ${items.length} รายการ`}
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/15">
            <ShoppingBag size={20} />
            <span className="absolute -right-2 -top-2 grid min-h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[11px] font-black text-slate-900">
              {items.length}
            </span>
          </span>
          <span className="hidden leading-tight sm:block">
            <strong className="block text-sm">ถาดอัปโหลด</strong>
            <small className="block text-xs text-indigo-100">
              {uploadingCount > 0
                ? `กำลังอ่าน ${uploadingCount} รายการ`
                : `รอดำเนินการ ${pendingCount} รายการ`}
            </small>
          </span>
        </button>
      )}

      {/* Create Category Modal */}
      {isOpen && activeItemForBankAccount && (
        <CreateBankAccountModal
          onClose={() => setActiveItemForBankAccount(null)}
          onCreated={(bankAccountId) => {
            handleUpdateItemForm(activeItemForBankAccount, "paymentMethod", PaymentMethod.BANK_TRANSFER);
            handleUpdateItemForm(activeItemForBankAccount, "bankAccountId", bankAccountId);
            handleUpdateItemForm(activeItemForBankAccount, "creditCardId", "");
            setActiveItemForBankAccount(null);
          }}
        />
      )}

      {isOpen && showCreateCategory && (
        <CreateCategoryModal
          onClose={() => setShowCreateCategory(false)}
          onSubmit={async (data) => {
            try {
              const newCat = await createCategory({
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

      {isOpen && isCategoryPickerOpen && activeItemForCategory && (() => {
        const activeItem = items.find((item) => item.id === activeItemForCategory);
        const availableCategories = categories.filter(
          (category) => category.type === activeItem?.formData.type,
        );

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-picker-title"
            className="fixed inset-0 z-[160] flex flex-col bg-slate-50"
          >
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
              <div>
                <p className="text-xs font-bold text-indigo-600">
                  {activeItem?.formData.type === "income" ? "รายรับ" : "รายจ่าย"}
                </p>
                <h2 id="category-picker-title" className="text-xl font-black text-slate-900">
                  เลือกหมวดหมู่
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryPickerOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="ปิดตัวเลือกหมวดหมู่"
              >
                <X size={21} />
              </button>
            </header>

            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-4 py-5 sm:px-8">
              <div className="flex-1 overflow-y-auto pb-6">
                {availableCategories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {availableCategories.map((category) => {
                      const isSelected = activeItem?.formData.categoryId === category._id;
                      return (
                        <button
                          key={category._id}
                          type="button"
                          onClick={() => {
                            handleUpdateItemForm(activeItemForCategory, "categoryId", category._id);
                            setIsCategoryPickerOpen(false);
                          }}
                          className={`flex min-h-24 flex-col items-start justify-between rounded-xl border p-4 text-left transition-colors ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                        >
                          <span className="text-2xl">{category.icon || "📦"}</span>
                          <span className="mt-3 text-sm font-black leading-tight">{category.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-medium text-slate-500">
                    ไม่พบหมวดหมู่ที่ค้นหา
                  </div>
                )}
              </div>
            </div>

            <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-8">
              <div className="mx-auto flex w-full max-w-4xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryPickerOpen(false);
                    setShowCreateCategory(true);
                  }}
                  className="min-h-12 w-full rounded-xl border border-dashed border-indigo-300 px-4 text-sm font-black text-indigo-700 transition-colors hover:bg-indigo-50"
                >
                  <Plus size={18} className="mr-2 inline-block" />
                  สร้างหมวดหมู่ใหม่
                </button>
              </div>
            </footer>
          </div>
        );
      })()}

      {/* Full-Screen Image Lightbox Modal */}
      {isOpen && zoomedImage && (
        <div
          className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            aria-label="ปิดภาพสลิปขนาดเต็ม"
            className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
          >
            <X size={28} />
          </button>
          <img
            src={zoomedImage}
            alt="ภาพสลิปขนาดเต็ม"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {isOpen && <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) onMinimize();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-upload-title"
          className="bg-slate-50 w-full max-w-5xl rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 h-[96dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden"
        >
          <header className="shrink-0 bg-[rgb(var(--hero))] px-4 py-3 text-[rgb(var(--hero-ink))] sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <Receipt size={24} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 id="bulk-upload-title" className="text-lg font-semibold sm:text-xl">ตรวจสอบสลิป</h2>
                <p className="text-xs leading-relaxed opacity-90" aria-live="polite">
                  พร้อมบันทึก {validSuccessItems.length} จาก {items.length} รายการ
                  {uploadingCount > 0 && ` · กำลังอ่าน ${uploadingCount}`}
                  {errorCount > 0 && ` · อ่านไม่สำเร็จ ${errorCount}`}
                </p>
              </div>
              <button type="button" onClick={onMinimize} disabled={isSubmitting}
                aria-label="ย่อเก็บถาดอัปโหลด" title="ย่อเก็บไว้ทำต่อภายหลัง"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-white/10">
                <X size={21} />
              </button>
            </div>
          </header>

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
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 sm:px-6 sm:py-4 space-y-2 custom-scrollbar">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Receipt size={48} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold">ยังไม่มีสลิปที่เลือก</p>
              </div>
            ) : (
              <>
                <section className="border-b border-slate-200 pb-1">
                  <button type="button" aria-expanded={isFilterPanelOpen} onClick={() => setIsFilterPanelOpen((open) => !open)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-1 text-left">
                    <span className="text-sm font-semibold text-slate-800">สลิปที่แสดง · {filteredVisibleItems.length} ใบ</span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                      <SlidersHorizontal size={15} /> ตัวกรอง
                      <ChevronDown size={15} className={`transition-transform duration-200 motion-reduce:transition-none ${isFilterPanelOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                  {isFilterPanelOpen && <motion.div initial={{ height: 0, opacity: 0, overflow: "hidden" }} animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }} exit={{ height: 0, opacity: 0, overflow: "hidden" }} transition={{ duration: reduceMotion ? 0 : 0.2 }}>
                    <div className="mt-3">
                    {(fromDate || toDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFromDate("");
                          setToDate("");
                        }}
                        className="mb-2 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                      >
                        ล้างวันที่
                      </button>
                    )}
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
                    <DatePickerField value={fromDate} onChange={setFromDate} max={toDate || undefined} placeholder="ตั้งแต่วันที่" ariaLabel="ตั้งแต่วันที่" />
                    <DatePickerField value={toDate} onChange={setToDate} min={fromDate || undefined} placeholder="ถึงวันที่" ariaLabel="ถึงวันที่" />
                    <label className="relative block">
                      <span className="sr-only">เรียงลำดับวันที่</span>
                      <ArrowDownUp size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        value={dateSort}
                        onChange={(event) => setDateSort(event.target.value as "newest" | "oldest")}
                        className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-800 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="newest">ใหม่สุดก่อน</option>
                        <option value="oldest">เก่าสุดก่อน</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="กรองความพร้อมของรายการ">
                    {[
                      { value: "all", label: "ทั้งหมด", count: visibleItems.length, icon: Receipt },
                      { value: "ready", label: "พร้อมบันทึก", count: readyVisibleCount, icon: CheckCircle2 },
                      { value: "needs-review", label: "ยังไม่พร้อม", count: needsReviewVisibleCount, icon: AlertCircle },
                    ].map(({ value, label, count, icon: Icon }) => {
                      const isSelected = readinessFilter === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReadinessFilter(value as "all" | "ready" | "needs-review")}
                          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          }`}
                        >
                          <Icon size={15} />
                          {label} ({count})
                        </button>
                      );
                    })}
                  </div>
                  {filteredVisibleItems.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={isAllFilteredSelected}
                          onChange={toggleAllFilteredSelection}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        เลือกทั้งหมดในผลลัพธ์ ({filteredVisibleItems.length})
                      </label>
                      {selectedVisibleItems.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">เลือก {selectedVisibleItems.length} รายการ</span>
                          <button
                            type="button"
                            onClick={handleDeleteSelected}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                          >
                            <Trash2 size={15} />
                            ลบที่เลือก
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                    </div>
                  </motion.div>}
                  </AnimatePresence>
                </section>
                <p className="px-1 text-xs text-slate-500 sm:hidden">ปัดการ์ดสลิปไปทางซ้ายเพื่อแสดงปุ่มลบ</p>
                {isPendingViewLoading ? (
                  <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-medium text-slate-500">
                    <Loader2 size={22} className="animate-spin text-indigo-600" />
                  </div>
                ) : filteredVisibleItems.length === 0 ? (
                  <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-medium text-slate-500">
                    {visibleItems.length === 0 ? "ไม่พบสลิปในช่วงวันที่เลือก" : "ไม่พบรายการตามสถานะที่เลือก"}
                  </div>
                ) : filteredVisibleItems.map((item, index) => {
                const filteredCats = categories.filter(
                  (c) => c.type === item.formData.type,
                );

                const isPdf =
                  item.file?.type === "application/pdf" ||
                  item.file?.name.toLowerCase().endsWith(".pdf") ||
                  item.formData.slipImageUrl?.toLowerCase().includes(".pdf");
                const isExpanded = expandedItemId === item.id;
                const amountLabel = item.formData.amount
                  ? `฿${Number(item.formData.amount).toLocaleString("th-TH")}`
                  : "ยังไม่ระบุยอด";
                const statusLabel =
                  item.status === "uploading"
                    ? "กำลังอ่านด้วย AI"
                    : item.status === "error"
                      ? "อ่านสลิปไม่สำเร็จ"
                      : item.requiresManualEntry
                        ? "กรอกข้อมูลเอง"
                        : "อ่านสลิปแล้ว";
                const isReadyToSave = readyItemIds.has(item.id);
                const slipDate = new Date(item.formData.date + "T12:00:00");
                const dateLabel = Number.isNaN(slipDate.getTime()) ? "ยังไม่ระบุวันที่" : slipDateFormat.format(slipDate);
                const { targetMonth, targetYear } = item.formData;
                const cycleLabel = targetMonth && targetYear ? cycleFormat.format(new Date(targetYear, targetMonth - 1, 1)) : "ยังไม่ระบุ";
                const canMarkReady = isReadyCandidate(item);

                return (
                  <div
                    key={item.id}
                    className="relative rounded-2xl bg-rose-600 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        void handleRemoveItem(item.id);
                        setSwipedItemId(null);
                      }}
                      tabIndex={swipedItemId === item.id ? 0 : -1}
                      aria-hidden={swipedItemId !== item.id}
                      aria-label={`ลบสลิปใบที่ ${index + 1}`}
                      className="absolute inset-y-0 right-0 flex w-20 flex-col items-center justify-center gap-1 rounded-r-2xl text-sm font-bold text-white"
                    >
                      <Trash2 size={22} /> ลบ
                    </button>
                    <motion.div
                      animate={{ x: swipeOffset !== null && swipeStartRef.current?.id === item.id ? swipeOffset : swipedItemId === item.id ? -80 : 0 }}
                      transition={{ duration: swipeOffset !== null || reduceMotion ? 0 : 0.2 }}
                      onTouchStart={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest("input, select, textarea") || (isExpanded && target.closest("button"))) return;
                        const touch = event.touches[0];
                        swipeStartRef.current = { id: item.id, x: touch.clientX, y: touch.clientY };
                      }}
                      onTouchMove={(event) => {
                        const start = swipeStartRef.current;
                        if (!start || start.id !== item.id) return;
                        const touch = event.touches[0];
                        const dx = touch.clientX - start.x;
                        const dy = touch.clientY - start.y;
                        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                          const base = swipedItemId === item.id ? -80 : 0;
                          setSwipeOffset(Math.max(-80, Math.min(0, base + dx)));
                        }
                      }}
                      onTouchEnd={(event) => {
                        const start = swipeStartRef.current;
                        if (start && start.id === item.id) {
                          const touch = event.changedTouches[0];
                          const dx = touch.clientX - start.x;
                          const dy = touch.clientY - start.y;
                          if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                            event.preventDefault();
                            setSwipedItemId(dx < 0 ? item.id : null);
                          }
                        }
                        swipeStartRef.current = null;
                        setSwipeOffset(null);
                      }}
                      onTouchCancel={() => { swipeStartRef.current = null; setSwipeOffset(null); }}
                      className="relative rounded-2xl border border-slate-200 bg-white p-3 sm:p-5"
                    >
                    <AnimatePresence initial={false} mode="wait">
                    {!isExpanded ? (
                      <motion.div key="collapsed" initial={{ height: 0, opacity: 0, overflow: "hidden" }} animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }} exit={{ height: 0, opacity: 0, overflow: "hidden" }} transition={{ duration: reduceMotion ? 0 : 0.16 }} className="flex items-center gap-3 sm:gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`เลือกรายการสลิปใบที่ ${index + 1}`}
                          className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(item.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          aria-label={`เปิดแก้ไขสลิปใบที่ ${index + 1}`}
                          aria-expanded={false}
                        >
                          <span className="relative grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-[76px] sm:w-16">
                            {isPdf ? (
                              <FileText size={25} className="text-rose-500" />
                            ) : item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={`ตัวอย่างสลิปใบที่ ${index + 1}`}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Receipt size={24} className="text-slate-400" />
                            )}
                            <span className="absolute left-1 top-1 rounded bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-black text-white">
                              #{index + 1}
                            </span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <strong className="text-sm font-black text-slate-900">
                                {amountLabel}
                              </strong>
                              <span
                                className={`text-xs font-bold ${
                                  item.status === "uploading"
                                    ? "text-indigo-600"
                                    : item.status === "error" || item.requiresManualEntry
                                      ? "text-amber-700"
                                      : "text-emerald-700"
                                }`}
                              >
                                {statusLabel}
                              </span>
                              {isReadyToSave && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                                  <CheckCircle2 size={13} />
                                  พร้อมบันทึก
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block truncate text-xs text-slate-500">
                              {item.formData.note || item.file?.name || "แตะเพื่อตรวจสอบรายละเอียด"}
                            </span>
                            <span className="mt-1 block text-xs font-medium text-slate-400">
                              {item.formData.date || "ยังไม่ระบุวันที่"}
                            </span>
                          </span>
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                            <ChevronRight size={18} />
                          </span>
                        </button>
                      </motion.div>
                    ) : (
                    <motion.div key="expanded" initial={{ height: 0, opacity: 0, overflow: "hidden" }} animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }} exit={{ height: 0, opacity: 0, overflow: "hidden" }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="flex flex-col items-stretch gap-3 sm:flex-row sm:gap-5">
                      <div className="min-w-0 shrink-0 sm:w-48">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPdf) window.open(item.previewUrl || item.formData.slipImageUrl, "_blank", "noopener,noreferrer");
                            else setZoomedImage(item.previewUrl);
                          }}
                          disabled={!item.previewUrl && !(isPdf && item.formData.slipImageUrl)}
                          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:border-indigo-300 sm:flex-col sm:items-stretch sm:p-3"
                        >
                          <span className="grid h-14 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-white sm:h-52 sm:w-full">
                            {isPdf ? <FileText size={26} /> : item.previewUrl ? (
                              <img src={item.previewUrl} alt="" className="h-full w-full object-contain" />
                            ) : <Receipt size={24} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs text-slate-500">สลิปใบที่ {index + 1}</span>
                            <strong className="block truncate text-base font-semibold text-slate-900">{item.formData.note || "รายละเอียดสลิป"}</strong>
                            {isPdf && <span className="block truncate text-xs text-slate-500" title={item.file?.name}>
                              {item.file?.name || "เอกสาร PDF"}{item.file?.size ? ` · ${(item.file.size / 1048576).toFixed(2)} MB` : ""}
                            </span>}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-indigo-700">
                            <ZoomIn size={16} /> {isPdf ? "เปิด PDF" : "ดูสลิป"}
                          </span>
                        </button>
                      </div>

                      {/* Details & Form Controls */}
                      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                        {/* Top Status & Remove Bar */}
                        <div className="flex items-center justify-between gap-2">
                          {/* Status Badge */}
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            aria-label={`เลือกรายการสลิปใบที่ ${index + 1}`}
                            className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {item.status === "uploading" && (
                            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3.5 py-1.5 rounded-full text-xs font-bold animate-pulse">
                              <Loader2 size={16} className="animate-spin" />
                              <span>กำลังวิเคราะห์ด้วย AI...</span>
                            </div>
                          )}
                          {item.status === "success" && !isReadyToSave && (
                            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                              item.requiresManualEntry
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-600"
                            }`}>
                              {item.requiresManualEntry ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                              <span>{item.requiresManualEntry ? "กรอกข้อมูลเอง" : "อ่านสลิปแล้ว"}</span>
                            </div>
                          )}
                          {isReadyToSave && (
                            <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
                              <CheckCircle2 size={15} />
                              <span>พร้อมบันทึกรายการ</span>
                            </div>
                          )}
                          {item.status === "error" && (
                            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3.5 py-1.5 rounded-full text-xs font-bold">
                              <AlertCircle size={16} />
                              <span>{item.errorMessage || "อ่านสลิปไม่สำเร็จ"}</span>
                            </div>
                          )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setExpandedItemId(null)}
                              className="grid h-11 w-11 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                              aria-label="ย่อรายละเอียดสลิป"
                              title="ย่อรายละเอียด"
                            >
                              <ChevronUp size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Amount & Type Input Row */}
                        <div className="grid grid-cols-2 items-start gap-2">
                          {/* Type Selector */}
                          <div className="flex min-w-0 rounded-xl bg-gray-100 p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemForm(
                                  item.id,
                                  "type",
                                  "expense",
                                )
                              }
                              aria-pressed={item.formData.type === "expense"}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                item.formData.type === "expense"
                                  ? "bg-surface text-red-500 shadow-sm"
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
                              aria-pressed={item.formData.type === "income"}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                item.formData.type === "income"
                                  ? "bg-surface text-emerald-500 shadow-sm"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              รายรับ
                            </button>
                          </div>

                          {/* Amount Input */}
                          <div id={`slip-field-${item.id}-amount`} className="relative">
                            <span className="absolute left-3 top-2.5 text-indigo-600 text-base font-black">
                              ฿
                            </span>
                            <input
                              type="number"
                              inputMode="decimal"
                              aria-label="จำนวนเงิน (บาท)"
                              placeholder="0.00"
                              value={item.formData.amount}
                              onChange={(e) =>
                                handleUpdateItemForm(
                                  item.id,
                                  "amount",
                                  e.target.value,
                                )
                              }
                              className={`w-full bg-gray-50 border rounded-2xl py-2 pl-9 pr-4 text-lg font-semibold tabular-nums text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${readinessErrors[item.id]?.includes("amount") ? "border-rose-500 ring-2 ring-rose-100" : "border-gray-200"}`}
                            />
                            {readinessErrors[item.id]?.includes("amount") && <p className="mt-1 text-xs font-bold text-rose-600">กรุณาระบุจำนวนเงิน</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 items-start gap-2 max-[359px]:grid-cols-1">
                          <div id={`slip-field-${item.id}-category`} className="min-w-0">
                            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                              หมวดหมู่
                            </label>
                            {(() => {
                              const selectedCategory = filteredCats.find(
                                (category) => category._id === item.formData.categoryId,
                              );

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveItemForCategory(item.id);
                                    setIsCategoryPickerOpen(true);
                                  }}
                                  className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-3 text-left transition-colors ${
                                    readinessErrors[item.id]?.includes("category")
                                      ? "border-rose-500 bg-rose-50 text-rose-700"
                                      : selectedCategory
                                      ? "border-indigo-200 bg-indigo-50 text-indigo-950"
                                      : "border-dashed border-slate-300 bg-white text-slate-500 hover:border-indigo-400 hover:bg-indigo-50"
                                  }`}
                                >
                                  <span className="flex min-w-0 items-center gap-2.5">
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-lg shadow-sm">
                                      {selectedCategory?.icon || "📦"}
                                    </span>
                                    <span className="truncate text-sm font-bold">
                                      {selectedCategory?.name || "เลือกหมวดหมู่"}
                                    </span>
                                  </span>
                                  <ChevronRight size={18} className="shrink-0" />
                                </button>
                              );
                            })()}
                            {readinessErrors[item.id]?.includes("category") && <p className="mt-1 text-xs font-bold text-rose-600">กรุณาเลือกหมวดหมู่</p>}
                          </div>
                          <div id={`slip-field-${item.id}-payment`} className="min-w-0">
                            <PaymentSourceSelect
                              paymentMethod={item.formData.paymentMethod}
                              bankAccountId={item.formData.bankAccountId}
                              creditCardId={item.formData.creditCardId}
                              label={item.formData.type === "income" ? "รับจาก" : "ชำระด้วย"}
                              onChange={({ paymentMethod, bankAccountId, creditCardId }) => {
                                handleUpdateItemForm(item.id, "paymentMethod", paymentMethod);
                                handleUpdateItemForm(item.id, "bankAccountId", bankAccountId || "");
                                handleUpdateItemForm(item.id, "creditCardId", creditCardId || "");
                              }}
                              onAddBankAccount={() => setActiveItemForBankAccount(item.id)}
                            />
                            {readinessErrors[item.id]?.includes("payment") && <p className="mt-1 text-xs font-bold text-rose-600">กรุณาเลือกบัญชีหรือบัตรที่ใช้ชำระ</p>}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200">
                          <button type="button" aria-expanded={openDetailsId === item.id} onClick={() => setOpenDetailsId(openDetailsId === item.id ? null : item.id)} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left">
                            <CalendarDays size={17} className="text-slate-500" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-semibold text-slate-700">วันที่ โน้ต และรอบบัญชี</span>
                              <span className="block text-xs text-slate-500">{dateLabel} · รอบ {cycleLabel}</span>
                            </span>
                            <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 motion-reduce:transition-none ${openDetailsId === item.id ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence initial={false}>
                          {openDetailsId === item.id && <motion.div initial={{ height: 0, opacity: 0, overflow: "hidden" }} animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }} exit={{ height: 0, opacity: 0, overflow: "hidden" }} transition={{ duration: reduceMotion ? 0 : 0.2 }}>
                          <div className="border-t border-slate-200 p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <label htmlFor={`slip-${item.id}-date`} className="text-xs font-semibold text-slate-600 block mb-1">
                                  วันที่
                                </label>
                                <input
                                  id={`slip-${item.id}-date`}
                                  type="date"
                                  value={item.formData.date}
                                  onChange={(e) => {
                                    const date = e.target.value;
                                    handleUpdateItemForm(item.id, "date", date);
                                    if (!item.formData.cycleManuallySelected) {
                                      const cycle = getDefaultCycle(date);
                                      handleUpdateItemForm(item.id, "targetMonth", cycle.targetMonth);
                                      handleUpdateItemForm(item.id, "targetYear", cycle.targetYear);
                                    }
                                  }}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-700"
                                />
                              </div>
                              <div>
                                <label htmlFor={`slip-${item.id}-note`} className="text-xs font-semibold text-slate-600 block mb-1">
                                  โน้ต / คำอธิบาย
                                </label>
                                <input
                                  id={`slip-${item.id}-note`}
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

                            <div className="mt-2">
                              <label className="block text-[11px] font-black text-indigo-950">
                                นับในรอบบัญชีเดือน
                              </label>
                              <div className="mt-1 flex items-center gap-3">
                                <MonthPickerField
                                  value={cycleInputValue(
                                    item.formData.targetMonth,
                                    item.formData.targetYear,
                                  )}
                                  onChange={(value) => {
                                    if (!value) {
                                      const cycle = getDefaultCycle(item.formData.date);
                                      handleUpdateItemForm(item.id, "targetMonth", cycle.targetMonth);
                                      handleUpdateItemForm(item.id, "targetYear", cycle.targetYear);
                                      handleUpdateItemForm(item.id, "cycleManuallySelected", false);
                                      return;
                                    }
                                    const [year, month] = value
                                      .split("-")
                                      .map(Number);
                                    handleUpdateItemForm(item.id, "targetMonth", month);
                                    handleUpdateItemForm(item.id, "targetYear", year);
                                    handleUpdateItemForm(item.id, "cycleManuallySelected", true);
                                  }}
                                  ariaLabel="เลือกเดือนรอบบัญชี"
                                  className="min-w-0 flex-1"
                                />
                                <span className="hidden text-xs font-bold text-indigo-700 sm:block">
                                  เลือกเดือนได้เอง
                                </span>
                              </div>
                            </div>
                          </div>
                          </motion.div>}
                          </AnimatePresence>
                        </div>
                        <button
                          type="button"
                          disabled={readyUpdatingItemId === item.id}
                          onClick={() => handleReadyForSave(item, !item.readyForSave)}
                          className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition-colors ${
                            item.readyForSave
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : canMarkReady
                                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {readyUpdatingItemId === item.id ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                          {item.readyForSave ? "นำออกจากพร้อมบันทึก" : "ยืนยันว่าพร้อมบันทึก"}
                        </button>
                      </div>
                    </motion.div>
                    )}
                    </AnimatePresence>
                    </motion.div>
                  </div>
                );
                })}
              </>
            )}

            {/* Add More Files Card */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-14 border-2 border-dashed border-indigo-200 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-indigo-700 hover:bg-indigo-50 transition-colors font-bold text-sm"
            >
              <Plus size={20} />
              <span>เพิ่มสลิปอื่น ๆ</span>
            </button>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 bg-white px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-3 sm:pb-3">
            <div className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1">
              <div>
                <span className="block text-xs text-slate-500">รายจ่ายที่แสดง</span>
                <strong className="text-base tabular-nums text-[rgb(var(--negative))]">฿{totalExpense.toLocaleString("th-TH")}</strong>
              </div>
              {totalIncome > 0 && (
                <div>
                  <span className="block text-xs text-slate-500">รายรับที่แสดง</span>
                  <strong className="text-base tabular-nums text-[rgb(var(--positive))]">฿{totalIncome.toLocaleString("th-TH")}</strong>
                </div>
              )}
            </div>

            {/* Save All Button */}
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={
                isSubmitting ||
                submissionItems.length === 0 ||
                uploadingCount > 0
              }
              className={`flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-black text-sm sm:text-base transition-colors ${
                submissionItems.length > 0 && uploadingCount === 0
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95"
                  : "bg-slate-100 text-slate-600 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>{selectedVisibleItems.length > 0 ? "บันทึกที่เลือก" : "บันทึก"} {submissionItems.length} รายการ</span>
                </>
              )}
            </button>
          </footer>
        </div>
      </div>}
    </>
  );
};

export default BulkSlipUploadModal;
