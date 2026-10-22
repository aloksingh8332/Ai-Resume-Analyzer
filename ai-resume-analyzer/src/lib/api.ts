
// ── AI Response Types ──────────────────────────────────────────────────────

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

// ── API Configuration ─────────────────────────────────────────────────────

const API_URL = "http://127.0.0.1:8001";

// ── Error Formatting ──────────────────────────────────────────────────────

const formatError = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;

  if (Array.isArray(value)) {
    return value.map(formatError).join(", ");
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;

    if (typeof obj.msg === "string") {
      const location = Array.isArray(obj.loc)
        ? obj.loc.filter((part) => part !== "body").join(" → ")
        : "";
      return location ? `${location}: ${obj.msg}` : obj.msg;
    }

    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.detail === "string") return obj.detail;

    return JSON.stringify(value);
  }

  return String(value ?? "An unexpected error occurred.");
};

const getErrorMessage = async (
  response: Response,
  fallback: string
): Promise<string> => {
  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const errorData: unknown = await response.json();

      if (errorData && typeof errorData === "object") {
        const data = errorData as Record<string, unknown>;
        const detail = data.detail ?? data.error ?? data.message;

        if (detail !== undefined) return formatError(detail);
      }

      return formatError(errorData);
    }

    const text = await response.text();
    return text.trim() || `${fallback} (HTTP ${response.status})`;
  } catch {
    return `${fallback} (HTTP ${response.status})`;
  }
};

const apiFetch = async (
  endpoint: string,
  options: RequestInit
): Promise<Response> => {
  try {
    return await fetch(`${API_URL}${endpoint}`, options);
  } catch {
    throw new Error(
      `Backend se connection nahi ho raha (${API_URL}). ` +
      "Backend server aur CORS settings check karein."
    );
  }
};

// ── Analyze Resume ────────────────────────────────────────────────────────

export const analyzeResume = async (
  file: File,
  jobDescription: string
): Promise<AnalysisResult> => {
  const formData = new FormData();

  // Backend ke expected field names
  formData.append("resume", file);
  formData.append("job_description", jobDescription);

  const response = await apiFetch("/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Resume analysis failed.")
    );
  }

  const data: AnalysisResult = await response.json();

  if (data.error) throw new Error(formatError(data.error));

  return data;
};

// ── Improve Resume ────────────────────────────────────────────────────────

export const improveResume = async (
  resumeText: string
): Promise<BulletImprovement[]> => {
  const response = await apiFetch("/improve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume_text: resumeText,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Resume improvement service is unavailable."
      )
    );
  }

  const data: unknown = await response.json();

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const result = data as Record<string, unknown>;

    if (result.error || result.detail) {
      throw new Error(formatError(result.error ?? result.detail));
    }

    if (Array.isArray(result.improved_bullets)) {
      return result.improved_bullets as BulletImprovement[];
    }

    if (Array.isArray(result.bullets)) {
      return result.bullets as BulletImprovement[];
    }
  }

  if (Array.isArray(data)) {
    return data as BulletImprovement[];
  }

  throw new Error(
    "Resume improvement API ka response expected format mein nahi hai."
  );
};
