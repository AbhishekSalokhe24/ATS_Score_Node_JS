const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    breakdown: [
      {
        label: { type: String, required: true },
        value: { type: Number, required: true },
      },
    ],
    missingSkills: [String],
    presentSkills: [String],
    suggestions: [
      {
        title: { type: String },
        description: { type: String },
      },
    ],
    extractedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    jobDescription: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Analysis", analysisSchema);
