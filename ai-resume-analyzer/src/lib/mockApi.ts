export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}

export const analyzeResume = async (
  file: File | null,
  jobDescription: string
): Promise<MatchResult> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("Resume file is required."));
    }
    if (!jobDescription || jobDescription.trim().length === 0) {
      return reject(new Error("Job description is required."));
    }

    // Simulate network latency (2-3 seconds)
    setTimeout(() => {
      // Return realistic-looking mock data
      resolve({
        score: Math.floor(Math.random() * 20) + 75, // 75-94 score range
        matchedSkills: [
          "React",
          "TypeScript",
          "Tailwind CSS",
          "Node.js",
          "Git",
        ],
        missingSkills: ["GraphQL", "Docker", "AWS"],
        suggestions: [
          "Highlight your experience with scalable cloud architecture (AWS).",
          "Add metrics to your recent role, e.g., 'Improved performance by 20%'.",
          "Include a section specifically for certifications if applicable.",
        ],
      });
    }, 2500);
  });
};
