import React, { useState } from "react";
import { Box, Save, X } from "lucide-react";

interface CreateCategoryModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; icon: string; color: string; monthlyLimit: number }) => void;
}

const ICONS = ["🍔", "🚗", "🏠", "🛍️", "🎬", "🏥", "📚", "💡", "💰", "📦", "🎁", "🎮", "🏋️", "🐈", "☕"];
const COLORS = ["#FF9500", "#5856D6", "#AF52DE", "#FF2D55", "#FFCC00", "#34C759", "#007AFF", "#5AC8FA", "#8E8E93"];

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#8E8E93");
  const [limit, setLimit] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      alert("กรุณาระบุชื่อหมวดหมู่");
      return;
    }
    onSubmit({ name: name.trim(), icon, color, monthlyLimit: Number(limit) || 0 });
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="category-modal" role="dialog" aria-modal="true" aria-labelledby="create-category-title">
        <header className="category-modal-header">
          <div>
            <span>หมวดหมู่ใหม่</span>
            <h2 id="create-category-title">สร้างหมวดหมู่</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="ปิด">
            <X size={20} />
          </button>
        </header>

        <div className="category-modal-body">
          <div className="category-preview" style={{ backgroundColor: `${color}18` }}>
            <Box size={18} style={{ color }} />
            <span className="category-preview-icon">{icon}</span>
            <span>{name.trim() || "หมวดหมู่ใหม่"}</span>
          </div>

          <label className="category-field">
            ชื่อหมวดหมู่
            <input autoFocus maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น ค่าขนมแมว" />
          </label>

          <label className="category-field">
            งบประมาณต่อเดือน <small>ไม่บังคับ</small>
            <input type="number" min="0" inputMode="decimal" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="0.00" />
          </label>

          <fieldset className="category-choice-group">
            <legend>ไอคอน</legend>
            <div className="category-icon-grid">
              {ICONS.map((item) => (
                <button key={item} type="button" onClick={() => setIcon(item)} aria-label={`เลือกไอคอน ${item}`} aria-pressed={icon === item}>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="category-choice-group">
            <legend>สี</legend>
            <div className="category-color-grid">
              {COLORS.map((item) => (
                <button key={item} type="button" onClick={() => setColor(item)} aria-label={`เลือกสี ${item}`} aria-pressed={color === item} style={{ backgroundColor: item }} />
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="category-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>ยกเลิก</button>
          <button type="button" className="primary-button" onClick={handleSave}>
            <Save size={17} /> สร้างหมวดหมู่
          </button>
        </footer>
      </section>
    </div>
  );
};

export default CreateCategoryModal;
