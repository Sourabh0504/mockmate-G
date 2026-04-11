> [!IMPORTANT]
> **SYNC RULE — ENFORCED ON EVERY PROMPT CHANGE**
> Whenever you edit any prompt inside `backend/app/services/gemini_service.py`, you **MUST** also update the corresponding section in this file.
> This file is the single source of truth for prompt history, reasoning, and optimization notes.
> Format for each version entry under a prompt:
> ```
> ### vN — YYYY-MM-DD
> **Change:** What changed and why
> **Template:**
> [full prompt text]
> ```

# MockMate AI — Prompt Engineering Registry

This file is the authoritative record of every Gemini prompt used in MockMate AI.

**Purpose:**
- Track prompt versions and iteration history
- Document known issues, failure modes, and what was tried
- Give you (and AI agents) a single place to write/review better prompts before deploying them
- Help maintain consistency across prompts when product rules change

**How to Use:**
1. To optimize a prompt: edit the template here first, test it, then copy the final version into `gemini_service.py`
2. After editing `gemini_service.py`: bump the version here, copy the new template, describe what changed and why
3. Never delete old versions — move them to the History section for that prompt

**File location:** `MockmateGemini/prompts.md`
**Code location:** `backend/app/services/gemini_service.py`

---

## Index

| # | Prompt Name | Function | Criticality | Current Version |
|---|---|---|---|---|
| 1 | Resume Parsing | `parse_resume()` | 🔴 HIGH | v1 |
| 2 | JD Quality Analysis | `analyze_jd_quality()` | 🟡 MEDIUM | v1 |
| 3 | JD Type Classification | `classify_jd_type()` | 🟡 MEDIUM | v1 |
| 4 | Resume-Based Questions | `generate_resume_questions()` | 🔴 HIGH | v1 |
| 5 | JD-Based Questions | `generate_jd_questions()` | 🔴 HIGH | v1 |
| 6 | Answer Evaluation | `evaluate_answer()` | 🔴 HIGH | v1 |
| 7 | Spell Correction | `spell_correct_transcript()` | 🟡 MEDIUM | v1 |
| 8 | Expected Answer Generation | `generate_expected_answer()` | 🟢 LOW | v1 |
| 9 | Per-Question Feedback | `generate_question_feedback()` | 🟡 MEDIUM | v1 |
| 10 | Interview Summary | `generate_interview_summary()` | 🔴 HIGH | v1 |
| 11 | Live Follow-up Question | `generate_followup_question()` | 🔴 HIGH | v1 |

**Criticality Key:**
- 🔴 HIGH — Failure blocks core product functionality (upload, interview, scoring)
- 🟡 MEDIUM — Failure degrades UX or report quality
- 🟢 LOW — Failure produces a graceful fallback with minor impact

---

## PROMPT 1: Resume Parsing

**Function:** `parse_resume()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** At resume upload time (before session creation)
**Output type:** JSON object
**Criticality:** 🔴 HIGH — if this fails or produces bad JSON, the upload is blocked

**What it must do:**
- Extract structured data from raw text (name, email, phone, education, experience, projects, certifications, skills)
- Apply fuzzy/semantic section matching (e.g. "Portfolio" → projects)
- Skip 10th grade (SSC/SSLC/Matriculation) entries
- Return ONLY valid JSON — no markdown fences, no explanation

**Known failure modes:**
- Sometimes wraps output in ```json ... ``` despite being told not to → handled by `_parse_json_response()` stripper
- Can hallucinate "grade" field when it's not present → acceptable, system uses empty string
- May miss fuzzy-matched sections if the resume uses unusual heading names → could improve with more examples

**Optimization ideas:**
- Add explicit negative examples ("DO NOT include headers like 'References' or 'Hobbies'")
- Provide the full JSON schema inline for stricter output

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
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
```

---

## PROMPT 2: JD Quality Analysis

