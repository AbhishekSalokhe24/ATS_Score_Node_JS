const express = require("express");
const router = express.Router();

const {
  analyze,
  saveAnalysis,
  getHistory,
  getAnalysisById,
} = require("../controllers/analysisController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// All routes are protected (require JWT)
router.post("/analyze", protect, upload.single("resume"), analyze);
router.post("/save", protect, saveAnalysis);
router.get("/history", protect, getHistory);
router.get("/:id", protect, getAnalysisById);

module.exports = router;
