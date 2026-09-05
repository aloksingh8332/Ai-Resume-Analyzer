import os
import re
import json
import asyncio
import logging
from pathlib import Path
from typing import List, Optional, Any, Dict, Union
from io import BytesIO

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, Form, HTTPException, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import PyPDF2
from google import genai

# ── Environment ───────────────────────────────────────────────────────────────
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Gemini Configuration ──────────────────────────────────────────────────────
GEMINI_MODEL = "gemini-2.5-flash"
api_key = os.getenv("LLM_API_KEY")

if not api_key:
    logger.error("CRITICAL: LLM_API_KEY is not set.")
    client = None
else:
    client = genai.Client(api_key=api_key)
    logger.info(f"Gemini configured with model: {GEMINI_MODEL}")

# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(title="AI Resume Analyzer API", version="3.0.0")

# ── FIX CORS CONFIGURATION (PRODUCTION ROBUST) ────────────────────────────────
# Get origins from environment, with a safe production default for your Vercel app
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip().rstrip('/') for origin in ALLOWED_ORIGINS.split(",") if origin.strip()]

# Add your production Vercel URL as a hardcoded safety fallback to prevent "No Access-Control-Allow-Origin"
PROD_FRONTEND = "https://ai-resume-analyzer-rho-puce.vercel.app"
LOCAL_FRONTEND = "http://localhost:5173"
for frontend in [LOCAL_FRONTEND, PROD_FRONTEND]:
    if frontend not in origins and "*" not in origins:
        origins.append(frontend)

# If still empty (local dev), allow everything
if not origins or (len(origins) == 1 and origins[0] == ""):
    origins = ["*"]

print(f"CORS allowed origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
)

# ── Response Schemas ──────────────────────────────────────────────────────────
class ImproveRequest(BaseModel):
    resume_text: str

class Metadata(BaseModel):
    match_score: int = Field(ge=0, le=100)
    fit_status: str
    skills_match_pct: int = Field(ge=0, le=100)
    experience_match_pct: int = Field(ge=0, le=100)
    gap_penalty_pct: int = Field(ge=0, le=30)

class Analysis(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]

class Recommendations(BaseModel):
    to_candidate: str
    to_recruiter: str

class RoadmapItem(BaseModel):
    skill: str
    impact: int
    priority: int
    reason: str

class BulletImprovement(BaseModel):
    original: str
    improved: str

class AnalysisResult(BaseModel):
    metadata: Metadata
    analysis: Analysis
    recommendations: Recommendations
    skill_gap_roadmap: List[RoadmapItem]
    improved_bullets: List[BulletImprovement]
    is_fallback: bool = False
    extracted_resume_text: str = ""
    error: Optional[str] = None

# ── Helper Logic ──────────────────────────────────────────────────────────────
def extract_text_from_pdf(content: bytes, max_chars: int = 1500) -> str:
    """Extract and truncate text from PDF (limited to 1500 chars)."""
    text = ""
    try:
        reader = PyPDF2.PdfReader(BytesIO(content))
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
            if len(text) >= max_chars:
                break
    except Exception as e:
        raise ValueError(f"Could not read PDF: {str(e)}")
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:max_chars]

def extract_json_safely(raw: str) -> Dict[str, Any]:
    raw = raw.strip()
    try:
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("JSON is not an object")
        return data
    except json.JSONDecodeError:
        pass
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()
    try:
        data = json.loads(cleaned)
        if not isinstance(data, dict):
            raise ValueError("JSON is not an object")
        return data
    except json.JSONDecodeError:
        pass
        
    start = raw.find("{")
    if start != -1:
        depth, i = 0, start
        while i < len(raw):
            if raw[i] == "{":
                depth += 1
            elif raw[i] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        data = json.loads(raw[start : i + 1])
                        if isinstance(data, dict):
                            return data
                    except json.JSONDecodeError:
                        break
            i += 1
    return {
        "match_score": 0,
        "matched_skills": [],
        "missing_skills": [],
        "summary": ""
    }

async def call_gemini_optimized(prompt: str) -> str:
    """Call Gemini with 1 retry, 10s wait, and 1.5s initial delay."""
    if client is None:
        raise RuntimeError("LLM_API_KEY missing")

    # Initial delay to avoid burst traffic
    await asyncio.sleep(1.5)

    loop = asyncio.get_event_loop()
    max_retries = 1
    
    for attempt in range(max_retries + 1):
        try:
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model=GEMINI_MODEL,
                        contents=prompt,
                    ),
                ),
                timeout=25.0,
            )
            return response.text
        except Exception as exc:
            if attempt < max_retries:
                logger.warning(f"Gemini error, retrying in 10s... ({exc})")
                await asyncio.sleep(10.0)
                continue
            raise

    raise RuntimeError("AI Service exhausted retries")

