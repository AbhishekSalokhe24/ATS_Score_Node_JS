const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    yearsOfExperience: {
      type: Number,
      default: null,
    },
    jobLink: {
      type: String,
      trim: true,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    referralPerson: {
      type: String,
      trim: true,
      default: "",
    },
    referralAvailable: {
      type: String,
      enum: ["", "Yes", "No"],
      default: "",
    },
    interviewStatus: {
      type: String,
      enum: [
        "",
        "Applied",
        "Screening",
        "Interview Scheduled",
        "Technical Round",
        "HR Round",
        "Interviewed",
        "Offered",
        "Accepted",
        "Rejected",
        "Withdrawn",
      ],

      default: "",
    },
    appliedOn: {
      type: Date,
      default: null,
    },
    upcomingInterviewDetails: {
      type: String,
      trim: true,
      default: "",
    },
    resumeUsed: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Job", jobSchema);
