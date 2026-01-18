// server/utils/prompts/mockResponse.js

// Demo response for the chat advisor (ConsultAI)
export const DEMO_RESPONSE = {
  role: "assistant",
  content:
    "Hi! This is a demo version of the BeSafe Advisor.\n\n" +
    "In the full version, I can help guide safer online decisions.\n\n" +
    "For now, this response demonstrates how the AI interaction works 💗",
};

// Mock response for the link analyzer (StaySafe / link-scanner)
export const LINK_ANALYZER_MOCK = (url = "the provided link") => ({
  verdict: "suspicious",
  reasons: [
    "Demo mode: AI analysis is simulated because no valid API key is configured.",
    "The URL structure may contain patterns commonly used in phishing attempts (example demo reason).",
  ],
  summary: `Demo mode: I can't query the AI right now, but here's what a real analysis would look like for ${url}.`,
  twoQuickSteps: [
    "Do not click the link. Verify the sender through another channel.",
    "If you already clicked, change your password and enable 2FA on the affected account.",
  ],
});
