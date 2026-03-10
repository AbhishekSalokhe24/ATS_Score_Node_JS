const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// ── Load environment variables ────────────────────────────────────────
dotenv.config();

// ── Connect to MongoDB ────────────────────────────────────────────────
connectDB();

// ── Initialize Express app ────────────────────────────────────────────
const app = express();

// ── Middleware ─────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/analysis", require("./routes/analysisRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));

// ── Health-check route ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 ATS Score Check API is running",
  });
});

// ── Start server ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
