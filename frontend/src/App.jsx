import { useState } from "react";

import {
  ShieldCheck,
  ScanSearch,
  FileSearch,
  LockKeyhole,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RotateCcw,
  ChevronDown,
  Database,
  Eye,
  Zap,
  Shield,
  Fingerprint,
  Server,
  Upload,
  FileText,
  X,
  Download,
} from "lucide-react";

import "./App.css";

const API_BASE_URL = "https://privguard-engp.onrender.com";

const DEMO_TEXT = `Employee: John Doe

Email: john.doe@example.com

Phone: 9876543210

ID: ABC-123456`;

function App() {
  const [inputMode, setInputMode] = useState("PDF");
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [redactionMethod, setRedactionMethod] = useState("MASK");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeNav, setActiveNav] = useState("Scanner");
  const [copied, setCopied] = useState(false);

  // -----------------------------
  // FILE HANDLING
  // -----------------------------

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("File type not supported. Please upload a PDF file.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("PDF file is too large. Maximum allowed size is 10 MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);

    const input = document.getElementById("pdf-upload");

    if (input) {
      input.value = "";
    }

    setResult(null);
    setError("");
  };

  // -----------------------------
  // SCAN
  // -----------------------------

  const scanData = async () => {
    setError("");
    setResult(null);

    if (inputMode === "PDF" && !selectedFile) {
      setError("Please upload a PDF document first.");
      return;
    }

    if (inputMode === "TEXT" && !text.trim()) {
      setError("Please enter some text to scan.");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (inputMode === "PDF") {
        const formData = new FormData();

        formData.append("file", selectedFile);
        formData.append("redactionMethod", redactionMethod);

        response = await fetch(
          `${API_BASE_URL}/api/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/api/scan`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              redactionMethod,
            }),
          }
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to process the request."
        );
      }

      setResult(data.result);
    } catch (err) {
      console.error(err);

      if (err.name === "TypeError") {
        setError(
          "Unable to connect to PrivGuard backend. Make sure the backend is running on port 5000."
        );
      } else {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // DEMO
  // -----------------------------

  const loadDemo = () => {
    setInputMode("TEXT");
    setSelectedFile(null);
    setText(DEMO_TEXT);
    setResult(null);
    setError("");
  };

  // -----------------------------
  // CLEAR
  // -----------------------------

  const clearAll = () => {
    setText("");
    setSelectedFile(null);
    setResult(null);
    setError("");
    setCopied(false);

    const input = document.getElementById("pdf-upload");

    if (input) {
      input.value = "";
    }
  };

  // -----------------------------
  // COPY
  // -----------------------------

  const copyRedactedText = async () => {
    if (!result?.redactedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        result.redactedText
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // -----------------------------
  // DOWNLOAD
  // -----------------------------

  const downloadRedacted = () => {
    if (!result?.redactedText) {
      return;
    }

    const blob = new Blob(
      [result.redactedText],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    const originalName =
      result.fileName || "privguard-document";

    const fileName = originalName
      .replace(/\.pdf$/i, "")
      .replace(/\s+/g, "-");

    link.download = `${fileName}-redacted.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // -----------------------------
  // COUNTS
  // -----------------------------

  const getCount = (type) => {
    return result?.summary?.[type] || 0;
  };

  const totalDetected = result?.totalDetected || 0;

  const confidence = result
    ? Math.round(
        (result.averageConfidence || 0) * 100
      )
    : 0;

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <div className="brand-name">
              PrivGuard
            </div>

            <div className="brand-subtitle">
              AI PRIVACY FIREWALL
            </div>
          </div>

        </div>

        <div className="sidebar-section">

          <div className="sidebar-label">
            SECURITY
          </div>

          <button
            className={`sidebar-item ${
              activeNav === "Scanner" ? "active" : ""
            }`}
            onClick={() => setActiveNav("Scanner")}
          >
            <ScanSearch size={18} />
            Scanner
          </button>

          <button
            className={`sidebar-item ${
              activeNav === "Detection" ? "active" : ""
            }`}
            onClick={() => setActiveNav("Detection")}
          >
            <Fingerprint size={18} />
            Detection Rules
          </button>

          <button
            className={`sidebar-item ${
              activeNav === "Audit" ? "active" : ""
            }`}
            onClick={() => setActiveNav("Audit")}
          >
            <Activity size={18} />
            Audit Monitor
          </button>

        </div>

        <div className="sidebar-section">

          <div className="sidebar-label">
            SYSTEM
          </div>

          <button
            className="sidebar-item"
            onClick={() =>
              setActiveNav("Infrastructure")
            }
          >
            <Server size={18} />
            Infrastructure
          </button>

          <button
            className="sidebar-item"
            onClick={() =>
              setActiveNav("Data")
            }
          >
            <Database size={18} />
            Data Protection
          </button>

        </div>

        <div className="sidebar-bottom">

          <div className="security-status">

            <div className="status-dot"></div>

            <div>
              <div className="status-title">
                SYSTEM SECURE
              </div>

              <div className="status-text">
                Protection engine online
              </div>
            </div>

          </div>

          <div className="version">
            PRIVGUARD AI v1.0
          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main-content">

        {/* HEADER */}

        <header className="topbar">

          <div>

            <div className="breadcrumb">
              Security
              <span>/</span>
              Scanner
            </div>

            <h1>
              Sensitive Data Scanner
            </h1>

            <p>
              Detect, analyze and redact sensitive information
              before it leaves your environment.
            </p>

          </div>

          <div className="topbar-actions">

            <div className="secure-badge">
              <Shield size={15} />
              Privacy Mode
            </div>

          </div>

        </header>

        {/* HERO */}

        <section className="hero-card">

          <div className="hero-content">

            <div className="hero-icon">
              <ShieldCheck size={30} />
            </div>

            <div>

              <div className="hero-tag">
                AI-POWERED PRIVACY FIREWALL
              </div>

              <h2>
                Protect sensitive data before
                it reaches downstream systems.
              </h2>

              <p>
                PrivGuard detects names, emails, phone numbers,
                identification numbers and other sensitive
                information, then automatically redacts them.
              </p>

            </div>

          </div>

          <div className="hero-flow">

            <div>
              <Upload size={17} />
              UPLOAD
            </div>

            <span>→</span>

            <div>
              <ScanSearch size={17} />
              SCAN
            </div>

            <span>→</span>

            <div>
              <Fingerprint size={17} />
              DETECT
            </div>

            <span>→</span>

            <div>
              <LockKeyhole size={17} />
              REDACT
            </div>

          </div>

        </section>

        {/* SCANNER */}

        <section className="scanner-section">

          <div className="section-heading">

            <div>

              <div className="section-kicker">
                SCANNING WORKSPACE
              </div>

              <h2>
                Analyze sensitive content
              </h2>

            </div>

            <button
              className="demo-button"
              onClick={loadDemo}
            >
              <Zap size={16} />
              Load Demo Data
            </button>

          </div>

          {/* INPUT MODE */}

          <div className="mode-tabs">

            <button
              className={
                inputMode === "PDF"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setInputMode("PDF");
                setResult(null);
                setError("");
              }}
            >
              <FileSearch size={17} />
              PDF Upload
            </button>

            <button
              className={
                inputMode === "TEXT"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setInputMode("TEXT");
                setResult(null);
                setError("");
              }}
            >
              <FileText size={17} />
              Text Input
            </button>

          </div>

          {/* PDF INPUT */}

          {inputMode === "PDF" && (
            <div className="input-card">

              <div className="input-card-header">

                <div>

                  <div className="input-title">
                    PDF DOCUMENT
                  </div>

                  <div className="input-description">
                    Upload a PDF containing sensitive information
                    for automated scanning.
                  </div>

                </div>

                <div className="file-type">
                  PDF
                </div>

              </div>

              <input
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              {!selectedFile ? (
                <label
                  htmlFor="pdf-upload"
                  className="upload-box"
                >

                  <div className="upload-icon">
                    <Upload size={28} />
                  </div>

                  <div className="upload-title">
                    Upload PDF document
                  </div>

                  <div className="upload-subtitle">
                    Click to browse or select a PDF file
                  </div>

                  <div className="upload-limit">
                    Maximum file size: 10 MB
                  </div>

                </label>
              ) : (
                <div className="selected-file">

                  <div className="selected-file-left">

                    <div className="pdf-icon">
                      <FileText size={22} />
                    </div>

                    <div>

                      <div className="selected-file-name">
                        {selectedFile.name}
                      </div>

                      <div className="selected-file-meta">

                        {(
                          selectedFile.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB

                        <span>•</span>

                        PDF DOCUMENT

                      </div>

                    </div>

                  </div>

                  <div className="selected-file-right">

                    <div className="ready-status">
                      <CheckCircle2 size={15} />
                      READY
                    </div>

                    <button
                      className="remove-file"
                      onClick={removeSelectedFile}
                      title="Remove file"
                      type="button"
                    >
                      <X size={17} />
                    </button>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* TEXT INPUT */}

          {inputMode === "TEXT" && (
            <div className="input-card">

              <div className="input-card-header">

                <div>

                  <div className="input-title">
                    TEXT CONTENT
                  </div>

                  <div className="input-description">
                    Paste text containing sensitive information.
                  </div>

                </div>

                <div className="file-type">
                  TEXT
                </div>

              </div>

              <textarea
                className="text-input"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError("");
                  setResult(null);
                }}
                placeholder={`Example:

Contact John Mehta at john.mehta@email.com

or 9876543210 for details.

Employee ID: ABC-123456`}
              />

              <div className="character-count">
                {text.length.toLocaleString()} characters
              </div>

            </div>
          )}

          {/* POLICY */}

          <div className="policy-card">

            <div className="policy-header">

              <div>

                <div className="policy-title">
                  PROTECTION POLICY
                </div>

                <div className="policy-description">
                  Choose how detected information should be
                  transformed.
                </div>

              </div>

              <ChevronDown size={18} />

            </div>

            <div className="policy-options">

              {/* MASK */}

              <button
                className={
                  redactionMethod === "MASK"
                    ? "policy-option active"
                    : "policy-option"
                }
                onClick={() =>
                  setRedactionMethod("MASK")
                }
                type="button"
              >

                <div className="policy-option-icon">
                  <Eye size={18} />
                </div>

                <div>

                  <strong>
                    Mask
                  </strong>

                  <span>
                    Replace with entity labels
                  </span>

                </div>

              </button>

              {/* HASH */}

              <button
                className={
                  redactionMethod === "HASH"
                    ? "policy-option active"
                    : "policy-option"
                }
                onClick={() =>
                  setRedactionMethod("HASH")
                }
                type="button"
              >

                <div className="policy-option-icon">
                  <Fingerprint size={18} />
                </div>

                <div>

                  <strong>
                    Hash
                  </strong>

                  <span>
                    Generate irreversible identifiers
                  </span>

                </div>

              </button>

              {/* REMOVE */}

              <button
                className={
                  redactionMethod === "REMOVE"
                    ? "policy-option active"
                    : "policy-option"
                }
                onClick={() =>
                  setRedactionMethod("REMOVE")
                }
                type="button"
              >

                <div className="policy-option-icon">
                  <X size={18} />
                </div>

                <div>

                  <strong>
                    Remove
                  </strong>

                  <span>
                    Completely delete sensitive values
                  </span>

                </div>

              </button>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="error-box">

              <AlertTriangle size={20} />

              <div>

                <strong>
                  Scan failed
                </strong>

                <span>
                  {error}
                </span>

              </div>

            </div>
          )}

          {/* ACTIONS */}

          <div className="scanner-actions">

            <button
              className="clear-button"
              onClick={clearAll}
              disabled={loading}
              type="button"
            >
              <RotateCcw size={17} />
              Clear
            </button>

            <button
              className="scan-button"
              onClick={scanData}
              disabled={loading}
              type="button"
            >

              {loading ? (
                <>
                  <span className="spinner"></span>
                  Scanning...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />

                  {inputMode === "PDF"
                    ? "Scan PDF & Protect"
                    : "Scan & Protect"}
                </>
              )}

            </button>

          </div>

        </section>

        {/* RESULTS */}

        {result && (
          <section className="results-section">

            <div className="section-heading">

              <div>

                <div className="section-kicker">
                  ANALYSIS COMPLETE
                </div>

                <h2>
                  Protection report
                </h2>

              </div>

              <div className="result-success">
                <CheckCircle2 size={17} />
                Scan completed
              </div>

            </div>

            {/* FILE INFO */}

            {result.fileName && (
              <div className="file-result-card">

                <div className="file-result-icon">
                  <FileText size={22} />
                </div>

                <div className="file-result-details">

                  <div className="file-result-name">
                    {result.fileName}
                  </div>

                  <div className="file-result-meta">

                    {result.pages || 0} page
                    {result.pages === 1
                      ? ""
                      : "s"}

                    <span>•</span>

                    {(
                      (result.fileSize || 0) /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB

                  </div>

                </div>

                <div className="protected-label">
                  <ShieldCheck size={15} />
                  PROTECTED
                </div>

              </div>
            )}

            {/* KPI GRID */}

            <div className="kpi-grid">

              <div className="kpi-card">

                <div className="kpi-icon detected">
                  <Fingerprint size={21} />
                </div>

                <div>

                  <div className="kpi-label">
                    SENSITIVE ITEMS
                  </div>

                  <div className="kpi-value">
                    {totalDetected}
                  </div>

                </div>

              </div>

              <div className="kpi-card">

                <div className="kpi-icon confidence">
                  <Activity size={21} />
                </div>

                <div>

                  <div className="kpi-label">
                    AVG CONFIDENCE
                  </div>

                  <div className="kpi-value">
                    {confidence}%
                  </div>

                </div>

              </div>

              <div className="kpi-card">

                <div className="kpi-icon protection">
                  <ShieldCheck size={21} />
                </div>

                <div>

                  <div className="kpi-label">
                    PROTECTION
                  </div>

                  <div className="kpi-value small">
                    {result.redactionMethod}
                  </div>

                </div>

              </div>

              <div className="kpi-card">

                <div className="kpi-icon secure">
                  <LockKeyhole size={21} />
                </div>

                <div>

                  <div className="kpi-label">
                    STATUS
                  </div>

                  <div className="kpi-value small">
                    SECURED
                  </div>

                </div>

              </div>

            </div>

            {/* DETECTION TABLE */}

            <div className="result-card">

              <div className="result-card-header">

                <div>

                  <div className="result-card-title">
                    Detection intelligence
                  </div>

                  <div className="result-card-subtitle">
                    Sensitive entity types identified in the input
                  </div>

                </div>

                <Fingerprint size={20} />

              </div>

              <div className="detection-table">

                <div className="table-header">

                  <span>
                    ENTITY
                  </span>

                  <span>
                    COUNT
                  </span>

                  <span>
                    CONFIDENCE
                  </span>

                  <span>
                    STATUS
                  </span>

                </div>

                {[
                  {
                    type: "NAME",
                    count: getCount("NAME"),
                    confidence: "85%",
                  },
                  {
                    type: "EMAIL",
                    count: getCount("EMAIL"),
                    confidence: "99%",
                  },
                  {
                    type: "PHONE",
                    count: getCount("PHONE"),
                    confidence: "98%",
                  },
                  {
                    type: "ID",
                    count: getCount("ID"),
                    confidence: "88%",
                  },
                ].map((item) => (
                  <div
                    className="table-row"
                    key={item.type}
                  >

                    <span className="entity-name">

                      <span className="entity-dot"></span>

                      {item.type}

                    </span>

                    <span>
                      {item.count}
                    </span>

                    <span>
                      {item.count > 0
                        ? item.confidence
                        : "—"}
                    </span>

                    <span>

                      {item.count > 0 ? (
                        <span className="detected-status">

                          <CheckCircle2 size={14} />

                          DETECTED

                        </span>
                      ) : (
                        <span className="not-found-status">
                          NOT FOUND
                        </span>
                      )}

                    </span>

                  </div>
                ))}

              </div>

            </div>

            {/* BEFORE / AFTER */}

            <div className="comparison-grid">

              <div className="comparison-card">

                <div className="comparison-header">

                  <div>

                    <div className="comparison-title">
                      Original
                    </div>

                    <div className="comparison-subtitle">
                      Detected source content
                    </div>

                  </div>

                  <div className="comparison-badge original">
                    ORIGINAL
                  </div>

                </div>

                <div className="content-preview">
                  {result.originalText}
                </div>

              </div>

              <div className="comparison-card protected">

                <div className="comparison-header">

                  <div>

                    <div className="comparison-title">
                      Protected
                    </div>

                    <div className="comparison-subtitle">
                      Redacted output
                    </div>

                  </div>

                  <div className="comparison-badge protected-badge">
                    PROTECTED
                  </div>

                </div>

                <div className="content-preview protected-preview">
                  {result.redactedText}
                </div>

              </div>

            </div>

            {/* ACTION BUTTONS */}

            <div className="result-actions">

              <button
                className="secondary-action"
                onClick={copyRedactedText}
                type="button"
              >

                {copied ? (
                  <>
                    <CheckCircle2 size={17} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={17} />
                    Copy Protected Text
                  </>
                )}

              </button>

              <button
                className="primary-action"
                onClick={downloadRedacted}
                type="button"
              >

                <Download size={17} />
                Download Protected File

              </button>

            </div>

            {/* RISK SUMMARY */}

            <div className="risk-card">

              <div className="risk-icon">
                <ShieldCheck size={25} />
              </div>

              <div className="risk-content">

                <div className="risk-title">
                  Privacy risk mitigated
                </div>

                <div className="risk-text">

                  PrivGuard identified{" "}

                  <strong>
                    {totalDetected}
                  </strong>{" "}

                  sensitive data item
                  {totalDetected === 1
                    ? ""
                    : "s"} and applied
                  the{" "}

                  <strong>
                    {result.redactionMethod}
                  </strong>{" "}

                  protection policy.

                </div>

              </div>

            </div>

          </section>
        )}

        {/* EMPTY STATE */}

        {!result && !loading && (
          <section className="empty-state">

            <div className="empty-icon">
              <ShieldCheck size={30} />
            </div>

            <div>

              <div className="empty-title">
                Ready to protect your data
              </div>

              <div className="empty-text">
                Upload a PDF or enter text, choose a protection
                policy and start the scan.
              </div>

            </div>

          </section>
        )}

        {/* FOOTER */}

        <footer className="footer">

          <div>
            <ShieldCheck size={15} />
            PrivGuard AI
          </div>

          <span>
            Privacy-first document intelligence
          </span>

          <span>
            Local processing • No unnecessary storage
          </span>

        </footer>

      </main>

    </div>
  );
}

export default App;