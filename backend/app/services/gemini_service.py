"""
services/gemini_service.py — ALL Gemini API interactions for MockMate AI.

This is the single point of contact with the Gemini API.
No other module should call Gemini directly.

Responsibilities:
  - Resume parsing and structuring
  - JD quality analysis
  - JD role classification (technical vs managerial)
  - Question bank generation (Module 1 resume-based + Module 2/3 JD-based)
  - Answer evaluation (AI scoring)
  - Transcript spell correction (preserve filler words)
  - Per-question expected answer generation
  - Overall interview summary generation
  - AI improvement suggestions generation
"""

import json
import google.generativeai as genai
from fastapi import HTTPException, status
from app.config import get_settings

settings = get_settings()


def _get_model(model_name: str = "gemini-1.5-flash"):
    """Initialize and return Gemini model. Centralised for easy model switching."""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(model_name)


def _parse_json_response(text: str) -> dict | list:
    """
    Safely parse Gemini's JSON response.
    Strips markdown code fences if present.
    """
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned.strip())


# ── Resume Parsing ────────────────────────────────────────────────────────────

async def parse_resume(raw_text: str) -> dict:
    """
    Parse raw resume text into structured JSON sections.
    Returns dict matching StructuredResume schema.

    Validates presence of mandatory sections: projects, education.
    Raises 422 if mandatory sections are missing.
    """
    model = _get_model()
    prompt = f"""
You are an expert resume parser. Extract the following sections from the resume text below.

Return a JSON object with these exact keys:
- name (string)
- email (string)
- phone (string)
- education (array of objects with: degree, institution, year, grade)
- experience (array of objects with: company, role, duration, responsibilities[])
- projects (array of objects with: name, description, tech_stack[], highlights[])
- certifications (array of objects with: name, issuer, year)
- skills (array of strings)

Rules:
- If a section is missing, use an empty array [].
- Preserve all details exactly as they appear.
- Use fuzzy/semantic matching for section names:
  "Academic Background" → education
  "Portfolio" or "Work Samples" → projects
  "Work History" → experience
  "Achievements" → certifications (if relevant)
- EXCLUDE 10th grade (SSC/SSLC/matriculation) entries from education.
- Return ONLY valid JSON. No markdown, no explanation.

Resume Text:
{raw_text}
"""

    try:
        response = model.generate_content(prompt)
        parsed = _parse_json_response(response.text)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not parse resume structure. Ensure the resume content is readable.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini resume parsing failed: {str(e)}",
        )

    # Mandatory section validation
    missing = []
    if not parsed.get("projects"):
        missing.append("Projects")
    if not parsed.get("education"):
        missing.append("Education")

    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Resume must contain the following mandatory sections: {', '.join(missing)}. "
                   f"Please upload a resume that includes these sections.",
        )

    return parsed


# ── JD Analysis ───────────────────────────────────────────────────────────────

async def analyze_jd_quality(jd_text: str) -> dict:
    """
    Rate JD quality and detect if it's too vague.
    Returns: { quality_score, warning, message }
    """
    model = _get_model()
    prompt = f"""
Analyze the following job description. Rate its detail level from 1 (very vague) to 10 (highly detailed).
Consider: length, specificity of requirements, listed responsibilities, and required qualifications.

Return ONLY valid JSON in this exact format:
{{
  "quality_score": <integer 1-10>,
  "warning": <boolean>,
  "message": "<string>"
}}

Rules:
- If score < 5, set warning: true and suggest: "Job description seems brief. Questions may be generic. Consider uploading a more detailed JD."
- If score >= 5, set warning: false and message: "Job description is sufficient for a targeted interview."

Job Description:
{jd_text}
"""
    try:
        response = model.generate_content(prompt)
        return _parse_json_response(response.text)
    except Exception as e:
        # Non-blocking — return default if fails
        return {"quality_score": 5, "warning": False, "message": "JD quality check unavailable."}


async def classify_jd_type(jd_text: str) -> str:
    """
    Classify JD as 'technical' or 'managerial'.
    Used to adjust skill scoring weights.
    """
    model = _get_model()
    prompt = f"""
Classify this job description as either 'technical' or 'managerial'.

- 'technical': focus on hard skills, coding, tools, frameworks, system design
- 'managerial': focus on leadership, team management, strategy, stakeholder communication

Return ONLY valid JSON: {{"type": "technical"}} or {{"type": "managerial"}}

Job Description:
{jd_text}
"""
    try:
        response = model.generate_content(prompt)
        result = _parse_json_response(response.text)
        return result.get("type", "technical")
    except Exception:
        return "technical"  # Default fallback


# ── Question Bank Generation ──────────────────────────────────────────────────

