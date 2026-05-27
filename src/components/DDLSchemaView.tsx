import React, { useState } from 'react';
import { POSTGRESQL_DDL } from '../types';
import { Copy, Check, Database, Table, Settings, Key, AlertCircle } from 'lucide-react';

export default function DDLSchemaView() {
  const [copied, setCopied] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('users');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(POSTGRESQL_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dbSchemaOverview = [
    {
      id: 'users',
      name: 'users',
      purpose: 'Core master table listing demographic onboarding state.',
      columns: [
        { name: 'user_id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Auto-generates high-entropy user key.' },
        { name: 'email', type: 'VARCHAR(255)', key: 'UNIQUE', desc: 'Verified communication email.' },
        { name: 'full_name', type: 'VARCHAR(150)', key: 'NOT NULL', desc: 'Student display name.' },
        { name: 'status', type: 'user_status_type', key: 'NOT NULL', desc: 'Enum: [10TH_COMPLETED, 12TH_COMPLETED, COLLEGE_GRADUATE]' }
      ]
    },
    {
      id: 'interest_profiles',
      name: 'interest_profiles',
      purpose: 'Stores stage-1 open text inputs and resulting NLP vector maps.',
      columns: [
        { name: 'profile_id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Primary document identifier.' },
        { name: 'user_id', type: 'UUID', key: 'FOREIGN KEY', desc: 'References users(user_id) ON DELETE CASCADE.' },
        { name: 'raw_hobbies_text', type: 'TEXT', key: '', desc: 'Student open-ended hobby description.' },
        { name: 'extracted_concepts', type: 'VARCHAR[]', key: '', desc: 'NER semantic concept array extracted by spaCy.' },
        { name: 'mapped_industry_cluster', type: 'VARCHAR', key: '', desc: 'Precomputed industry match determined by Bi-Encoder cosine similarity.' }
      ]
    },
    {
      id: 'test_templates',
      name: 'test_templates',
      purpose: 'Adaptive evaluation question items repository.',
      columns: [
        { name: 'question_id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Identifies evaluation item.' },
        { name: 'domain', type: 'assessment_domain_type', key: 'NOT NULL', desc: 'Domain filter tags [e.g. MATH, SCIENCE, COMMERCE_ARTS].' },
        { name: 'question_text', type: 'TEXT', key: 'NOT NULL', desc: 'Question prompt statement.' },
        { name: 'options', type: 'JSONB', key: 'NOT NULL', desc: 'Structured selection list of candidate options.' },
        { name: 'correct_option', type: 'VARCHAR', key: 'NOT NULL', desc: 'Correct value matching for scoring.' }
      ]
    },
    {
      id: 'test_sessions',
      name: 'test_sessions',
      purpose: 'Logs complete details of user assessment scores and responses.',
      columns: [
        { name: 'session_id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Identifier for user test session.' },
        { name: 'user_id', type: 'UUID', key: 'FOREIGN KEY', desc: 'References users(user_id).' },
        { name: 'domain_type', type: 'assessment_domain_type', key: 'NOT NULL', desc: 'Active session stream category.' },
        { name: 'answers_payload', type: 'JSONB', key: 'NOT NULL', desc: 'Answers payload containing keys and entries selected by student.' },
        { name: 'raw_score', type: 'INTEGER', key: 'NOT NULL', desc: 'Aggregated numeric correct answers count.' }
      ]
    },
    {
      id: 'recommendations',
      name: 'recommendations',
      purpose: 'Tailored roadmaps matching score outcomes.',
      columns: [
        { name: 'recommendation_id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Prescription unique lookup.' },
        { name: 'user_id', type: 'UUID', key: 'FOREIGN KEY', desc: 'References users(user_id).' },
        { name: 'suggested_major_pathway', type: 'VARCHAR(255)', key: 'NOT NULL', desc: 'Final predicted stream/course.' },
        { name: 'nlp_match_confidence', type: 'NUMERIC(5,2)', key: 'NOT NULL', desc: 'Classifier model affinity output (%).' },
        { name: 'structured_roadmap', type: 'JSONB', key: 'NOT NULL', desc: 'Curriculum steps logged as ordered sequence.' }
      ]
    }
  ];

  const currentTableSchema = dbSchemaOverview.find(t => t.id === selectedTable);

  return (
    <div className="space-y-6" id="ddl-schema-root">
      
      {/* Intro section */}
      <div className="bg-zinc-850/50 backdrop-blur border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 md:max-w-2xl">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-sans">
            <Database className="w-5 h-5 text-indigo-400" />
            Relational PostgreSQL DDL Specification
          </h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            This database design operates under full relational validation standards. Every table is normalized to 3NF boundaries, indexing crucial key columns to ensure ultra-low latency searches.
          </p>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-750 text-white font-bold font-sans rounded-xl text-xs transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'DDL Copied!' : 'Copy Schema DDL'}
        </button>
      </div>

      {/* Main Grid: DDL Catalog Browser and Live Schema Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Table navigator */}
        <div className="lg:col-span-4 space-y-3.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Database Catalog Tables</h4>
          <div className="space-y-2">
            {dbSchemaOverview.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedTable(item.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedTable === item.id 
                    ? 'bg-zinc-800 border-indigo-500 text-indigo-400 font-bold' 
                    : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900/40 text-zinc-300 hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-mono text-xs">{item.name}</span>
                </div>
                <p className="text-[10px] text-zinc-500 truncate max-w-xs font-sans">{item.purpose}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Active table metadata details */}
        <div className="lg:col-span-8 bg-zinc-900 border border-zinc-850 rounded-2xl p-5 space-y-5">
          {currentTableSchema && (
            <div className="space-y-5">
              <div className="border-b border-zinc-800/80 pb-3">
                <span className="text-[10px] font-mono text-indigo-400 tracking-wider font-bold uppercase">Active Table Diagnostics</span>
                <h4 className="text-lg font-bold text-zinc-250 font-mono mt-1">TABLE: {currentTableSchema.name}</h4>
                <p className="text-zinc-450 text-xs mt-1 font-sans text-zinc-400">{currentTableSchema.purpose}</p>
              </div>

              {/* Columns specification cards */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-12 text-[10px] font-mono font-black text-zinc-500 px-3 pb-1 border-b border-zinc-850">
                  <div className="col-span-4">COLUMN NAME</div>
                  <div className="col-span-3">DATA TYPE</div>
                  <div className="col-span-2">KEY / STATE</div>
                  <div className="col-span-3">SPECIFICATION</div>
                </div>

                <div className="space-y-2">
                  {currentTableSchema.columns.map((col, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px] font-mono py-2 px-2.5 bg-zinc-950 rounded-lg border border-zinc-850 hover:bg-zinc-950/80 transition-all items-center">
                      <div className="col-span-4 font-bold text-zinc-150 flex items-center gap-1.5">
                        <Key className="w-3 h-3 text-amber-500/80 flex-shrink-0" />
                        {col.name}
                      </div>
                      <div className="col-span-3 text-indigo-305 text-indigo-400">{col.type}</div>
                      <div className="col-span-2">
                        {col.key ? (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            col.key.includes('PRIMARY') 
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/60' 
                              : 'bg-indigo-950/80 text-indigo-400 border border-indigo-900/60'
                          }`}>
                            {col.key}
                          </span>
                        ) : (
                          <span className="text-zinc-650 text-zinc-500">-</span>
                        )}
                      </div>
                      <div className="col-span-3 text-zinc-455 text-[10px] leading-snug text-zinc-400">{col.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DDL SQL code scroll sandbox block */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">COMPLETE PostgreSQL DDL script</h5>
              <span className="text-[10px] font-mono text-zinc-500">PostgreSQL v16 compliant</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-855 h-52 overflow-auto font-mono text-xs text-zinc-400 relative">
              <pre className="whitespace-pre-wrap leading-relaxed">{POSTGRESQL_DDL}</pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
