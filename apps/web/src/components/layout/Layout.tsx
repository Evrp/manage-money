import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  CreditCard,
  LayoutDashboard,
  List,
  PieChart,
  Target,
  User,
  Cat,
} from "lucide-react";
import BottomNav from "./BottomNav";
import { useAuthStore } from "../../store/auth.store";

const navigation = [
  { to: "/", icon: LayoutDashboard, label: "ภาพรวม", caption: "overview" },
  { to: "/transactions", icon: List, label: "รายการ", caption: "transactions" },
  { to: "/budgets", icon: Target, label: "งบประมาณ", caption: "budgets" },
  { to: "/analytics", icon: PieChart, label: "วิเคราะห์", caption: "insights" },
  {
    to: "/credit-cards",
    icon: CreditCard,
    label: "ช่องทางชำระเงิน",
    caption: "payment-methods",
  },
  { to: "/profile", icon: User, label: "โปรไฟล์", caption: "profile" },
];

const LineProfileAvatar: React.FC<{ pictureUrl?: string; displayName?: string }> = ({
  pictureUrl,
  displayName,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [pictureUrl]);

  return (
    <span className="account-avatar">
      {pictureUrl && !imageFailed ? (
        <img
          src={pictureUrl}
          alt={`รูปโปรไฟล์ ${displayName || "ผู้ใช้"}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <User size={19} aria-hidden="true" />
      )}
    </span>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const mainRef = useRef<HTMLElement>(null);
  const current =
    navigation.find((item) => item.to === pathname) || navigation[0];
  useEffect(() => {
    document.title = `${current.label} · Fumi Manager`;
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname, current.label]);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        ข้ามไปยังเนื้อหา
      </a>
      <aside className="app-sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Cat size={22} />
          </span>
          <span>Fumi</span>&nbsp;Manager
        </Link>
        <p className="nav-eyebrow">YOUR MONEY, IN FOCUS</p>
        <nav aria-label="เมนูหลัก" className="sidebar-links">
          {navigation.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "is-active" : ""}`
              }
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="eyebrow">MAKE ROOM FOR MORE</span>
            <p>
              ให้ทุกการใช้จ่าย
              <br />
              พาคุณเข้าใกล้เป้าหมาย
            </p>
            <Link to="/budgets">
              วางแผนงบประมาณ <ArrowUpRight size={16} />
            </Link>
          </div>
          <Link to="/profile" className="sidebar-account">
            <LineProfileAvatar pictureUrl={user?.pictureUrl} displayName={user?.displayName} />
            <span>
              <strong>{user?.displayName || "บัญชีของฉัน"}</strong>
              <small>จัดการโปรไฟล์และธีม</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="app-topbar">
          <Link to="/" className="mobile-brand brand">
            <span className="brand-mark">
              <Cat size={20} />
            </span>
            Fumi Manager
          </Link>
          <div className="desktop-breadcrumb">
            พื้นที่การเงินของคุณ <span>/</span> <strong>{current.label}</strong>
          </div>
          <Link
            to="/profile"
            className="topbar-account"
            aria-label="เปิดโปรไฟล์และตั้งค่าธีม"
          >
            <span className="topbar-name">
              {user?.displayName || "บัญชีของฉัน"}
            </span>
            <LineProfileAvatar pictureUrl={user?.pictureUrl} displayName={user?.displayName} />
          </Link>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          ref={mainRef}
          className={`app-main page-${current.caption}`}
        >
          {children}
          <footer className="app-footer">
            <span>Fumi Manager</span>
            <span>จัดการเงินวันนี้ เพื่อวันพรุ่งนี้ที่ดีขึ้น</span>
          </footer>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
export default Layout;
