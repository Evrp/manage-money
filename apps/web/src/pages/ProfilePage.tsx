import React from 'react';
import { Banknote, CalendarDays, Check, Mail, Moon, Palette, ShieldCheck, Sun, UserRound, Waves } from 'lucide-react';
import { Theme } from '@moneyflow/shared';
import Layout from '../components/layout/Layout';
import { useAuthStore } from '../store/auth.store';

const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const themePreference = useAuthStore((state) => state.themePreference);
  const setThemePreference = useAuthStore((state) => state.setThemePreference);
  const activeTheme = themePreference || user?.theme || Theme.LIGHT;

  const themes = [
    { value: Theme.LIGHT, label: 'สว่าง', icon: Sun, preview: 'bg-gradient-to-br from-amber-100 to-white text-amber-600' },
    { value: Theme.DARK, label: 'มืด', icon: Moon, preview: 'bg-gradient-to-br from-slate-700 to-slate-950 text-white' },
    { value: Theme.GREEN, label: 'เขียว', icon: Palette, preview: 'bg-gradient-to-br from-emerald-400 to-teal-700 text-white' },
    { value: Theme.OCEAN, label: 'โอเชียน', icon: Waves, preview: 'bg-gradient-to-br from-sky-400 to-blue-700 text-white' },
  ];

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'บัญชี LINE';

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="px-1">
          <h1 className="text-2xl font-black">โปรไฟล์</h1>
          <p className="mt-1 text-sm text-gray-500">ข้อมูลบัญชีและการตั้งค่าปัจจุบัน</p>
        </header>

        <section className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-xl shadow-indigo-100">
          {user?.pictureUrl ? (
            <img
              src={user.pictureUrl}
              alt="รูปโปรไฟล์"
              className="h-16 w-16 rounded-2xl border-2 border-white/40 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
              <UserRound size={30} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{user?.displayName || 'ผู้ใช้งาน'}</h2>
            <p className="mt-1 text-sm text-indigo-100">สมาชิกตั้งแต่ {memberSince}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-bold">ข้อมูลบัญชี</h2>
          </div>
          {user?.email && (
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <Mail size={19} className="text-indigo-500" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">อีเมล</p>
                <p className="truncate text-sm font-medium">{user.email}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <Banknote size={19} className="text-emerald-500" />
            <div>
              <p className="text-xs text-gray-400">สกุลเงิน</p>
              <p className="text-sm font-medium">{user?.currency || 'THB'} — บาทไทย</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <Palette size={19} className="text-violet-500" />
            <div>
              <p className="text-xs text-gray-400">ธีม</p>
              <p className="text-sm font-medium">{themes.find((theme) => theme.value === activeTheme)?.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <ShieldCheck size={19} className="text-sky-500" />
            <div>
              <p className="text-xs text-gray-400">การเชื่อมต่อ</p>
              <p className="text-sm font-medium">เข้าสู่ระบบด้วย LINE</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="px-5 pb-2 pt-4">
            <h2 className="font-bold">เลือกธีม</h2>
            <p className="mt-1 text-sm text-gray-500">เปลี่ยนหน้าตาของแอปทันที และจดจำไว้ในอุปกรณ์นี้</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 pt-3">
            {themes.map(({ value, label, icon: Icon, preview }) => {
              const isActive = activeTheme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setThemePreference(value)}
                  aria-pressed={isActive}
                  className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-95 ${
                    isActive ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${preview}`}>
                    <Icon size={19} />
                  </span>
                  <span className="text-sm font-semibold">{label}</span>
                  {isActive && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {user?.monthlyBudget !== undefined && (
          <section className="flex items-center gap-3 rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
            <CalendarDays size={21} className="text-indigo-600" />
            <div>
              <p className="text-xs text-indigo-500">งบประมาณรายเดือน</p>
              <p className="text-lg font-bold text-indigo-950">฿{user.monthlyBudget.toLocaleString()}</p>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