**Function:** `analyze_jd_quality()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** During session creation background processing (Step 2)
**Output type:** JSON object `{ quality_score, warning, message }`
**Criticality:** 🟡 MEDIUM — failure returns a safe default (`quality_score: 5, warning: false`)

**What it must do:**
- Rate the JD from 1 (very vague) to 10 (highly detailed)
- Set `warning: true` and a user-visible message if score < 5
- Set `warning: false` if score ≥ 5

**Known failure modes:**
- Vague JDs (single sentence) sometimes still score 4–5 instead of 1–2, giving no warning when one is warranted
- The hardcoded fallback message is different from what the plan specifies → currently acceptable

**Optimization ideas:**
- Add scoring rubric details: "Score 1-2: single sentence or just a job title. Score 3-4: ..."
- Make Gemini explain the score briefly for admin debug visibility

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
Analyze the following job description. Rate its detail level from 1 (very vague) to 10 (highly detailed).
Consider: length, specificity of requirements, listed responsibilities, and required qualifications.

Return ONLY valid JSON in this exact format:
{
  "quality_score": <integer 1-10>,
  "warning": <boolean>,
  "message": "<string>"
}

Rules:
- If score < 5, set warning: true and suggest: "Job description seems brief. Questions may be generic. Consider uploading a more detailed JD."
- If score >= 5, set warning: false and message: "Job description is sufficient for a targeted interview."

Job Description:
{jd_text}
```

---

## PROMPT 3: JD Type Classification

**Function:** `classify_jd_type()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** During session creation background processing (Step 3)
**Output type:** JSON `{ "type": "technical" }` or `{ "type": "managerial" }`
**Criticality:** 🟡 MEDIUM — failure defaults to `"technical"` which is correct for most candidates

**What it must do:**
- Classify the JD as `technical` (hard skills, coding, tools) or `managerial` (leadership, team, strategy)
- This drives the skill weight matrix in scoring (Section 15 of plan.md)

**Known failure modes:**
- Hybrid roles (e.g. Tech Lead) are ambiguous — model picks one, which may skew weights
- Could add a third type `"hybrid"` in future, but scoring system doesn't support it yet

**Optimization ideas:**
- Add examples: "If the JD mentions managing engineers AND writing code, classify as technical"
- Consider adding a confidence score to surface ambiguous cases

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
Classify this job description as either 'technical' or 'managerial'.

- 'technical': focus on hard skills, coding, tools, frameworks, system design
- 'managerial': focus on leadership, team management, strategy, stakeholder communication

Return ONLY valid JSON: {"type": "technical"} or {"type": "managerial"}

Job Description:
{jd_text}
```

---

## PROMPT 4: Resume-Based Questions (Module 1)

**Function:** `generate_resume_questions()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** During session creation background processing (Step 4)
**Output type:** JSON array of question objects
**Criticality:** 🔴 HIGH — bad questions make Module 1 feel off, and the opener "Please introduce yourself." is added separately (not by this prompt)

**What it must do:**
- Generate ≤3 questions per section: education, experience, projects, certifications
- NEVER ask about 10th grade
- Prioritize JD relevance
- Return each question with its section and `jd_relevance_score (0–10)`
- Skip sections entirely if the resume has nothing relevant

**Known failure modes:**
- Sometimes generates more than 3 per section when asked to "select the best" — could add hard count enforcement
- May ask about generic resume facts ("What was your GPA?") instead of substantive questions
- Certifications section: often generates poor questions when certs are niche or unrecognized

**Optimization ideas:**
- Add persona framing ("You are a senior hiring manager at a tier-1 tech company")
- Give example of a good vs bad question for each section
- Explicitly forbid trivial questions ("Do not ask what year they graduated")

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
You are a professional interviewer preparing resume-based questions for a mock interview.

Job Description:
{jd_text}

Candidate's Structured Resume:
{structured_resume_json}

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
  {
    "section": "education|experience|projects|certifications",
    "question_text": "<question>",
    "jd_relevance_score": <float 0-10>
  }
]

Return ONLY the JSON array. No explanation. No markdown.
```

---

## PROMPT 5: JD-Based Questions (Module 2 & 3)

