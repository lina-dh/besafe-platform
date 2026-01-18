import "dotenv/config";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import {
  getSystemPrompt,
  getUserPrompt,
} from "../utils/prompts/analyzerPrompts.js";
import { LINK_ANALYZER_MOCK } from "../utils/prompts/mockResponse.js";

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: only treat as "real mode" if key looks like a real OpenAI key
function hasValidOpenAiKey() {
  const key = (process.env.OPENAI_API_KEY || "").trim();
  return key.startsWith("sk-");
}

/**
 * פונקציית עזר: הרצת מודל XGBoost (Python)
 * מחזירה מספר בין 0 ל־1
 */
async function getRiskScoreFromModel(url) {
  return new Promise((resolve) => {
    const pythonScriptPath = path.join(
      __dirname,
      "..",
      "XGBOOST_model",
      "predict_server.py",
    );

    const pythonProcess = spawn("python", [pythonScriptPath, url]);

    let resultData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      resultData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (errorData) {
        console.log("[Python logs]:\n", errorData);
      }

      if (code !== 0) {
        console.error("Python script failed");
        return resolve(0);
      }

      const score = parseFloat(resultData.trim());
      resolve(Number.isNaN(score) ? 0 : score);
    });
  });
}

/**
 * Link analysis: XGBoost + LLM (with demo fallback if no API key)
 */
export const analyzeLink = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "No message provided",
      });
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlRegex);

    if (!urls) {
      return res.status(200).json({
        success: true,
        isMock: false,
        data: {
          advice: { summary: "Failed to find any URL in the message." },
          result: { verdict: "safe", reasons: [] },
        },
      });
    }

    const targetUrl = urls[0];

    // Step 1: XGBoost risk score
    const riskScore = await getRiskScoreFromModel(targetUrl);

    // Demo mode: no valid API key => return a mock analysis (still includes real riskScore)
    if (!hasValidOpenAiKey()) {
      const mock = LINK_ANALYZER_MOCK(targetUrl);

      return res.status(200).json({
        success: true,
        isMock: true,
        data: {
          input: { url: targetUrl },
          result: {
            riskScore,
            verdict: mock.verdict,
            reasons: mock.reasons,
          },
          advice: {
            summary: mock.summary,
            twoQuickSteps: mock.twoQuickSteps,
          },
        },
      });
    }

    // Step 2: OpenAI call
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: getUserPrompt(targetUrl, riskScore) },
      ],
    });

    let outputText = (response.output_text || "")
      // Remove Markdown JSON fences if present
      .replace(/```json\s*/i, "")
      .replace(/```/g, "")
      .trim();

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(outputText);
    } catch {
      console.error("AI returned invalid JSON");
      console.error("Raw output:", outputText);
      throw new Error("AI response parsing failed");
    }

    // Step 3: Return response to the client
    return res.status(200).json({
      success: true,
      isMock: false,
      data: {
        input: { url: targetUrl },
        result: {
          riskScore,
          verdict: aiAnalysis.verdict,
          reasons: aiAnalysis.reasons,
        },
        advice: {
          summary: aiAnalysis.summary,
          twoQuickSteps: aiAnalysis.twoQuickSteps,
        },
      },
    });
  } catch (error) {
    console.error("Analyze Critical Error:", error.message);

    // Optional: fallback to mock mode even if OpenAI fails (quota/network/etc.)
    // Keeps the demo working instead of returning a 500.
    try {
      const { message } = req.body || {};
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = message?.match?.(urlRegex);
      const targetUrl = urls?.[0] || "the provided link";

      const mock = LINK_ANALYZER_MOCK(targetUrl);

      return res.status(200).json({
        success: true,
        isMock: true,
        data: {
          input: { url: targetUrl },
          result: {
            riskScore: 0,
            verdict: mock.verdict,
            reasons: mock.reasons,
          },
          advice: {
            summary: mock.summary,
            twoQuickSteps: mock.twoQuickSteps,
          },
        },
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Server error during link analysis",
      });
    }
  }
};

/**
 * Reporting and retraining
 */
export const reportAndTrain = async (req, res) => {
  const { url, isMalicious } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "No URL provided",
    });
  }

  const pythonScriptPath = path.join(
    __dirname,
    "..",
    "XGBOOST_model",
    "retrain.py",
  );
  const label = isMalicious ? "1" : "0";

  try {
    const pythonProcess = spawn("python", [pythonScriptPath, url, label]);

    let resultData = "";
    pythonProcess.stdout.on("data", (data) => {
      resultData += data.toString();
    });

    pythonProcess.on("close", () => {
      try {
        const jsonRes = JSON.parse(resultData);
        return res.status(200).json({ success: true, data: jsonRes });
      } catch {
        return res.status(200).json({
          success: true,
          message: "The report has been received.",
        });
      }
    });
  } catch (err) {
    console.error("Retrain error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error during retrain",
    });
  }
};
