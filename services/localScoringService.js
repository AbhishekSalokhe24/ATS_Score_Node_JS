/**
 * Local ATS Scoring Engine
 * Used as a fallback when Gemini API is unavailable
 * Performs keyword-based analysis entirely on the server
 */

// ── Common keyword dictionaries ───────────────────────────────────────
const PROGRAMMING_LANGUAGES = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust",
  "ruby", "php", "swift", "kotlin", "dart", "scala", "r", "matlab",
  "html", "css", "sql", "bash", "shell", "perl",
];

const FRAMEWORKS = [
  "react", "react.js", "reactjs", "react native", "angular", "vue", "vue.js",
  "next.js", "nextjs", "nuxt", "express", "express.js", "node.js", "nodejs",
  "django", "flask", "spring", "spring boot", "laravel", "rails",
  "flutter", "svelte", "gatsby", "remix", "fastapi", "nest.js", "nestjs",
  "tailwind", "tailwindcss", "bootstrap", "material ui", "redux",
  "redux toolkit", "redux saga", "mobx", "zustand",
];

const TOOLS = [
  "git", "github", "gitlab", "bitbucket", "jira", "confluence",
  "figma", "postman", "vs code", "vscode", "intellij", "webpack",
  "vite", "babel", "eslint", "prettier", "npm", "yarn", "pnpm",
  "jest", "mocha", "cypress", "selenium", "playwright",
  "storybook", "swagger", "insomnia",
];

const DATABASES = [
  "mongodb", "mongoose", "mysql", "postgresql", "postgres", "redis",
  "sqlite", "oracle", "firebase", "firestore", "dynamodb",
  "cassandra", "elasticsearch", "supabase", "prisma", "sequelize",
];

const CLOUD_DEVOPS = [
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
  "jenkins", "ci/cd", "github actions", "vercel", "netlify", "heroku",
  "terraform", "ansible", "nginx", "linux", "ubuntu",
  "s3", "ec2", "lambda", "cloudfront", "route53",
];

const ACTION_VERBS = [
  "developed", "built", "designed", "implemented", "created", "led",
  "managed", "optimized", "improved", "delivered", "architected",
  "deployed", "integrated", "automated", "launched", "reduced",
  "increased", "maintained", "collaborated", "contributed",
  "refactored", "migrated", "scaled", "engineered", "established",
  "streamlined", "enhanced", "resolved", "analyzed", "mentored",
];

// ── Section heading patterns ──────────────────────────────────────────
const SECTION_HEADINGS = [
  "experience", "work experience", "work history", "employment",
  "professional experience", "employment history",
  "education", "academic", "academics", "qualification", "qualifications",
  "projects", "personal projects", "key projects", "academic projects",
  "skills", "technical skills", "core competencies",
  "summary", "professional summary", "objective", "profile", "about me",
  "certifications", "certificates", "awards", "achievements",
  "contact", "personal information", "personal details",
  "internship", "internships", "training",
];

// ── Helper: find matches from a keyword list in text ──────────────────
const findMatches = (text, keywords) => {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
};

// ── Helper: extract email ─────────────────────────────────────────────
const extractEmail = (text) => {
  const match = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : null;
};

// ── Helper: extract phone ─────────────────────────────────────────────
const extractPhone = (text) => {
  const match = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  return match ? match[0].trim() : null;
};

// ── Helper: extract links ─────────────────────────────────────────────
const extractLinks = (text) => {
  const matches = text.match(/https?:\/\/[^\s,)]+/gi) || [];
  return [...new Set(matches)];
};

// ── Helper: check if section exists ───────────────────────────────────
const hasSection = (text, keywords) => {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
};

// ── Helper: extract name (first non-empty line, likely the name) ──────
const extractName = (text) => {
  const lines = text.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  // First meaningful line is usually the name
  const firstLine = lines[0];
  // Validate: should be 2-5 words, no special chars like @ or http
  if (
    firstLine.length < 50 &&
    !firstLine.includes("@") &&
    !firstLine.includes("http") &&
    !firstLine.includes(":") &&
    firstLine.split(/\s+/).length <= 5
  ) {
    return firstLine;
  }
  return null;
};

