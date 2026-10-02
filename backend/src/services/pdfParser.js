async function extractTextFromFile(file) {
  const extension = file.originalname
    .toLowerCase()
    .slice(file.originalname.lastIndexOf("."));

  /* TXT FILE */

  if (
    extension === ".txt" ||
    file.mimetype === "text/plain"
  ) {
    return file.buffer
      .toString("utf8")
      .replace(/\u0000/g, "")
      .trim();
  }

  /* PDF FILE */

  if (
    extension === ".pdf" ||
    file.mimetype === "application/pdf"
  ) {
    try {
      /*
       * Load pdf-parse only when a PDF
       * is actually uploaded.
       */
      const {
        PDFParse,
      } = require("pdf-parse");

      const parser = new PDFParse({
        data: file.buffer,
      });

      try {
        const result =
          await parser.getText();

        return (result.text || "")
          .replace(/\u0000/g, "")
          .trim();
      } finally {
        await parser.destroy();
      }
    } catch (error) {
      throw new Error(
        "PDF extraction failed. Reinstall backend dependencies with npm install and try again."
      );
    }
  }

  throw new Error(
    "Unsupported file type. Please upload a PDF or TXT file."
  );
}

module.exports = {
  extractTextFromFile,
};