**Function:** `generate_jd_questions()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** During session creation background processing (Step 4, after Module 1)
**Output type:** JSON array of question objects
**Criticality:** 🔴 HIGH — this is the core of the interview (65% of session time)

**What it must do:**
- Generate `num_questions` questions (default 10) driven by the JD
- Include technical/domain, role responsibility, and behavioral questions
- Open-ended questions only — require detailed answers
- NOT repeat things already covered in Module 1 resume review
- Vary depth: mix of core and advanced

**Known failure modes:**
- Often generates generic questions ("Tell me about a time you worked in a team") that aren't specific to the JD
- Can generate overly easy or obvious questions for senior roles
- Behavioral questions sometimes read as HR filler, not role-specific

**Optimization ideas:**
- Add explicit instruction: "At least 3 of the {num_questions} must be scenario-based ('Imagine you are...')"
- Add: "At least 2 must require the candidate to demonstrate technical depth, not just describe experience"
- Consider sending the Module 1 questions already generated so the model can avoid overlap

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
You are a senior interviewer for the role described in the Job Description below.

Job Description:
{jd_text}

Candidate Resume Summary:
{structured_resume_json}

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
  {
    "question_text": "<question>",
    "jd_relevance_score": <float 0-10>
  }
]

No explanation. No markdown. JSON only.
```

---

## PROMPT 6: Answer Evaluation

**Function:** `evaluate_answer()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** Post-interview, once per Q&A pair during evaluation pipeline
**Output type:** JSON object with scores and reasoning
**Criticality:** 🔴 HIGH — this drives the AI's 70% contribution to the final score

**What it must do:**
- Evaluate on: relevance, depth of knowledge, overall content quality
- Return `ai_score` (0–100) — this is the single composite AI score used in `0.7 × AI_score`
- Provide reasoning for relevance and depth
- Identify strengths and weaknesses
- Infer confidence from text patterns (hesitation, directness, clarity)
- Evaluate the RAW transcript — filler words and hesitations are intentional and meaningful signals

**Known failure modes:**
- `ai_score` can be inflated (65–80 for weak answers) because model is trained to be encouraging
- Confidence inference from text alone is unreliable — the model often says "high confidence" regardless
- "Weaknesses" field frequently says "Could be more specific" for every answer, which is not useful feedback

**Optimization ideas:**
- Add scoring anchor examples: "A score of 40-60 means the answer is partially relevant but thin. 70-85 = good answer with minor gaps. Above 85 = exceptional."
- Instruct: "Do NOT inflate scores. Be honest. A mediocre answer should score 40-60."
- Add: "For weaknesses, name a SPECIFIC missing concept, not a generic observation"
- Consider splitting `ai_score` into sub-scores (relevance_score, depth_score) and computing the composite in Python for better traceability

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
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
{
  "ai_score": <integer 0-100>,
  "relevance_reasoning": "<string>",
  "depth_reasoning": "<string>",
  "strengths": "<string>",
  "weaknesses": "<string>",
  "confidence_inference": "<string>"
}
```

---

## PROMPT 7: Spell Correction (Transcript Cleanup)

**Function:** `spell_correct_transcript()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** Post-interview, per answer, AFTER evaluation (never before)
**Output type:** Plain text (corrected transcript string)
**Criticality:** 🟡 MEDIUM — failure returns the raw transcript unchanged (safe fallback)

**What it must do:**
- Fix only clear STT/accent-induced errors (e.g. "I worked on react" → "I worked on ReactJS")
- PRESERVE all filler words: um, uh, like, you know, sort of, kind of, basically, right, so
- NOT paraphrase, rewrite, or restructure sentences
- NOT change the meaning of anything said
- Return ONLY corrected text — no labels, no explanation

**Known failure modes:**
- Can silently remove filler words despite the rule (especially "like" and "so" which read as non-filler in some contexts)
- Can over-correct and paraphrase short or fragmented answers
- Struggles with Indian technical acronyms (e.g. "DBMS" transcribed as "dee bee em es")

**Optimization ideas:**
- Add explicit filler word list to the "PRESERVE" rule with examples of what NOT to change
- Add: "If you are unsure whether something is an STT error or intentional phrasing, leave it unchanged"
- Consider adding a test case pair in the prompt to anchor the model's behavior

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
You are correcting STT (speech-to-text) transcription errors caused by accents or audio noise.

STRICT RULES:
1. PRESERVE all filler words: um, uh, like, you know, sort of, kind of, basically, right, so
2. Do NOT paraphrase or rewrite any sentence
3. Do NOT change the structure or meaning
4. ONLY fix clear STT/accent errors (e.g., "I worked on react" when clearly meant "ReactJS")
5. Return ONLY the corrected text — no explanation, no labels

Transcript to correct:
{raw_transcript}
```

