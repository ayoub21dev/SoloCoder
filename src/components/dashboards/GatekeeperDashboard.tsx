"use client"

import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GatekeeperDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { label: 'حضور اليوم', value: '142', total: '150', icon: UserCheck, color: 'text-green-500' },
    { label: 'متأخرون', value: '8', icon: Clock, color: 'text-yellow-500' },
    { label: 'غائبون', value: '5', icon: XCircle, color: 'text-red-500' },
    { label: 'أكثر غياباً (هذا الشهر)', value: '3 طلاب', icon: ShieldAlert, color: 'text-orange-500' },
  ];

  const attendanceData = [
    { id: 1, name: "إسماعيل المرابط", class: "A1", time: "08:45", status: "present" },
    { id: 2, name: "لينا الوردي", class: "B2", time: "09:15", status: "late" },
    { id: 3, name: "كريم بناني", class: "A1", time: "-", status: "absent" },
    { id: 4, name: "مريم الصقلي", class: "C1", time: "08:55", status: "present" },
    { id: 5, name: "يوسف العلمي", class: "A1", time: "-", status: "justified" },
  ];
  
  const filteredAttendanceData = attendanceData.filter((row) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return true;

    return (
      row.name.toLowerCase().includes(normalizedSearch) ||
      row.class.toLowerCase().includes(normalizedSearch)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20">حاضر</span>;
      case 'late':
        return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold border border-yellow-500/20">متأخر</span>;
      case 'absent':
        return <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold border border-red-500/20">غائب</span>;
      case 'justified':
        return <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold border border-blue-500/20">غياب مبرر</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card-premium p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-muted flex items-center gap-1">
                عرض التفاصيل <Calendar className="w-3 h-3" />
              </span>
            </div>
            <p className="text-sm text-muted mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stat.value}</span>
              {stat.total && <span className="text-xs text-muted">/ {stat.total}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 card-premium p-8 overflow-hidden flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold mb-1">تسجيل الحضور اليومي</h2>
            <p className="text-sm text-muted">إدارة حضور الطلاب والغيابات المبررة</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type="text" 
                placeholder="بحث عن طالب..."
                className="bg-white/5 border border-[#262626] rounded-xl pr-10 pl-4 py-2.5 text-sm w-64 focus:border-blue-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-[#262626] rounded-xl text-sm transition-all">
              <Filter className="w-4 h-4" />
              تصنيف
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto scrollbar-hide">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-[#1A1A1A] text-muted text-xs">
                <th className="pb-4 font-medium px-4">اسم الطالب</th>
                <th className="pb-4 font-medium px-4">القسم</th>
                <th className="pb-4 font-medium px-4">وقت الدخول</th>
                <th className="pb-4 font-medium px-4">الحالة</th>
                <th className="pb-4 font-medium px-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {filteredAttendanceData.map((row) => (
                <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-500 border border-blue-500/20">
                        {row.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted">{row.class}</td>
                  <td className="py-4 px-4 text-sm font-mono">{row.time}</td>
                  <td className="py-4 px-4">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="py-4 px-4 text-left">
                    <div className="flex items-center justify-start gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-blue-500/20">
                        تبرير
                      </button>
                      <button className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-500/20">
                        تجميد الحساب
                      </button>
                      <button className="p-1.5 hover:bg-white/10 rounded-lg text-muted transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAttendanceData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted">
                    لا توجد نتائج مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-8 pt-6 border-t border-[#1A1A1A] flex items-center justify-between text-xs text-muted">
          <span>نتائج العرض: 1-5 من أصل 150</span>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50">السابق</button>
            <button className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10">التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatekeeperDashboard;