async def generate_resume_questions(structured_resume: dict, jd_text: str) -> list[dict]:
    """
    Generate Module 1 resume-based questions with caps.
    Caps: Education max 3, Experience max 3, Projects max 3, Certifications max 3.
    Skip 10th grade. Prioritize JD relevance.

    Returns list of question dicts with: section, question_text, jd_relevance_score
    """
    model = _get_model()
    prompt = f"""
You are a professional interviewer preparing resume-based questions for a mock interview.

Job Description:
{jd_text}

Candidate's Structured Resume:
{json.dumps(structured_resume, indent=2)}

Generate resume-based interview questions with the following STRICT rules:

1. EDUCATION (max 3 questions):
   - Focus on the highest qualification only
   - NEVER ask about 10th grade (SSC/SSLC/Matriculation) entries
   - Prioritize degrees most relevant to the JD

2. EXPERIENCE (max 3 questions):
   - Focus on the most JD-relevant role first
   - Then the longest tenure role
   - Skip very short or completely unrelated roles

3. PROJECTS (max 3 questions):
   - Select only the most JD-relevant projects
   - Focus on tech stack overlap with JD

4. CERTIFICATIONS (max 3 questions):
   - Select only certifications relevant to the JD
   - If none are relevant, return empty array for this section

Return ONLY valid JSON as an array of objects:
[
  {{
    "section": "education|experience|projects|certifications",
    "question_text": "<question>",
    "jd_relevance_score": <float 0-10>
  }}
]

Return ONLY the JSON array. No explanation. No markdown.
"""
    try:
        response = model.generate_content(prompt)
        return _parse_json_response(response.text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate resume questions: {str(e)}",
        )


async def generate_jd_questions(jd_text: str, structured_resume: dict, num_questions: int = 10) -> list[dict]:
    """
    Generate Module 2 & 3 JD-based questions.
    These are the primary interview questions (65% of session time).

    Returns list of question dicts with: question_text, jd_relevance_score
    """
    model = _get_model()
    prompt = f"""
You are a senior interviewer for the role described in the Job Description below.

Job Description:
{jd_text}

Candidate Resume Summary:
{json.dumps(structured_resume, indent=2)}

Generate {num_questions} interview questions that:
1. Test technical/domain knowledge required by the JD
2. Probe role responsibilities and required skills
3. Include some behavioral questions relevant to the role
4. Are open-ended and require detailed answers
5. Vary in depth (mix of core and advanced)

Do NOT repeat topics covered in a basic resume review.
Focus on what the COMPANY needs for THIS specific role.

Return ONLY valid JSON as an array of objects:
[
  {{
    "question_text": "<question>",
    "jd_relevance_score": <float 0-10>
  }}
]

No explanation. No markdown. JSON only.
"""
    try:
        response = model.generate_content(prompt)
        return _parse_json_response(response.text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate JD questions: {str(e)}",
        )


# ── Answer Evaluation ─────────────────────────────────────────────────────────

async def evaluate_answer(question: str, raw_answer: str, jd_text: str) -> dict:
    """
    Evaluate a candidate's answer to an interview question.
    Called on the RAW transcript (before spell correction) to capture natural signals.

    Returns: { ai_score, relevance_reasoning, depth_reasoning, strengths, weaknesses, confidence_inference }
    """
    model = _get_model()
    prompt = f"""
You are evaluating a candidate's interview answer. Assess honestly and professionally.

Job Description Context:
{jd_text}

Question Asked:
{question}

Candidate's Answer (raw, may contain filler words like um/uh — evaluate the substance):
{raw_answer}

Evaluate on:
1. Relevance to the question and JD (0-100)
2. Depth of knowledge demonstrated (0-100)
3. Overall content quality (0-100)

Also provide:
- Strengths: what was good about this answer
- Weaknesses: what was missing or incorrect
- Confidence inference: based on hesitation patterns, directness, and clarity in the text

Return ONLY valid JSON:
{{
  "ai_score": <integer 0-100>,
  "relevance_reasoning": "<string>",
  "depth_reasoning": "<string>",
  "strengths": "<string>",
  "weaknesses": "<string>",
  "confidence_inference": "<string>"
}}
"""
    try:
        response = model.generate_content(prompt)
        return _parse_json_response(response.text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Answer evaluation failed: {str(e)}",
        )


# ── Transcript Spell Correction ───────────────────────────────────────────────

async def spell_correct_transcript(raw_transcript: str) -> str:
    """
    Correct only accent/STT-induced spelling errors in the transcript.

    CRITICAL RULES (never violate):
    - Do NOT paraphrase or restructure any sentence
    - Do NOT remove filler words (um, uh, like, you know, sort of, kind of)
    - Do NOT change the meaning of anything said
    - Only fix obvious STT/accent transcription errors (wrong words from homophones/accents)
    - Return the corrected text ONLY, nothing else
    """
    model = _get_model()
    prompt = f"""
You are correcting STT (speech-to-text) transcription errors caused by accents or audio noise.

STRICT RULES:
1. PRESERVE all filler words: um, uh, like, you know, sort of, kind of, basically, right, so
2. Do NOT paraphrase or rewrite any sentence
3. Do NOT change the structure or meaning
4. ONLY fix clear STT/accent errors (e.g., "I worked on react" when clearly meant "ReactJS")
5. Return ONLY the corrected text — no explanation, no labels

Transcript to correct:
{raw_transcript}
"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return raw_transcript  # Return original if correction fails


# ── Expected Answer Generation ────────────────────────────────────────────────

async def generate_expected_answer(question: str, jd_text: str, structured_resume: dict) -> str:
    """
    Generate the ideal answer for a question, tailored to:
    - What the JD expects from a candidate in this role
    - What this specific candidate's resume shows they know/have done

    This is NOT a generic textbook answer. It is the best answer THIS candidate could give.
    """
    model = _get_model()
    prompt = f"""
