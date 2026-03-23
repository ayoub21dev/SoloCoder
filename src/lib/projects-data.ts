import htmlProjects from '@/lib/generated/projects/html.json';
import cssProjects from '@/lib/generated/projects/css.json';
import javascriptProjects from '@/lib/generated/projects/javascript.json';
import type { EditorLanguage } from '@/lib/curriculum';

export type Category = 'html' | 'css' | 'javascript';

export interface Project {
  id: string;
  number: number;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  status: 'locked' | 'completed' | 'in-progress';
  completedSteps: number;
  totalSteps: number;
  xpReward: number;
  estimatedTime: string;
  editorLanguage: EditorLanguage;
  previewHtml?: string;
}

export const allProjects: Record<Category, Project[]> = {
  html: htmlProjects as Project[],
  css: cssProjects as Project[],
  javascript: javascriptProjects as Project[]
};

const projectIndex = new Map<string, Project>();

for (const category of Object.values(allProjects)) {
  for (const project of category) {
    projectIndex.set(project.id, project);
  }
}

export function getProjectById(projectId: string): Project | null {
  return projectIndex.get(projectId) ?? null;
}

export function getCategoryProgress(category: Category) {
  const projects = allProjects[category];
  const total = projects.length;
  const completed = projects.filter(project => project.status === 'completed').length;
  const xpEarned = projects.reduce(
    (accumulator, project) => (project.status === 'completed' ? accumulator + project.xpReward : accumulator),
    0
  );
  const totalXp = projects.reduce((accumulator, project) => accumulator + project.xpReward, 0);
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    completed,
    xpEarned,
    totalXp,
    percentage
  };
}
