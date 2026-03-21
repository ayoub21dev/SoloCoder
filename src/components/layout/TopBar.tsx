"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Briefcase, 
  Terminal, 
  LayoutDashboard,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const TopBar = ({ activeView, setActiveView }: TopBarProps) => {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const navItems = [
    { id: 'roadmap', label: 'المشاريع', icon: Briefcase },
    { id: 'leaderboard', label: 'لوحة الصدارة', icon: LayoutDashboard },
  ];

  return (
    <header className="h-20 border-b border-white/5 bg-black flex items-center justify-between px-12 fixed top-0 inset-x-0 z-50" dir="rtl">
      {/* Right section: Logo (Logo is on the right in RTL layout) */}
      <div className="flex items-center gap-3 group cursor-pointer order-last">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
           <div className="text-white transform -rotate-12 transition-transform group-hover:rotate-0">
             <Terminal className="w-6 h-6 stroke-[3]" />
           </div>
        </div>
        <span className="text-xl font-black text-white tracking-tighter">soloCoder</span>
      </div>

      {/* Center section: Navigation */}
      <nav className="flex items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              activeView === item.id 
                ? "bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-900/10" 
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Left section: Profile & Notifications */}
      <div className="flex items-center gap-6 order-first">
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white">
              a
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs font-black text-white leading-none">ayoub</span>
              <span className="text-[10px] text-zinc-500 font-bold">طالب</span>
            </div>
            <ChevronDown className={cn("w-3 h-3 text-zinc-500 transition-transform", isProfileOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 mt-3 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
              >
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                  <p className="text-sm font-black text-white">ayoub</p>
                  <p className="text-[10px] text-zinc-500 font-bold">طالب</p>
                </div>
                <div className="p-1.5">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all group">
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-full border border-yellow-500/20">
           <span className="text-xs font-black text-yellow-500">XP 1240</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
