import React, { useState } from 'react';
import { ArrowRight, Cpu, Database, Layout, Shield, Chrome, Server, HelpCircle, Activity } from 'lucide-react';

export default function ArchitectureView() {
  const [activeNode, setActiveNode] = useState<string | null>('client');

  const nodes = [
    {
      id: 'client',
      title: '1. Reactive Client-Side SPA',
      desc: 'Built with React, Vite, and Tailwind CSS. Collects user onboarding metrics (Standard Completed, raw interest text, stream-specific assessment answers).',
      icon: <Chrome className="w-6 h-6 text-teal-400" />,
      badges: ['React 19', 'Tailwind', 'Responsive UX']
    },
    {
      id: 'backend',
      title: '2. Express Full-Stack Server',
      desc: 'Handles secure routing, serves client assets, and holds secret key bindings. Houses analytical score aggregation and triggers matching engines.',
      icon: <Server className="w-6 h-6 text-indigo-400" />,
      badges: ['Express v4', 'Secret Management', 'CORS Enforcer']
    },
    {
      id: 'nlp',
      title: '3. NLP Vector & Evaluation pipeline',
      desc: 'Performs Named Entity Recognition (NER), handles token part-of-speech filtering (spaCy), calculates semantic embeddings, and groups user intent.',
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      badges: ['Gemini 3.5 Flash', 'Sentence-Transformers', 'spaCy Core']
    },
    {
      id: 'postgres',
      title: '4. Relational Storage Layer',
      desc: 'Standardized PostgreSQL database ensuring relational constraints. Normalizes user data, logs chronological assessment scores, and tracks recommendations.',
      icon: <Database className="w-6 h-6 text-blue-400" />,
      badges: ['PostgreSQL 16+', 'DDL Norms', 'Performance Indexes']
    }
  ];

  return (
    <div className="space-y-6" id="architecture-view-root">
      {/* Introduction Header */}
      <div className="bg-zinc-850/50 backdrop-blur border border-zinc-800 p-5 rounded-2xl">
        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 mb-1.5 font-sans">
          <Activity className="w-4 h-4 text-indigo-400" />
          Enterprise System Architecture & Data Flow
        </h3>
        <p className="text-zinc-405 text-xs text-zinc-400 leading-relaxed">
          The Smart Student Hub follows an event-driven decoupled architecture model. Data moves securely from the React client-side form-nodes up through our Express gateway layer into the modern NLP semantic classifiers. This pipeline resolves dynamic user context and registers transactional records inside relational schema pools.
        </p>
      </div>

      {/* Interactive Visual Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Nodes flow column */}
        <div className="lg:col-span-7 space-y-3.5">
          <h4 className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase font-mono">System Components (Click to inspect data flow)</h4>
          <div className="space-y-3">
            {nodes.map((node, idx) => (
              <div 
                key={node.id}
                onClick={() => setActiveNode(node.id)}
                className={`p-4.5 rounded-xl border transition-all duration-200 cursor-pointer flex gap-4 items-start ${
                  activeNode === node.id 
                    ? 'bg-zinc-800/80 border-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.08)]' 
                    : 'bg-zinc-950 border-zinc-850 hover:border-zinc-800 hover:bg-zinc-900/30'
                }`}
              >
                <div className={`p-2.5 rounded-lg bg-zinc-900 border ${activeNode === node.id ? 'border-indigo-500/50' : 'border-zinc-800'}`}>
                  {node.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-zinc-100 text-sm font-sans">{node.title}</h5>
                    <span className="text-[10px] font-mono text-zinc-500 font-bold">Node 0{idx + 1}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">{node.desc}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {node.badges.map((b) => (
                      <span key={b} className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-905 text-zinc-305 border border-zinc-800/60 font-bold">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Detail Card / Simulation Trace */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-950 border border-zinc-850 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="space-y-5 flex-1">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">Data Flow Details</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Connection
              </span>
            </div>

            {/* Client Context */}
            {activeNode === 'client' && (
              <div className="space-y-3.5 animate-fade-in">
                <span className="text-[10px] font-mono bg-indigo-950/60 border border-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded font-bold">STAGE 1: INTERACTION INGRESS</span>
                <h5 className="text-base font-bold text-zinc-200">How Data Originates</h5>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  The user selects their educational tier and outputs raw, descriptive text indicating their life dream, favorite subject, and strengths. 
                </p>
                <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-850 space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 block">HTTP REQUEST PAYLOAD (METRICS)</span>
                  <pre className="text-[11px] text-indigo-300 font-mono overflow-auto leading-tight">
{`{
  "status": "12th_completed",
  "hobbies": "coding robotic scripts",
  "strengths": "calculus & logic",
  "favoriteSubject": "Physics",
  "openDream": "develop neural nets"
}`}
                  </pre>
                </div>
              </div>
            )}

            {/* Backend Context */}
            {activeNode === 'backend' && (
              <div className="space-y-3.5 animate-fade-in">
                <span className="text-[10px] font-mono bg-indigo-950/60 border border-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded font-bold">GATEWAY API LAYER</span>
                <h5 className="text-base font-bold text-zinc-200">Express Routing & Execution</h5>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  The local Express core (running on port 3000) acts as a reverse proxy validation point. It prevents API key leaks by withholding credentials from client browsers, executing server-side API requests instead.
                </p>
                <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-850 space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 block">POST ROUTE VALIDATION</span>
                  <pre className="text-[11px] text-indigo-400 font-mono overflow-auto leading-tight">
{`app.post("/api/profile-interests", 
  async (req, res) => {
    // 1. Verify Request body
    // 2. Fetch system Secrets
    // 3. Forward to Pipeline
});`}
                  </pre>
                </div>
              </div>
            )}

            {/* NLP Pipeline Web Model */}
            {activeNode === 'nlp' && (
              <div className="space-y-3.5 animate-fade-in">
                <span className="text-[10px] font-mono bg-indigo-950/60 border border-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded font-bold">VECTOR ALIGNMENT & EXTRACTION</span>
                <h5 className="text-base font-bold text-zinc-200">Under-the-Hood NLP Engines</h5>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  The engine extracts concepts (Part-of-Speech tagging to identify substantive nouns) and computes embeddings. It executes cosine similarity algorithms to match responses with precomputed industry vector spaces.
                </p>
                <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-850 text-[11px] space-y-1 text-indigo-300 font-mono">
                  <div>1. Text Tokenization [spaCy]</div>
                  <div>2. NER Extraction (e.g. Entity: "Python")</div>
                  <div>3. Embeddings [all-MiniLM-L6-v2]</div>
                  <div>4. Cosine Match: sim(User_V, Industry_V)</div>
                </div>
              </div>
            )}

            {/* Postgres SQL Context */}
            {activeNode === 'postgres' && (
              <div className="space-y-3.5 animate-fade-in">
                <span className="text-[10px] font-mono bg-indigo-950/60 border border-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded font-bold">RELATIONAL PERSISTENT TRANSACTION</span>
                <h5 className="text-base font-bold text-zinc-200">Schema Relational Normalization</h5>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  After mapping, the user profile, assessment metrics, and career suggestions are committed to distinct PostgreSQL catalog tables linked by declarative referential UUID keys.
                </p>
                <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-850 text-[11px] text-zinc-400 font-mono space-y-1">
                  <div>- INSERT INTO users VALUES (...)</div>
                  <div>- INSERT INTO interest_profiles (...)</div>
                  <div>- INSERT INTO test_sessions (...)</div>
                  <div>- INSERT INTO recommendations (...)</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-850/30 p-4 rounded-xl border border-zinc-800 mt-4 flex gap-3 items-center">
            <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <p className="text-[11px] text-zinc-500 leading-snug">
              Every stage incorporates strict defensive verification. High-entropy UUID identifiers isolate profile transactions, and semantic fallbacks assure robust operation even in peak API latency states.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
