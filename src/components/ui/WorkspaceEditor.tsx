'use client';

import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { lessons } from '@/lib/curriculum';
import { runTests, TestResult } from '@/lib/validation';
import { CheckCircle, XCircle, Circle, Play, ArrowLeft, ArrowRight } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { cn } from '@/lib/utils';

interface WorkspaceEditorProps {
  projectId: string | null;
  onBack: () => void;
}

type WorkspaceLayout = {
  instructionRatio: number;
  editorRatio: number;
  previewHeightRatio: number;
};

type DragTarget = 'instructions' | 'editor' | 'preview-height';
type DragAxis = 'col' | 'row';

type DragState = {
  target: DragTarget;
  pointerId: number;
  startX: number;
  startY: number;
  startPreviewWidth: number;
  startInstructionWidth: number;
  startEditorWidth: number;
  startPreviewHeight: number;
  containerWidth: number;
  previewStackHeight: number;
  startLayout: WorkspaceLayout;
};

const DESKTOP_BREAKPOINT = 1024;
const STORAGE_KEY = 'solocoder_workspace_layout_v1';
const GUTTER_SIZE = 10;
const INSTRUCTION_MIN_WIDTH = 320;
const EDITOR_MIN_WIDTH = 360;
const PREVIEW_MIN_WIDTH = 320;
const PREVIEW_MIN_HEIGHT = 180;
const CONSOLE_MIN_HEIGHT = 160;
const DEFAULT_LAYOUT: WorkspaceLayout = {
  instructionRatio: 0.30,
  editorRatio: 0.35,
  previewHeightRatio: 0.68,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isWorkspaceLayout(value: unknown): value is WorkspaceLayout {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.instructionRatio === 'number' &&
    typeof candidate.editorRatio === 'number' &&
    typeof candidate.previewHeightRatio === 'number'
  );
}

