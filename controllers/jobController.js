const Job = require("../models/Job");

// ──────────────────────────────────────────────────────────────────────
// @desc    Create a new job application
// @route   POST /api/jobs
// @access  Private
// ──────────────────────────────────────────────────────────────────────
const createJob = async (req, res) => {
  try {
    const {
      companyName,
      jobTitle,
      location,
      yearsOfExperience,
      jobLink,
      skills,
      referralPerson,
      referralAvailable,
      interviewStatus,
      appliedOn,
      upcomingInterviewDetails,
      resumeUsed,
    } = req.body;

    // Validate required fields
    if (!companyName || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: "Company name and job title are required.",
      });
    }

    const job = await Job.create({
      user: req.user._id,
      companyName,
      jobTitle,
      location: location || "",
      yearsOfExperience: yearsOfExperience || null,
      jobLink: jobLink || "",
      skills: skills || [],
      referralPerson: referralPerson || "",
      referralAvailable: referralAvailable || "",
      interviewStatus: interviewStatus || "",
      appliedOn: appliedOn || null,
      upcomingInterviewDetails: upcomingInterviewDetails || "",
      resumeUsed: resumeUsed || "",
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Create Job Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────
// @desc    Get all jobs for the logged-in user
// @route   GET /api/jobs
// @access  Private
// ──────────────────────────────────────────────────────────────────────
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error("Get All Jobs Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────
// @desc    Get a single job by ID
// @route   GET /api/jobs/:id
// @access  Private
// ──────────────────────────────────────────────────────────────────────
const getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found" });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Get Job By ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────
// @desc    Update a job by ID
// @route   PUT /api/jobs/:id
// @access  Private
// ──────────────────────────────────────────────────────────────────────
const updateJob = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found" });
    }

    // Only update fields that are provided in the request body
    const updatableFields = [
      "companyName",
      "jobTitle",
      "location",
      "yearsOfExperience",
      "jobLink",
      "skills",
      "referralPerson",
      "referralAvailable",
      "interviewStatus",
      "appliedOn",
      "upcomingInterviewDetails",
      "resumeUsed",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    const updatedJob = await job.save();

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob,
    });
  } catch (error) {
    console.error("Update Job Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────
// @desc    Delete a job by ID
// @route   DELETE /api/jobs/:id
// @access  Private
// ──────────────────────────────────────────────────────────────────────
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found" });
    }

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete Job Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createJob, getAllJobs, getJobById, updateJob, deleteJob };
