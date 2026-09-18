import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  CreditCard,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Target,
  UserRound,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Theme } from "@moneyflow/shared";
import Layout from "../components/layout/Layout";
import { useAuthStore } from "../store/auth.store";

const themes = [
  { value: Theme.LIGHT, label: "สว่าง", icon: Sun },
  { value: Theme.DARK, label: "มืด", icon: Moon },
  { value: Theme.GREEN, label: "เขียว", icon: Palette },
  { value: Theme.OCEAN, label: "โอเชียน", icon: Waves },
];

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const preference = useAuthStore((state) => state.themePreference);
  const setTheme = useAuthStore((state) => state.setThemePreference);
  const theme = preference || user?.theme || Theme.LIGHT;
  const [imageFailed, setImageFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
  const memberSince =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "ไม่ระบุวันที่";
  return (
    <Layout>
      <header className="page-heading">
        <div>
          <span className="eyebrow">MAKE IT YOURS</span>
          <h1>พื้นที่ของคุณ</h1>
          <p>ข้อมูลบัญชีและหน้าตาที่เหมาะกับสไตล์ของคุณ</p>
        </div>
      </header>
      <div className="profile-grid">
        <section className="panel profile-identity">
          {user?.pictureUrl && !imageFailed ? (
            <img
              className="profile-avatar"
              src={user.pictureUrl}
              alt="รูปโปรไฟล์จาก LINE"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="profile-avatar">
              <UserRound size={34} strokeWidth={1.5} />
            </div>
          )}
          <h2>{user?.displayName || "บัญชีของฉัน"}</h2>
          <span className="status-chip">
            <ShieldCheck size={14} />
            เชื่อมต่อด้วย LINE
          </span>
          <dl className="detail-list">
            <div>
              <dt>อีเมล</dt>
              <dd>{user?.email || "ยังไม่ได้ระบุอีเมล"}</dd>
            </div>
            <div>
              <dt>สมาชิกตั้งแต่</dt>
              <dd>{memberSince}</dd>
            </div>
            <div>
              <dt>สกุลเงินของบัญชี</dt>
              <dd>
                {user?.currency === "THB" || !user?.currency
                  ? "บาทไทย · THB"
                  : user.currency}
              </dd>
            </div>
          </dl>
          <p className="muted text-xs text-left mt-4 leading-relaxed">
            ชื่อและรูปโปรไฟล์มาจากบัญชี LINE ที่ใช้เข้าสู่ระบบ
          </p>
        </section>
        <div className="settings-stack">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">APPEARANCE</span>
                <h2>เลือกบรรยากาศที่ใช่</h2>
                <p>ธีมจะเปลี่ยนทุกหน้าของแอปทันที</p>
              </div>
              <Palette size={21} className="muted" />
            </div>
            <div className="theme-options" role="group" aria-label="เลือกธีม">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  className="theme-option"
                  type="button"
                  aria-pressed={theme === value}
                  onClick={() => {
                    setTheme(value);
                    setAnnouncement("บันทึกธีม" + label + "ในอุปกรณ์นี้แล้ว");
                  }}
                >
                  <span
                    className="theme-preview"
                    data-theme={value}
                    aria-hidden="true"
                  >
                    <span className="preview-nav">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="preview-content">
                      <b />
                      <i />
                    </span>
                  </span>
                  <span className="theme-label">
                    <span>
                      <Icon size={14} />
                      {label}
                    </span>
                    {theme === value && <Check size={16} />}
                  </span>
                </button>
              ))}
            </div>
            <p className="theme-saved">
              <CheckCircle2 size={15} />
              จดจำธีมไว้ในอุปกรณ์นี้ ไม่ต้องกดบันทึก
            </p>
            <p className="sr-only" role="status">
              {announcement}
            </p>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">YOUR FINANCIAL TOOLS</span>
                <h2>จัดการการเงินของคุณ</h2>
              </div>
            </div>
            <Link className="setting-link" to="/budgets">
              <Target size={21} />
              <span>
                งบประมาณรายเดือน
                <small>ตั้งวงเงินและติดตามการใช้จ่ายแต่ละหมวด</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
            <Link className="setting-link" to="/credit-cards">
              <CreditCard size={21} />
              <span>
                ช่องทางชำระเงิน<small>จัดการบัญชีธนาคารและบัตรเครดิต</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          </section>
        </div>
      </div>
    </Layout>
  );
}
