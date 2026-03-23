import { useSyncExternalStore } from 'react';
import { allProjects, Category, Project } from '@/lib/projects-data';

const STORAGE_KEY = 'solocoder_progress';
const PROGRESS_EVENT = 'solocoder-progress-change';
const EMPTY_PROGRESS: string[] = [];

let cachedProgressRaw: string | null | undefined;
let cachedProgressSnapshot: string[] = EMPTY_PROGRESS;

function parseStoredProgress(saved: string | null): string[] {
  if (!saved) {
    return EMPTY_PROGRESS;
  }

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return EMPTY_PROGRESS;
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing progress from local storage', error);
    return EMPTY_PROGRESS;
  }
}

function readStoredProgress(): string[] {
  if (typeof window === 'undefined') {
    return EMPTY_PROGRESS;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (saved === cachedProgressRaw) {
    return cachedProgressSnapshot;
  }

  cachedProgressRaw = saved;
  cachedProgressSnapshot = parseStoredProgress(saved);
  return cachedProgressSnapshot;
}

function getServerProgressSnapshot() {
  return EMPTY_PROGRESS;
}

function subscribeToProgress(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener(PROGRESS_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(PROGRESS_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}

function notifyProgressChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function useProgress() {
  const completedProjectIds = useSyncExternalStore(
    subscribeToProgress,
    readStoredProgress,
    getServerProgressSnapshot
  );
  const isLoaded = true;

  const markCompleted = (projectId: string) => {
    const current = readStoredProgress();

    if (current.includes(projectId)) {
      return;
    }

    const next = [...current, projectId];
    const serialized = JSON.stringify(next);

    window.localStorage.setItem(STORAGE_KEY, serialized);
    cachedProgressRaw = serialized;
    cachedProgressSnapshot = next;
    notifyProgressChanged();
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