---

## PROMPT 8: Expected Answer Generation

**Function:** `generate_expected_answer()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** Post-interview, once per question during evaluation pipeline
**Output type:** Plain text (ideal answer string)
**Criticality:** 🟢 LOW — shown in the Detailed Report for reference; failure returns a graceful fallback message

**What it must do:**
- Generate the ideal answer for a specific question, tailored to THIS candidate's resume AND the JD
- NOT a generic textbook answer — it should be what THIS candidate could realistically say, drawing on their actual experience
- Tone: professional, confident, specific

**Known failure modes:**
- Frequently produces textbook answers that ignore the candidate's specific resume
- Can become overly long (5+ paragraphs) which is unhelpful in the report UI
- Sometimes references experience the candidate doesn't actually have

**Optimization ideas:**
- Add a length constraint: "Limit to 150–200 words. Write it as if the candidate is speaking, not writing an essay."
- Add explicit: "Reference specific items from the candidate's resume (project names, company names, tech stack) — do not invent experience they don't have"
- Consider structuring output as: "Key point 1... Key point 2... Closing."

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
Generate the ideal interview answer for the question below.

Context:
- This is a mock interview for the role described in the Job Description
- The answer should reflect what THIS specific candidate (based on their resume) could realistically say
- It should align with what the company expects based on the JD
- Tone: professional, confident, specific

Job Description:
{jd_text}

Candidate's Resume:
{structured_resume_json}

Question:
{question}

Write the ideal answer this candidate should have given. Be specific and practical.
Return ONLY the answer text. No labels, no markdown.
```

---

## PROMPT 9: Per-Question Feedback

**Function:** `generate_question_feedback()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** Post-interview, once per Q&A pair (after evaluation)
**Output type:** JSON object `{ comment, suggestion }`
**Criticality:** 🟡 MEDIUM — shown in Detailed Report per question; failure returns a generic fallback

**What it must do:**
- Write a brief honest comment on the answer quality (2–3 sentences)
- Write a specific, actionable improvement suggestion (2–3 sentences)
- Use the already-computed `ai_score` as context for tone calibration

**Known failure modes:**
- Comments are often vague ("Good answer, but could be more detailed")
- Suggestions rarely name specific technologies or concepts to study
- High-scoring answers (85+) often get hollow praise with no useful suggestion

**Optimization ideas:**
- Add: "If the score is above 80, still find one concrete thing to improve — no answer is perfect"
- Add: "The suggestion must name a specific concept, framework, or skill to work on — not generic advice"
- Add tone instruction: "You are a strict but fair mentor, not a cheerleader"

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
You reviewed this interview Q&A and scored the answer {ai_score}/100.

Question: {question}
Answer: {corrected_answer}

Now provide:
1. A brief, honest comment on the quality of this answer (2-3 sentences)
2. A specific, actionable improvement suggestion for this answer (2-3 sentences)

Return ONLY valid JSON:
{
  "comment": "<string>",
  "suggestion": "<string>"
}
```

---

## PROMPT 10: Interview Summary & AI Suggestions