# ── Local Feature Generation ──────────────────────────────────────────────────
def generate_full_result(ai_data: Dict[str, Any], resume_text: str, jd_text: str) -> Dict[str, Any]:
    """Generates the full AnalysisResult from lightweight AI response."""
    # Ensure data integrity
    score = ai_data.get("match_score", 0)
    matched = ai_data.get("matched_skills", [])
    if not isinstance(matched, list): matched = []
    missing = ai_data.get("missing_skills", [])
    if not isinstance(missing, list): missing = []
    summary = ai_data.get("summary", "")
    if not isinstance(summary, str) or not summary:
        summary = "AI analysis completed successfully."
        
    logger.info(f"Mapping AI Response: Score={score}, Matched={len(matched)}, Missing={len(missing)}")

    # 1. Metadata Details
    skills_match_pct = min(100, int((len(matched) / max(1, len(matched) + len(missing))) * 100))
    exp_pct = 80 if score > 75 else 60
    penalty = min(30, len(missing) * 5)

    # 2. Skill Gap Roadmap (Local)
    roadmap = []
    for i, skill in enumerate(missing[:5]):
        roadmap.append({
            "skill": skill.capitalize(),
            "impact": 8,
            "priority": i + 1,
            "reason": f"Required keyword '{skill}' is missing from your resume."
        })

    return {
        "metadata": {
            "match_score": score,
            "fit_status": "Ideal" if score >= 70 else "Underqualified",
            "skills_match_pct": skills_match_pct,
            "experience_match_pct": exp_pct,
            "gap_penalty_pct": penalty,
        },
        "analysis": {
            "matched_skills": matched,
            "missing_skills": missing,
        },
        "recommendations": {
            "to_candidate": summary,
            "to_recruiter": f"Candidate score: {score}%. Key overlaps found in: " + ", ".join(matched[:3]) + ".",
        },
        "skill_gap_roadmap": roadmap,
        "improved_bullets": [], # Separate API call for this feature
        "is_fallback": False,
        "extracted_resume_text": resume_text
    }

def generate_local_fallback(resume_text: str, jd_text: str) -> Dict[str, Any]:
    """Basic local fallback logic."""
    tech_keywords = {"python", "javascript", "react", "node", "aws", "docker", "sql", "java", "typescript", "fastapi"}
    jd_words = set(re.findall(r'\b\w+\b', jd_text.lower()))
    resume_words = set(re.findall(r'\b\w+\b', resume_text.lower()))
    
    potential = jd_words.intersection(tech_keywords)
    matched = list(potential.intersection(resume_words))
    missing = list(potential.difference(resume_words))
    
    score = int((len(matched) / max(1, len(potential))) * 100)
    
    return generate_full_result({
        "match_score": score,
        "matched_skills": [s.capitalize() for s in matched],
        "missing_skills": [s.capitalize() for s in missing],
        "summary": "AI is temporarily busy. Showing a quick local analysis based on keyword matching.",
        "extracted_resume_text": resume_text
    }, resume_text, jd_text)

# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok", "api_key_loaded": bool(api_key)}

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_resume(
    file: UploadFile = File(...),
    jobDescription: str = Form(...),
):
    try:
        if not (file.filename or "").lower().endswith(".pdf"):
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Only PDF files are accepted."}
            )
        
        content = await file.read()
        resume_text = extract_text_from_pdf(content, max_chars=1500)
        jd_trimmed = jobDescription[:800].strip()

        if not resume_text:
            return generate_local_fallback("", jd_trimmed)

        # LIGHTWEIGHT PROMPT
        prompt = f"""Analyze the resume against the job description.
Return ONLY JSON:
{{
  "match_score": number,
  "matched_skills": [],
  "missing_skills": [],
  "summary": "Short 2-sentence assessment"
}}
RESUME: {resume_text}
JD: {jd_trimmed}"""

        try:
            raw_response = await call_gemini_optimized(prompt)
            ai_data = extract_json_safely(raw_response)
            return generate_full_result(ai_data, resume_text, jd_trimmed)
        except Exception as e:
            logger.error(f"AI call failed: {e}. Switching to local.")
            return generate_local_fallback(resume_text, jd_trimmed)

    except Exception as e:
        logger.error(f"Backend error: {e}")
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Service temporarily unavailable"}
        )

@app.post("/api/improve")
async def improve_resume(
    request: ImproveRequest,
):
    """Separate API call for Resume Improver, only when clicked."""
    try:
        prompt = f"Improve these resume bullet points using STAR format. Return JSON list of {{'original': '...', 'improved': '...'}}. RESUME: {request.resume_text[:1000]}"
        raw = await call_gemini_optimized(prompt)
        return extract_json_safely(raw)
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Improver currently busy. Please try again later."}
        )
