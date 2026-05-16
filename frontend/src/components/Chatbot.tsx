import React, { useState, useRef, useEffect } from "react";
import { api } from "../services/api";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I am MARLON. How can I help you with the library today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMessage: Message = { role: "user", text: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await api.sendChatMessage(userMessage.text);
      setMessages((prev) => [...prev, { role: "assistant", text: res.assistant.message }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Server error. Is Ollama running?" }]);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-3xl shadow-2xl hover:scale-105 transition-transform flex items-center justify-center z-50"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-6 w-80 md:w-96 h-[500px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-100">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white">
            <h3 className="font-bold text-lg">MARLON AI</h3>
            <p className="text-xs text-blue-100">Library Assistant</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 p-3 rounded-2xl rounded-tl-sm text-sm animate-pulse shadow-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}