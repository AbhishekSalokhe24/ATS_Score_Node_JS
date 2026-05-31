# 📄 ATS Score Check API

A powerful **Applicant Tracking System (ATS) Score Analyzer** built with Node.js, Express, and MongoDB. This API lets users upload their resumes (PDF, DOC, DOCX), and get an intelligent ATS compatibility score powered by **Google Gemini AI** — with a robust **local scoring engine** as a fallback when the AI service is unavailable.

I built this project to solve a real problem — job seekers often don't know how well their resume will perform against ATS filters used by recruiters. This API gives them an instant, actionable score with detailed breakdowns and improvement suggestions.

---

## ✨ Features

- **🤖 Dual Scoring Engine** — Primary analysis via Google Gemini AI (`gemini-2.0-flash`) with automatic fallback to a comprehensive local keyword-based scoring engine
- **📤 Resume Upload & Parsing** — Supports PDF, DOC, and DOCX formats with text extraction using `pdf-parse` and `mammoth`
- **📊 Detailed Score Breakdown** — Scores across 4 dimensions:
  - Resume Completeness (40% weight)
  - Keyword Optimization (30% weight)
  - ATS Formatting (20% weight)
  - Readability & Grammar (10% weight)
- **🎯 Job Description Matching** — Optionally compare your resume against a specific job description to identify skill gaps
- **💡 Smart Suggestions** — Receive actionable tips to improve your resume's ATS performance
- **🔐 JWT Authentication** — Secure user registration, login (via email or username), and profile management
- **📁 Job Application Tracker** — Full CRUD for tracking job applications with fields for company, role, referral info, interview status, and more
- **📜 Analysis History** — Save and retrieve past analysis results for comparison over time
- **⚡ Retry Logic with Exponential Backoff** — Gemini API calls retry up to 3 times with 5s/10s/15s delays, then fallback to `gemini-1.5-flash`
- **🔒 Postman Collection Included** — Ready-to-use API collection for testing all endpoints

---

## 🏗️ Architecture

```
ATS_Score_Node_JS/
├── server.js                 # Express app entry point
├── config/
│   └── db.js                 # MongoDB connection with Mongoose
├── controllers/
│   ├── analysisController.js # Resume analysis, save, history, detail
│   ├── authController.js     # Signup, login, profile
│   └── jobController.js      # Job application CRUD
├── middleware/
│   ├── auth.js               # JWT verification middleware
│   └── upload.js             # Multer config (memory storage, 10MB limit)
├── models/
│   ├── Analysis.js           # Analysis result schema
│   ├── Job.js                # Job application schema
│   └── User.js               # User schema with bcrypt hashing
├── routes/
│   ├── analysisRoutes.js     # /api/analysis/*
│   ├── authRoutes.js         # /api/auth/*
│   └── jobRoutes.js          # /api/jobs/*
├── services/
│   ├── geminiService.js      # Google Gemini AI integration
│   └── localScoringService.js# Keyword-based local ATS scorer (500 lines)
├── utils/
│   ├── generateToken.js      # JWT token generation
│   └── resumeParser.js       # PDF/DOC/DOCX text extraction
└── ATS_Score_Api_collection.postman_collection.json
```

---

