import { useMemo, useState } from "react";
import BackToHome from "../components/BackToHome";
import api from "../services/api";
import staySafeIcon from "../assets/staysafe.png";

/**
 * StaySafe - Message/Link Scanner
 * - Scans messages for malicious URLs.
 * - Report button:
 *   - Hover: shows info (popover)
 *   - Click: opens modal
 *   - After report: modal shows success message
 *
 * IMPORTANT:
 * - UI text is English
 * - Results section is ALWAYS LTR and expected English from backend
 * - Debug panel removed
 */

function extractFirstUrl(text) {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match?.[0] || null;
}

export default function StaySafe() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isReported, setIsReported] = useState(false);

  // Keep these so eslint won't complain + UI stays nice
  const [showReportInfo, setShowReportInfo] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalStep, setReportModalStep] = useState("confirm"); // "confirm" | "success"

  // Input can still feel natural (RTL if user types Hebrew)
  const inputDir = useMemo(
    () => (/[\u0590-\u05FF]/.test(message) ? "rtl" : "ltr"),
    [message]
  );

  async function handleAnalyze() {
    setError("");
    setResult(null);
    setIsReported(false);
    setReportModalStep("confirm");
    setIsReportModalOpen(false);

    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please paste a message or a link first! 📝");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/link-scanner/analyze", {
        message: trimmed,
      });
      if (!response.data?.success) throw new Error("Backend error");
      setResult(response.data.data);
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Something went wrong. Please try again! 🔄");
    } finally {
      setLoading(false);
    }
  }

  function openReportModal() {
    if (!result) return;
    setError("");
    setReportModalStep(isReported ? "success" : "confirm");
    setIsReportModalOpen(true);
  }

  function closeReportModal() {
    setIsReportModalOpen(false);
  }

  async function handleReport() {
    setError("");
    if (!result || isReported) return;

    const urlFromResult =
      result?.input?.url || result?.result?.url || extractFirstUrl(message);

    if (!urlFromResult) {
      setError(
        "I couldn't find a link to report. Paste a message with a URL first. 🔗"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/link-scanner/report", {
        url: urlFromResult,
        isMalicious: true,
        message: message.trim(),
        scanResult: result,
      });

      if (response?.data && response.data.success === false) {
        throw new Error("Report failed");
      }

      setIsReported(true);
      setReportModalStep("success");
      setIsReportModalOpen(true);
    } catch (err) {
      console.error("Report error:", err);
      setError("Couldn't report right now. Please try again. 🚨");
    } finally {
      setLoading(false);
    }
  }

  const verdict = result?.result?.verdict;
  const riskScore = result?.result?.riskScore;
  const reasons = result?.result?.reasons || [];
  const steps = result?.advice?.twoQuickSteps || [];
  const summary = result?.advice?.summary;

  const verdictLabel = verdict ? verdict.toUpperCase() : "UNKNOWN";

  // English strings
  const reportInfoTitle = "Report a suspicious link?";
  const reportInfoBody =
    "Your report helps the community and improves our AI over time 🧠🛡️";
  const reportSuccessMsg =
    "Thanks! Your report was received and the system learned from it. 🧠🛡️";
  const popoverHint = "Click Report to open a confirmation window.";
  const modalTitleConfirm = "Report a suspicious link 🚨";
  const modalTitleSuccess = "Report received ✅";
  const modalWhatReporting = "What are you reporting?";
  const modalCancel = "Cancel";
  const modalConfirm = "Confirm report";
  const modalSending = "Sending...";
  const modalClose = "Close";

  return (
    <div className="space-y-8">
      <BackToHome />

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-fit rounded-3xl bg-white/50 backdrop-blur-md p-4 shadow-lg border border-white/40">
          <img
            src={staySafeIcon}
            alt="StaySafe Scanner"
            className="w-52 md:w-64 h-auto object-contain rounded-2xl"
          />
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight pb-2 gradient-text">
          StaySafe Scanner
        </h1>

        <p className="text-lg text-slate-700 max-w-2xl mx-auto">
          Paste suspicious messages here. Our AI will scan for dangerous links
          and help keep you safe! (Results are always in English.)
        </p>
      </div>

      {/* Scanner Input */}
      <div className="bubble-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#a855f7" strokeWidth="2" />
            <path
              d="m21 21-4.35-4.35"
              stroke="#a855f7"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-bold text-slate-800">Message Scanner</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="stay-safe-message"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Paste the suspicious message here:
            </label>

            <textarea
              id="stay-safe-message"
              name="message"
              aria-label="Suspicious message input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              dir={inputDir}
              placeholder="Paste the message here... 📋"
              className="w-full px-4 py-3 rounded-xl bg-white/80 border border-slate-200 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all duration-200 resize-none"
            />
          </div>

          {error && (
            <div className="bubble-card p-4 border-l-4 border-red-400 bg-red-500/10">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#ef4444">
                  <path d="M8 1 L15 13 L1 13 Z" />
                  <circle cx="8" cy="11" r="1" fill="white" />
                  <rect x="7" y="6" width="2" height="3" fill="white" rx="1" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl btn-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? "Scanning..." : "Scan Message"}
            </button>
          </div>
        </div>
      </div>

      {/* Results — ALWAYS LTR */}
      {result && (
        <div className="space-y-6">
          <div
            className="bubble-card p-6 border-l-4 border-purple-400"
            dir="ltr"
          >
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="#a855f7" />
                  <circle cx="10" cy="7" r="1" fill="white" />
                  <circle cx="14" cy="7" r="1" fill="white" />
                  <path
                    d="M10 9 Q12 10 14 9"
                    stroke="white"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  <rect
                    x="8"
                    y="14"
                    width="8"
                    height="4"
                    rx="2"
                    fill="#a855f7"
                  />
                  <circle cx="10" cy="16" r="0.5" fill="white" />
                  <circle cx="14" cy="16" r="0.5" fill="white" />
                </svg>

                <h3 className="text-xl font-bold text-slate-800">
                  Scan Results
                </h3>
              </div>

              {/* Verdict + Report */}
              <div className="flex items-center gap-2 relative">
                <div className="px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-800">
                  {verdictLabel}
                  {typeof riskScore === "number"
                    ? ` • Risk ${riskScore.toFixed(3)} /1`
                    : ""}
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => setShowReportInfo(true)}
                  onMouseLeave={() => setShowReportInfo(false)}
                >
                  <button
                    type="button"
                    onClick={openReportModal}
                    disabled={loading}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition btn-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                      isReported
                        ? "border-green-200 bg-green-500/10 text-green-700"
                        : "border-rose-200 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15"
                    }`}
                  >
                    {isReported ? (
                      <>
                        <span>✅</span>
                        Reported
                      </>
                    ) : (
                      <>
                        <span>🚩</span>
                        Report
                      </>
                    )}
                  </button>

                  {showReportInfo && !isReported && (
                    <div className="absolute z-20 mt-2 w-72 bubble-card p-4 shadow-xl border border-white/40 bg-white/70 backdrop-blur-md left-0 text-left">
                      <div className="font-extrabold text-slate-800">
                        {reportInfoTitle}
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {reportInfoBody}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {popoverHint}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-purple-700 mb-2">
                    Summary
                  </h4>
                  <p className="text-slate-700">
                    {summary || "No summary available."}
                  </p>
                </div>

                {reasons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-700 mb-2">
                      Why this might be risky:
                    </h4>
                    <ul className="space-y-1 text-slate-700 pl-4">
                      {reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400 mt-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-purple-700 mb-2">
                    What to do next:
                  </h4>
                  <ol className="space-y-2 text-slate-700">
                    {steps.slice(0, 2).map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="ltr"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeReportModal}
          />

          <div className="relative w-full max-w-lg bubble-card p-6 border border-white/40 bg-white/80 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-extrabold text-slate-800">
                {reportModalStep === "success"
                  ? modalTitleSuccess
                  : modalTitleConfirm}
              </h3>

              <button
                onClick={closeReportModal}
                className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/60 transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {reportModalStep === "confirm" ? (
              <>
                <p className="mt-3 text-slate-700">{reportInfoBody}</p>

                <div className="mt-4 bubble-card p-4 bg-white/70">
                  <div className="text-sm font-semibold text-slate-700 mb-1">
                    {modalWhatReporting}
                  </div>
                  <div className="text-sm text-slate-800 break-words">
                    {result?.input?.url ||
                      result?.result?.url ||
                      extractFirstUrl(message) ||
                      "—"}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    onClick={closeReportModal}
                    className="px-5 py-2 rounded-xl font-semibold border border-slate-200 bg-white/60 text-slate-700 hover:bg-white transition btn-hover"
                    disabled={loading}
                  >
                    {modalCancel}
                  </button>

                  <button
                    onClick={handleReport}
                    disabled={loading || isReported}
                    className="px-6 py-2 rounded-xl font-extrabold text-white bg-linear-to-r from-rose-500 to-pink-600 shadow-lg btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? modalSending : modalConfirm}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 bubble-card p-4 border-l-4 border-red-400 bg-red-500/10">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="mt-4 text-slate-700">{reportSuccessMsg}</p>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={closeReportModal}
                    className="px-6 py-2 rounded-xl font-semibold bg-white/70 border border-slate-200 text-slate-700 hover:bg-white transition btn-hover"
                  >
                    {modalClose}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
