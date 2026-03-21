"use client"

import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  Search, 
  ArrowUpRight, 
  Medal,
  Flame,
  Zap,
  LayoutDashboard,
  Terminal,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'sections'>('students');

  const stats = [
    { label: "إجمالي الطلاب", value: "120", icon: Users, color: "text-blue-500" },
    { label: "متوسط XP", value: "2,840", icon: ArrowUpRight, color: "text-yellow-500" },
    { label: "أعلى XP", value: "4,850", icon: Trophy, color: "text-green-500" },
  ];

  const students = [
    { rank: 1, name: "أحمد محمد العمري", streak: 12, section: "A", level: 9, xp: 4850 },
    { rank: 2, name: "سارة عبدالله الزهراني", streak: 8, section: "B", level: 8, xp: 4620 },
    { rank: 3, name: "محمد علي الغامدي", streak: 15, section: "A", level: 8, xp: 4139 },
    { rank: 4, name: "نورة خالد القحطاني", streak: 6, section: "C", level: 7, xp: 4100 },
    { rank: 5, name: "عمر سعد الدوسري", streak: 9, section: "B", level: 7, xp: 3980 },
    { rank: 6, name: "ريم فهد المطيري", streak: 4, section: "A", level: 6, xp: 3720 },
    { rank: 7, name: "يوسف ناصر الحربي", streak: 7, section: "C", level: 6, xp: 3540 },
    { rank: 8, name: "هند عادل السبيعي", streak: 3, section: "B", level: 6, xp: 3280 },
    { rank: 9, name: "خالد إبراهيم العتيبي", streak: 5, section: "A", level: 5, xp: 3105 },
  ];

  const sectionsList = [
    { rank: 1, name: "القسم A", studentsCount: 30, averageXp: 1747, totalXp: 52400, progress: 95 },
    { rank: 2, name: "القسم B", studentsCount: 28, averageXp: 1746, totalXp: 48900, progress: 88 },
    { rank: 3, name: "القسم C", studentsCount: 32, averageXp: 1409, totalXp: 45100, progress: 82 },
    { rank: 4, name: "القسم D", studentsCount: 30, averageXp: 1273, totalXp: 38200, progress: 75 },
  ];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
      {/* Header */}
      <div className="text-right pt-8">
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">لوحة الصدارة</h1>
        <p className="text-zinc-500 font-medium text-lg">تنافس مع زملائك واصعد الترتيب</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-white/10 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-zinc-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Control */}
      <div className="flex justify-center">
        <div className="bg-[#0a0a0a] p-1.5 rounded-2xl border border-white/5 flex gap-1">
          <button 
            onClick={() => setActiveTab('students')}
            className={cn(
              "px-8 py-2.5 rounded-xl text-sm font-black transition-all",
              activeTab === 'students' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-400"
            )}
          >
            ترتيب الطلاب
          </button>
          <button 
            onClick={() => setActiveTab('sections')}
            className={cn(
              "px-8 py-2.5 rounded-xl text-sm font-black transition-all",
              activeTab === 'sections' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-400"
            )}
          >
            ترتيب الأقسام
          </button>
        </div>
      </div>

      {/* Leaderboard Table Content */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl min-h-[600px] relative">
        <AnimatePresence mode="wait">
          {activeTab === 'students' ? (
            <motion.div
              key="students-table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-x-auto w-full scrollbar-hide"
            >
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-6 text-sm font-black text-zinc-500">XP</th>
                    <th className="px-8 py-6 text-sm font-black text-zinc-500">المستوى</th>
                    <th className="px-8 py-6 text-sm font-black text-zinc-500">القسم</th>
                    <th className="px-8 py-6 text-sm font-black text-zinc-500 text-right pr-20">الطالب</th>
                    <th className="px-8 py-6 text-sm font-black text-zinc-500 w-20 text-center">#</th>
                  </tr>
                </thead>
                <motion.tbody
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.05
                      }
                    }
                  }}
                >
                  {students.map((student, index) => (
                    <motion.tr 
                      key={index}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      className={cn(
                        "border-b border-white/5 hover:bg-white/[0.01] transition-colors group",
                        index === students.length - 1 && "border-0"
                      )}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-1.5 justify-start text-xp font-black">
                          <Zap className="w-4 h-4 fill-current" />
                          <span>{student.xp.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-blue-500/10 text-blue-500 text-xs font-black px-3 py-1 rounded-full border border-blue-500/20">
                          Lv.{student.level}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-zinc-400 border border-white/5">
                          {student.section}
                        </div>
                      </td>
                      <td className="px-8 py-6 pr-20 relative">
                        <div className="flex items-center justify-end">
                          <div className="text-right">
                            <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{student.name}</p>
                            <div className="flex items-center gap-1.5 justify-end text-[10px] font-bold text-orange-500">
                              <span>{student.streak} يوم متواصل</span>
                              <Flame className="w-3 h-3 fill-current" />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center">
                          {student.rank <= 3 ? (
                            <Medal className={cn(
                              "w-6 h-6",
                              student.rank === 1 ? "text-yellow-500" :
                              student.rank === 2 ? "text-zinc-400" :
                              "text-orange-500"
                            )} />
                          ) : (
                            <span className="text-sm font-black text-zinc-600">{student.rank}</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div
              key="sections-table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-x-auto w-full scrollbar-hide"
            >
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-6 text-sm font-black text-zinc-500">إجمالي XP</th>
                    <th className="px-8 py-6 text-sm font-black text-zinc-500">متوسط XP</th>
                    <th className="px-8 py-6 text-sm font-black text-zinc-500">الطلاب</th>
                    <th className="px-8 py-6 text-sm font-black text-zinc-500 text-right pr-20">القسم</th>
                    <th className="px-8 py-6 text-sm font-black text-zinc-500 w-20 text-center">#</th>
                  </tr>
                </thead>
                <motion.tbody
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.08
                      }
                    }
                  }}
                >
                  {sectionsList.map((section, index) => (
                    <motion.tr 
                      key={index}
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      className={cn(
                        "border-b border-white/10 hover:bg-white/[0.01] transition-colors group",
                        index === sectionsList.length - 1 && "border-0"
                      )}
                    >
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-1.5 justify-start text-xp font-black">
                          <Zap className="w-4 h-4 fill-current" />
                          <span>{section.totalXp.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-1.5 justify-start text-zinc-400 font-bold opacity-70">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs">{section.averageXp.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-1.5 justify-start text-zinc-500 text-xs font-bold font-mono">
                          <span>{section.studentsCount}</span>
                          <Users className="w-3.5 h-3.5" />
                        </div>
                      </td>
                      <td className="px-8 py-8 pr-20 relative">
                         <div className="text-right flex flex-col items-end gap-3">
                           <span className="font-bold text-lg text-white">{section.name}</span>
                           <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${section.progress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                              />
                           </div>
                         </div>
                      </td>
                      <td className="px-8 py-8 text-center border-l border-white/5">
                        <div className="flex items-center justify-center">
                          {section.rank <= 3 ? (
                            <Medal className={cn(
                              "w-6 h-6",
                              section.rank === 1 ? "text-yellow-500" :
                              section.rank === 2 ? "text-zinc-400" :
                              "text-orange-500"
                            )} />
                          ) : (
                            <span className="text-sm font-black text-zinc-600">{section.rank}</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Leaderboard;
