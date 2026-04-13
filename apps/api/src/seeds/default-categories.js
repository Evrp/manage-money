"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CATEGORIES = void 0;
const shared_1 = require("@moneyflow/shared");
exports.DEFAULT_CATEGORIES = [
    { name: "อาหาร", type: shared_1.CategoryType.EXPENSE, icon: "🍔", color: "#FF9500" },
    {
        name: "การเดินทาง",
        type: shared_1.CategoryType.EXPENSE,
        icon: "🚗",
        color: "#5856D6",
    },
    {
        name: "ที่อยู่อาศัย",
        type: shared_1.CategoryType.EXPENSE,
        icon: "🏠",
        color: "#AF52DE",
    },
    {
        name: "ช้อปปิ้ง",
        type: shared_1.CategoryType.EXPENSE,
        icon: "🛍️",
        color: "#FF2D55",
    },
    {
        name: "ความบันเทิง",
        type: shared_1.CategoryType.EXPENSE,
        icon: "🎬",
        color: "#FFCC00",
    },
    { name: "สุขภาพ", type: shared_1.CategoryType.EXPENSE, icon: "🏥", color: "#34C759" },
    {
        name: "การศึกษา",
        type: shared_1.CategoryType.EXPENSE,
        icon: "📚",
        color: "#007AFF",
    },
    {
        name: "สาธารณูปโภค",
        type: shared_1.CategoryType.EXPENSE,
        icon: "💡",
        color: "#5AC8FA",
    },
    {
        name: "เงินเดือน",
        type: shared_1.CategoryType.INCOME,
        icon: "💰",
        color: "#06C755",
    },
    { name: "อื่นๆ", type: shared_1.CategoryType.EXPENSE, icon: "📦", color: "#8E8E93" },
];
//# sourceMappingURL=default-categories.js.map