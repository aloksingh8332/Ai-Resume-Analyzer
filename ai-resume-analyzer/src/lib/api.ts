// ── AI Response Types ─────────────────────────────────────────────────────────

export interface AnalysisMetadata {
  match_score: number;
  fit_status: "Ideal" | "Overqualified" | "Underqualified";
  skills_match_pct: number;
  experience_match_pct: number;
  gap_penalty_pct: number;
}

export interface AnalysisData {
  matched_skills: string[];
  missing_skills: string[];
}

export interface Recommendations {
  to_candidate: string;
  to_recruiter: string;
}

export interface RoadmapItem {
  skill: string;
  impact: number;
  priority: number;
  reason: string;
}

export interface BulletImprovement {
  original: string;
  improved: string;
}

export interface AnalysisResult {
  metadata: AnalysisMetadata;
  analysis: AnalysisData;
  recommendations: Recommendations;
  skill_gap_roadmap: RoadmapItem[];
  improved_bullets: BulletImprovement[];
  is_fallback?: boolean;
  extracted_resume_text?: string;
  error?: string;
}

// ── API Client ────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const analyzeResume = async (
  file: File,
  jobDescription: string
): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jobDescription", jobDescription);

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = "System busy, please try again shortly";
    try {
      const err = await response.json();
      errorMsg = err.error || err.detail || errorMsg;
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<AnalysisResult>;
};

export const improveResume = async (resumeText: string): Promise<BulletImprovement[]> => {
  const response = await fetch(`${API_URL}/api/improve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume_text: resumeText }),
  });

  if (!response.ok) throw new Error("Improver service currently unavailable.");

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  
  return data as BulletImprovement[];
};
