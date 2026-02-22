const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract plain text from a resume file buffer
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} mimetype - MIME type of the uploaded file
 * @returns {Promise<string>} Extracted text
 */
const extractText = async (buffer, mimetype) => {
  // ── PDF ──────────────────────────────────────────────────────────────
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }

  // ── DOC / DOCX ──────────────────────────────────────────────────────
  if (
    mimetype === "application/msword" ||
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type. Only PDF, DOC, and DOCX are allowed.");
};

module.exports = { extractText };
