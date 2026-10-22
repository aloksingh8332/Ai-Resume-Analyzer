import os
import re
import json
import asyncio
import logging
from pathlib import Path
from typing import List, Optional, Any, Dict
from io import BytesIO

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, Form, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import PyPDF2
from google import genai


# ============================================================
# ENVIRONMENT
# ============================================================

_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)


# ============================================================
# GEMINI CONFIGURATION
# ============================================================

GEMINI_MODEL = "gemini-3.8-flash"

api_key = os.getenv("LLM_API_KEY")

if not api_key:
    logger.error("CRITICAL: LLM_API_KEY is not set.")
    client = None
else:
    client = genai.Client(api_key=api_key)
    logger.info(f"Gemini configured with model: {GEMINI_MODEL}")


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="AI Resume Analyzer API",
    version="3.0.0"
)


# ============================================================
# CORS
# ============================================================

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")

origins = [
    origin.strip().rstrip("/")
    for origin in ALLOWED_ORIGINS.split(",")
    if origin.strip()
]

LOCAL_FRONTEND = "http://localhost:5173"
PROD_FRONTEND = "https://ai-resume-analyzer-rho-puce.vercel.app"

for frontend in [LOCAL_FRONTEND, PROD_FRONTEND]:
    if frontend not in origins:
        origins.append(frontend)

logger.info(f"CORS allowed origins: {origins}")


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With"
    ],
)


# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

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


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================

def extract_text_from_pdf(
    content: bytes,
    max_chars: int = 8000
) -> str:

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
        raise ValueError(
            f"Could not read PDF: {str(e)}"
        )

    text = re.sub(r"\s+", " ", text).strip()

    return text[:max_chars]


# ============================================================
# SAFE JSON EXTRACTION
# ============================================================

def extract_json_safely(raw: str) -> Dict[str, Any]:

    if not raw:
        raise ValueError("Empty AI response")

    raw = raw.strip()

    # --------------------------------------------------------
    # Direct JSON
    # --------------------------------------------------------

    try:
        data = json.loads(raw)

        if isinstance(data, dict):
            return data

    except Exception:
        pass

    # --------------------------------------------------------
    # Remove markdown code block
    # --------------------------------------------------------

    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        raw,
        flags=re.IGNORECASE
    )

    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned
    ).strip()

    try:
        data = json.loads(cleaned)

        if isinstance(data, dict):
            return data

    except Exception:
        pass

    # --------------------------------------------------------
    # Find JSON object inside response
    # --------------------------------------------------------

    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start != -1 and end != -1 and end > start:

        possible_json = cleaned[start:end + 1]

        try:
            data = json.loads(possible_json)

            if isinstance(data, dict):
                return data

        except Exception:
            pass

    raise ValueError("Could not extract valid JSON from AI response")


# ============================================================
# DEFAULT FALLBACK RESPONSE
# ============================================================

def fallback_result(
    resume_text: str,
    error_message: str = ""
) -> AnalysisResult:

    return AnalysisResult(
        metadata=Metadata(
            match_score=0,
            fit_status="Unable to analyze",
            skills_match_pct=0,
            experience_match_pct=0,
            gap_penalty_pct=0
        ),

        analysis=Analysis(
            matched_skills=[],
            missing_skills=[]
        ),

        recommendations=Recommendations(
            to_candidate=(
                "AI analysis could not be completed. "
                "Please try again with a valid resume PDF and job description."
            ),
            to_recruiter=(
                "Resume analysis was not completed successfully."
            )
        ),

        skill_gap_roadmap=[],

        improved_bullets=[],

        is_fallback=True,

        extracted_resume_text=resume_text,

        error=error_message
    )


# ============================================================
# NORMALIZE AI DATA
# ============================================================

