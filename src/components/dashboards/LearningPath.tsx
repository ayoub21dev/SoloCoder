"use client"

import { useState } from "react"
import {
  Lock,
  CheckCircle2,
  Clock,
  Zap,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type Category,
  type Project
} from "@/lib/projects-data"
import { motion, AnimatePresence } from "framer-motion"
import { useProgress } from "@/hooks/useProgress"
import { useLocale } from "@/components/providers/LocaleProvider"

const rtlTextStyle = {
  direction: "rtl" as const,
  textAlign: "right" as const,
  unicodeBidi: "plaintext" as const,
}

/* ─── data ─────────────────────────────────────── */
const categories = [
  { id: "html"       as Category, label: "HTML", color: "#f06529" }, // Orange for HTML
  { id: "css"        as Category, label: "CSS",  color: "#3b82f6" },
  { id: "javascript" as Category, label: "JS",   color: "#f7df1e" },
]

/* ─── Circle node ───────────────────────────────── */
function PathCircle({
  category,
  isActive,
  onClick,
}: {
  category: typeof categories[number]
  isActive: boolean
  onClick: () => void
}) {
  const { getProjectsWithProgress } = useProgress()
  const projects = getProjectsWithProgress(category.id)
  
  const total = projects.length
  const completed = projects.filter(p => p.status === 'completed').length
  const xpEarned = projects.reduce((acc, p) => p.status === 'completed' ? acc + p.xpReward : acc, 0)
  const totalXp = projects.reduce((acc, p) => acc + p.xpReward, 0)
  const percentage = total > 0 ? (completed / total) * 100 : 0
  
  const prog = { total, completed, xpEarned, totalXp, percentage }
  
  const CIRC = 289
  const dash = (prog.percentage / 100) * CIRC

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full transition-all duration-300",
        isActive ? "scale-110" : "scale-100 opacity-40 hover:opacity-80"
      )}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#1e1e1e" strokeWidth="3" />
        {isActive && (
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke={category.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC - dash}`}
            style={{ filter: `drop-shadow(0 0 6px ${category.color})` }}
          />
        )}
        {!isActive && prog.completed > 0 && (
          <circle cx="50" cy="4" r="2.5" fill={category.color} />
        )}
      </svg>
      <div className={cn(
        "absolute inset-0 rounded-full border-2 transition-all",
        isActive ? "border-white/80" : "border-white/10"
      )} />
      <div className="relative z-10 flex flex-col items-center leading-none gap-1">
        <span
          className="text-[1.65rem] font-black italic tracking-tight"
          style={{ color: isActive ? category.color : "#555" }}
        >
          {category.label}
        </span>
        <span className="text-[11px] font-bold text-zinc-500">
          {prog.completed}/{prog.total}
        </span>
      </div>
    </button>
  )
}

/* ─── Curved arrow connector ────────────────────── */
function Connector() {
  return (
    <div className="relative w-28 h-24 shrink-0 -mx-3">
      <svg viewBox="0 0 110 90" className="absolute inset-0 h-full w-full" fill="none">
        <path d="M 5 30 C 30 30, 80 60, 105 60" stroke="#333" strokeWidth="1.6" strokeDasharray="4 5" strokeLinecap="round" />
        <path d="M 96 53 L 105 60 L 96 67" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ─── Project row card ──────────────────────────── */
function ProjectCard({ project, onClick }: { project: Project, onClick: () => void }) {
  const { direction, isArabic } = useLocale()
  const isLocked      = project.status === "locked"
  const isCompleted   = project.status === "completed"
  const isInProgress  = project.status === "in-progress"
  const pct = Math.round((project.completedSteps / project.totalSteps) * 100)
  const projectTitle = isArabic ? project.titleAr ?? project.title : project.title
  const projectDescription = isArabic ? project.descriptionAr ?? project.description : project.description

  return (
    <div
      dir={direction}
      onClick={isLocked ? undefined : onClick}
      className={cn(
        "group relative flex items-stretch gap-0 rounded-2xl border bg-[#050505] transition-all duration-200 min-h-[100px]",
        isLocked
          ? "border-white/5 cursor-not-allowed"
          : "border-white/[0.08] hover:border-white/[0.15] hover:bg-[#080808] cursor-pointer shadow-xl"
      )}
    >
      {/* ── Section 1: Progress Status (Right Side) ── */}
      <div className="flex items-center justify-center w-24 border-l border-white/5">
        {isCompleted ? (
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-green-500/10 border border-green-500/30 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-6 w-6 text-green-500 stroke-[2.5]" />
          </div>
        ) : isInProgress ? (
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
            <span className="text-black font-black text-xl leading-none">{project.number}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/5 bg-white/[0.02]">
            <Lock className="h-5 w-5 text-zinc-600" />
          </div>
        )}
      </div>

      {/* ── Section 2: Content (Center) ── */}
      <div className={cn("relative flex-1 flex flex-col justify-center px-6 py-5", isArabic ? "text-right" : "text-left")}>
        <div className="flex items-center gap-3 mb-1" dir={direction} style={isArabic ? rtlTextStyle : undefined}>
          <h3 className={cn(
            "font-black text-xl tracking-tight leading-none",
            isLocked ? "text-zinc-600" : "text-white"
          )} dir={direction} style={isArabic ? rtlTextStyle : undefined}>
            {projectTitle}
          </h3>
          {isInProgress && (
            <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-black px-2 py-0.5 rounded border border-[#f59e0b]/20">
              {isArabic ? "جاري" : "In Progress"}
            </span>
          )}
        </div>
        <p className={cn(
          "text-sm font-medium leading-normal max-w-[90%]",
          isLocked ? "text-zinc-700" : "text-zinc-500"
        )} dir={direction} style={isArabic ? rtlTextStyle : undefined}>
          {projectDescription}
        </p>

        {/* Progress bar at the bottom */}
        {isInProgress && (
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-2">
            <div className="h-0.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
               <div 
                 className="h-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" 
                 style={{ width: `${pct}%` }}
               />
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Stats (Left Middle) ── */}
      <div className="flex flex-col items-start justify-center px-6 py-5 min-w-[120px] border-r border-white/5" dir={direction} style={isArabic ? rtlTextStyle : undefined}>
        <div className={cn(
          "flex items-center gap-1.5 text-[15px] font-black",
          isLocked ? "text-zinc-700" : "text-[#f59e0b]"
        )} dir={direction} style={isArabic ? rtlTextStyle : undefined}>
          <span>XP {project.xpReward}</span>
          <Zap className="h-4 w-4 fill-current" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 mt-1" dir={direction} style={isArabic ? rtlTextStyle : undefined}>
          <Clock className="h-3.5 w-3.5" />
          <span>{project.estimatedTime}</span>
        </div>
      </div>

      {/* ── Section 4: Chevron (Far Left) ── */}
      <div className="flex items-center justify-center w-14 group-hover:bg-white/[0.02] transition-colors">
        <ChevronLeft className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </div>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────── */
interface LearningPathProps {
  onProjectSelect?: (projectId: string) => void;
}

export default function LearningPath({ onProjectSelect }: LearningPathProps) {
  const { direction, isArabic } = useLocale()
  const [selected, setSelected] = useState<Category>("html")
  const [previewProject, setPreviewProject] = useState<Project | null>(null)
  
  const { getProjectsWithProgress } = useProgress()
  const projects = getProjectsWithProgress(selected)
  
  const total = projects.length
  const completed = projects.filter(p => p.status === 'completed').length
  const xpEarned = projects.reduce((acc, p) => p.status === 'completed' ? acc + p.xpReward : acc, 0)
  const totalXp = projects.reduce((acc, p) => acc + p.xpReward, 0)
  const percentage = total > 0 ? (completed / total) * 100 : 0
  
  const prog = { total, completed, xpEarned, totalXp, percentage }
  const uiText = isArabic
    ? {
        title: 'مسار التعلم',
        subtitle: 'اختر المسار وابدأ رحلتك في البرمجة',
        completed: 'مكتمل',
        previewTitle: 'هذه معاينة لما ستقوم ببنائه',
        previewEmpty: 'لا توجد معاينة جاهزة لهذا المشروع بعد.',
        openProject: 'ابدأ كتابة الكود!'
      }
    : {
        title: 'Learning Path',
        subtitle: 'Choose a track and start your coding journey',
        completed: 'completed',
        previewTitle: 'Preview of what you will build',
        previewEmpty: 'No preview is available for this project yet.',
        openProject: 'Start Coding'
      }

  return (
    <div className="pb-24 pt-10" dir={direction}>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-white tracking-tight mb-3">{uiText.title}</h1>
        <p className="text-zinc-500 text-lg">{uiText.subtitle}</p>
      </div>

      {/* Roadmap circles */}
      <div className="relative mb-16" dir="ltr">
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <p className="text-center text-[11px] font-black tracking-[0.5em] text-zinc-500 mb-8 uppercase opacity-60">FRONTEND</p>
        <div className="flex items-center justify-center">
          {categories.map((cat, i) => (
            <div key={cat.id} className="flex items-center">
              <PathCircle category={cat} isActive={selected === cat.id} onClick={() => setSelected(cat.id)} />
              {i < categories.length - 1 && <Connector />}
            </div>
          ))}
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-6 py-3">
           <Zap className="h-5 w-5 text-[#f59e0b] fill-current" />
           <span className="text-white font-black text-base">XP {prog.xpEarned} / {prog.totalXp}</span>
        </div>
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-6 py-3">
           <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-black stroke-[3]" />
          </div>
          <span className="text-white font-black text-base">{prog.completed} / {prog.total} {uiText.completed}</span>
        </div>
      </div>

      {/* Project list mapping */}
      <div className="max-w-4xl mx-auto px-4 space-y-5">
        {projects.map(p => (
           <ProjectCard 
             key={p.id} 
             project={p} 
             onClick={() => setPreviewProject(p)}
           />
        ))}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-4xl bg-[#0a0a0a] border border-[#262626] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
              dir={direction}
            >
              <div className="bg-[#111111] px-6 py-4 flex items-center justify-between border-b border-[#262626]">
                 <span className="text-zinc-300 font-bold">{uiText.previewTitle}</span>
                 <button onClick={() => setPreviewProject(null)} className="text-zinc-500 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="flex-1 bg-white relative min-h-[400px]" dir="ltr">
                {previewProject.previewHtml ? (
                  <iframe
                    title="project-preview"
                    srcDoc={previewProject.previewHtml}
                    sandbox="allow-scripts"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 p-8 text-center text-zinc-500">
                    {uiText.previewEmpty}
                  </div>
                )}
              </div>

              <div className="p-6 bg-[#0a0a0a] border-t border-[#262626]">
                <button 
                  onClick={() => {
                    onProjectSelect?.(previewProject.id);
                    setPreviewProject(null);
                  }}
                  className="w-full py-4 border-2 border-[#262626] hover:bg-white hover:text-black hover:border-white text-white rounded-lg font-bold text-lg transition-all"
                >
                  {uiText.openProject}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
