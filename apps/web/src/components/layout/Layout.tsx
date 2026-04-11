import React from 'react';
import BottomNav from './BottomNav';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900 overflow-x-hidden transition-colors duration-500">
      <main className="max-w-md mx-auto px-4 pt-6 animate-in fade-in duration-700">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