function loadWorkspaceLayout(): WorkspaceLayout {
  if (typeof window === 'undefined') {
    return DEFAULT_LAYOUT;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_LAYOUT;
    }

    const parsed = JSON.parse(raw);

    if (!isWorkspaceLayout(parsed)) {
      return DEFAULT_LAYOUT;
    }

    return {
      instructionRatio: clampNumber(parsed.instructionRatio, 0.18, 0.6),
      editorRatio: clampNumber(parsed.editorRatio, 0.2, 0.6),
      previewHeightRatio: clampNumber(parsed.previewHeightRatio, 0.35, 0.82),
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function saveWorkspaceLayout(layout: WorkspaceLayout) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

function clampDesktopLayout(layout: WorkspaceLayout, viewportWidth: number) {
  const totalResizableWidth = Math.max(
    viewportWidth - (GUTTER_SIZE * 2),
    INSTRUCTION_MIN_WIDTH + EDITOR_MIN_WIDTH + PREVIEW_MIN_WIDTH
  );

  let instructionWidth = clampNumber(
    layout.instructionRatio * viewportWidth,
    INSTRUCTION_MIN_WIDTH,
    totalResizableWidth - EDITOR_MIN_WIDTH - PREVIEW_MIN_WIDTH
  );

  let editorWidth = clampNumber(
    layout.editorRatio * viewportWidth,
    EDITOR_MIN_WIDTH,
    totalResizableWidth - instructionWidth - PREVIEW_MIN_WIDTH
  );

  let previewWidth = totalResizableWidth - instructionWidth - editorWidth;

  if (previewWidth < PREVIEW_MIN_WIDTH) {
    const deficit = PREVIEW_MIN_WIDTH - previewWidth;
    const editorSlack = Math.max(0, editorWidth - EDITOR_MIN_WIDTH);
    const editorReduction = Math.min(deficit, editorSlack);

    editorWidth -= editorReduction;
    instructionWidth = Math.max(INSTRUCTION_MIN_WIDTH, instructionWidth - (deficit - editorReduction));
    previewWidth = totalResizableWidth - instructionWidth - editorWidth;
  }

  return {
    instructionRatio: instructionWidth / viewportWidth,
    editorRatio: editorWidth / viewportWidth,
    previewHeightRatio: clampNumber(layout.previewHeightRatio, 0.35, 0.82),
  };
}

function renderInlineCode(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${part}-${index}`}
          className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 font-mono text-[0.92em] text-zinc-100"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
}

function renderTextBlocks(text: string, className: string) {
  return text.split('\n\n').map((paragraph, index) => (
    <p key={`${paragraph}-${index}`} className={className}>
      {renderInlineCode(paragraph)}
    </p>
  ));
}

export default function WorkspaceEditor({ projectId, onBack }: WorkspaceEditorProps) {
  const initialStepList = projectId ? lessons[projectId] : null;
  const initialCode = initialStepList?.[0]?.seedCode ?? '';
  const { markCompleted } = useProgress();

  const desktopRootRef = useRef<HTMLDivElement | null>(null);
  const instructionPaneRef = useRef<HTMLDivElement | null>(null);
  const editorPaneRef = useRef<HTMLDivElement | null>(null);
  const previewPaneRef = useRef<HTMLDivElement | null>(null);
  const previewStackRef = useRef<HTMLDivElement | null>(null);
  const pendingLayoutRef = useRef<WorkspaceLayout>(DEFAULT_LAYOUT);
  const dragStateRef = useRef<DragState | null>(null);
  const dragFrameRef = useRef<number | null>(null);

  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window === 'undefined' ? 1440 : window.innerWidth
  ));
  const [viewportHeight, setViewportHeight] = useState(() => (
    typeof window === 'undefined' ? 900 : window.innerHeight
  ));
  const [layout, setLayout] = useState<WorkspaceLayout>(() => loadWorkspaceLayout());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [code, setCode] = useState(initialCode);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isPassed, setIsPassed] = useState(false);
  const [dragAxis, setDragAxis] = useState<DragAxis | null>(null);

  const stepList = projectId ? lessons[projectId] : null;
  const currentStep = stepList ? stepList[currentStepIndex] : null;
  const hasProjectId = typeof projectId === 'string' && projectId.length > 0;
  const isDesktop = viewportWidth >= DESKTOP_BREAKPOINT;
  const desktopLayout = clampDesktopLayout(layout, viewportWidth);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
      }
    };
  }, []);

  const applyLayoutToDom = (nextLayout: WorkspaceLayout) => {
    if (desktopRootRef.current) {
      desktopRootRef.current.style.setProperty('--instruction-ratio', `${nextLayout.instructionRatio}`);
      desktopRootRef.current.style.setProperty('--editor-ratio', `${nextLayout.editorRatio}`);
    }

    if (previewStackRef.current) {
      const previewStackHeight = previewStackRef.current.getBoundingClientRect().height || viewportHeight;
      const previewHeight = clampNumber(
        nextLayout.previewHeightRatio * previewStackHeight,
        PREVIEW_MIN_HEIGHT,
        previewStackHeight - CONSOLE_MIN_HEIGHT - GUTTER_SIZE
      );

      previewStackRef.current.style.setProperty('--preview-height', `${previewHeight}px`);
    }
  };

  const scheduleLayoutUpdate = (nextLayout: WorkspaceLayout) => {
    pendingLayoutRef.current = nextLayout;

    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
    }

    dragFrameRef.current = window.requestAnimationFrame(() => {
      dragFrameRef.current = null;
      applyLayoutToDom(pendingLayoutRef.current);
    });
  };

  const finishDrag = (target: Element, pointerId: number) => {
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }

    const nextLayout = pendingLayoutRef.current;
    applyLayoutToDom(nextLayout);
    setLayout(nextLayout);
    saveWorkspaceLayout(nextLayout);
    setDragAxis(null);
    dragStateRef.current = null;

    if (target instanceof Element && target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  };

  const handleDragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    if (dragState.target === 'instructions') {
      const maxInstructionWidth = dragState.containerWidth - dragState.startPreviewWidth - EDITOR_MIN_WIDTH - (GUTTER_SIZE * 2);
      const nextInstructionWidth = clampNumber(
        dragState.startInstructionWidth + (dragState.startX - event.clientX),
        INSTRUCTION_MIN_WIDTH,
        maxInstructionWidth
      );
      const nextEditorWidth = dragState.containerWidth - dragState.startPreviewWidth - nextInstructionWidth - (GUTTER_SIZE * 2);

      scheduleLayoutUpdate({
        ...dragState.startLayout,
        editorRatio: nextEditorWidth / dragState.containerWidth,
        instructionRatio: nextInstructionWidth / dragState.containerWidth,
      });

      return;
    }

    if (dragState.target === 'editor') {
      const maxEditorWidth = dragState.containerWidth - INSTRUCTION_MIN_WIDTH - PREVIEW_MIN_WIDTH - (GUTTER_SIZE * 2);
      const nextEditorWidth = clampNumber(
        dragState.startEditorWidth - (event.clientX - dragState.startX),
        EDITOR_MIN_WIDTH,
        maxEditorWidth
      );

      scheduleLayoutUpdate({
        ...dragState.startLayout,
        editorRatio: nextEditorWidth / dragState.containerWidth,
      });

      return;
    }

    const maxPreviewHeight = dragState.previewStackHeight - CONSOLE_MIN_HEIGHT - GUTTER_SIZE;
    const nextPreviewHeight = clampNumber(
      dragState.startPreviewHeight + (event.clientY - dragState.startY),
      PREVIEW_MIN_HEIGHT,
      maxPreviewHeight
    );

    scheduleLayoutUpdate({
      ...dragState.startLayout,
      previewHeightRatio: nextPreviewHeight / dragState.previewStackHeight,
    });
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    finishDrag(event.currentTarget, event.pointerId);
  };

  const startDrag = (target: DragTarget) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDesktop || !desktopRootRef.current || !instructionPaneRef.current || !editorPaneRef.current || !previewStackRef.current || !previewPaneRef.current) {
      return;
    }

    event.preventDefault();

    const containerWidth = desktopRootRef.current.getBoundingClientRect().width;
    const instructionWidth = instructionPaneRef.current.getBoundingClientRect().width;
    const editorWidth = editorPaneRef.current.getBoundingClientRect().width;
    const previewWidth = containerWidth - instructionWidth - editorWidth - (GUTTER_SIZE * 2);
    const previewHeight = previewPaneRef.current.getBoundingClientRect().height;
    const previewStackHeight = previewStackRef.current.getBoundingClientRect().height;
    const startLayout: WorkspaceLayout = {
      instructionRatio: instructionWidth / containerWidth,
      editorRatio: editorWidth / containerWidth,
      previewHeightRatio: previewHeight / previewStackHeight,
    };

    dragStateRef.current = {
      target,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPreviewWidth: previewWidth,
      startInstructionWidth: instructionWidth,
      startEditorWidth: editorWidth,
      startPreviewHeight: previewHeight,
      containerWidth,
      previewStackHeight,
      startLayout,
    };

    pendingLayoutRef.current = startLayout;
    setDragAxis(target === 'preview-height' ? 'row' : 'col');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleCheckCode = () => {
    if (!currentStep) {
      return;
    }

    const results = runTests(code, currentStep.testCases);
    const allPassed = results.every(result => result.passed) && results.length === currentStep.testCases.length;

    setTestResults(results);
    setIsPassed(allPassed);
  };

  const handleNextChallenge = () => {
    if (!stepList || currentStepIndex >= stepList.length - 1) {
      return;
    }

    const nextStep = stepList[currentStepIndex + 1];

    setCurrentStepIndex(prev => prev + 1);
    setCode(nextStep.seedCode);
    setTestResults([]);
    setIsPassed(false);
  };

  if (!hasProjectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#050505] text-white">
        <div className="mb-4 text-xl text-zinc-400">جاري تحميل مساحة العمل...</div>
        <button onClick={onBack} className="rounded-lg bg-zinc-800 px-4 py-2 transition hover:bg-zinc-700">
          العودة
        </button>
      </div>
    );
  }

  if (!stepList || !currentStep) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#050505] px-6 text-center text-white">
        <div className="mb-3 text-xl text-zinc-200">هذا المشروع غير جاهز بعد</div>
        <p className="mb-5 text-sm text-zinc-500">
          لم نعثر على محتوى تدريبي للمشروع <span className="font-mono text-zinc-300">{projectId}</span>.
        </p>
        <button onClick={onBack} className="rounded-lg bg-zinc-800 px-4 py-2 transition hover:bg-zinc-700">
          العودة
        </button>
      </div>
    );
  }

  const instructionPaneContent = (
    <>
      <div className="flex h-12 items-center gap-3 border-b border-[#262626] bg-[#111111] px-4">
        <button onClick={onBack} className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
          <ArrowRight className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-zinc-300">مسار التعلم</span>
      </div>

      <div className="scrollbar-hide flex-1 space-y-6 overflow-y-auto p-6">
        <header>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-500">
            الخطوة {currentStepIndex + 1} من {stepList.length}
          </p>
          <h1 className="text-2xl font-black leading-tight text-white">{currentStep.title}</h1>
        </header>

        <section className="space-y-4">
          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
            <strong className="mb-3 block text-sm font-bold text-white">شرح الفكرة</strong>
            <div className="space-y-3">
              {renderTextBlocks(currentStep.description, 'whitespace-pre-line text-[15px] leading-7 text-zinc-300')}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 shadow-[0_18px_40px_rgba(18,72,155,0.18)]">
            <strong className="mb-2 block text-sm font-bold text-blue-400">التعليمات</strong>
            <div className="space-y-3">
              {renderTextBlocks(currentStep.instructions, 'whitespace-pre-line text-sm leading-7 text-blue-50')}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 shadow-[0_18px_40px_rgba(120,88,19,0.15)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <strong className="text-sm font-bold text-amber-300">مثال جاهز</strong>
              <span className="text-[11px] font-bold text-amber-100/80">هكذا قد تبدو النتيجة بعد هذه الخطوة</span>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-white/8 bg-[#050505] p-4 text-left text-[12px] leading-6 text-amber-100" dir="ltr">
              <code>{currentStep.expectedOutput}</code>
            </pre>
          </div>
        </section>

        <section className="mt-8">
          <h3 className="mb-4 text-[15px] font-bold text-white">الاختبارات المطلوبة</h3>
          <ul className="space-y-3">
            {currentStep.testCases.map(testCase => {
              const result = testResults.find(item => item.id === testCase.id);
              let Icon = Circle;
              let iconColor = 'text-zinc-600';

              if (result) {
                if (result.passed) {
                  Icon = CheckCircle;
                  iconColor = 'text-green-500';
                } else {
                  Icon = XCircle;
                  iconColor = 'text-red-500';
                }
              }

              return (
                <li key={testCase.id} className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3.5 shadow-sm transition-colors">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
                  <span className={`text-[13px] leading-relaxed ${result?.passed ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {testCase.description}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-[#262626] bg-[#111111] p-4 transition-all">
        <button
          onClick={handleCheckCode}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all hover:bg-blue-500"
        >
          <Play className="ml-1 h-4 w-4 fill-current" />
          تحقق من الكود
        </button>

        {isPassed && currentStepIndex < stepList.length - 1 && (
          <button
            onClick={handleNextChallenge}
            className="animate-in zoom-in fade-in flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-300 hover:bg-green-400"
          >
            الخطوة التالية
            <ArrowLeft className="mr-1 h-4 w-4" />
          </button>
        )}

        {isPassed && currentStepIndex === stepList.length - 1 && (
          <button
            onClick={() => {
              if (projectId) {
                markCompleted(projectId);
              }

              onBack();
            }}
            className="animate-in zoom-in fade-in flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all duration-300 hover:bg-purple-400"
          >
            اكتمل المشروع! العودة
          </button>
        )}
      </div>
    </>
  );

  const editorPaneContent = (
    <>
      <div className="flex h-12 items-center justify-between border-b border-[#262626] bg-[#111111] px-5 py-3">
        <span className="text-xs font-mono text-zinc-400">index.html</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="html"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            wordWrap: 'on',
            padding: { top: 24, bottom: 24 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            formatOnPaste: true,
          }}
        />
      </div>
    </>
  );

  const previewPanelContent = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-b border-zinc-200 bg-white">
      <div className="flex h-12 items-center justify-between border-b border-zinc-200 bg-zinc-100 px-5 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Preview</span>
      </div>
      <div className="relative min-h-0 flex-1 bg-white">
        <iframe
          title="live-preview"
          srcDoc={code}
          sandbox="allow-scripts"
          className={cn('absolute inset-0 h-full w-full border-0 bg-white', dragAxis && 'pointer-events-none')}
        />
      </div>
    </div>
  );

  const consolePanelContent = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#050505] font-mono text-sm text-zinc-300">
      <div className="flex h-10 items-center border-b border-[#262626] bg-[#111111] px-5 py-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Console Output</span>
      </div>
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto p-4 text-left" dir="ltr">
        {testResults.length === 0 ? (
          <div className="flex items-center gap-2 text-xs italic text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse" />
            Waiting for execution...
          </div>
        ) : (
          <div className="space-y-3">
            {testResults.map(result => (
              <div key={result.id} className="flex flex-col border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <span className="text-[10px] font-bold uppercase text-green-500">✔ Passed</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-red-500">✘ Failed</span>
                  )}
                  <span className="max-w-[200px] truncate text-[10px] text-zinc-500">- {result.id}</span>
                </div>
                {result.error && (
                  <pre className="mt-1.5 whitespace-pre-wrap rounded border border-red-500/20 bg-red-500/10 p-2 text-[11px] text-red-400">
                    {result.error}
                  </pre>
                )}
              </div>
            ))}
            {isPassed && (
              <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <span className="mb-1 block text-[10px] font-bold uppercase text-green-500">
                  === Build Success ===
                </span>
                <p className="text-[11px] leading-relaxed text-green-400/80">
                  Tests executed successfully. Challenge limits passed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const desktopPreviewHeight = clampNumber(
    desktopLayout.previewHeightRatio * viewportHeight,
    PREVIEW_MIN_HEIGHT,
    viewportHeight - CONSOLE_MIN_HEIGHT - GUTTER_SIZE
  );

  const desktopRootStyle = {
    '--instruction-ratio': `${desktopLayout.instructionRatio}`,
    '--editor-ratio': `${desktopLayout.editorRatio}`,
    gridTemplateRows: 'minmax(0, 1fr)',
    gridTemplateColumns: `minmax(${PREVIEW_MIN_WIDTH}px, 1fr) ${GUTTER_SIZE}px minmax(${EDITOR_MIN_WIDTH}px, calc(var(--editor-ratio) * 100%)) ${GUTTER_SIZE}px minmax(${INSTRUCTION_MIN_WIDTH}px, calc(var(--instruction-ratio) * 100%))`,
  } as React.CSSProperties & Record<string, string>;

  const desktopPreviewStackStyle = {
    '--preview-height': `${desktopPreviewHeight}px`,
    height: '100%',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridTemplateRows: `minmax(${PREVIEW_MIN_HEIGHT}px, var(--preview-height)) ${GUTTER_SIZE}px minmax(${CONSOLE_MIN_HEIGHT}px, 1fr)`,
  } as React.CSSProperties & Record<string, string>;

  const gutterBaseClass = 'group flex items-center justify-center bg-[#080808] transition-colors touch-none select-none';

  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-[100] flex h-screen w-screen flex-col overflow-y-auto bg-[#050505] text-zinc-300">
        <div className="flex min-h-[280px] flex-col border-b border-[#262626] bg-[#0A0A0A]" dir="rtl">
          {instructionPaneContent}
        </div>

        <div className="flex min-h-[320px] flex-col border-b border-[#262626] bg-[#1e1e1e]" dir="ltr">
          {editorPaneContent}
        </div>

        <div
          className="grid min-h-[340px] flex-1 bg-white"
          dir="ltr"
          style={{ gridTemplateRows: 'minmax(180px, 3fr) minmax(160px, 2fr)' }}
        >
          {previewPanelContent}
          {consolePanelContent}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={desktopRootRef}
      className="fixed inset-0 z-[100] grid h-screen w-screen overflow-hidden bg-[#050505] font-sans text-zinc-300"
      dir="ltr"
      style={desktopRootStyle}
    >
      {dragAxis && (
        <div className={cn('absolute inset-0 z-[140] bg-transparent', dragAxis === 'col' ? 'cursor-col-resize' : 'cursor-row-resize')} />
      )}

      <div ref={previewStackRef} className="grid h-full min-h-0 bg-white" dir="ltr" style={desktopPreviewStackStyle}>
        <div ref={previewPaneRef} className="h-full min-h-0">
          {previewPanelContent}
        </div>

        <button
          type="button"
          aria-label="Resize preview and console"
          onPointerDown={startDrag('preview-height')}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          className={`${gutterBaseClass} h-[10px] cursor-row-resize border-y border-[#1d1d1d] hover:bg-cyan-500/20`}
        >
          <span className="h-[2px] w-16 rounded-full bg-black/20 transition-colors group-hover:bg-cyan-500/60" />
        </button>

        <div className="h-full min-h-0">
          {consolePanelContent}
        </div>
      </div>

      <button
        type="button"
        aria-label="Resize editor and preview"
        onPointerDown={startDrag('editor')}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        className={`${gutterBaseClass} w-[10px] cursor-col-resize border-l border-r border-[#1d1d1d] hover:bg-emerald-500/20`}
      >
        <span className="h-16 w-[2px] rounded-full bg-white/10 transition-colors group-hover:bg-emerald-400/60" />
      </button>

      <div ref={editorPaneRef} className="flex min-w-0 flex-col border-l border-[#262626] bg-[#1e1e1e]" dir="ltr">
        {editorPaneContent}
      </div>

      <button
        type="button"
        aria-label="Resize instructions and editor"
        onPointerDown={startDrag('instructions')}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        className={`${gutterBaseClass} w-[10px] cursor-col-resize border-l border-r border-[#1d1d1d] hover:bg-blue-500/20`}
      >
        <span className="h-16 w-[2px] rounded-full bg-white/10 transition-colors group-hover:bg-blue-400/60" />
      </button>

      <div ref={instructionPaneRef} className="flex min-w-0 flex-col border-l border-[#262626] bg-[#0A0A0A]" dir="rtl">
        {instructionPaneContent}
      </div>
    </div>
  );
}