// ── Helper: split text into sections by headings ──────────────────────
const splitIntoSections = (text) => {
  const lines = text.split(/\n/);
  const sections = {};
  let currentSection = "header";
  let currentContent = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase().replace(/[:\-_|]/g, "").trim();

    // Check if this line is a section heading
    const isHeading = SECTION_HEADINGS.some(
      (h) => lower === h || lower.startsWith(h + " ") || lower.endsWith(" " + h)
    );

    if (isHeading && trimmed.length < 60) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join("\n").trim();
      }
      // Normalize section name
      if (lower.includes("experience") || lower.includes("employment") || lower.includes("work history")) {
        currentSection = "experience";
      } else if (lower.includes("education") || lower.includes("academic") || lower.includes("qualification")) {
        currentSection = "education";
      } else if (lower.includes("project")) {
        currentSection = "projects";
      } else if (lower.includes("skill") || lower.includes("competenc")) {
        currentSection = "skills";
      } else if (lower.includes("summary") || lower.includes("objective") || lower.includes("profile") || lower.includes("about")) {
        currentSection = "summary";
      } else if (lower.includes("internship") || lower.includes("training")) {
        currentSection = "experience";
      } else {
        currentSection = lower;
      }
      currentContent = [];
    } else if (trimmed.length > 0) {
      currentContent.push(trimmed);
    }
  }

  // Don't forget last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join("\n").trim();
  }

  return sections;
};

// ── Helper: parse experience section ──────────────────────────────────
const parseExperience = (sectionText) => {
  if (!sectionText) return [];

  const entries = [];
  const lines = sectionText.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  let current = null;

  for (const line of lines) {
    // Detect date patterns like "Jan 2023 - Present", "2022 - 2023", "06/2021 – 08/2022"
    const hasDate = /(\b\d{4}\b.*[-–—].*(\b\d{4}\b|present|current|ongoing))|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4})/i.test(line);
    // Detect company/role patterns (lines with " - ", " | ", " at ", " @ ")
    const looksLikeRoleOrCompany = /\s[-–|@]\s/.test(line) || hasDate;

    if (looksLikeRoleOrCompany && line.length < 150) {
      // Save previous entry
      if (current) entries.push(current);

      // Try to split "Role - Company" or "Company | Role"
      const parts = line.split(/\s[-–|@]\s/);
      const dateMatch = line.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s,]*\d{4}\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s,]*\d{4}|present|current|ongoing)|\d{4}\s*[-–—]\s*(?:\d{4}|present|current|ongoing))/i);

      current = {
        company: parts.length > 1 ? parts[1].replace(dateMatch ? dateMatch[0] : "", "").trim() : "",
        role: parts[0].replace(dateMatch ? dateMatch[0] : "", "").trim(),
        duration: dateMatch ? dateMatch[0].trim() : "",
        responsibilities: [],
        technologies: [],
      };
    } else if (current) {
      // This is a bullet point / responsibility
      const cleaned = line.replace(/^[•●■◦▸▹\->\*]\s*/, "").trim();
      if (cleaned.length > 5) {
        current.responsibilities.push(cleaned);
        // Extract tech from responsibility
        const allTechKeywords = [...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...DATABASES, ...CLOUD_DEVOPS, ...TOOLS];
        const techs = findMatches(cleaned, allTechKeywords);
        current.technologies.push(...techs);
      }
    }
  }

  if (current) entries.push(current);

  // Deduplicate technologies in each entry
  entries.forEach((entry) => {
    entry.technologies = [...new Set(entry.technologies)];
  });

  return entries;
};

// ── Helper: parse education section ───────────────────────────────────
const parseEducation = (sectionText) => {
  if (!sectionText) return [];

  const entries = [];
  const lines = sectionText.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  let current = null;

  for (const line of lines) {
    // Detect degree keywords
    const hasDegree = /\b(b\.?tech|m\.?tech|b\.?sc|m\.?sc|b\.?e|m\.?e|b\.?a|m\.?a|b\.?com|m\.?com|bachelor|master|mba|phd|diploma|bca|mca|b\.?c\.?a|m\.?c\.?a|12th|10th|hsc|ssc|intermediate|degree|engineering)\b/i.test(line);
    const hasYear = /\b(19|20)\d{2}\b/.test(line);
    const hasInstitution = /\b(university|college|institute|school|academy|iit|nit|iiit)\b/i.test(line);

    if (hasDegree || hasInstitution) {
      if (current) entries.push(current);

      const yearMatch = line.match(/\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2}|present|current|ongoing)|\b((?:19|20)\d{2})\b/i);

      current = {
        degree: line.replace(yearMatch ? yearMatch[0] : "", "").trim(),
        institution: "",
        year: yearMatch ? yearMatch[0].trim() : "",
      };
    } else if (current && (hasInstitution || (line.length > 5 && line.length < 100 && !current.institution))) {
      current.institution = line.replace(/\b(19|20)\d{2}\b.*/, "").trim();
      if (hasYear && !current.year) {
        const yearMatch = line.match(/\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2}|present|current|ongoing)|\b((?:19|20)\d{2})\b/i);
        if (yearMatch) current.year = yearMatch[0].trim();
      }
    }
  }

  if (current) entries.push(current);
  return entries;
};