## 🛠️ Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| **Runtime**    | Node.js                                              |
| **Framework**  | Express.js 5                                         |
| **Database**   | MongoDB with Mongoose ODM                            |
| **AI Engine**  | Google Gemini AI (`@google/generative-ai`)            |
| **Auth**       | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)            |
| **File Upload**| Multer (in-memory storage)                           |
| **Parsing**    | `pdf-parse` (PDF), `mammoth` (DOC/DOCX)              |
| **Dev Tools**  | Nodemon, Postman                                     |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or Atlas cloud instance)
- **Google Gemini API Key** — Get one at [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/ATS_Score_Node_JS.git
   cd ATS_Score_Node_JS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ats-score-db
   JWT_SECRET=your_jwt_secret_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the production server**
   ```bash
   npm start
   ```

The server will start at `http://localhost:5000` with a health check at the root endpoint.

---

## 📡 API Endpoints

### 🔓 Authentication (`/api/auth`)

| Method | Endpoint           | Access  | Description                       |
| ------ | ------------------ | ------- | --------------------------------- |
| POST   | `/api/auth/signup`  | Public  | Register a new user               |
| POST   | `/api/auth/login`   | Public  | Login with email/username + password |
| GET    | `/api/auth/profile` | Private | Get logged-in user's profile      |

**Signup Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Login Body:**
```json
{
  "login": "johndoe",
  "password": "secure123"
}
```

> Note: The `login` field accepts either an email or a username.

---

### 📊 Analysis (`/api/analysis`)

| Method | Endpoint                | Access  | Description                          |
| ------ | ----------------------- | ------- | ------------------------------------ |
| POST   | `/api/analysis/analyze` | Private | Upload resume & get ATS score        |
| POST   | `/api/analysis/save`    | Private | Save an analysis result to DB        |
| GET    | `/api/analysis/history` | Private | Get all saved analyses (list view)   |
| GET    | `/api/analysis/:id`     | Private | Get full details of a saved analysis |

**Analyze — `multipart/form-data`:**
- `resume` (file) — PDF, DOC, or DOCX file (max 10MB)
- `jobDescription` (text, optional) — Paste the job description for targeted matching

**Example Response:**
```json
{
  "success": true,
  "analyzedBy": "gemini",
  "data": {
    "score": 72,
    "fileName": "resume.pdf",
    "breakdown": [
      { "label": "Resume Completeness", "value": 85 },
      { "label": "Keyword Optimization", "value": 60 },
      { "label": "ATS Formatting", "value": 75 },
      { "label": "Readability & Grammar", "value": 80 }
    ],
    "missingSkills": ["Docker", "Kubernetes"],
    "presentSkills": ["JavaScript", "React", "Node.js", "MongoDB"],
    "suggestions": [
      {
        "title": "Add DevOps Skills",
        "description": "Consider adding Docker and CI/CD experience if applicable."
      }
    ],
    "extractedData": {
      "name": "John Doe",
      "email": "john@example.com",
      "skills": { ... },
      "experience": [ ... ],
      "education": [ ... ],
      "projects": [ ... ]
    }
  }
}
```

---

### 💼 Job Application Tracker (`/api/jobs`)

| Method | Endpoint         | Access  | Description                  |
| ------ | ---------------- | ------- | ---------------------------- |
| POST   | `/api/jobs`      | Private | Create a new job application |
| GET    | `/api/jobs`      | Private | Get all your job applications|
| GET    | `/api/jobs/:id`  | Private | Get a single job by ID       |
| PUT    | `/api/jobs/:id`  | Private | Update a job application     |
| DELETE | `/api/jobs/:id`  | Private | Delete a job application     |

**Create Job Body:**
```json
{
  "companyName": "Google",
  "jobTitle": "SDE 2",
  "location": "Bangalore",
  "yearsOfExperience": 2,
  "jobLink": "https://careers.google.com/...",
  "skills": ["React", "Node.js", "System Design"],
  "referralAvailable": "Yes",
  "referralPerson": "Jane Doe",
  "interviewStatus": "Applied",
  "appliedOn": "2025-05-01",
  "resumeUsed": "resume_v3.pdf"
}
```

**Interview Status Options:** `Applied`, `Screening`, `Interview Scheduled`, `Technical Round`, `HR Round`, `Interviewed`, `Offered`, `Accepted`, `Rejected`, `Withdrawn`

---

## 🔐 Authentication

All private endpoints require a **Bearer Token** in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are returned upon successful signup or login.

---

## 🧠 How the Scoring Works

### Gemini AI Scoring (Primary)

When the Gemini API is available, the resume text and optional job description are sent to the AI model with a detailed scoring prompt. The AI evaluates:
- Contact information completeness
- Skills section comprehensiveness
- Experience and project details
- Keyword density and action verb usage
- ATS-friendly formatting
- Grammar and readability

### Local Scoring Engine (Fallback)

If the Gemini API fails (rate limits, quota exhaustion), the system automatically falls back to a comprehensive **500-line local scoring engine** that:
- Extracts contact info (email, phone, links) using regex
- Matches skills against dictionaries of 100+ programming languages, frameworks, tools, databases, and cloud/DevOps technologies
- Detects section headings and parses experience, education, and project entries
- Counts action verbs for professional language quality
- Performs JD matching when a job description is provided

---

## 📬 Postman Collection

Import the included `ATS_Score_Api_collection.postman_collection.json` file into Postman to test all endpoints with pre-configured requests.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

