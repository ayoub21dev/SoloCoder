"use client"

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  GraduationCap,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DashboardType = 'learner' | 'mentor' | 'gatekeeper' | 'director';

interface SidebarProps {
  activeDashboard: DashboardType;
  setActiveDashboard: (dash: DashboardType) => void;
}

const Sidebar = ({ activeDashboard, setActiveDashboard }: SidebarProps) => {
  const menuItems = [
    { id: 'learner', label: 'لوحة الطالب', icon: GraduationCap },
    { id: 'mentor', label: 'لوحة الأستاذ', icon: Users },
    { id: 'gatekeeper', label: 'الحارسة العامة', icon: ShieldCheck },
    { id: 'director', label: 'لوحة المدير', icon: LayoutDashboard },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0A0A0A] border-l border-[#1A1A1A] flex flex-col fixed right-0 top-0 z-50">
      <div className="p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm" />
          </div>
          <span className="font-bold text-xl tracking-tight">سولو كودر</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveDashboard(item.id as DashboardType)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-right",
              activeDashboard === item.id 
                ? "bg-white/10 text-white" 
                : "text-muted hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeDashboard === item.id ? "text-white" : "text-muted group-hover:text-white"
            )} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-[#1A1A1A]">
        <div className="flex items-center gap-3 px-4 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
            أ
          </div>
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium">أيوب</span>
            <span className="text-xs text-muted">طالب مبادر</span>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 text-right">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