Generate the ideal interview answer for the question below.

Context:
- This is a mock interview for the role described in the Job Description
- The answer should reflect what THIS specific candidate (based on their resume) could realistically say
- It should align with what the company expects based on the JD
- Tone: professional, confident, specific

Job Description:
{jd_text}

Candidate's Resume:
{json.dumps(structured_resume, indent=2)}

Question:
{question}

Write the ideal answer this candidate should have given. Be specific and practical.
Return ONLY the answer text. No labels, no markdown.
"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return "Expected answer generation is unavailable for this question."


# ── Per-Question Feedback ─────────────────────────────────────────────────────

async def generate_question_feedback(question: str, corrected_answer: str, ai_score: float) -> dict:
    """
    Generate a comment and improvement suggestion for a specific Q&A pair.
    Called after evaluation is complete.

    Returns: { comment, suggestion }
    """
    model = _get_model()
    prompt = f"""
You reviewed this interview Q&A and scored the answer {ai_score}/100.

Question: {question}
Answer: {corrected_answer}

Now provide:
1. A brief, honest comment on the quality of this answer (2-3 sentences)
2. A specific, actionable improvement suggestion for this answer (2-3 sentences)

Return ONLY valid JSON:
{{
  "comment": "<string>",
  "suggestion": "<string>"
}}
"""
    try:
        response = model.generate_content(prompt)
        return _parse_json_response(response.text)
    except Exception:
        return {"comment": "Evaluation comment unavailable.", "suggestion": "Review the topic and practice structuring your answer clearly."}


# ── Overall Summary & Suggestions ─────────────────────────────────────────────

async def generate_interview_summary(
    transcript: list[dict],
    scores: dict,
    jd_text: str,
) -> dict:
    """
    Generate:
    - 4-5 line overall interview summary
    - Behavioral improvement suggestions (list)
    - Technical improvement suggestions (list)

    Returns: { summary_text, ai_suggestions_behavioral, ai_suggestions_technical }
    """
    model = _get_model()

    # Build a compact transcript for the prompt
    qa_summary = "\n".join([
        f"Q: {entry.get('question_text', '')}\nScore: {entry.get('final_score', 'N/A')}/100"
        for entry in transcript
    ])

    prompt = f"""
You have just completed evaluating a mock interview. Here is the overall performance:

Overall Score: {scores.get('overall', 'N/A')}
Fluency: {scores.get('fluency', 'N/A')}
Confidence: {scores.get('confidence', 'N/A')}
Content Quality: {scores.get('content_quality', 'N/A')}

Question-Answer Summary:
{qa_summary}

Job Description Context:
{jd_text[:500]}...

Generate:
1. A 4-5 line overall summary of the candidate's performance. 
   Tone: professional, constructive, honest. Highlight key strengths and areas for improvement.

2. Up to 4 behavioral improvement suggestions (communication, confidence, structure, delivery).

3. Up to 4 technical improvement suggestions (specific topics, technologies, or concepts to study based on the JD).

Return ONLY valid JSON:
{{
  "summary_text": "<4-5 line summary>",
  "ai_suggestions_behavioral": ["<suggestion 1>", "<suggestion 2>", ...],
  "ai_suggestions_technical": ["<suggestion 1>", "<suggestion 2>", ...]
}}
"""
    try:
        response = model.generate_content(prompt)
        return _parse_json_response(response.text)
    except Exception:
        return {
            "summary_text": "Interview evaluation summary is currently unavailable.",
            "ai_suggestions_behavioral": [],
            "ai_suggestions_technical": [],
        }


# ── Follow-up Question Generation (called live during interview) ──────────────

async def generate_followup_question(question: str, answer: str, jd_text: str) -> str:
    """
    Generate a single follow-up question based on the candidate's answer.
    Used during live interview in Module 2/3 to dig deeper or challenge.
    Max 2 follow-ups per topic enforced by the WebSocket session manager.
    """
    model = _get_model()
    prompt = f"""
During an interview for the role described in this Job Description:
{jd_text[:300]}

The interviewer asked: {question}
The candidate answered: {answer}

Generate ONE natural follow-up question to either:
- Dig deeper into something the candidate mentioned
- Challenge a claim they made
- Explore a gap in their answer

The follow-up should feel like what a real interviewer would naturally ask next.
Return ONLY the question text. Nothing else.
"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return "Can you elaborate on that?"
