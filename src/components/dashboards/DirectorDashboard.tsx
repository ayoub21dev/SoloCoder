"use client"

import React from 'react';
import { 
  BarChart3, 
  Settings2, 
  Rocket, 
  TrendingDown, 
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const data = [
  { name: 'الأسبوع 1', xp: 400, absence: 5 },
  { name: 'الأسبوع 2', xp: 800, absence: 8 },
  { name: 'الأسبوع 3', xp: 1200, absence: 4 },
  { name: 'الأسبوع 4', xp: 1100, absence: 10 },
  { name: 'الأسبوع 5', xp: 1800, absence: 2 },
  { name: 'الأسبوع 6', xp: 2300, absence: 3 },
];

const DirectorDashboard = () => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="card-premium p-6 bg-gradient-to-br from-blue-600/10 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs text-green-500 font-bold">+12% من الشهر الماضي</span>
          </div>
          <h3 className="text-sm text-muted mb-1">متوسط الـ XP بالمدرسة</h3>
          <p className="text-3xl font-bold">2,840 <span className="text-xs text-muted">نقطة</span></p>
        </div>

        <div className="card-premium p-6 bg-gradient-to-br from-red-600/10 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-xs text-red-500 font-bold">-4% من الشهر الماضي</span>
          </div>
          <h3 className="text-sm text-muted mb-1">متوسط الغياب العام</h3>
          <p className="text-3xl font-bold">6.2%</p>
        </div>

        <div className="card-premium p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500">
              <Rocket className="w-6 h-6" />
            </div>
            <span className="text-xs text-muted">الموسم الحالي: {currentYear} الشتاء</span>
          </div>
          <h3 className="text-sm text-muted mb-1">الطلاب النشطون</h3>
          <p className="text-3xl font-bold">148 <span className="text-xs text-muted">/ 150</span></p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
        {/* Charts Section */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="card-premium p-8 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold">تحليل العلاقة: XP مقابل الغياب</h3>
                <p className="text-xs text-muted">يوضح المبيان كيف يتأثر التحصيل الدراسي بانتظام الحضور</p>
              </div>
              <BarChart3 className="w-5 h-5 text-muted" />
            </div>
            
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #262626', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="xp" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Global Settings & Season Management */}
        <div className="flex flex-col gap-6">
          <div className="card-premium p-6">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Settings2 className="w-4 h-4 text-blue-500" />
              نظام التوقيت المرن
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs text-muted block mb-3">وقت احتساب التأخير</label>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <Clock className="w-4 h-4 text-muted" />
                  <span className="text-sm font-mono">09:30 صباحاً</span>
                  <button className="mr-auto text-[10px] text-blue-500 hover:underline">تعديل</button>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                <div className="text-[10px] text-muted leading-relaxed">
                  <span className="font-bold text-yellow-500 block mb-1">تنبيه الإدارة</span>
                  تفعيل توقيت رمضان سيقوم تلقائياً بتأخير وقت الحضور إلى 10:00 صباحاً.
                </div>
              </div>

              <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10">
                إدارة التنبيهات الآلية
              </button>
            </div>
          </div>

          <div className="card-premium p-6 border-red-500/20 bg-red-500/[0.02]">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-red-500">
              <Calendar className="w-4 h-4" />
              إدارة المواسم
            </h3>
            <p className="text-xs text-muted mb-6 leading-relaxed">
              بدء موسم جديد سيؤدي إلى أرشفة جميع بيانات الطلاب الحالية وتصفير عدادات الـ XP.
            </p>
            <button className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-3">
              <Rocket className="w-5 h-5" />
              بدء موسم دراسي جديد {nextYear}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;
