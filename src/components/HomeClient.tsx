"use client"

import React, { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { DashboardType } from '@/components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import LearnerDashboard from '@/components/dashboards/LearnerDashboard';
import MentorDashboard from '@/components/dashboards/MentorDashboard';
import GatekeeperDashboard from '@/components/dashboards/GatekeeperDashboard';
import DirectorDashboard from '@/components/dashboards/DirectorDashboard';

export default function HomeClient() {
  const [activeDashboard, setActiveDashboard] = useState<DashboardType>('learner');
  const [activeView, setActiveView] = useState('roadmap');
  const isWorkspaceView = activeDashboard === 'learner' && activeView === 'workspace';

  const renderDashboard = () => {
    switch (activeDashboard) {
      case 'learner':
        return <LearnerDashboard activeView={activeView} setActiveView={setActiveView} />;
      case 'mentor':
        return <MentorDashboard />;
      case 'gatekeeper':
        return <GatekeeperDashboard />;
      case 'director':
        return <DirectorDashboard />;
      default:
        return <LearnerDashboard activeView={activeView} setActiveView={setActiveView} />;
    }
  };

  return (
    <main className={isWorkspaceView ? "h-screen bg-black flex flex-col overflow-hidden" : "min-h-screen bg-black flex flex-col pt-20"}>
      {!isWorkspaceView && <TopBar activeView={activeView} setActiveView={setActiveView} />}

      <div className={isWorkspaceView ? "flex-1 overflow-hidden" : "flex-1 p-8 overflow-y-auto"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDashboard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={isWorkspaceView ? "h-full w-full" : "h-full"}
          >
            {renderDashboard()}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
