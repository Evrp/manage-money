import { CategoryType } from "@moneyflow/shared";

export const DEFAULT_CATEGORIES = [
  { name: "อาหาร", type: CategoryType.EXPENSE, icon: "🍔", color: "#FF9500" },
  {
    name: "การเดินทาง",
    type: CategoryType.EXPENSE,
    icon: "🚗",
    color: "#5856D6",
  },
  {
    name: "ที่อยู่อาศัย",
    type: CategoryType.EXPENSE,
    icon: "🏠",
    color: "#AF52DE",
  },
  {
    name: "ช้อปปิ้ง",
    type: CategoryType.EXPENSE,
    icon: "🛍️",
    color: "#FF2D55",
  },
  {
    name: "ความบันเทิง",
    type: CategoryType.EXPENSE,
    icon: "🎬",
    color: "#FFCC00",
  },
  { name: "สุขภาพ", type: CategoryType.EXPENSE, icon: "🏥", color: "#34C759" },
  {
    name: "การศึกษา",
    type: CategoryType.EXPENSE,
    icon: "📚",
    color: "#007AFF",
  },
  {
    name: "สาธารณูปโภค",
    type: CategoryType.EXPENSE,
    icon: "💡",
    color: "#5AC8FA",
  },
  {
    name: "เงินเดือน",
    type: CategoryType.INCOME,
    icon: "💰",
    color: "#06C755",
  },
  { name: "อื่นๆ", type: CategoryType.EXPENSE, icon: "📦", color: "#8E8E93" },
];
