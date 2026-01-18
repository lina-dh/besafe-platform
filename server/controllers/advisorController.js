import OpenAI from "openai";
import { ADVISOR_SYSTEM_PROMPT } from "../utils/prompts/advisorPrompts.js";
import { DEMO_RESPONSE } from "../utils/prompts/mockResponse.js";

// Helper: only treat as "real mode" if key looks like a real OpenAI key
function hasValidOpenAiKey() {
  const key = (process.env.OPENAI_API_KEY || "").trim();

  // Strict rule: real keys typically start with "sk-"
  // Anything else (missing/placeholder) => demo mode
  return key.startsWith("sk-");
}

export const getAdvice = async (req, res) => {
  try {
    const { message, conversation } = req.body;

    // Basic validation: must have a message
    if (!message) {
      return res
        .status(400)
        .json({ success: false, error: "Message is required" });
    }

    // Demo mode (no valid API key) — returns a stable mock response
    if (!hasValidOpenAiKey()) {
      const demoText =
        (DEMO_RESPONSE?.content || "Demo mode response.") +
        "\n\nYou asked: " +
        message;

      return res.status(200).json({
        success: true,
        isMock: true,
        response: demoText,
      });
    }

    // Real AI mode
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() });

    // Build history for memory (OpenAI-style messages)
    const chatHistory = Array.isArray(conversation) ? conversation : [];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: ADVISOR_SYSTEM_PROMPT },
        ...chatHistory,
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    return res.status(200).json({
      success: true,
      isMock: false,
      response: response.choices?.[0]?.message?.content || "",
    });
  } catch (error) {
    console.error("[Advisor] Error:", error.message);

    // Optional: fallback to demo mode so the UI never breaks during a demo
    const demoText =
      (DEMO_RESPONSE?.content || "Demo mode response.") +
      "\n\n(We couldn't reach the AI right now, but the demo is still running.)";

    return res.status(200).json({
      success: true,
      isMock: true,
      response: demoText,
    });
  }
};
