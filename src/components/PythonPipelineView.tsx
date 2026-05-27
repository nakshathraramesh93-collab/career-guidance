import React, { useState } from 'react';
import { PYTHON_NLP_PIPELINE } from '../types';
import { Copy, Check, Cpu, Terminal, Play, Sliders, ListFilter, HelpCircle, HardDrive } from 'lucide-react';

export default function PythonPipelineView() {
  const [copied, setCopied] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.65);
  const [spacyModel, setSpacyModel] = useState<string>('en_core_web_md');
  const [sandboxInput, setSandboxInput] = useState<string>('I enjoy structural coding in Python, sketching UI vector assets, and implementing deep neural graphs.');
  const [sandboxOutput, setSandboxOutput] = useState<any | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(PYTHON_NLP_PIPELINE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulating NLP parsing and vector comparison locally to provide interactive playground!
  const runSimulatedNlpPipeline = () => {
    setRunning(true);
    setSandboxOutput(null);
    
    setTimeout(() => {
      const tokens = sandboxInput.toLowerCase().split(/[\s,.]+/);
      const extractedConcepts: string[] = [];
      const keywords = ['python', 'coding', 'sketching', 'neural', 'graphs', 'programming', 'biology', 'medicine', 'finance', 'statistics', 'accounting', 'art', 'vector', 'design', 'calculus'];
      
      tokens.forEach(tok => {
        if (keywords.includes(tok) && !extractedConcepts.includes(tok)) {
          extractedConcepts.push(tok);
        }
      });

      // Default fallback concepts
      if (extractedConcepts.length === 0) {
        extractedConcepts.push('lexical-tokens', 'semantic-nouns');
      }

      // Compute match vectors
      const lower = sandboxInput.toLowerCase();
      let bestCluster = "Humanities, Creative Arts & Design";
      let confidence = 0.42;

      if (lower.includes('coding') || lower.includes('python') || lower.includes('neural') || lower.includes('graphs')) {
        bestCluster = "Engineering & Software Development";
        confidence = 0.88;
      } else if (lower.includes('biology') || lower.includes('medicine') || lower.includes('anatomy')) {
        bestCluster = "Medical, Biological & Life Sciences";
        confidence = 0.85;
      } else if (lower.includes('finance') || lower.includes('accounting') || lower.includes('statistics')) {
        bestCluster = "Commerce, Business Analytics & Finance";
        confidence = 0.81;
      } else if (lower.includes('sketching') || lower.includes('art') || lower.includes('vector') || lower.includes('design')) {
        bestCluster = "Humanities, Creative Arts & Design";
        confidence = 0.79;
      }

      const passThreshold = confidence >= similarityThreshold;

      setSandboxOutput({
        extractedConcepts,
        mappedCluster: passThreshold ? bestCluster : 'General Studies (Below similarity threshold)',
        similarityScore: confidence,
        thresholdMet: passThreshold,
        pipelineMetrics: {
          tokenization_time_ms: (12 + Math.random() * 8).toFixed(2),
          embeddings_compute_ms: (45 + Math.random() * 20).toFixed(2),
          overall_execution_time_ms: (57 + Math.random() * 30).toFixed(2),
          spacy_model_used: spacyModel
        },
        suggestedGroupRoute: passThreshold && bestCluster === "Engineering & Software Development" 
          ? "Computer Science & Mathematics group suggested."
          : passThreshold && bestCluster === "Medical, Biological & Life Sciences"
          ? "Bio-Medical & Integrative Sciences group suggested."
          : passThreshold && bestCluster === "Commerce, Business Analytics & Finance"
          ? "Quantitative Finance & Commercial analytics stream suggested."
          : "Liberal Humanities combined educational tracks suggested."
      });
      setRunning(false);
    }, 850);
  };

  return (
    <div className="space-y-6" id="python-pipeline-root">
      
      {/* Intro section */}
      <div className="bg-zinc-850/50 backdrop-blur border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 md:max-w-xl">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-sans">
            <Cpu className="w-5 h-5 text-indigo-400" />
            NLP Pipeline & ML Formulation
          </h3>
          <p className="text-zinc-400 text-xs leading-relaxed font-sans">
            Modular Python engine blueprint demonstrating SpaCy entity recognition, Sentence-Transformer vector cosine similarity comparisons, and automated multi-route classification logic.
          </p>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-505 text-white font-bold font-sans rounded-xl text-xs transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Codebase Copied!' : 'Copy Code Blueprint'}
        </button>
      </div>

      {/* Two columns: Interactive parameter playground and Sandbox execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Parameter playground & sandbox */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 font-mono">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Pipeline Parameters Console
            </h4>

            {/* Config Sliders */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono text-zinc-350">
                  <span>Cosine Similarity Threshold</span>
                  <span className="text-indigo-400 font-bold">{(similarityThreshold).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.95"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-zinc-500 font-mono block">Higher values require tight semantic matching.</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-zinc-300 block">spaCy Language Model Weights</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['en_core_web_sm', 'en_core_web_md', 'en_core_web_lg'].map((model) => (
                    <button
                      key={model}
                      onClick={() => setSpacyModel(model)}
                      className={`text-[10px] font-mono py-1 rounded border transition-all ${
                        spacyModel === model 
                          ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 font-bold' 
                          : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      {model.replace('en_core_web_', '').toUpperCase()} ({(model.endsWith('sm') ? 'Small' : model.endsWith('md') ? 'Medium' : 'Large')})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sandbox input */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-mono text-zinc-300 block">Simulate Onboarding Open-Text Stream Input</span>
              <textarea
                value={sandboxInput}
                onChange={(e) => setSandboxInput(e.target.value)}
                className="w-full h-24 bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 font-sans focus:border-indigo-500 focus:outline-none resize-none leading-relaxed placeholder-zinc-700"
                placeholder="Type hobbies, dream, strengths..."
              />
              <button
                onClick={runSimulatedNlpPipeline}
                disabled={running}
                className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 text-indigo-451 text-indigo-400 font-bold text-xs font-mono rounded-xl border border-indigo-500/30 hover:border-indigo-500/80 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                {running ? 'Parsing Text Features...' : 'Run Pipeline Simulator'}
              </button>
            </div>
          </div>

          {/* Execution metrics */}
          {sandboxOutput && (
            <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4.5 space-y-3.5 animate-fade-in text-xs font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 border-b border-zinc-850 pb-2">
                <Terminal className="w-3.5 h-3.5" />
                <span className="font-bold">[PIPELINE OUTPUT VERBAL REGISTER]</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Language Model:</span>
                  <span className="text-zinc-300">{sandboxOutput.pipelineMetrics.spacy_model_used}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">NER Concept Vocabulary:</span>
                  <span className="text-indigo-400 font-bold">[{sandboxOutput.extractedConcepts.join(', ')}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Calculated Cosine Affinity:</span>
                  <span className="text-emerald-400 font-bold">{sandboxOutput.similarityScore.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Threshold Met Status:</span>
                  <span className={`font-bold ${sandboxOutput.thresholdMet ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sandboxOutput.thresholdMet ? 'PASSED_ROUTING_KEY' : 'FAILED_THRESHOLD_PRUNED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Mapped Industry Sector:</span>
                  <span className="text-zinc-200">{sandboxOutput.mappedCluster}</span>
                </div>
              </div>
              <div className="p-3 bg-zinc-950 rounded-lg text-zinc-400 text-[11px] leading-snug border border-zinc-850">
                <span className="text-indigo-400 font-bold block mb-1">🎯 Suggested Sub-specialty:</span>
                {sandboxOutput.suggestedGroupRoute}
              </div>
            </div>
          )}
        </div>

        {/* Right: Technical codebase pre block */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-850 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2 text-zinc-300">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-xs">pipeline_engine.py</span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-950 font-bold text-zinc-500 border border-zinc-850/60">Python 3.10+ & spaCy & HuggingFace</span>
          </div>
          <div className="flex-1 bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 font-mono text-[11px] text-zinc-400 overflow-auto h-[480px] leading-relaxed relative">
            <pre className="whitespace-pre">{PYTHON_NLP_PIPELINE}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
