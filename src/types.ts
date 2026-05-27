/**
 * Types and static specifications for the Smart Student Hub Architect Platform
 */

export type UserStatus = '10th_completed' | '12th_completed' | 'college_graduate' | null;

export interface UserState {
  status: UserStatus;
  currentScreen: 'select_status' | 'interest_profiling' | 'assessment' | 'results';
  interests: {
    hobbies: string;
    strengths: string;
    favoriteSubject: string;
    openDream: string;
  };
  highSchoolStream?: string;
  immediateObjective?: 'higher_studies' | 'secure_job' | null;
  undergradDegree?: string;
  testAnswers: Record<string, string>;
}

export interface Question {
  id: string;
  section: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface RecommendationResult {
  title: string;
  subtitle: string;
  matchScore: number;
  reasoning: string;
  pathway: string[];
  skillsToAcquire: string[];
  examsRequired?: string[];
  suggestedResources: string[];
}

// Complete DDL Scheme Statement
export const POSTGRESQL_DDL = `-- ===========================================================================
-- SMART STUDENT HUB: ENTERPRISE POSTGRESQL SCHEMA SPECIFICATION
-- ===========================================================================

-- 1. ENUM DEFINITIONS FOR STATE ROUTING
CREATE TYPE user_status_type AS ENUM ('10TH_COMPLETED', '12TH_COMPLETED', 'COLLEGE_GRADUATE');
CREATE TYPE objective_type AS ENUM ('HIGHER_STUDIES', 'SECURE_JOB');
CREATE TYPE assessment_domain_type AS ENUM ('MATH', 'SCIENCE', 'COMPUTER_SCIENCE', 'STATISTICS', 'BIOLOGY_MATH', 'PURE_SCIENCE', 'COMMERCE_ARTS');

-- 2. USERS CORE MASTER TABLE
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    status user_status_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. INTEREST & NLP PROFILING METRICS
CREATE TABLE interest_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    raw_hobbies_text TEXT,
    raw_strengths_text TEXT,
    raw_dreams_text TEXT,
    extracted_concepts VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[], -- EXTRACTED VIA NLP PIPELINE (NER)
    mapped_industry_cluster VARCHAR(100),                         -- VIA SEMANTIC CLUSTER VECTOR CLASSIFIER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ADAPTIVE TEST TEMPLATES BANK (SECTIONS & QUESTIONS)
CREATE TABLE test_templates (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain assessment_domain_type NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,                   -- Array of options ["Opt A", "Opt B", "Opt C", "Opt D"]
    correct_option VARCHAR(255) NOT NULL,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SCORED TEST SESSIONS & PER-SECTION PERFORMANCE
CREATE TABLE test_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    domain_type assessment_domain_type NOT NULL,
    answers_payload JSONB NOT NULL,            -- Kept as key-value JSON mapping for full auditing
    raw_score INT NOT NULL,
    max_score INT NOT NULL,
    completion_time_seconds INT,
    nlp_cognitive_feedback TEXT,               -- Assessment synthesis powered by Gemini or custom local summarizer
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TAILORED ADAPTIVE RECOMMENDATIONS
CREATE TABLE recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    suggested_major_pathway VARCHAR(255) NOT NULL,
    nlp_match_confidence NUMERIC(5, 2) NOT NULL, -- Probability confidence score (Percentage 0-100)
    structured_roadmap JSONB NOT NULL,          -- Step-by-step career path guidelines
    skills_gap_analysis JSONB NOT NULL,         -- Missing skills identified via semantic correlation
    certification_recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CREATE OPTIMIZATION INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_interest_profiles_user ON interest_profiles(user_id);
CREATE INDEX idx_test_sessions_user ON test_sessions(user_id);
CREATE INDEX idx_recommendations_user ON recommendations(user_id);
`;

// Complete NLP Code formulation script
export const PYTHON_NLP_PIPELINE = `"""
Smart Student Hub: Adaptive Onboarding, Assessment Scoring, and Career Vector Recommendation Pipeline.
Built using spacy, sentence-transformers, and core ML pipelines.
"""

import os
import spacy
import numpy as np
from typing import Dict, List, Any, Tuple
from sentence_transformers import SentenceTransformer, util

class SmartStudentHubNLPEngine:
    def __init__(self, spacy_model: str = "en_core_web_md", embedding_model: str = "all-MiniLM-L6-v2"):
        print(f"[Smart Student Hub] Initializing NLP Pipeline components...")
        # 1. Initialize Named Entity Recognition (NER) & Dependency Parsing with spaCy
        try:
            self.nlp = spacy.load(spacy_model)
        except OSError:
            print(f"[Warning] spaCy model '{spacy_model}' not found. Downloading...")
            spacy.cli.download(spacy_model)
            self.nlp = spacy.load(spacy_model)
            
        # 2. Initialize Bi-Encoder for Semantic Textual Similarity & Categorization Match
        self.embedder = SentenceTransformer(embedding_model)
        
        # Defined Vector Space Clusters for Industry matching
        self.industry_clusters = {
            "Engineering & Software Development": [
                "coding", "programming", "algorithms", "computers", "gaming", "building applications", 
                "robots", "math", "cybersecurity", "databases", "web development", "automation"
            ],
            "Medical, Biological & Life Sciences": [
                "biology", "medicine", "healthcare", "human body", "genetics", "plants", "chemistry",
                "hospitals", "veterinary", "diseases", "surgery", "biotechnology", "anatomy"
            ],
            "Commerce, Business Analytics & Finance": [
                "accountancy", "stock market", "economics", "investing", "banking", "statistics",
                "marketing", "entrepreneurship", "business operations", "finance", "data analysis"
            ],
            "Humanities, Creative Arts & Design": [
                "painting", "writing", "designing", "psychology", "teaching", "history", "social science",
                "acting", "music", "sketching", "video production", "languages", "counseling"
            ]
        }
        
        # Precompute industry target embeddings once
        self.cluster_embeddings = {}
        for cluster, terms in self.industry_clusters.items():
            combined_text = " ".join(terms)
            self.cluster_embeddings[cluster] = self.embedder.encode(combined_text, convert_to_tensor=True)

    def extract_key_domain_concepts(self, text: str) -> List[str]:
        \"\"\"
        Stage 1: Dynamic Interest Mapping.
        Extracts key domain concepts, nouns, and proper nouns while pruning stopwords.
        \"\"\"
        if not text.strip():
            return []
            
        doc = self.nlp(text.lower())
        concepts = []
        for token in doc:
            # Keep meaningful nouns, verbs, and adjectives that aren't generic stopwords
            if token.pos_ in ["NOUN", "PROPN", "ADJ"] and not token.is_stop and token.is_alpha:
                concepts.append(token.lemma_)
                
        # Also extract spaCy Named Entities (NER) where available (e.g. "Python", "Google", "Biology")
        for ent in doc.ents:
            if ent.label_ in ["ORG", "PRODUCT", "WORK_OF_ART", "GPE", "PERSON"]:
                concepts.append(ent.text)
                
        return list(set(concepts))

    def map_to_industry_cluster(self, user_text: str) -> Tuple[str, float]:
        \"\"\"
        Stage 1: Vector Classification.
        Calculates cosine similarity between user input embeddings and precalculated industry clusters.
        \"\"\"
        if not user_text.strip():
            return "General Studies", 0.0
            
        user_embedding = self.embedder.encode(user_text, convert_to_tensor=True)
        
        best_cluster = "Humanities, Creative Arts & Design"
        highest_score = -1.0
        
        for cluster, cluster_emb in self.cluster_embeddings.items():
            similarity = util.cos_sim(user_embedding, cluster_emb).item()
            if similarity > highest_score:
                highest_score = similarity
                best_cluster = cluster
                
        return best_cluster, float(highest_score)

    def predict_stream_and_courses_10th(self, test_scores: Dict[str, float], raw_interests: str) -> Dict[str, Any]:
        \"\"\"
        Stage 2 - Flow A: 10th Standard completed.
        Evaluates scores across: Math, Science, Computer Science, Statistics and maps to streams.
        \"\"\"
        best_cluster, cluster_score = self.map_to_industry_cluster(raw_interests)
        
        # Simple logical heuristic routing combining numeric strength and NLP cluster match
        math_score = test_scores.get("Mathematics", 0.0)
        science_score = test_scores.get("Science", 0.0)
        cs_score = test_scores.get("Computer Science", 0.0)
        stats_score = test_scores.get("Statistics", 0.0)
        
        avg_analytical = (math_score + cs_score + stats_score) / 3.0
        
        if avg_analytical >= 0.7 and best_cluster == "Engineering & Software Development":
            recommended_stream = "Computer Science & Mathematics Group"
            explanation = "Exceptional logical reasoning coupled with intense tech and programming interests."
            pathway = ["11th Std Computer Science Group", "B.Tech/BE in AI, Computer Science", "Senior Software Architect"]
        elif science_score >= 0.70 and (best_cluster == "Medical, Biological & Life Sciences" or science_score > math_score):
            recommended_stream = "Biology & Chemistry (Bio-Math / Bio-Science) Group"
            explanation = "Strong foundations in physical and natural sciences aligned with medical or biotech branches."
            pathway = ["11th Std Bio-Math Group", "MBBS / B.Sc Biotechnology / B.Pharm", "Life Sciences Researcher or Medical Expert"]
        elif stats_score >= 0.70 or best_cluster == "Commerce, Business Analytics & Finance":
            recommended_stream = "Commerce, Statistics & Business Group"
            explanation = "Displays strong interest in financial, accounting, statistical analytics, or commercial logic."
            pathway = ["11th Std Commerce with Applied Maths", "B.Com Honors / BBA / CA / Actuarial Sciences", "Investment Banker or Business Specialist"]
        else:
            recommended_stream = "Pure Sciences Group (Physics, Chemistry, Maths)"
            explanation = "Balanced aptitudes in science and math. Broad-spectrum scientific curriculum suggested."
            pathway = ["11th Std Pure Science Group", "B.Sc Physics / B.Sc Chemistry Research", "Scientific Investigator or Academic Expert"]
            
        return {
            "recommended_stream": recommended_stream,
            "explanation": explanation,
            "pathway": pathway,
            "mapped_cluster": best_cluster,
            "correlation_score": cluster_score
        }

    def suggest_degree_12th(self, current_stream: str, test_scores: Dict[str, float], raw_interests: str) -> Dict[str, Any]:
        \"\"\"
        Stage 2 - Flow B: 12th Standard completed.
        Dynamically triggers stream-based scoring, correlates with interests vector and outputs PG degrees.
        \"\"\"
        best_cluster, cluster_score = self.map_to_industry_cluster(raw_interests)
        avg_score = np.mean(list(test_scores.values())) if test_scores else 0.5
        
        degrees = []
        if "Biology" in current_stream or "Bio" in current_stream:
            if best_cluster == "Engineering & Software Development" or avg_score > 0.8:
                degrees = ["B.Tech Bioinformatics", "B.Tech Biotechnology", "B.Sc Computational Neuroscience"]
            else:
                degrees = ["MBBS / Medicine", "BDS Dental Surgery", "B.Sc Genetics & Anatomy"]
        elif "Computer" in current_stream or "CS" in current_stream:
            if best_cluster == "Commerce, Business Analytics & Finance":
                degrees = ["B.Sc Financial Technology (FinTech)", "B.Tech Information Technology & Management", "B.Com Analytics"]
            else:
                degrees = ["B.Tech Artificial Intelligence & Data Science", "B.Tech Computer Science & Engineering", "B.Sc CyberSecurity"]
        elif "Commerce" in current_stream or "Account" in current_stream:
            degrees = ["B.Com Professional (CA Integrated)", "BBA Finance & Business Analysis", "B.Sc Finance / Economics"]
        else:
            # Pure Science / General
            degrees = ["B.Sc Physics Research", "B.Sc Chemistry Honours", "B.Sc Material Sciences", "B.Sc Astrobiology"]
            
        return {
            "suggested_degrees": degrees,
            "nlp_analysis_details": f"Aligned current stream [{current_stream}] with dynamic cluster [{best_cluster}] with cosine correlation score of {cluster_score:.2f}."
        }

    def evaluate_college_graduate(self, objective: str, current_degree: str, interests_text: str) -> Dict[str, Any]:
        \"\"\"
        Stage 2 - Flow C: College Graduates.
        Routings based on objective: 'higher_studies' vs 'secure_job'.
        Uses semantic similarity to match PG paths or craft targeted Placement upskilling.
        \"\"\"
        if objective == "higher_studies":
            # Semantic search representing possible global Postgraduate (PG) paths
            pg_paths_bank = [
                "Master of Business Administration (MBA) in Strategy & Data-Driven Management",
                "M.Tech / MS in Machine Learning and Computer Vision",
                "Master of Science in Financial Actuarial Analytics",
                "Doctor of Philosophy (Ph.D.) in Advanced Biomaterial Engineering",
                "Master of Science in Strategic Corporate Communications"
            ]
            
            # Embed both the current UG degree + user goals vs the target banks
            ug_query = f"{current_degree} with interest in {interests_text}"
            query_emb = self.embedder.encode(ug_query, convert_to_tensor=True)
            bank_embs = self.embedder.encode(pg_paths_bank, convert_to_tensor=True)
            
            similarities = util.cos_sim(query_emb, bank_embs)[0].tolist()
            
            ranked_paths = []
            for i, score in enumerate(similarities):
                ranked_paths.append((pg_paths_bank[i], score))
            ranked_paths.sort(key=lambda x: x[1], reverse=True)
            
            best_pg_path, similarity_score = ranked_paths[0]
            
            # Define PG exams based on path
            exams = ["GRE / TOEFL"]
            if "MBA" in best_pg_path:
                exams = ["CAT (India)", "GMAT (International)", "XAT"]
            elif "M.Tech" in best_pg_path:
                exams = ["GATE", "GRE"]
                
            return {
                "objective": "Higher Education Guidance",
                "recommended_path": best_pg_path,
                "similarity_score": similarity_score,
                "all_ranks": ranked_paths,
                "required_exams": exams,
                "roadmap": ["Academic Preparation", "Attempt Exams", "SOP Drafting & Recommendations", "Application Phase"]
            }
        else:
            # Secure job readiness module
            # Extract key strengths and create personalized targeted upskilling
            skills = self.extract_key_domain_concepts(interests_text)
            
            # Heuristic placement readiness formulation
            upskill_roadmap = []
            if any(s in ["coding", "programming", "python", "software", "tech"] for s in [sk.lower() for sk in skills]):
                upskill_roadmap = [
                    "Master Data Structures & Algorithms on LeetCode (Aim for 150 Mediums)",
                    "Build 2 full-stack projects using React, Node.js, and PostgreSQL",
                    "Practice Low-Level & High-Level System Design architecture",
                    "Do 10 mock technical interviews on Pramp / Exponent"
                ]
                domain = "Software Systems Engineering"
            elif any(s in ["finance", "account", "money", "markets"] for s in [sk.lower() for sk in skills]):
                upskill_roadmap = [
                    "Complete Chartered Financial Analyst (CFA) Level 1 Preparation",
                    "Master Advanced Excel Modeling and SQL databases",
                    "Study valuation methodologies, discounted cash flow (DCF), and LBO",
                    "Practice market sizing cases & logic estimation puzzles"
                ]
                domain = "Investment Banking / Corporate Finance"
            else:
                upskill_roadmap = [
                    "Build a strong portfolio of professional communication and content projects",
                    "Obtain certifications in Google Project Management & Scrum agile",
                    "Construct 3 extensive case studies solving open business metrics",
                    "Engage in cold networking with hiring managers on LinkedIn"
                ]
                domain = "Business Operations & Strategy"
                
            return {
                "objective": "Placement Skill Acceleration Plans",
                "target_domain": domain,
                "custom_upskilling_roadmap": upskill_roadmap,
                "interview_strategy": "Perform 3 structured STAR behavioral drills and conduct system design reviews daily.",
                "technical_tips": "Focus intensely on core logical foundations rather than memorizing frameworks."
            }

# Self-Test Executable Blueprint Validation
if __name__ == "__main__":
    # Create the virtual pipeline
    engine = SmartStudentHubNLPEngine()
    
    # 1. Test Concept Extraction
    hobbies = "I love structural programming in Python, designing custom database schemas, and learning about machine learning."
    concepts = engine.extract_key_domain_concepts(hobbies)
    print("\\n=== TEST 1: Concept Extraction ===")
    print(f"Raw Input: '{hobbies}'")
    print(f"Extracted NLP Concepts: {concepts}")
    
    # 2. Test Stream & Course Heuristics Prediction for 10th
    test_scores = {"Mathematics": 0.85, "Science": 0.60, "Computer Science": 0.90, "Statistics": 0.75}
    results_10th = engine.predict_stream_and_courses_10th(test_scores, hobbies)
    print("\\n=== TEST 2: 10th Standard Suggestion ===")
    print(f"Recommended Stream: {results_10th['recommended_stream']}")
    print(f"Explanation: {results_10th['explanation']}")
    print(f"Pathway: {results_10th['pathway']}")
    
    # 3. Test Similarity Matching for College Graduate
    results_grad = engine.evaluate_college_graduate(
        objective="higher_studies", 
        current_degree="B.Sc Computer Science", 
        interests_text="Advanced artificial intelligence, deep neural networks, and robotic navigation systems"
    )
    print("\\n=== TEST 3: College Graduate PG Similarity Match ===")
    print(f"Best Matched PG Path: {results_grad['recommended_path']}")
    print(f"Similarity Confidence Score: {results_grad['similarity_score']:.4f}")
    print(f"Required entrance examinations: {results_grad['required_exams']}")
`;

// Dynamic robust question banks matching user interests profiling
export type AssessmentType = 'science' | 'computer' | 'math' | 'math_science' | 'computer_math';

export interface AssessmentConfig {
  label: string;
  subLabel: string;
  badge: string;
}

export const ASSESSMENT_CONFIGS: Record<AssessmentType, AssessmentConfig> = {
  science: {
    label: "Dynamic Foundational Science Aptitude Test",
    subLabel: "Evaluating physics, chemistry, botanical processes, and general natural systems.",
    badge: "Life & Physical Sciences"
  },
  computer: {
    label: "Dynamic Algorithmic Computer Science Test",
    subLabel: "Evaluating computing concepts, fundamental logic, hardware systems, and web architecture.",
    badge: "Computer Science & IT"
  },
  math: {
    label: "Dynamic Quantitative Mathematics Test",
    subLabel: "Evaluating algebraic forms, geometry ratios, statistial means, and calculus derivatives.",
    badge: "Quantitative Mathematics"
  },
  math_science: {
    label: "Dynamic Integrated Math & Science Test",
    subLabel: "Evaluating core physical equations, biological cells, and analytical geometric structures.",
    badge: "Integrated Math & Science"
  },
  computer_math: {
    label: "Dynamic Computational Mathematics Test",
    subLabel: "Evaluating binary operations, modulo logic, complexity bounds, and probability stats.",
    badge: "Computational Mathematics"
  }
};

export const DYNAMIC_QUESTION_BANKS: Record<AssessmentType, Question[]> = {
  science: [
    {
      id: "sci_1",
      section: "Science",
      text: "What is the primary gas that makes up the Earth's atmosphere?",
      options: ["Nitrogen", "Oxygen", "Carbon Dioxide", "Hydrogen"],
      correctAnswer: "Nitrogen"
    },
    {
      id: "sci_2",
      section: "Biology",
      text: "Which organelle is universally known as the powerhouse of the cell?",
      options: ["Mitochondria", "Ribosome", "Lysosome", "Nucleus"],
      correctAnswer: "Mitochondria"
    },
    {
      id: "sci_3",
      section: "Chemistry",
      text: "What is the chemical symbol for water?",
      options: ["H2O", "CO2", "O2", "NaCl"],
      correctAnswer: "H2O"
    },
    {
      id: "sci_4",
      section: "Physics",
      text: "What fundamental force pulls physical objects toward the center of the Earth?",
      options: ["Gravity", "Magnetism", "Friction", "Inertia"],
      correctAnswer: "Gravity"
    },
    {
      id: "sci_5",
      section: "Astronomy",
      text: "What is the closest star to the Earth?",
      options: ["Sun", "Proxima Centauri", "Sirius", "Alpha Centauri"],
      correctAnswer: "Sun"
    },
    {
      id: "sci_6",
      section: "Biology",
      text: "Which pigment gives leaves and botanical flora their green color?",
      options: ["Chlorophyll", "Carotene", "Xanthophyll", "Anthocyanin"],
      correctAnswer: "Chlorophyll"
    },
    {
      id: "sci_7",
      section: "Chemistry",
      text: "What state of matter has a definite volume but no definite shape?",
      options: ["Liquid", "Solid", "Gas", "Plasma"],
      correctAnswer: "Liquid"
    },
    {
      id: "sci_8",
      section: "Astronomy",
      text: "Which planet is known as the Red Planet in our solar system?",
      options: ["Mars", "Venus", "Jupiter", "Saturn"],
      correctAnswer: "Mars"
    },
    {
      id: "sci_9",
      section: "Physics",
      text: "What is the boiling point of pure water at sea level?",
      options: ["100°C", "0°C", "50°C", "200°C"],
      correctAnswer: "100°C"
    },
    {
      id: "sci_10",
      section: "Geology",
      text: "What is the lighter, outermost solid layer of the Earth called?",
      options: ["Crust", "Mantle", "Core", "Lithosphere"],
      correctAnswer: "Crust"
    }
  ],
  computer: [
    {
      id: "comp_1",
      section: "Hardware",
      text: "What does CPU stand for, in computer engineering terminology?",
      options: ["Central Processing Unit", "Computer Personal Unit", "Central Process Utilities", "Core Processing Unit"],
      correctAnswer: "Central Processing Unit"
    },
    {
      id: "comp_2",
      section: "Operating Systems",
      text: "Which of the following serves universally as an operating system?",
      options: ["Windows", "Chrome", "Python", "Intel Core i7"],
      correctAnswer: "Windows"
    },
    {
      id: "comp_3",
      section: "Programming Basics",
      text: "In computer programming, what is a 'variable' used for?",
      options: ["Storing data values", "Printing text to display", "Connecting to the internet", "Powering down the processor"],
      correctAnswer: "Storing data values"
    },
    {
      id: "comp_4",
      section: "Internet",
      text: "What does HTML stand for in web architecture?",
      options: ["HyperText Markup Language", "Hyperlinks and Text Markup Language", "Home Tool Markup Language", "HyperTech Modern Language"],
      correctAnswer: "HyperText Markup Language"
    },
    {
      id: "comp_5",
      section: "Data Structures",
      text: "Which data structure works strictly on a Last-In, First-Out (LIFO) model?",
      options: ["Stack", "Queue", "Array", "Linked List"],
      correctAnswer: "Stack"
    },
    {
      id: "comp_6",
      section: "Systems",
      text: "What is the primary function of a compiler?",
      options: [
        "Converts software source code into raw machine code", 
        "Runs virus scans on the local hard drive", 
        "Deletes temporary browser cookie logs", 
        "Browses servers over web portals"
      ],
      correctAnswer: "Converts software source code into raw machine code"
    },
    {
      id: "comp_7",
      section: "Languages",
      text: "Which of these is a popular high-level, human-readable coding language?",
      options: ["Python", "HTML", "CSS", "XML"],
      correctAnswer: "Python"
    },
    {
      id: "comp_8",
      section: "Memory",
      text: "What is the main function of RAM (Random Access Memory) inside a computer?",
      options: [
        "Temporary volatile working storage for active execution", 
        "Permanent non-volatile file storage", 
        "Rendering advanced 3D vector graphics matrices", 
        "Managing power distribution to cooling fans"
      ],
      correctAnswer: "Temporary volatile working storage for active execution"
    },
    {
      id: "comp_9",
      section: "Debugging",
      text: "In software engineering, what does a 'bug' refer to?",
      options: ["An error or flaw in program code causing unexpected results", "A physical insect nested in the CPU fan", "A slow network handshake protocol", "Malicious phishing cookies"],
      correctAnswer: "An error or flaw in program code causing unexpected results"
    },
    {
      id: "comp_10",
      section: "Networks",
      text: "What is the core protocol used to send webpages over the World Wide Web secure routes?",
      options: ["HTTPS", "SMTP", "FTP", "SSH"],
      correctAnswer: "HTTPS"
    }
  ],
  math: [
    {
      id: "math_1",
      section: "Algebra",
      text: "Solve for the value of x: 3x - 5 = 10.",
      options: ["x = 5", "x = 3", "x = 15", "x = 6"],
      correctAnswer: "x = 5"
    },
    {
      id: "math_2",
      section: "Geometry",
      text: "What is the value of Pi (π) rounded to two decimal places?",
      options: ["3.14", "3.16", "3.12", "3.00"],
      correctAnswer: "3.14"
    },
    {
      id: "math_3",
      section: "Geometry",
      text: "If a triangle has a base of 6 cm and height of 10 cm, what is its mathematical area?",
      options: ["30 cm²", "60 cm²", "16 cm²", "20 cm²"],
      correctAnswer: "30 cm²"
    },
    {
      id: "math_4",
      section: "Arithmetic",
      text: "What is the square root of 144?",
      options: ["12", "14", "10", "16"],
      correctAnswer: "12"
    },
    {
      id: "math_5",
      section: "Averages",
      text: "If the average of four numbers 5, 10, 15, and x is 10, what is the value of x?",
      options: ["10", "5", "20", "15"],
      correctAnswer: "10"
    },
    {
      id: "math_6",
      section: "Polygons",
      text: "What is a closed geometric polygon with five internal sides called?",
      options: ["Pentagon", "Hexagon", "Octagon", "Quadrangle"],
      correctAnswer: "Pentagon"
    },
    {
      id: "math_7",
      section: "Calculus",
      text: "What is the derivative of x² with respect to x?",
      options: ["2x", "x", "2", "2x²"],
      correctAnswer: "2x"
    },
    {
      id: "math_8",
      section: "Fractions",
      text: "Express the fraction 3/5 as a perfect percentage.",
      options: ["60%", "30%", "50%", "75%"],
      correctAnswer: "60%"
    },
    {
      id: "math_9",
      section: "Combinatorics",
      text: "What is the correct value of 5 factorial (5!)?",
      options: ["120", "60", "24", "100"],
      correctAnswer: "120"
    },
    {
      id: "math_10",
      section: "Trigonometry",
      text: "In a right-angled triangle, if the side lengths are 3 and 4, what is the length of the hypotenuse?",
      options: ["5", "6", "7", "4.5"],
      correctAnswer: "5"
    }
  ],
  math_science: [
    {
      id: "ms_1",
      section: "Fluid Mechanics",
      text: "What is the mathematical density of an object with a mass of 50 grams and volume of 10 cm³?",
      options: ["5 g/cm³", "500 g/cm³", "0.2 g/cm³", "15 g/cm³"],
      correctAnswer: "5 g/cm³"
    },
    {
      id: "ms_2",
      section: "Physics",
      text: "What is gravity's approximate rate of acceleration on Earth at sea level?",
      options: ["9.8 m/s²", "5.5 m/s²", "12.0 m/s²", "3.0 m/s²"],
      correctAnswer: "9.8 m/s²"
    },
    {
      id: "ms_3",
      section: "Algebra",
      text: "If a custom vehicle travels at a constant speed of 60 km/h, how far does it travel in 2.5 hours?",
      options: ["150 km", "120 km", "180 km", "130 km"],
      correctAnswer: "150 km"
    },
    {
      id: "ms_4",
      section: "Botanical Process",
      text: "Which gas do green flora absorb from the atmosphere to perform photosynthesis?",
      options: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Helium"],
      correctAnswer: "Carbon Dioxide"
    },
    {
      id: "ms_5",
      section: "Arithmetic Logic",
      text: "Evaluate this arithmetic formulation: 2 * (3 + 5) - 4 / 2.",
      options: ["14", "12", "10", "16"],
      correctAnswer: "14"
    },
    {
      id: "ms_6",
      section: "Chemistry",
      text: "What is the standard pH value of completely pure, neutral water?",
      options: ["7", "0", "14", "5"],
      correctAnswer: "7"
    },
    {
      id: "ms_7",
      section: "Geometry",
      text: "What is the constant sum of all internal angles inside any flat triangle?",
      options: ["180°", "360°", "90°", "270°"],
      correctAnswer: "180°"
    },
    {
      id: "ms_8",
      section: "States of Matter",
      text: "What state of matter sustains a definite, stable volume and a definite, stable shape?",
      options: ["Solid", "Liquid", "Gas", "Plasma"],
      correctAnswer: "Solid"
    },
    {
      id: "ms_9",
      section: "Probability ratios",
      text: "A probability ratio of 0.75 is equivalent to what percentage?",
      options: ["75%", "25%", "0.75%", "7.5%"],
      correctAnswer: "75%"
    },
    {
      id: "ms_10",
      section: "Biology",
      text: "What is the fundamental, smallest structural unit of biological life?",
      options: ["Cell", "Tissue", "Atom", "Neuron"],
      correctAnswer: "Cell"
    }
  ],
  computer_math: [
    {
      id: "cm_1",
      section: "Binary Math",
      text: "What is the value of x in binary notation if decimal x = 13?",
      options: ["1101", "1011", "1111", "1001"],
      correctAnswer: "1101"
    },
    {
      id: "cm_2",
      section: "Complexity Theory",
      text: "What is the worst-case search complexity of finding an element in a pre-sorted array of size N using binary search?",
      options: ["O(log N)", "O(N)", "O(1)", "O(N²)"],
      correctAnswer: "O(log N)"
    },
    {
      id: "cm_3",
      section: "Modulo algebra",
      text: "Solve this mathematical expression: 15 % 4 (modulo operator).",
      options: ["3", "1", "2", "0"],
      correctAnswer: "3"
    },
    {
      id: "cm_4",
      section: "Syntax rules",
      text: "In Python, which operator is used for exponentiation (raising a base to a power)?",
      options: ["**", "^", "*", "xp"],
      correctAnswer: "**"
    },
    {
      id: "cm_5",
      section: "Statistics",
      text: "What is the statistical mode of this dataset: 3, 7, 7, 2, 9, 3, 7?",
      options: ["7", "3", "5", "2"],
      correctAnswer: "7"
    },
    {
      id: "cm_6",
      section: "Computers",
      text: "What base-16 numbering system uses digits 0-9 and letters A-F to represent values in memory addresses?",
      options: ["Hexadecimal", "Binary", "Octal", "Decimal"],
      correctAnswer: "Hexadecimal"
    },
    {
      id: "cm_7",
      section: "Averages",
      text: "Find the median value of this numeric scope: 3, 5, 7, 12, 15.",
      options: ["7", "5", "9", "12"],
      correctAnswer: "7"
    },
    {
      id: "cm_8",
      section: "Web Programming",
      text: "Which HTML anchor tag is used to create a dynamic hyperlink?",
      options: ["<a>", "<link>", "<href>", "<p>"],
      correctAnswer: "<a>"
    },
    {
      id: "cm_9",
      section: "Probability Math",
      text: "If two fair six-sided dice are rolled, what is the probability of rolling a sum of exactly 2?",
      options: ["1/36", "1/6", "1/12", "2/36"],
      correctAnswer: "1/36"
    },
    {
      id: "cm_10",
      section: "Variables Logic",
      text: "Which data type is used to store values representing true or false truths?",
      options: ["Boolean", "Float", "Integer", "String"],
      correctAnswer: "Boolean"
    }
  ]
};