def normalize_result(
    data: Dict[str, Any],
    resume_text: str
) -> AnalysisResult:

    metadata_data = data.get("metadata", {})
    analysis_data = data.get("analysis", {})
    recommendations_data = data.get("recommendations", {})

    roadmap_data = data.get(
        "skill_gap_roadmap",
        []
    )

    bullets_data = data.get(
        "improved_bullets",
        []
    )

    # --------------------------------------------------------
    # Metadata
    # --------------------------------------------------------

    try:
        match_score = int(
            metadata_data.get("match_score", 0)
        )
    except Exception:
        match_score = 0

    try:
        skills_match_pct = int(
            metadata_data.get("skills_match_pct", 0)
        )
    except Exception:
        skills_match_pct = 0

    try:
        experience_match_pct = int(
            metadata_data.get("experience_match_pct", 0)
        )
    except Exception:
        experience_match_pct = 0

    try:
        gap_penalty_pct = int(
            metadata_data.get("gap_penalty_pct", 0)
        )
    except Exception:
        gap_penalty_pct = 0

    match_score = max(0, min(100, match_score))
    skills_match_pct = max(0, min(100, skills_match_pct))
    experience_match_pct = max(0, min(100, experience_match_pct))
    gap_penalty_pct = max(0, min(30, gap_penalty_pct))

    fit_status = str(
        metadata_data.get(
            "fit_status",
            "Needs Improvement"
        )
    )

    # --------------------------------------------------------
    # Analysis
    # --------------------------------------------------------

    matched_skills = analysis_data.get(
        "matched_skills",
        []
    )

    missing_skills = analysis_data.get(
        "missing_skills",
        []
    )

    if not isinstance(matched_skills, list):
        matched_skills = []

    if not isinstance(missing_skills, list):
        missing_skills = []

    matched_skills = [
        str(skill)
        for skill in matched_skills
    ]

    missing_skills = [
        str(skill)
        for skill in missing_skills
    ]

    # --------------------------------------------------------
    # Recommendations
    # --------------------------------------------------------

    to_candidate = str(
        recommendations_data.get(
            "to_candidate",
            "Review the missing skills and improve your resume accordingly."
        )
    )

    to_recruiter = str(
        recommendations_data.get(
            "to_recruiter",
            "Candidate should be evaluated based on the provided resume and job description."
        )
    )

    # --------------------------------------------------------
    # Roadmap
    # --------------------------------------------------------

    roadmap = []

    if isinstance(roadmap_data, list):

        for item in roadmap_data:

            if not isinstance(item, dict):
                continue

            try:
                impact = int(item.get("impact", 50))
            except Exception:
                impact = 50

            try:
                priority = int(item.get("priority", 50))
            except Exception:
                priority = 50

            impact = max(0, min(100, impact))
            priority = max(0, min(100, priority))

            roadmap.append(
                RoadmapItem(
                    skill=str(
                        item.get(
                            "skill",
                            "Unknown skill"
                        )
                    ),
                    impact=impact,
                    priority=priority,
                    reason=str(
                        item.get(
                            "reason",
                            "Important skill for the target role."
                        )
                    )
                )
            )

    # --------------------------------------------------------
    # Improved bullets
    # --------------------------------------------------------

    improved_bullets = []

    if isinstance(bullets_data, list):

        for item in bullets_data:

            if not isinstance(item, dict):
                continue

            original = str(
                item.get("original", "")
            ).strip()

            improved = str(
                item.get("improved", "")
            ).strip()

            if original and improved:

                improved_bullets.append(
                    BulletImprovement(
                        original=original,
                        improved=improved
                    )
                )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return AnalysisResult(
        metadata=Metadata(
            match_score=match_score,
            fit_status=fit_status,
            skills_match_pct=skills_match_pct,
            experience_match_pct=experience_match_pct,
            gap_penalty_pct=gap_penalty_pct
        ),

        analysis=Analysis(
            matched_skills=matched_skills,
            missing_skills=missing_skills
        ),

        recommendations=Recommendations(
            to_candidate=to_candidate,
            to_recruiter=to_recruiter
        ),

        skill_gap_roadmap=roadmap,

        improved_bullets=improved_bullets,

        is_fallback=False,

        extracted_resume_text=resume_text,

        error=None
    )


# ============================================================
# GEMINI ANALYSIS
# ============================================================

