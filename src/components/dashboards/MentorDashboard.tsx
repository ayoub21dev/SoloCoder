"use client"

import React from 'react';
import { 
  Users, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Code2,
  ChevronRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const MentorDashboard = () => {
  const students = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: `طالب ${i + 1}`,
    step: Math.floor(Math.random() * 12) + 1,
    attempts: Math.floor(Math.random() * 5),
    status: i % 10 === 0 ? 'stuck' : i % 5 === 0 ? 'idle' : 'active',
    lastActive: i % 10 === 0 ? '20 دقيقة' : 'الآن'
  }));

  const weeklyChallengers = [
    { name: "سعيد بن عمر", class: "A1", avatar: "س" },
    { name: "ليلى حسن", class: "B2", avatar: "ل" },
    { name: "ياسين فوزي", class: "A1", avatar: "ي" },
    { name: "فاطمة زهراء", class: "C1", avatar: "ف" },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الطلاب', value: '30', icon: Users, color: 'text-blue-500' },
          { label: 'نشط حالياً', value: '24', icon: Zap, color: 'text-yellow-500' },
          { label: 'عالقون', value: '3', icon: AlertCircle, color: 'text-red-500' },
          { label: 'أنهوا المشروع', value: '3', icon: CheckCircle2, color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className="card-premium p-4 flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Live Radar Grid */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              رادار القسم المباشر
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </h2>
            <div className="flex items-center gap-4 text-xs">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> نشط</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> يكتب الآن</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> يحتاج مساعدة</div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-5 gap-3 overflow-y-auto pr-2 scrollbar-hide">
            {students.map((student) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className={cn(
                  "card-premium p-4 relative group",
                  student.status === 'stuck' && "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                )}
              >
                {student.status === 'stuck' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse-red" />
                )}
                
                <div className="flex justify-between items-start mb-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                    {student.id}
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                    student.status === 'stuck' ? "bg-red-500/10 text-red-500" :
                    student.status === 'idle' ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"
                  )}>
                    {student.status === 'stuck' ? 'عالق' : student.status === 'idle' ? 'يكتب' : 'نشط'}
                  </div>
                </div>

                <h3 className="text-sm font-bold mb-1 truncate">{student.name}</h3>
                <div className="flex items-center gap-1 text-[10px] text-muted mb-3">
                  <Code2 className="w-3 h-3" />
                  الخطوة {student.step}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] text-muted">
                    <span>محاولات خاطئة</span>
                    <span className={cn(student.attempts > 3 ? "text-red-500 font-bold" : "")}>{student.attempts}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-1/2" />
                  </div>
                </div>

                <button className="w-full mt-4 py-1.5 bg-white/5 hover:bg-white text-muted hover:text-black rounded-lg text-[10px] font-bold transition-all opacity-0 group-hover:opacity-100">
                  Force Pass
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex flex-col gap-6">
          {/* Weekly Challenge */}
          <div className="card-premium p-6">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Target className="w-4 h-4 text-purple-500" />
              التحدي الأسبوعي
            </h3>
            <p className="text-xs text-muted mb-6 leading-relaxed">
              الطلاب الـ 4 المختارون عشوائياً لتمثيل أقسامهم في تحدي البرمجة السريع.
            </p>
            <div className="space-y-4">
              {weeklyChallengers.map((challenger) => (
                <div key={challenger.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold border border-white/10">
                    {challenger.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{challenger.name}</p>
                    <p className="text-[10px] text-muted">القسم {challenger.class}</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all">
              بدء التحدي المباشر
            </button>
          </div>

          {/* Activity Logs */}
          <div className="card-premium p-6 flex-1 overflow-hidden flex flex-col">
            <h3 className="font-bold text-sm mb-4">آخر التنبيهات</h3>
            <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide">
              {[
                "أنهى طالب 12 الخطوة 8 بنجاح",
                "طالب 5 عالق في الخطوة 4 منذ 20 دقيقة",
                "تم تسجيل دخول طالب 3",
                "أكمل طالب 18 المشروع بنجاح 🏆",
              ].map((log, i) => (
                <div key={i} className="flex gap-3 text-[10px] leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                  <span className={cn(log.includes('عالق') ? "text-red-400" : "text-muted")}>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