**Function:** `generate_interview_summary()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** Once at the end of the entire evaluation pipeline
**Output type:** JSON object with `summary_text`, `ai_suggestions_behavioral`, `ai_suggestions_technical`
**Criticality:** 🔴 HIGH — this powers Section D (AI Recommendations) on the Dashboard and the report summary

**What it must do:**
- Write a 4–5 line overall summary: professional, constructive, honest. Highlight key strengths AND areas for improvement.
- Generate up to 4 behavioral suggestions (communication, confidence, structure, delivery)
- Generate up to 4 technical suggestions (specific topics/technologies to study, grounded in the JD)
- Note: only the first 500 chars of the JD are passed to this prompt to save tokens

**Known failure modes:**
- Summary is often too generic ("The candidate demonstrated knowledge but needs to improve...") — doesn't feel personalized
- Technical suggestions often say "Study X" without context of why X is relevant to this JD
- Behavioral suggestions repeat the same 3–4 generic points regardless of the actual transcript

**Optimization ideas:**
- Pass the actual Q&A pairs (not just score) so the model has content to reference
- Add: "Reference at least one specific answer or topic from the interview in your summary — not just overall impressions"
- Add for technical suggestions: "Tie each suggestion to a specific gap observed in the interview answers, not just the JD requirements"
- Consider increasing JD context from 500 to 800–1000 chars for better technical suggestion grounding

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
You have just completed evaluating a mock interview. Here is the overall performance:

Overall Score: {overall_score}
Fluency: {fluency_score}
Confidence: {confidence_score}
Content Quality: {content_quality_score}

Question-Answer Summary:
{qa_summary}  ← format: "Q: <question>\nScore: <score>/100" per entry

Job Description Context:
{jd_text_first_500_chars}...

Generate:
1. A 4-5 line overall summary of the candidate's performance.
   Tone: professional, constructive, honest. Highlight key strengths and areas for improvement.

2. Up to 4 behavioral improvement suggestions (communication, confidence, structure, delivery).

3. Up to 4 technical improvement suggestions (specific topics, technologies, or concepts to study based on the JD).

Return ONLY valid JSON:
{
  "summary_text": "<4-5 line summary>",
  "ai_suggestions_behavioral": ["<suggestion 1>", "<suggestion 2>", ...],
  "ai_suggestions_technical": ["<suggestion 1>", "<suggestion 2>", ...]
}
```

---

## PROMPT 11: Live Follow-up Question

**Function:** `generate_followup_question()` in `gemini_service.py`
**Model:** `gemini-2.5-flash-lite`
**Called:** Live during the interview, in Module 2/3 only, max 2 times per topic
**Output type:** Plain text (single follow-up question string)
**Criticality:** 🔴 HIGH — this is the adaptive intelligence of the interview; bad follow-ups break the conversation flow

**What it must do:**
- Generate ONE natural follow-up question based on the candidate's actual answer
- Options: dig deeper into something mentioned, challenge a claim, or explore a gap
- Must feel like what a real interviewer would naturally ask next
- Note: only the first 300 chars of the JD are passed to keep latency low

**Known failure modes:**
- Can generate follow-ups that are too broad ("Can you tell me more about that?") — these add no value
- When the candidate gives a short or weak answer, follow-up sometimes repeats the original question in different words
- Fallback (`"Can you elaborate on that?"`) is returned on any exception, which is noticeable to the user

**Optimization ideas:**
- Add: "Your follow-up must introduce a NEW angle — never re-ask what was just asked"
- Add persona: "You are a sharp, curious interviewer with 10 years of hiring experience for this role"
- Add specificity requirement: "Reference something concrete from the candidate's answer"
- Consider logging follow-up quality for admin review post-interview

---

### v1 — 2026-03-01 (Initial)
**Change:** Original prompt from initial scaffold.

**Template:**
```
During an interview for the role described in this Job Description:
{jd_text_first_300_chars}

The interviewer asked: {question}
The candidate answered: {answer}

Generate ONE natural follow-up question to either:
- Dig deeper into something the candidate mentioned
- Challenge a claim they made
- Explore a gap in their answer

The follow-up should feel like what a real interviewer would naturally ask next.
Return ONLY the question text. Nothing else.
```

---

## Optimization Log

Track cross-prompt improvements and experiments here.

| Date | Prompt(s) Affected | Change Summary | Result |
|---|---|---|---|
| — | — | — | — |

---

## Notes on Prompt Engineering for This Project

1. **JSON-only outputs are critical** — the code calls `_parse_json_response()` which breaks on markdown or prose. Always instruct "Return ONLY valid JSON."
2. **`gemini-2.5-flash-lite` is the default model** — it's cost-optimized. If a prompt consistently produces poor quality, consider switching that specific function to a higher-tier model.
3. **System instructions vs user prompt** — currently all context is in the user prompt. Moving persona/role instructions to a system instruction (via `GenerationConfig`) could improve consistency.
4. **Token cost awareness** — prompts 6, 8, and 9 are called once per Q&A pair (potentially 15+ times per session). Keep them tight.
5. **Evaluation order is sacred** — Prompt 6 (evaluation) ALWAYS runs on the RAW transcript before Prompt 7 (spell correction). Never reverse this (see plan.md §11).
