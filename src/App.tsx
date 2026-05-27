import React from 'react';
import AssessmentEngine from './components/AssessmentEngine';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background ambient decorative spotlights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-505/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Main Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-indigo-600 rounded-lg text-white font-mono text-sm leading-none flex items-center justify-center shadow-lg shadow-indigo-500/10 font-bold">ST</span>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Smart Student Hub
                <span className="text-indigo-400 text-[10px] font-mono select-none font-bold bg-indigo-950/60 border border-indigo-900/40 px-1.5 py-0.5 rounded ml-1">v2.0.4</span>
              </h1>
            </div>
          </div>
          <span className="text-[10px] bg-zinc-900 text-indigo-400 px-2.5 py-1 rounded font-mono border border-zinc-800 font-bold uppercase tracking-wider">
            Portal Active
          </span>
        </div>
      </header>

      {/* Main Grid Layout: Onboarding Stages & Workspace */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Onboarding Stages */}
          <div className="col-span-12 lg:col-span-4 bg-zinc-900 border border-zinc-850 rounded-2xl p-6 flex flex-col justify-between h-fit lg:sticky lg:top-24">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Onboarding Stages</h3>
                <span className="text-[9px] bg-zinc-950 text-indigo-400 px-2 py-0.5 rounded font-mono border border-zinc-850 font-bold">4 Steps</span>
              </div>
              
              <div className="space-y-5">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-indigo-600/30 shrink-0 mt-0.5">
                    01
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-200">Initial Academic Selection</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Define student target grade mapping</span>
                  </div>
                </div>
                
                <div className="w-px h-4 bg-zinc-800 ml-3"></div>
                
                {/* Step 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-800 text-zinc-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    02
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-400">Concept Semantic Extraction</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Extract interests vocabulary [spaCy]</span>
                  </div>
                </div>
                
                <div className="w-px h-4 bg-zinc-800 ml-3"></div>
                
                {/* Step 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-800 text-zinc-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    03
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-400">Calibrated Cognitive Evaluation</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Complete adaptive aptitude tests</span>
                  </div>
                </div>
                
                <div className="w-px h-4 bg-zinc-800 ml-3"></div>
                
                {/* Step 4 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-800 text-zinc-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    04
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-400">Strategic Roadmap Matching</span>
                    <span className="text-[10px] text-zinc-505 text-zinc-500 font-mono mt-0.5">Retrieve curated progress paths</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Portal Interaction Workspace */}
          <div className="col-span-12 lg:col-span-8 bg-zinc-900 border border-zinc-850 rounded-2xl p-6 md:p-8 relative shadow-xl shadow-black/40 h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] pointer-events-none rounded-full" />
            <AssessmentEngine />
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-[10.5px] text-zinc-505 text-zinc-500 font-mono">
        <div className="max-w-6xl mx-auto px-6">
          Smart Student Hub &copy; 2026 • Intelligent Adaptive Pathing System
        </div>
      </footer>

    </div>
  );
}
