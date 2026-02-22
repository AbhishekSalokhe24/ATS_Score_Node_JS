const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Build the system prompt for ATS analysis
 */
const buildPrompt = (resumeText, jdText) => {
  let prompt = `You are an expert Resume Analysis & ATS Evaluation AI.

TASK: Analyze the following resume text and return a structured JSON response.

RESUME TEXT:
"""
${resumeText}
"""
`;

  if (jdText) {
    prompt += `
JOB DESCRIPTION:
"""
${jdText}
"""

Since a Job Description is provided, also perform JD matching:
- Extract JD keywords (skills, role requirements, experience level)
- Compare with resume: skill overlap %, missing critical skills, experience relevance
- Adjust the ATS score accordingly
`;
  } else {
    prompt += `
No Job Description was provided. Calculate a generic ATS compatibility score based on industry standards.
`;
  }

  prompt += `
SCORING RULES (calculate each subscore out of 100):

1. Resume Completeness (40% weight):
   - Contact details present (name, email, phone, links)
   - Skills section exists and is comprehensive
   - Experience/projects listed with details
   - Education present

2. Keyword Optimization (30% weight):
   - Industry-relevant keywords present
   - Technical skill density
   - Action verbs usage (built, developed, implemented, led, etc.)

3. ATS Formatting (20% weight):
   - Simple structure (no complex tables/images dependency)
   - Proper headings and sections
   - Clean text extraction quality

4. Readability & Grammar (10% weight):
   - Sentence clarity
   - Professional tone
   - No excessive grammar errors

FINAL SCORE = weighted average of the 4 subscores, rounded to an integer.

RESPONSE FORMAT — Return ONLY valid JSON, no markdown, no code fences, no extra text:
{
  "score": <number 0-100>,
  "breakdown": [
    { "label": "Resume Completeness", "value": <number 0-100> },
    { "label": "Keyword Optimization", "value": <number 0-100> },
    { "label": "ATS Formatting", "value": <number 0-100> },
    { "label": "Readability & Grammar", "value": <number 0-100> }
  ],
  "missingSkills": [<string>, ...],
  "presentSkills": [<string>, ...],
  "suggestions": [
    {
      "title": "<short title>",
      "description": "<actionable improvement tip>"
    }
  ],
  "extractedData": {
    "name": "<string or null>",
    "email": "<string or null>",
    "phone": "<string or null>",
    "links": [<string>, ...],
    "summary": "<string or null>",
    "skills": {
      "programmingLanguages": [<string>, ...],
      "frameworks": [<string>, ...],
      "tools": [<string>, ...],
      "databases": [<string>, ...],
      "cloudDevOps": [<string>, ...]
    },
    "experience": [
      {
        "company": "<string>",
        "role": "<string>",
        "duration": "<string>",
        "responsibilities": [<string>, ...],
        "technologies": [<string>, ...]
      }
    ],
    "education": [
      {
        "degree": "<string>",
        "institution": "<string>",
        "year": "<string>"
      }
    ],
    "projects": [
      {
        "name": "<string>",
        "description": "<string>",
        "techStack": [<string>, ...],
        "outcomes": "<string or null>"
      }
    ]
  }
}

RULES:
- Prioritize factual extraction. Do NOT assume or hallucinate data.
- If a field is not found in the resume, use null or an empty array.
- Return suggestions ONLY if they genuinely improve ATS performance.
- If no improvements are needed, return an empty suggestions array.
- Return ONLY the JSON object, nothing else.
`;

  return prompt;
};

/**
 * Analyze a resume using Google Gemini AI
 * Retries up to 3 times with exponential backoff, falls back to gemini-1.5-flash
 * @param {string} resumeText - Extracted resume text
 * @param {string|null} jdText - Optional job description text
 * @returns {Promise<Object>} Structured analysis result
 */
const analyzeResume = async (resumeText, jdText = null) => {
  const prompt = buildPrompt(resumeText, jdText);

  // Models to try in order (primary → fallback)
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  const maxRetries = 3;

  for (const modelName of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Trying ${modelName} (attempt ${attempt}/${maxRetries})...`);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Strip markdown code fences if Gemini wraps the response
        text = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

        // Parse and return JSON
        const analysis = JSON.parse(text);
        console.log(`✅ Analysis complete using ${modelName}`);
        return analysis;
      } catch (error) {
        const isRateLimit = error.message && error.message.includes("429");
        const isLastAttempt = attempt === maxRetries;

        if (isRateLimit && !isLastAttempt) {
          const waitMs = attempt * 5000; // 5s, 10s, 15s
          console.log(`⏳ Rate limited. Waiting ${waitMs / 1000}s before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        } else if (isRateLimit && isLastAttempt) {
          console.log(`⚠️ ${modelName} exhausted. Trying fallback model...`);
          break; // Try next model
        } else {
          throw error; // Non-rate-limit error, throw immediately
        }
      }
    }
  }

  throw new Error(
    "Gemini API quota exceeded on all models. Please wait a minute and try again, or check your API key billing at https://ai.google.dev/gemini-api/docs/rate-limits"
  );
};

module.exports = { analyzeResume };
