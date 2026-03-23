"use client"

import React, { useState } from 'react';
import { 
  Trophy, 
  Zap, 
  Clock, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  Code2,
  BookOpen,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import LearningPath from './LearningPath';
import Leaderboard from './Leaderboard';
import WorkspaceEditor from '@/components/ui/WorkspaceEditor';
import { useLocale } from '@/components/providers/LocaleProvider';

interface LearnerDashboardProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const LearnerDashboard = ({ activeView, setActiveView }: LearnerDashboardProps) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { direction, isArabic } = useLocale();
  
  const studentStats = {
    level: 12,
    xp: 2450,
    nextLevelXp: 3000,
    progress: 65,
    projectName: "بناء واجهة متجر إلكتروني"
  };
  const uiText = isArabic
    ? {
        blockedTitle: 'حسابك موقوف مؤقتاً',
        blockedMessage: 'بسبب الغياب المتكرر، تم تعليق وصولك إلى المحتوى التعليمي. يرجى مراجعة إدارة المدرسة لتسوية وضعك.',
        contactAdmin: 'مراسلة الإدارة'
      }
    : {
        blockedTitle: 'Your Account Is Temporarily Paused',
        blockedMessage: 'Because of repeated absences, your access to the learning content has been suspended. Please contact the school administration to resolve your status.',
        contactAdmin: 'Contact Administration'
      };

  return (
    <div className="relative h-full flex flex-col gap-6" dir={direction}>
      {/* Blocked Overlay */}
      {isBlocked && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center rounded-2xl overflow-hidden border border-red-500/20">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111111] p-12 rounded-3xl border border-white/5 max-w-md text-center"
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">{uiText.blockedTitle}</h2>
            <p className="text-muted leading-relaxed mb-8">
              {uiText.blockedMessage}
            </p>
            <button className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
              {uiText.contactAdmin}
            </button>
          </motion.div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden scrollbar-hide relative">
        <AnimatePresence mode="wait">
          {activeView === 'roadmap' && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto scrollbar-hide h-full"
            >
              <LearningPath 
                onProjectSelect={(id) => {
                  setSelectedProjectId(id);
                  setActiveView('workspace');
                }} 
              />
            </motion.div>
          )}

          {activeView === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto scrollbar-hide"
            >
              <Leaderboard />
            </motion.div>
          )}

          {activeView === 'workspace' && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full relative pb-4"
            >
              <WorkspaceEditor 
                key={selectedProjectId ?? 'workspace-empty'}
                projectId={selectedProjectId} 
                onBack={() => setActiveView('roadmap')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LearnerDashboard;