async def analyze_with_gemini(
    resume_text: str,
    job_description: str
) -> AnalysisResult:

    if client is None:

        return fallback_result(
            resume_text,
            "LLM_API_KEY is not configured."
        )

    prompt = f"""
You are an expert ATS Resume Analyzer and technical recruiter.

Analyze the candidate resume against the provided Job Description.

Return ONLY valid JSON.
Do not use markdown.
Do not use ```.

The JSON must have exactly this structure:

{{
  "metadata": {{
    "match_score": 0,
    "fit_status": "Strong Fit",
    "skills_match_pct": 0,
    "experience_match_pct": 0,
    "gap_penalty_pct": 0
  }},

  "analysis": {{
    "matched_skills": [],
    "missing_skills": []
  }},

  "recommendations": {{
    "to_candidate": "",
    "to_recruiter": ""
  }},

  "skill_gap_roadmap": [
    {{
      "skill": "",
      "impact": 0,
      "priority": 0,
      "reason": ""
    }}
  ],

  "improved_bullets": [
    {{
      "original": "",
      "improved": ""
    }}
  ]
}}

Rules:

1. match_score must be between 0 and 100.
2. skills_match_pct must be between 0 and 100.
3. experience_match_pct must be between 0 and 100.
4. gap_penalty_pct must be between 0 and 30.
5. impact must be between 0 and 100.
6. priority must be between 0 and 100.
7. matched_skills must contain skills found in both the resume and job description.
8. missing_skills must contain important job requirements missing from the resume.
9. Do not invent experience that is not present.
10. Improve resume bullets without adding fake achievements.
11. Use concise professional language.
12. Give the candidate practical recommendations.
13. Give the recruiter an objective assessment.
14. Provide a useful roadmap for missing skills.
15. If there are no suitable bullets to improve, return an empty list.

JOB DESCRIPTION:

{job_description[:10000]}

RESUME:

{resume_text[:8000]}
"""

    try:

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt
        )

        raw_response = getattr(
            response,
            "text",
            None
        )

        if not raw_response:

            return fallback_result(
                resume_text,
                "Gemini returned an empty response."
            )

        logger.info(
            "Gemini response received successfully."
        )

        data = extract_json_safely(
            raw_response
        )

        return normalize_result(
            data,
            resume_text
        )

    except Exception as e:

        logger.exception(
            "Gemini analysis failed."
        )

        return fallback_result(
            resume_text,
            f"AI analysis failed: {str(e)}"
        )


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
async def root():

    return {
        "message": "AI Resume Analyzer API is running",
        "version": "3.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.get("/health")
async def health():

    return {
        "status": "ok",
        "gemini_configured": client is not None,
        "model": GEMINI_MODEL
    }


# ============================================================
# ANALYZE RESUME
# ============================================================

@app.post(
    "/analyze",
    response_model=AnalysisResult
)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):

    logger.info(
        f"Analyze request received. "
        f"File: {resume.filename}"
    )

    # --------------------------------------------------------
    # Validate file
    # --------------------------------------------------------

    if not resume.filename:

        raise HTTPException(
            status_code=400,
            detail="Resume file is required."
        )

    if not resume.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF resume files are supported."
        )

    # --------------------------------------------------------
    # Validate JD
    # --------------------------------------------------------

    job_description = job_description.strip()

    if not job_description:

        raise HTTPException(
            status_code=400,
            detail="Job description is required."
        )

    if len(job_description) < 20:

        raise HTTPException(
            status_code=400,
            detail="Job description is too short."
        )

    # --------------------------------------------------------
    # Read PDF
    # --------------------------------------------------------

    try:

        content = await resume.read()

        if not content:

            raise HTTPException(
                status_code=400,
                detail="Uploaded resume is empty."
            )

        resume_text = extract_text_from_pdf(
            content
        )

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "Resume extraction failed."
        )

        raise HTTPException(
            status_code=400,
            detail=f"Could not process resume PDF: {str(e)}"
        )

    # --------------------------------------------------------
    # Check extracted text
    # --------------------------------------------------------

    if not resume_text.strip():

        return fallback_result(
            "",
            "Could not extract text from the PDF. "
            "The PDF may be scanned/image-based."
        )

    logger.info(
        f"Resume extracted successfully. "
        f"Characters: {len(resume_text)}"
    )

    # --------------------------------------------------------
    # Gemini analysis
    # --------------------------------------------------------

    result = await analyze_with_gemini(
        resume_text,
        job_description
    )

    return result


# ============================================================
# IMPROVE RESUME
# ============================================================

@app.post(
    "/improve",
    response_model=AnalysisResult
)
async def improve_resume(
    request: ImproveRequest
):

    resume_text = request.resume_text.strip()

    if not resume_text:

        raise HTTPException(
            status_code=400,
            detail="resume_text is required."
        )

    if client is None:

        return fallback_result(
            resume_text,
            "LLM_API_KEY is not configured."
        )

    prompt = f"""
You are an expert resume writer.

Improve the following resume.

IMPORTANT:
- Do not invent experience.
- Do not invent companies.
- Do not invent degrees.
- Do not invent certifications.
- Do not invent numbers or achievements.
- Keep facts truthful.
- Improve clarity, ATS keywords, grammar and professional impact.

Return ONLY valid JSON.

Use exactly this structure:

{{
  "metadata": {{
    "match_score": 0,
    "fit_status": "Resume Improved",
    "skills_match_pct": 0,
    "experience_match_pct": 0,
    "gap_penalty_pct": 0
  }},

  "analysis": {{
    "matched_skills": [],
    "missing_skills": []
  }},

  "recommendations": {{
    "to_candidate": "",
    "to_recruiter": ""
  }},

  "skill_gap_roadmap": [],

  "improved_bullets": [
    {{
      "original": "",
      "improved": ""
    }}
  ]
}}

Resume:

{resume_text[:10000]}
"""

    try:

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt
        )

        raw_response = getattr(
            response,
            "text",
            None
        )

        if not raw_response:

            return fallback_result(
                resume_text,
                "Gemini returned an empty response."
            )

        data = extract_json_safely(
            raw_response
        )

        return normalize_result(
            data,
            resume_text
        )

    except Exception as e:

        logger.exception(
            "Resume improvement failed."
        )

        return fallback_result(
            resume_text,
            f"Resume improvement failed: {str(e)}"
        )


# ============================================================
# STARTUP MESSAGE
# ============================================================

@app.on_event("startup")
async def startup_event():

    logger.info(
        "=================================================="
    )

    logger.info(
        "AI Resume Analyzer API started successfully"
    )

    logger.info(
        f"Gemini model: {GEMINI_MODEL}"
    )

    logger.info(
        f"Gemini configured: {client is not None}"
    )

    logger.info(
        "Swagger docs available at /docs"
    )

    logger.info(
        "=================================================="
    )