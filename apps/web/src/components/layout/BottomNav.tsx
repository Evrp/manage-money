import { NavLink } from "react-router-dom";
import {
  CreditCard,
  LayoutDashboard,
  List,
  PieChart,
  Target,
} from "lucide-react";
const items = [
  { to: "/", icon: LayoutDashboard, label: "ภาพรวม" },
  { to: "/transactions", icon: List, label: "รายการ" },
  { to: "/budgets", icon: Target, label: "งบประมาณ" },
  { to: "/analytics", icon: PieChart, label: "วิเคราะห์" },
  { to: "/credit-cards", icon: CreditCard, label: "ชำระเงิน" },
];
export default function BottomNav() {
  return (
    <nav className="mobile-nav" aria-label="เมนูหลักบนมือถือ">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `mobile-nav-link ${isActive ? "is-active" : ""}`
          }
        >
          <Icon size={21} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
