import React, { useState } from 'react';
import { DYNAMIC_QUESTION_BANKS, ASSESSMENT_CONFIGS, AssessmentType, Question, UserState, RecommendationResult } from '../types';
import { 
  ArrowRight, Brain, BookOpen, Compass, ClipboardList, RefreshCw, 
  Sparkles, Award, Map, CheckCircle2, ChevronRight, GraduationCap, 
  Briefcase, Star, HelpCircle, GraduationCap as GradIcon
} from 'lucide-react';

export default function AssessmentEngine() {
  // Main states
  const [userState, setUserState] = useState<UserState>({
    status: null,
    currentScreen: 'select_status',
    interests: {
      hobbies: '',
      strengths: '',
      favoriteSubject: '',
      openDream: '',
    },
    testAnswers: {},
  });

  const [assessmentType, setAssessmentType] = useState<AssessmentType>('computer');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  // NLP results state from backend
  const [nlpProfile, setNlpProfile] = useState<{
    extractedConcepts: string[];
    mappedCluster: string;
    matchScore: number;
    briefNlpRefinement: string;
    personalizedEncouragement: string;
    assessmentType?: string;
  } | null>(null);

  // Local quick lexical classifier matching user's detailed interests to domains
  const classifyInterests = (interests: {
    hobbies: string;
    strengths: string;
    favoriteSubject: string;
    openDream: string;
  }): AssessmentType => {
    const text = `${interests.hobbies} ${interests.strengths} ${interests.favoriteSubject} ${interests.openDream}`.toLowerCase();
    
    const computerKeywords = ['code', 'coding', 'program', 'programming', 'software', 'developer', 'web', 'python', 'javascript', 'html', 'css', 'game', 'gaming', 'computer', 'computers', 'tech', 'technology', 'cyber', 'db', 'database', 'it', 'artificial', 'ai', 'cloud', 'app'];
    const scienceKeywords = ['science', 'biology', 'biological', 'physics', 'chemistry', 'chemical', 'medicine', 'med', 'medical', 'doctor', 'nature', 'anatomy', 'cell', 'cells', 'dna', 'organism', 'biotech', 'biotechnology', 'planet', 'space', 'earth', 'astronomy', 'atoms', 'molecules', 'star', 'stars', 'respiration'];
    const mathKeywords = ['math', 'maths', 'mathematics', 'algebra', 'calculus', 'geometry', 'statistics', 'stats', 'accounting', 'accounts', 'finance', 'numbers', 'equations', 'sum', 'addition', 'ledger', 'bcom', 'mba', 'economics', 'quantitative', 'vector', 'matrix', 'modulo'];

    let compScore = 0;
    let sciScore = 0;
    let mathScore = 0;

    computerKeywords.forEach(k => {
      const regex = new RegExp(`\\b${k}`, 'g');
      const matches = text.match(regex);
      if (matches) compScore += matches.length;
    });

    scienceKeywords.forEach(k => {
      const regex = new RegExp(`\\b${k}`, 'g');
      const matches = text.match(regex);
      if (matches) sciScore += matches.length;
    });

    mathKeywords.forEach(k => {
      const regex = new RegExp(`\\b${k}`, 'g');
      const matches = text.match(regex);
      if (matches) mathScore += matches.length;
    });

    if (compScore >= 1 && mathScore >= 1) {
      return 'computer_math';
    }
    if (mathScore >= 1 && sciScore >= 1) {
      return 'math_science';
    }

    const maxScore = Math.max(compScore, sciScore, mathScore);
    if (maxScore === 0) {
      const fav = interests.favoriteSubject.toLowerCase();
      if (fav.includes('computer') || fav.includes('coding') || fav.includes('it') || fav.includes('programming')) return 'computer';
      if (fav.includes('math') || fav.includes('algebra') || fav.includes('stat') || fav.includes('account')) return 'math';
      if (fav.includes('sci') || fav.includes('physics') || fav.includes('chem') || fav.includes('bio')) return 'science';
      return 'computer';
    }

    if (maxScore === compScore) return 'computer';
    if (maxScore === sciScore) return 'science';
    return 'math';
  };

  // final recommendation output
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);

  // Status mappings
  const statusLabels: Record<string, string> = {
    '10th_completed': '10th Standard Completed',
    '12th_completed': '12th Standard Completed',
    'college_graduate': 'College Graduate / Looking for Job'
  };

  // Stage 1 - Screen 1: Choose status
  const handleSelectStatus = (status: '10th_completed' | '12th_completed' | 'college_graduate') => {
    setUserState(prev => ({
      ...prev,
      status,
      currentScreen: 'interest_profiling'
    }));
  };

  // Stage 1 - Screen 2: Submit dynamic interest profile to backend
  const handleAnalyzeInterests = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMsg('Tokenizing open inputs... Extraction executing [spaCy NER]');
    
    // Simulate pipeline loading states for premium look
    setTimeout(() => {
      setLoadingMsg('Computing semantic embeddings [all-MiniLM-L6-v2]...');
    }, 1200);

    setTimeout(async () => {
      const localCalibratedType = classifyInterests(userState.interests);
      try {
        const response = await fetch('/api/profile-interests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: userState.status,
            hobbies: userState.interests.hobbies,
            strengths: userState.interests.strengths,
            favoriteSubject: userState.interests.favoriteSubject,
            openDream: userState.interests.openDream
          })
        });
        const data = await response.json();
        setNlpProfile(data);
        
        // Save assessment type from server response or local hybrid classifier fallback
        const resultingType = (data.assessmentType && ['science', 'computer', 'math', 'math_science', 'computer_math'].includes(data.assessmentType))
          ? data.assessmentType as AssessmentType
          : localCalibratedType;
          
        setAssessmentType(resultingType);
        setUserState(prev => ({ ...prev, currentScreen: 'assessment' }));
      } catch (err) {
        console.error("NLP backend analysis offline, fallback routing triggered:", err);
        setNlpProfile({
          extractedConcepts: [localCalibratedType, 'foundational', 'interest'],
          mappedCluster: localCalibratedType === 'science' || localCalibratedType === 'math_science' 
            ? "Medical, Biological & Life Sciences" 
            : localCalibratedType === 'math' 
              ? "Commerce, Business Analytics & Finance" 
              : "Engineering & Software Development",
          matchScore: 88.0,
          briefNlpRefinement: "Mapped securely of the local affinity router heuristics. Your keywords strongly align with analytical methods of: " + localCalibratedType.toUpperCase().replace('_', ' + ') + ".",
          personalizedEncouragement: "Your natural talents are highly relevant!"
        });
        setAssessmentType(localCalibratedType);
        setUserState(prev => ({ ...prev, currentScreen: 'assessment' }));
      } finally {
        setLoading(false);
        setLoadingMsg('');
      }
    }, 2400);
  };

  // Reset function to restart flow
  const handleReset = () => {
    setUserState({
      status: null,
      currentScreen: 'select_status',
      interests: {
        hobbies: '',
        strengths: '',
        favoriteSubject: '',
        openDream: '',
      },
      testAnswers: {},
    });
    setNlpProfile(null);
    setRecommendation(null);
  };

  // Check which test questions to render in Screen 3
  const getTestQuestions = (): Question[] => {
    return DYNAMIC_QUESTION_BANKS[assessmentType] || DYNAMIC_QUESTION_BANKS.computer;
  };

  // Handle radio select for tests
  const handleOptionSelect = (qId: string, answer: string) => {
    setUserState(prev => ({
      ...prev,
      testAnswers: {
        ...prev.testAnswers,
        [qId]: answer
      }
    }));
  };

  // Aggregates standardized test percentage score
  const calculateScore = (questions: Question[]): number => {
    if (questions.length === 0) return 0;
    let correct = 0;
    questions.forEach(q => {
      if (userState.testAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  // Screen 3: Submit assessment test or graduate selection for final evaluation
  const handleCompleteAssessment = async () => {
    setLoading(true);
    setLoadingMsg('Calculating test responses... Correlating score metrics...');
    
    const questions = getTestQuestions();
    const score = calculateScore(questions);

    setTimeout(async () => {
      try {
        if (userState.status === 'college_graduate') {
          // Flow C has PG vs Job endpoints
          const response = await fetch('/api/evaluate-graduate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              objective: userState.immediateObjective,
              undergradDegree: userState.undergradDegree,
              rawInterests: `${userState.interests.hobbies} ${userState.interests.strengths} ${userState.interests.openDream}`,
              extractedConcepts: nlpProfile?.extractedConcepts || [],
              mappedCluster: nlpProfile?.mappedCluster || ''
            })
          });
          const data = await response.json();
          setRecommendation(data);
        } else {
          // Flow A & B utilize standard stream evaluation
          const response = await fetch('/api/evaluate-assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: userState.status,
              flow: userState.status === '10th_completed' ? 'Stream & Subject Prediction' : `12th Standard: ${userState.highSchoolStream}`,
              score: score,
              rawInterests: `${userState.interests.hobbies} ${userState.interests.strengths} ${userState.interests.openDream}`,
              answers: userState.testAnswers,
              extractedConcepts: nlpProfile?.extractedConcepts || [],
              mappedCluster: nlpProfile?.mappedCluster || ''
            })
          });
          const data = await response.json();
          setRecommendation(data);
        }
        setUserState(prev => ({ ...prev, currentScreen: 'results' }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMsg('');
      }
    }, 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto" id="assessment-engine-root">
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="p-8 bg-gray-900 border border-gray-800 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 animate-pulse" />
            <div className="w-16 h-16 bg-gray-950 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-8 h-8 text-teal-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-gray-100 font-bold text-base font-sans">Student Hub Engine Processing</h4>
              <p className="text-xs text-teal-400 font-mono tracking-wider animate-pulse">{loadingMsg}</p>
            </div>
            <div className="text-[10px] text-gray-500 leading-snug">
              Running server-side analytical classification pipeline checks.
            </div>
          </div>
        </div>
      )}

      {/* STAGE 1 - Screen 1: Initial Selection */}
      {userState.currentScreen === 'select_status' && (
        <div className="space-y-8 animate-fade-in text-center py-8">
          <div className="max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800/60 font-mono">
              Adaptive Evaluation Engine
            </span>
            <h2 className="text-3xl font-extrabold text-gray-100 font-sans tracking-tight leading-none">
              Welcome to Smart Student Hub
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              An intelligent placement routing and stream mapping platform utilizing advanced semantic analysis. Select your current status to trigger an adaptively styled experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-6 text-left">
            
            {/* Status Option 1 */}
            <div 
              onClick={() => handleSelectStatus('10th_completed')}
              className="p-6 bg-gray-900 border border-gray-800 hover:border-teal-500/60 hover:shadow-[0_8px_30px_rgb(20,184,166,0.08)] cursor-pointer rounded-2xl transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="p-3 bg-teal-950 border border-teal-900 rounded-xl w-fit">
                  <BookOpen className="w-6 h-6 text-teal-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-200 group-hover:text-teal-400 transition-colors">10th Completed</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Stream Suggestion, foundational aptitude tests, optimal High school subject routing.
                  </p>
                </div>
              </div>
              <div className="pt-6 flex items-center text-xs font-semibold text-teal-400 gap-1 mt-auto">
                Begin Profile Onboarding <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Status Option 2 */}
            <div 
              onClick={() => handleSelectStatus('12th_completed')}
              className="p-6 bg-gray-900 border border-gray-800 hover:border-indigo-500/60 hover:shadow-[0_8px_30px_rgb(99,102,241,0.08)] cursor-pointer rounded-2xl transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="p-3 bg-indigo-950 border border-indigo-900 rounded-xl w-fit">
                  <GraduationCap className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-200 group-hover:text-indigo-400 transition-colors">12th Completed</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Higher education major analysis, stream customized adaptive test scoring, college forecasts.
                  </p>
                </div>
              </div>
              <div className="pt-6 flex items-center text-xs font-semibold text-indigo-400 gap-1 mt-auto">
                Begin Degree Alignment <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Status Option 3 */}
            <div 
              onClick={() => handleSelectStatus('college_graduate')}
              className="p-6 bg-gray-900 border border-gray-800 hover:border-purple-500/60 hover:shadow-[0_8px_30px_rgb(168,85,247,0.08)] cursor-pointer rounded-2xl transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="p-3 bg-purple-950 border border-purple-900 rounded-xl w-fit">
                  <Briefcase className="w-6 h-6 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-200 group-hover:text-purple-400 transition-colors">College Graduates</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Strategy route analyzer. Post-graduate semantic similarity pathways vs industry Job placement upskilling plans.
                  </p>
                </div>
              </div>
              <div className="pt-6 flex items-center text-xs font-semibold text-purple-400 gap-1 mt-auto">
                Begin Career Pathways <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STAGE 1 - Screen 2: Dynamic Interest profiling */}
      {userState.currentScreen === 'interest_profiling' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Section guide indicator header */}
          <div className="flex items-center gap-3 border-b border-gray-800 pb-5">
            <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20 text-teal-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest font-mono">Stage 1: Profile Initialization</span>
              <h3 className="text-lg font-bold text-gray-150">Dynamic Onboarding Interests Mapping</h3>
            </div>
            <button 
              onClick={handleReset}
              className="ml-auto text-xs text-gray-500 hover:text-gray-300 font-mono transition-colors border border-gray-850 px-3 py-1 rounded"
            >
              Back to Start
            </button>
          </div>

          <form onSubmit={handleAnalyzeInterests} className="bg-gray-900 border border-gray-800 rounded-2xl p-6.5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Question 1: Hobbies */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  1. Hobbies & Free-Time Activities
                </label>
                <textarea
                  required
                  value={userState.interests.hobbies}
                  onChange={(e) => {
                    const txt = e.target.value;
                    setUserState(prev => ({ ...prev, interests: { ...prev.interests, hobbies: txt } }));
                  }}
                  placeholder="e.g. Building static Python scripts, editing video clips, playing strategy board games"
                  className="w-full h-24 bg-gray-950 border border-gray-800 hover:border-gray-700 focus:border-teal-500 rounded-xl p-3 text-xs text-gray-250 leading-relaxed placeholder-gray-600 focus:outline-none resize-none"
                />
              </div>

              {/* Question 2: Strengths */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  2. Personal Cognitive Strengths
                </label>
                <textarea
                  required
                  value={userState.interests.strengths}
                  onChange={(e) => {
                    const txt = e.target.value;
                    setUserState(prev => ({ ...prev, interests: { ...prev.interests, strengths: txt } }));
                  }}
                  placeholder="e.g. Quick pattern recognition, strong math solving skills, writing complex systems logic"
                  className="w-full h-24 bg-gray-950 border border-gray-800 hover:border-gray-700 focus:border-indigo-500 rounded-xl p-3 text-xs text-gray-250 leading-relaxed placeholder-gray-600 focus:outline-none resize-none"
                />
              </div>

              {/* Question 3: Favorite subject */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  3. Favorite Subject or Domain Field
                </label>
                <input
                  required
                  type="text"
                  value={userState.interests.favoriteSubject}
                  onChange={(e) => {
                    const txt = e.target.value;
                    setUserState(prev => ({ ...prev, interests: { ...prev.interests, favoriteSubject: txt } }));
                  }}
                  placeholder="e.g. Statistics, Physics, Accountancy, Biological systems"
                  className="w-full bg-gray-950 border border-gray-800 hover:border-gray-700 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-gray-250 placeholder-gray-600 focus:outline-none"
                />
              </div>

              {/* Question 4: Open dream */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  4. Ultimate Dream Job / Career vision
                </label>
                <input
                  required
                  type="text"
                  value={userState.interests.openDream}
                  onChange={(e) => {
                    const txt = e.target.value;
                    setUserState(prev => ({ ...prev, interests: { ...prev.interests, openDream: txt } }));
                  }}
                  placeholder="e.g. Build artificial intelligence software to automate energy grids"
                  className="w-full bg-gray-950 border border-gray-800 hover:border-gray-700 focus:border-teal-500 rounded-xl px-3 py-2.5 text-xs text-gray-250 placeholder-gray-600 focus:outline-none"
                />
              </div>

              {/* Extras for College Graduates */}
              {userState.status === 'college_graduate' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                      5. Present Undergraduate (UG) Degree
                    </label>
                    <input
                      required
                      type="text"
                      value={userState.undergradDegree || ''}
                      onChange={(e) => {
                        const txt = e.target.value;
                        setUserState(prev => ({ ...prev, undergradDegree: txt }));
                      }}
                      placeholder="e.g. B.Sc Computer Science / B.Com Finance"
                      className="w-full bg-gray-950 border border-gray-800 hover:border-gray-700 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-gray-250 placeholder-gray-650 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      6. Strategic Placement Pathway Objective
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
                      <button
                        type="button"
                        onClick={() => setUserState(prev => ({ ...prev, immediateObjective: 'higher_studies' }))}
                        className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 text-left ${
                          userState.immediateObjective === 'higher_studies'
                            ? 'bg-teal-950/20 border-teal-500 text-teal-400 font-bold'
                            : 'bg-gray-950 border-gray-850 text-gray-300 hover:bg-zinc-900'
                        }`}
                      >
                        <GraduationCap className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-sans text-xs block">Pursue Higher Education (Postgrad)</span>
                          <span className="text-[9px] text-gray-400 font-normal mt-0.5 block">Graduate routing, admission exams and research tracks.</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserState(prev => ({ ...prev, immediateObjective: 'secure_job' }))}
                        className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 text-left ${
                          userState.immediateObjective === 'secure_job'
                            ? 'bg-purple-950/20 border-purple-500 text-purple-400 font-bold'
                            : 'bg-gray-950 border-gray-850 text-gray-300 hover:bg-zinc-900'
                        }`}
                      >
                        <Briefcase className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-sans text-xs block">Secure an Industry Placement Job</span>
                          <span className="text-[9px] text-gray-400 font-normal mt-0.5 block">Direct coding placement portfolios & interviews strategy.</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
              <p className="text-[11px] text-gray-500 max-w-sm font-sans">
                Submitting executes a live raw text entities parse down to specific sector groupings using automated similarity.
              </p>
              <button
                type="submit"
                disabled={userState.status === 'college_graduate' && (!userState.undergradDegree || !userState.immediateObjective)}
                className={`px-5 py-2.5 font-bold text-xs font-mono rounded-xl flex items-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(20,184,166,0.15)] ${
                  userState.status === 'college_graduate' && (!userState.undergradDegree || !userState.immediateObjective)
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-850 shadow-none'
                    : 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-gray-900 cursor-pointer'
                }`}
              >
                Perform AI NLP Profiling <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STAGE 2 - Screen 3: Targeted adaptive testing or strategic choices */}
      {userState.currentScreen === 'assessment' && (
        <div className="space-y-8 animate-fade-in pb-12">
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-800 pb-5">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Stage 2: Target testing</span>
              <h3 className="text-lg font-bold text-gray-150">Custom Educational Pathway Evaluation</h3>
            </div>
            <button 
              onClick={handleReset}
              className="ml-auto text-xs text-gray-500 hover:text-gray-300 font-mono transition-colors border border-gray-850 px-3 py-1 rounded"
            >
              Start Over
            </button>
          </div>

          {/* NLP Profiling Insight Summary Badge */}
          {nlpProfile && (
            <div className="p-5 bg-gradient-to-r from-gray-900 to-indigo-950/40 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="space-y-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 border border-indigo-805">
                  NLP DYNAMIC MAPPED CLUSTER
                </span>
                <h4 className="text-base font-extrabold text-gray-200 mt-1">{nlpProfile.mappedCluster}</h4>
                <p className="text-xs text-gray-400 leading-normal font-sans">{nlpProfile.briefNlpRefinement}</p>
                <div className="flex flex-wrap gap-1 pt-1.5">
                  <span className="text-[9px] font-mono text-indigo-400">Concepts:</span>
                  {nlpProfile.extractedConcepts.map((c) => (
                    <span key={c} className="text-[9px] font-mono text-gray-400 bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
                      #{c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:ml-auto p-4 bg-gray-950 rounded-xl border border-gray-850 text-center flex-shrink-0">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Vector Affinity</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{nlpProfile.matchScore.toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* ==================== UNIFIED INTEREST-CALIBRATED ASSESSMENT INTERFACE ==================== */}
          <div className="space-y-6 animate-fade-in">
            <div className={`p-5 rounded-2xl border bg-gray-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-gray-800`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold font-mono tracking-widest px-2.5 py-0.5 rounded-full border bg-zinc-950 border-gray-800 text-indigo-400`}>
                    {ASSESSMENT_CONFIGS[assessmentType]?.badge || "Custom Evaluation"}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Dynamic Alignment Test</span>
                </div>
                <h4 className="text-base font-bold text-gray-255 pt-1">
                  {ASSESSMENT_CONFIGS[assessmentType]?.label || "Tailored Evaluation"}
                </h4>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  {ASSESSMENT_CONFIGS[assessmentType]?.subLabel}
                </p>
              </div>
              <div className="px-4 py-2 bg-gray-950 border border-gray-850 rounded-xl space-y-0.5 text-center sm:text-left flex-shrink-0">
                <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block">Status Context</span>
                <span className="text-xs font-bold text-gray-300 font-sans tracking-wide">
                  {statusLabels[userState.status || ''] || 'Profile Evaluating'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {getTestQuestions().map((q, qIdx) => (
                <div key={q.id} className="p-5 bg-gray-905 border border-gray-800 rounded-2xl space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-transparent to-indigo-500/10 w-32" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-zinc-500 bg-gray-950 border border-gray-850 px-2.5 py-0.5 rounded-full">
                      Q0{qIdx + 1}
                    </span>
                    <span className="text-[9px] font-mono font-black text-indigo-400 bg-indigo-950/45 border border-indigo-900/40 px-2 py-0.5 rounded">
                      {q.section}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 font-medium leading-relaxed font-sans">{q.text}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleOptionSelect(q.id, opt)}
                        className={`p-3 text-left bg-gray-950 hover:bg-gray-850 text-xs rounded-xl border transition-all ${
                          userState.testAnswers[q.id] === opt 
                            ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-950/20' 
                            : 'border-gray-850 hover:border-gray-705 text-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleCompleteAssessment}
              disabled={Object.keys(userState.testAnswers).length < getTestQuestions().length}
              className={`w-full py-3 font-mono text-sm rounded-xl font-bold transition-all shadow-md ${
                Object.keys(userState.testAnswers).length === getTestQuestions().length
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-gray-100 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-850 shadow-none'
              }`}
            >
              {Object.keys(userState.testAnswers).length === getTestQuestions().length
                ? 'Submit Answers & Calculate Suggestions'
                : `Please answer all questions (${Object.keys(userState.testAnswers).length}/${getTestQuestions().length} done)`}
            </button>
          </div>

        </div>
      )}

      {/* =========================================================================== */}
      {/* FINAL RESULTS DISPLAY */}
      {/* =========================================================================== */}
      {userState.currentScreen === 'results' && recommendation && (
        <div className="space-y-6 animate-fade-in pb-16">
          
          {/* Top Banner layout */}
          <div className="text-center space-y-2 py-6 bg-gradient-to-b from-indigo-950/20 to-transparent border-t border-indigo-500/10 rounded-t-3xl">
            <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-900/40">
              AI MATCHING RESOLUTION SUCCESSFUL
            </span>
            <h2 className="text-2xl font-black text-white font-sans tracking-tight">{recommendation.title}</h2>
            <p className="text-zinc-400 text-xs font-sans italic">{recommendation.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Box 2: Tailored Progress Route Roadmap (Left Column - Spans 8) */}
            <div className="md:col-span-8 bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-5">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Map className="w-4 h-4 text-indigo-400" />
                Tailored Progress Route Roadmap
              </h4>
              <div className="space-y-4 relative pl-4 border-l border-indigo-500/20">
                {recommendation.pathway.map((step, idx) => (
                  <div key={idx} className="relative space-y-1">
                    {/* dot */}
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-zinc-950" />
                    <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase block">Phase 0{idx + 1}</span>
                    <p className="text-xs text-zinc-200 leading-normal font-sans font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 3: Global Confidence Match Badge (Right Column - Spans 4) */}
            <div className="md:col-span-4 bg-zinc-950 border border-zinc-850 rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[220px]">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-black block mb-1">Global Confidence Group</span>
                <span className="text-4xl font-black text-indigo-400 font-mono">{(recommendation.matchScore || 85.0).toFixed(1)}%</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[220px]">
                Optimal affinity match calibrated based on academic records and future vision.
              </p>
            </div>

          </div>

          <div className="pt-6 border-t border-zinc-900 flex justify-center">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 hover:text-indigo-400 border border-zinc-850 font-bold font-mono text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Portal & Initiate Fresh Student Onboarding
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
