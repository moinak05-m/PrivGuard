const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");

const { extractTextFromFile } = require("./services/pdfParser");
const { detectPII } = require("./services/piiDetector");
const { redactText } = require("./services/redactionEngine");

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5000;

const MAX_TEXT_LENGTH = 100000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

app.use(cors());

app.use(
  express.json({
    limit: "2mb",
  })
);

/* ---------------- FILE UPLOAD CONFIG ---------------- */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "text/plain",
    ];

    const allowedExtensions = [
      ".pdf",
      ".txt",
    ];

    const extension = file.originalname
      .toLowerCase()
      .slice(file.originalname.lastIndexOf("."));

    if (
      allowedMimeTypes.includes(file.mimetype) ||
      allowedExtensions.includes(extension)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file type. Please upload a PDF or TXT file."
        )
      );
    }
  },
});

/* ---------------- HELPERS ---------------- */

function getRedactionMethod(value) {
  const allowedMethods = [
    "MASK",
    "HASH",
    "REMOVE",
  ];

  return allowedMethods.includes(value)
    ? value
    : "MASK";
}

function buildResult(
  text,
  redactionMethod,
  source = "text",
  fileName = null
) {
  const entities = detectPII(text);

  const redactedText = redactText(
    text,
    entities,
    redactionMethod
  );

  const summary = {};

  for (const entity of entities) {
    summary[entity.type] =
      (summary[entity.type] || 0) + 1;
  }

  const averageConfidence = entities.length
    ? entities.reduce(
        (sum, entity) =>
          sum + entity.confidence,
        0
      ) / entities.length
    : 0;

  return {
    originalText: text,

    redactedText,

    entities,

    summary,

    totalDetected: entities.length,

    averageConfidence: Number(
      averageConfidence.toFixed(2)
    ),

    redactionMethod,

    source,

    fileName,
  };
}

/* ---------------- BASIC ROUTES ---------------- */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PrivGuard AI backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
  });
});

/* ---------------- TEXT SCANNING ---------------- */

app.post("/api/scan", (req, res) => {
  try {
    const {
      text,
      redactionMethod = "MASK",
    } = req.body || {};

    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide text to scan.",
      });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Text is too large. Maximum allowed size is ${MAX_TEXT_LENGTH.toLocaleString()} characters.`,
      });
    }

    const method =
      getRedactionMethod(redactionMethod);

    const result = buildResult(
      text,
      method,
      "text"
    );

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(
      "Text scan error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to process the text.",
    });
  }
});

/* ---------------- FILE SCANNING ---------------- */

app.post(
  "/api/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload a PDF or TXT file.",
        });
      }

      const redactionMethod =
        getRedactionMethod(
          req.body?.redactionMethod ||
            "MASK"
        );

      const text =
        await extractTextFromFile(
          req.file
        );

      if (!text.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "No readable text was found in this file. Scanned/image-only PDFs are not supported yet.",
        });
      }

      if (text.length > MAX_TEXT_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Extracted text is too large. Maximum allowed size is ${MAX_TEXT_LENGTH.toLocaleString()} characters.`,
        });
      }

      const result = buildResult(
        text,
        redactionMethod,
        "file",
        req.file.originalname
      );

      return res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error(
        "File upload error:",
        error
      );

      const status =
        error.code === "LIMIT_FILE_SIZE"
          ? 400
          : 500;

      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "File is too large. Maximum allowed size is 5 MB."
          : error.message ||
            "Unable to process the uploaded file.";

      return res.status(status).json({
        success: false,
        message,
      });
    }
  }
);

/* ---------------- MULTER ERROR HANDLER ---------------- */

app.use(
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "File is too large. Maximum allowed size is 5 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Request failed.",
      });
    }

    return next();
  }
);

/* ---------------- START SERVER ---------------- */

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `PrivGuard AI backend running on http://0.0.0.0:${PORT}`
  );
});