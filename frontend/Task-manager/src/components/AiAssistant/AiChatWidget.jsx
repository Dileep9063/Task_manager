import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { LuBot, LuSend, LuX, LuSparkles } from "react-icons/lu";
import { API_BASE_URL } from "../../config/api";
import "./AiChatWidget.css";

function AiChatWidget({ role, onActionComplete }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const endpoint =
    role === "admin" ? "/api/admin/ai/chat" : "/api/user/ai/chat";

  const greeting =
    role === "admin"
      ? "Hi, I'm your admin assistant. Ask me to look up users, manage tasks, or check system stats — I can act directly, just tell me what you need."
      : "Hi, I'm your task assistant. Ask me to create, update, complete, or clean up your tasks — just tell me what you need in plain language.";

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: greeting,
          actions: [],
        },
      ]);
    }
  }, [open, greeting, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) return;

    const nextMessages = [
      ...messages,
      {
        role: "user",
        content: text,
      },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const payload = {
        messages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };

      const res = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const actions = res.data.actions || [];

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.reply || "Done.",
          actions: actions,
        },
      ]);

      // Notify the parent page that the AI performed an action
      if (actions.length > 0 && onActionComplete) {
        onActionComplete(actions);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Something went wrong reaching the AI assistant.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        className="ai-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
      >
        {open ? <LuX /> : <LuBot />}
      </button>

      {open && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <div className="ai-panel-heading">
              <LuSparkles className="ai-panel-icon" />

              <div>
                <h3>AI Assistant</h3>

                <span>
                  {role === "admin" ? "Admin mode" : "Task mode"}
                </span>
              </div>
            </div>

            <button
              className="ai-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <LuX />
            </button>
          </div>

          <div className="ai-panel-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`ai-msg ai-msg--${m.role}`}
              >
                <div className="ai-msg-bubble">
                  {m.content}
                </div>

                {m.actions && m.actions.length > 0 && (
                  <div className="ai-actions-log">
                    {m.actions.map((a, j) => (
                      <div
                        key={j}
                        className={`ai-action-item ${
                          a.result?.error
                            ? "ai-action-item--error"
                            : ""
                        }`}
                      >
                        <span className="ai-action-dot" />

                        <span>
                          {a.result?.error
                            ? `${a.tool} failed: ${a.result.error}`
                            : `Ran ${a.tool}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-msg ai-msg--assistant">
                <div className="ai-msg-bubble ai-msg-bubble--typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {error && (
              <div className="ai-error">
                {error}
              </div>
            )}
          </div>

          <div className="ai-panel-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                role === "admin"
                  ? "e.g. Block the user with email jane@example.com"
                  : "e.g. Create a high priority task to finish the report by Friday"
              }
              rows={1}
            />

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <LuSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AiChatWidget;