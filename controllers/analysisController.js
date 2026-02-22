const Analysis = require("../models/Analysis");
const { extractText } = require("../utils/resumeParser");
const { analyzeResume } = require("../services/geminiService");
const { localAnalyze } = require("../services/localScoringService");

// ──────────────────────────────────────────────────────────────────────
// @desc    Upload resume & analyze (does NOT save to DB)
// @route   POST /api/analysis/analyze
// @access  Private
// ──────────────────────────────────────────────────────────────────────
const analyze = async (req, res) => {
  try {
    // Validate resume file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required. Upload a PDF, DOC, or DOCX file.",
      });
    }

    const { jobDescription } = req.body;

    // 1. Extract text from the uploaded file
    const resumeText = await extractText(req.file.buffer, req.file.mimetype);

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from the resume. Please upload a valid file.",
      });
    }

    // 2. Try Gemini AI first, fallback to local scoring
    let result;
    let analyzedBy = "gemini";

    try {
      result = await analyzeResume(resumeText, jobDescription || null);
    } catch (geminiError) {
      console.warn("⚠️ Gemini API failed, using local scoring:", geminiError.message);
      result = localAnalyze(resumeText, jobDescription || null);
      analyzedBy = "local";
    }

    // 3. Return result WITHOUT saving (user saves separately)
    res.status(200).json({
      success: true,
      analyzedBy,
      data: {
        score: result.score,
        fileName: req.file.originalname,
        breakdown: result.breakdown,
        missingSkills: result.missingSkills || [],
        presentSkills: result.presentSkills || [],
        suggestions: result.suggestions || [],
        extractedData: result.extractedData || {},
        jobDescription: jobDescription || null,
      },
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────
// @desc    Save an analysis result to the database
// @route   POST /api/analysis/save
// @access  Private
// ──────────────────────────────────────────────────────────────────────
const saveAnalysis = async (req, res) => {
  try {
    const {
      fileName,
      score,
      breakdown,
      missingSkills,
      presentSkills,
      suggestions,
      extractedData,
      jobDescription,
    } = req.body;

    // Validate required fields
    if (!fileName || score === undefined || !breakdown) {
      return res.status(400).json({
        success: false,
        message: "fileName, score, and breakdown are required to save an analysis.",
      });
    }

    const analysis = await Analysis.create({
      user: req.user._id,
      fileName,
      score,
      breakdown,
      missingSkills: missingSkills || [],
      presentSkills: presentSkills || [],
      suggestions: suggestions || [],
      extractedData: extractedData || {},
      jobDescription: jobDescription || null,
    });

    res.status(201).json({
      success: true,
      message: "Analysis saved successfully",
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────
// @desc    Get all saved analyses (Resume Name, Uploaded On, ATS Score, ID)
// @route   GET /api/analysis/history
// @access  Private
// ──────────────────────────────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user._id })
      .select("_id fileName score createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: analyses.length,
      data: analyses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────
// @desc    Get single analysis by ID
// @route   GET /api/analysis/:id
// @access  Private
// ──────────────────────────────────────────────────────────────────────
const getAnalysisById = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) {
      return res
        .status(404)
        .json({ success: false, message: "Analysis not found" });
    }

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { analyze, saveAnalysis, getHistory, getAnalysisById };
