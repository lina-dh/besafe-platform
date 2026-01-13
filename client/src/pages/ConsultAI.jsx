import { useEffect, useMemo, useRef, useState } from "react";
import BackToHome from "../components/BackToHome";
import consultIcon from "../assets/consult.png";
import api from "../services/api";

/**
 * ConsultAI - Chat UI for safety advice
 * - Keeps full chat history (like WhatsApp/OpenAI)
 * - Scrollable chat box
 * - Sends conversation to backend
 * - UI text is English
 */

function isHebrew(text) {
  return /[\u0590-\u05FF]/.test(text || "");
}

export default function ConsultAI() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Chat messages
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your online safety advisor. Ask me anything about staying safe online 💜",
    },
  ]);

  const chatRef = useRef(null);

  const inputDir = useMemo(
    () => (isHebrew(question) ? "rtl" : "ltr"),
    [question]
  );

  // Auto scroll to bottom when messages change
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  function buildConversationForApi(allMessages) {
    // backend expects OpenAI style: [{role, content}, ...]
    // Keep only user/assistant roles and drop our local "id"
    return allMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));
  }

  async function handleAsk() {
    setError("");

    const q = question.trim();
    if (!q) {
      return;
    }

    // Optimistic: add user message immediately
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
    };

    // Add a temporary assistant "typing" placeholder
    const typingMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Thinking…",
      isTyping: true,
    };

    const nextMessages = [...messages, userMsg, typingMsg];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    try {
      const conversation = buildConversationForApi([...messages, userMsg]);

      const resp = await api.post("/api/advisor/ask", {
        message: q,
        conversation,
      });

      const text =
        resp?.data?.success && resp.data.response
          ? resp.data.response
          : "Sorry — I didn't get a response. Please try again.";

      setMessages((prev) => {
        // Replace the typing bubble with the real response
        const withoutTyping = prev.filter((m) => m.id !== typingMsg.id);
        return [
          ...withoutTyping,
          { id: crypto.randomUUID(), role: "assistant", content: text },
        ];
      });
    } catch (err) {
      console.error("Advisor request failed:", err);
      setError("Unable to reach the assistant. Please try again later.");
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== typingMsg.id);
        return [
          ...withoutTyping,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Something went wrong. Please try again later.",
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  }

  const tips = [
    "Use strong, unique passwords for each account",
    "Turn on 2FA for important accounts",
    "Keep your social media private when possible",
    "Never share codes, addresses, or private photos in DMs",
    "If pressured: pause, verify, ask a trusted adult",
  ];

  return (
    <div className="space-y-8">
      <BackToHome />

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-fit rounded-3xl bg-white/50 backdrop-blur-md p-4 shadow-lg border border-white/40">
          <img
            src={consultIcon}
            alt="Consult AI"
            className="w-52 md:w-64 h-auto object-contain rounded-2xl"
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight pb-2 gradient-text">
          Consult AI
        </h1>
        <p className="text-lg text-slate-700 max-w-2xl mx-auto">
          Your AI safety advisor. Ask me anything about staying safe online.
        </p>
      </div>

      {/* Safety Tips */}
      <div className="bubble-card p-6 hover:scale-[1.02] transition-transform duration-300">
        <div className="flex items-center gap-3 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#f59e0b" />
            <path
              d="M12 8 L12 12 L16 16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-xl font-bold text-slate-800">
            Quick Safety Tips
          </h2>
        </div>
        <ul className="space-y-3 text-slate-700">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-purple-500 mt-1">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat */}
      <div className="bubble-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="robot-wave"
          >
            <circle cx="12" cy="8" r="4" fill="#a855f7" />
            <circle cx="10" cy="7" r="1" fill="white" />
            <circle cx="14" cy="7" r="1" fill="white" />
            <path
              d="M10 9 Q12 10 14 9"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <rect x="8" y="14" width="8" height="4" rx="2" fill="#a855f7" />
            <circle cx="10" cy="16" r="0.5" fill="white" />
            <circle cx="14" cy="16" r="0.5" fill="white" />
          </svg>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Chat</h2>
            <p className="text-slate-600 text-sm">
              For scanning suspicious messages and links, use the StaySafe
              scanner.
            </p>
          </div>
        </div>

        {/* Scrollable messages box */}
        <div
          ref={chatRef}
          className="h-80 md:h-[420px] overflow-y-auto rounded-2xl bg-white/60 border border-white/40 backdrop-blur-md p-4 space-y-3"
          dir="ltr"
        >
          {messages.map((m) => {
            const isUser = m.role === "user";
            const bubbleDir = isHebrew(m.content) ? "rtl" : "ltr";

            return (
              <div
                key={m.id}
                className={`w-full flex ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  dir={bubbleDir}
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm border ${
                    isUser
                      ? "bg-linear-to-r from-purple-500 to-pink-500 text-white border-white/20"
                      : "bg-white/80 text-slate-800 border-white/40"
                  }`}
                >
                  <div className="text-xs opacity-80 mb-1">
                    {isUser ? "You" : "AI"}
                  </div>
                  <div
                    className={`${
                      m.isTyping ? "animate-pulse" : ""
                    } whitespace-pre-wrap`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 bubble-card p-4 border-l-4 border-red-400 bg-red-50">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Input row */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <label htmlFor="consult-question" className="sr-only">
            Ask a question
          </label>

          <input
            id="consult-question"
            name="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            dir={inputDir}
            placeholder="Ask about privacy, 2FA, suspicious messages..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/80 border border-slate-200 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all duration-200"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!loading) handleAsk();
              }
            }}
          />

          <button
            onClick={handleAsk}
            disabled={loading}
            aria-busy={loading}
            className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl btn-hover flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