// ── Helper: parse projects section ────────────────────────────────────
const parseProjects = (sectionText) => {
  if (!sectionText) return [];

  const entries = [];
  const lines = sectionText.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  let current = null;

  for (const line of lines) {
    const isBullet = /^[•●■◦▸▹\->\*]/.test(line);
    const cleaned = line.replace(/^[•●■◦▸▹\->\*]\s*/, "").trim();

    // Detect tech stack line
    const techStackLine = /\b(tech\s*stack|technologies|built\s*with|tools?\s*used|stack)\s*[:|-]/i.test(line);

    if (!isBullet && line.length < 80 && !techStackLine && line.length > 2) {
      // Likely a project name
      if (current) entries.push(current);

      const allTechKeywords = [...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...DATABASES, ...CLOUD_DEVOPS, ...TOOLS];

      current = {
        name: cleaned.replace(/[:|]/g, "").trim(),
        description: "",
        techStack: [],
        outcomes: null,
      };
    } else if (current) {
      if (techStackLine) {
        // Extract tech stack
        const allTechKeywords = [...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...DATABASES, ...CLOUD_DEVOPS, ...TOOLS];
        current.techStack = findMatches(line, allTechKeywords);
      } else if (cleaned.length > 10) {
        // Add to description
        if (current.description) {
          current.description += " " + cleaned;
        } else {
          current.description = cleaned;
        }
        // Also detect tech in description
        if (current.techStack.length === 0) {
          const allTechKeywords = [...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...DATABASES, ...CLOUD_DEVOPS, ...TOOLS];
          const found = findMatches(cleaned, allTechKeywords);
          current.techStack.push(...found);
        }
      }
    }
  }

  if (current) entries.push(current);

  // Deduplicate tech stacks
  entries.forEach((entry) => {
    entry.techStack = [...new Set(entry.techStack)];
  });

  return entries;
};

/**
 * Perform local ATS analysis on resume text
 * @param {string} resumeText - Extracted resume text
 * @param {string|null} jdText - Optional job description text
 * @returns {Object} ATS analysis result
 */
