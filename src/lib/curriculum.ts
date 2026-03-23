export type EditorLanguage = 'html' | 'css' | 'javascript';
export type ValidationMode = 'legacy' | 'freecodecamp';

export interface TestCase {
  id: string;
  description: string;
  descriptionAr?: string;
  testLogic: string;
}

export interface Step {
  id: string;
  stepNumber: number;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  instructions: string;
  instructionsAr?: string;
  seedCode: string;
  expectedOutput: string;
  testCases: TestCase[];
  editorLanguage?: EditorLanguage;
  editorFileName?: string;
  previewTemplate?: string;
  validationMode?: ValidationMode;
  testSetup?: string;
  blockLabel?: string;
}

type StepMap = Record<string, Step[]>;
type Category = 'html' | 'css' | 'javascript';

const CURRICULUM_PATHS: Record<Category, string> = {
  html: '/curriculum/html.json',
  css: '/curriculum/css.json',
  javascript: '/curriculum/javascript.json'
};

const curriculumCache = new Map<Category, Promise<StepMap>>();
const PREVIEW_PLACEHOLDER = '__SOLOCODER_EDITABLE_REGION__';
const shouldCacheCurriculum = process.env.NODE_ENV === 'production';

export function getCategoryFromProjectId(projectId: string): Category | null {
  if (projectId.startsWith('html-')) {
    return 'html';
  }

  if (projectId.startsWith('css-')) {
    return 'css';
  }

  if (projectId.startsWith('javascript-')) {
    return 'javascript';
  }

  return null;
}

async function loadCategoryCurriculum(category: Category): Promise<StepMap> {
  if (shouldCacheCurriculum) {
    const cached = curriculumCache.get(category);

    if (cached) {
      return cached;
    }
  }

  const request = fetch(CURRICULUM_PATHS[category], {
    cache: shouldCacheCurriculum ? 'force-cache' : 'no-store'
  }).then(async response => {
    if (!response.ok) {
      throw new Error(`Failed to load curriculum for ${category}`);
    }

    return response.json() as Promise<StepMap>;
  });

  if (shouldCacheCurriculum) {
    curriculumCache.set(category, request);
  }

  return request;
}

export async function loadProjectSteps(projectId: string): Promise<Step[] | null> {
  const category = getCategoryFromProjectId(projectId);

  if (!category) {
    return null;
  }

  const categoryCurriculum = await loadCategoryCurriculum(category);
  return categoryCurriculum[projectId] ?? null;
}

export function buildPreviewDocument(step: Step, code: string): string {
  if (step.previewTemplate) {
    return step.previewTemplate.replaceAll(PREVIEW_PLACEHOLDER, code);
  }

  if (step.editorLanguage === 'javascript') {
    return `<!DOCTYPE html><html><body><script>${code}</script></body></html>`;
  }

  if (step.editorLanguage === 'css') {
    return `<!DOCTYPE html><html><head><style>${code}</style></head><body></body></html>`;
  }

  return code;
}
