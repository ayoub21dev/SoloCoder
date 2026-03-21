'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { lessons } from '@/lib/curriculum';
import { runTests, TestResult } from '@/lib/validation';
import { CheckCircle, XCircle, Circle, Play, ArrowLeft, ArrowRight } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

interface WorkspaceEditorProps {
  projectId: string | null;
  onBack: () => void;
}

export default function WorkspaceEditor({ projectId, onBack }: WorkspaceEditorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isPassed, setIsPassed] = useState(false);
  const { markCompleted } = useProgress();

  const stepList = projectId ? lessons[projectId] : null;
  const currentStep = stepList ? stepList[currentStepIndex] : null;

  // Reset to first step when the project changes
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [projectId]);

  // Reset state when current step changes
  useEffect(() => {
    if (currentStep) {
      setCode(currentStep.seedCode);
      setTestResults([]);
      setIsPassed(false);
    }
  }, [currentStep]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleCheckCode = () => {
    if (!currentStep) return;
    const results = runTests(code, currentStep.testCases);
    setTestResults(results);
    
    // Check if all tests passed
    const allPassed = results.every(r => r.passed) && results.length === currentStep.testCases.length;
    setIsPassed(allPassed);
  };

  const handleNextChallenge = () => {
    if (stepList && currentStepIndex < stepList.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  if (!currentStep || !stepList) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050505] text-white">
        <div className="text-xl mb-4 text-zinc-400">جاري تحميل مساحة العمل...</div>
        <button onClick={onBack} className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition">
          العودة
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex h-screen w-screen bg-[#050505] text-zinc-300 font-sans overflow-hidden" dir="rtl">
      
      {/* 1. Right Pane: Instruction Panel (First child in RTL goes to right) */}
      <div className="w-1/3 flex flex-col border-l border-[#262626] bg-[#0A0A0A] z-10">
        <div className="flex items-center px-4 h-12 border-b border-[#262626] bg-[#111111] gap-3">
           <button onClick={onBack} className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
           </button>
           <span className="text-xs font-bold text-zinc-300">مسار التعلم</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <header>
            <p className="text-xs font-bold text-blue-500 mb-2 uppercase tracking-wide">
              الخطوة {currentStepIndex + 1} من {stepList.length}
            </p>
            <h1 className="text-2xl font-black text-white leading-tight">{currentStep.title}</h1>
          </header>
          
          <section className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-zinc-400">
            <p className="text-[15px] whitespace-pre-line">{currentStep.description}</p>
            <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 relative overflow-hidden">
              <strong className="block text-blue-400 mb-2 font-bold text-sm">التعليمات:</strong>
              <p className="text-sm leading-relaxed text-blue-100">{currentStep.instructions}</p>
            </div>
          </section>

          {/* Test Cases List */}
          <section className="mt-8">
            <h3 className="text-[15px] font-bold text-white mb-4">الاختبارات المطلوبة</h3>
            <ul className="space-y-3">
              {currentStep.testCases.map((tc) => {
                const result = testResults.find(r => r.id === tc.id);
                let Icon = Circle;
                let iconColor = "text-zinc-600";
                
                if (result) {
                  if (result.passed) {
                    Icon = CheckCircle;
                    iconColor = "text-green-500";
                  } else {
                    Icon = XCircle;
                    iconColor = "text-red-500";
                  }
                }
                
                return (
                  <li key={tc.id} className="flex items-start gap-3 bg-white/[0.02] p-3.5 rounded-lg border border-white/[0.05] shadow-sm transition-colors">
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                    <span className={`text-[13px] leading-relaxed ${result?.passed ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {tc.description}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t border-[#262626] bg-[#111111] flex justify-between items-center transition-all">
          <button 
            onClick={handleCheckCode}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
          >
            <Play className="w-4 h-4 fill-current ml-1" />
            تحقق من الكود
          </button>
          
          {isPassed && currentStepIndex < stepList.length - 1 && (
            <button 
              onClick={handleNextChallenge}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-in fade-in zoom-in duration-300"
            >
              الخطوة التالية
              <ArrowLeft className="w-4 h-4 mr-1" />
            </button>
          )}

          {isPassed && currentStepIndex === stepList.length - 1 && (
             <button 
               onClick={() => {
                 if (projectId) markCompleted(projectId);
                 onBack();
               }}
               className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-in fade-in zoom-in duration-300"
             >
                اكتمل المشروع! العودة
             </button>
          )}
        </div>
      </div>

      {/* 2. Middle Pane: Code Editor */}
      <div className="w-1/3 flex flex-col border-l border-[#262626] relative bg-[#1e1e1e]" dir="ltr">
        <div className="px-5 py-3 h-12 bg-[#111111] border-b border-[#262626] flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">index.html</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="html"
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
              wordWrap: "on",
              padding: { top: 24, bottom: 24 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              formatOnPaste: true,
            }}
          />
        </div>
      </div>

      {/* 3. Left Pane: Preview & Console */}
      <div className="w-1/3 flex flex-col bg-white" dir="ltr">
        {/* Live Preview */}
        <div className="flex-1 flex flex-col border-b border-zinc-200 relative">
          <div className="px-5 py-3 h-12 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Preview</span>
          </div>
          <div className="flex-1 w-full relative bg-white">
            <iframe
              title="live-preview"
              srcDoc={code}
              sandbox="allow-scripts"
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        </div>

        {/* Console */}
        <div className="h-[35%] min-h-[200px] flex flex-col bg-[#050505] font-mono text-sm transition-all duration-300 border-t border-[#262626]">
          <div className="px-5 py-2 h-10 bg-[#111111] flex items-center border-b border-[#262626]">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Console Output</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide text-left" dir="ltr">
            {testResults.length === 0 ? (
              <div className="text-zinc-600 italic flex items-center gap-2 text-xs">
                 <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-pulse"></span>
                 Waiting for execution...
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((r) => (
                  <div key={r.id} className="flex flex-col border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                       {r.passed ? (
                          <span className="text-green-500 font-bold text-[10px] uppercase">✔ Passed</span>
                       ) : (
                          <span className="text-red-500 font-bold text-[10px] uppercase">✘ Failed</span>
                       )}
                       <span className="text-zinc-500 text-[10px] truncate max-w-[200px]">- {r.id}</span>
                    </div>
                    {r.error && (
                       <pre className="text-red-400 mt-1.5 whitespace-pre-wrap text-[11px] bg-red-500/10 p-2 rounded border border-red-500/20">
                         {r.error}
                       </pre>
                    )}
                  </div>
                ))}
                {isPassed && (
                  <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="block text-green-500 font-bold mb-1 text-[10px] uppercase">
                       === Build Success ===
                    </span>
                    <p className="text-green-400/80 text-[11px] leading-relaxed">
                       Tests executed successfully. Challenge limits passed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    
    </div>
  );
}