const localAnalyze = (resumeText, jdText = null) => {
  const text = resumeText;
  const lower = text.toLowerCase();

  // ── 1. Extract Data ─────────────────────────────────────────────────
  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const links = extractLinks(text);

  const programmingLanguages = findMatches(text, PROGRAMMING_LANGUAGES);
  const frameworks = findMatches(text, FRAMEWORKS);
  const tools = findMatches(text, TOOLS);
  const databases = findMatches(text, DATABASES);
  const cloudDevOps = findMatches(text, CLOUD_DEVOPS);
  const actionVerbs = findMatches(text, ACTION_VERBS);

  const allSkills = [
    ...programmingLanguages,
    ...frameworks,
    ...tools,
    ...databases,
    ...cloudDevOps,
  ];

  // ── Split into sections and parse ───────────────────────────────────
  const sections = splitIntoSections(text);
  const experience = parseExperience(sections.experience);
  const education = parseEducation(sections.education);
  const projects = parseProjects(sections.projects);
  const summary = sections.summary || null;

  // ── 2. Resume Completeness (40%) ────────────────────────────────────
  let completeness = 0;
  if (email) completeness += 15;
  if (phone) completeness += 10;
  if (links.length > 0) completeness += 5;
  if (allSkills.length >= 3) completeness += 20;
  else if (allSkills.length >= 1) completeness += 10;
  if (experience.length > 0 || hasSection(lower, ["experience", "work history", "employment"])) completeness += 20;
  if (education.length > 0 || hasSection(lower, ["education", "degree", "university", "college"])) completeness += 15;
  if (projects.length > 0 || hasSection(lower, ["project", "projects"])) completeness += 15;
  completeness = Math.min(completeness, 100);

  // ── 3. Keyword Optimization (30%) ───────────────────────────────────
  let keywordScore = 0;
  if (allSkills.length >= 15) keywordScore += 40;
  else if (allSkills.length >= 10) keywordScore += 30;
  else if (allSkills.length >= 5) keywordScore += 20;
  else if (allSkills.length >= 1) keywordScore += 10;

  if (actionVerbs.length >= 10) keywordScore += 30;
  else if (actionVerbs.length >= 5) keywordScore += 20;
  else if (actionVerbs.length >= 2) keywordScore += 10;

  const industryKeywords = ["agile", "scrum", "rest", "api", "microservices", "responsive", "full stack", "frontend", "backend"];
  const industryMatches = findMatches(text, industryKeywords);
  if (industryMatches.length >= 4) keywordScore += 30;
  else if (industryMatches.length >= 2) keywordScore += 20;
  else if (industryMatches.length >= 1) keywordScore += 10;

  keywordScore = Math.min(keywordScore, 100);

  // ── 4. ATS Formatting (20%) ─────────────────────────────────────────
  let formatScore = 50;
  const headings = ["experience", "education", "skills", "projects", "summary", "objective", "certifications"];
  const headingMatches = headings.filter((h) => lower.includes(h));
  if (headingMatches.length >= 4) formatScore += 30;
  else if (headingMatches.length >= 2) formatScore += 20;
  else if (headingMatches.length >= 1) formatScore += 10;

  if (text.length > 200) formatScore += 20;
  formatScore = Math.min(formatScore, 100);

  // ── 5. Readability & Grammar (10%) ──────────────────────────────────
  let readabilityScore = 60;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length >= 10) readabilityScore += 20;
  if (actionVerbs.length >= 5) readabilityScore += 10;
  if (text.length > 500 && text.length < 5000) readabilityScore += 10;
  readabilityScore = Math.min(readabilityScore, 100);

  // ── 6. Final weighted score ─────────────────────────────────────────
  const finalScore = Math.round(
    completeness * 0.4 +
    keywordScore * 0.3 +
    formatScore * 0.2 +
    readabilityScore * 0.1
  );

  // ── 7. JD Matching (if provided) ───────────────────────────────────
  let missingSkills = [];
  let presentSkills = allSkills;

  if (jdText) {
    const allKeywordLists = [
      ...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...TOOLS, ...DATABASES, ...CLOUD_DEVOPS,
    ];
    const jdSkills = findMatches(jdText, allKeywordLists);
    presentSkills = jdSkills.filter((s) => lower.includes(s.toLowerCase()));
    missingSkills = jdSkills.filter((s) => !lower.includes(s.toLowerCase()));
  }

  // ── 8. Suggestions ─────────────────────────────────────────────────
  const suggestions = [];

  if (!email && !phone) {
    suggestions.push({
      title: "Add Contact Information",
      description: "Include your email address and phone number so recruiters can reach you.",
    });
  }

  if (allSkills.length < 5) {
    suggestions.push({
      title: "Expand Skills Section",
      description: "Add more specific technical skills, frameworks, and tools you've worked with.",
    });
  }

  if (actionVerbs.length < 5) {
    suggestions.push({
      title: "Use More Action Verbs",
      description: "Start bullet points with strong action verbs like 'Developed', 'Implemented', 'Optimized' to strengthen impact.",
    });
  }

  if (!summary) {
    suggestions.push({
      title: "Add a Professional Summary",
      description: "Include a 2-3 sentence summary highlighting your key expertise and career goals.",
    });
  }

  if (missingSkills.length > 0) {
    suggestions.push({
      title: "Add Missing JD Skills",
      description: `Consider adding these skills if you have experience: ${missingSkills.slice(0, 5).join(", ")}.`,
    });
  }

  // ── 9. Build Response ──────────────────────────────────────────────
  return {
    score: finalScore,
    breakdown: [
      { label: "Resume Completeness", value: completeness },
      { label: "Keyword Optimization", value: keywordScore },
      { label: "ATS Formatting", value: formatScore },
      { label: "Readability & Grammar", value: readabilityScore },
    ],
    missingSkills,
    presentSkills: [...new Set(presentSkills)],
    suggestions,
    extractedData: {
      name,
      email,
      phone,
      links,
      summary,
      skills: {
        programmingLanguages,
        frameworks,
        tools,
        databases,
        cloudDevOps,
      },
      experience,
      education,
      projects,
    },
    _analyzedBy: "local",
  };
};

module.exports = { localAnalyze };

