import { useState, useEffect } from 'react';
import { allProjects, Category, Project } from '@/lib/projects-data';

export function useProgress() {
  const [completedProjectIds, setCompletedProjectIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('solocoder_progress');
    if (saved) {
      try {
        setCompletedProjectIds(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing progress from local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const markCompleted = (projectId: string) => {
    setCompletedProjectIds(prev => {
      if (prev.includes(projectId)) return prev;
      const next = [...prev, projectId];
      localStorage.setItem('solocoder_progress', JSON.stringify(next));
      return next;
    });
  };

  const isCompleted = (projectId: string) => completedProjectIds.includes(projectId);

  // Derive the current state of a project list based on completions
  const getProjectsWithProgress = (category: Category): Project[] => {
    const projects = allProjects[category];
    return projects.map((project, index) => {
      const isProjectCompleted = isCompleted(project.id);
      
      // A project is unlocked if it's the first one, or the previous one is completed
      const isPreviousCompleted = index === 0 || isCompleted(projects[index - 1].id);
      
      let status: Project['status'] = 'locked';
      if (isProjectCompleted) {
        status = 'completed';
      } else if (isPreviousCompleted) {
        status = 'in-progress';
      }

      return {
        ...project,
        status,
        completedSteps: isProjectCompleted ? project.totalSteps : (status === 'in-progress' ? 0 : 0) // Simplify steps for now
      };
    });
  };

  return {
    completedProjectIds,
    markCompleted,
    isCompleted,
    isLoaded,
    getProjectsWithProgress
  };
}
