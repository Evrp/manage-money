import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, List, PieChart, Target, User } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'หน้าแรก' },
    { to: '/transactions', icon: List, label: 'รายการ' },
    { to: '/budgets', icon: Target, label: 'งบประมาณ' },
    { to: '/analytics', icon: PieChart, label: 'วิเคราะห์' },
    { to: '/profile', icon: User, label: 'โปรไฟล์' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex justify-around items-center z-50 transition-all duration-300">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-colors duration-200 ${
              isActive ? 'text-indigo-600' : 'text-gray-400'
            }`
          }
        >
          <Icon size={22} className="transition-transform duration-200 hover:scale-110" />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
