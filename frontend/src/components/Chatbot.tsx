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

  // Updated to accept optional text directly from quick replies
  const sendMessage = async (textToSend?: string) => {
    const finalMessage = typeof textToSend === 'string' ? textToSend : message;
    
    if (!finalMessage.trim()) return;
    
    const userMessage: Message = { role: "user", text: finalMessage };
    setMessages((prev) => [...prev, userMessage]);
    setMessage(""); // Clear input box
    setLoading(true);

    try {
      const res = await api.sendChatMessage(userMessage.text);
      setMessages((prev) => [...prev, { role: "assistant", text: res.assistant.message }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Server error. Is Ollama running?" }]);
    }
    
    setLoading(false);
  };

  // Function to clear the chat
  const clearChat = () => {
    setMessages([{ role: "assistant", text: "Chat cleared! How can I help you today?" }]);
  };

  // Function to handle quick reply clicks
  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-3xl shadow-2xl hover:scale-105 transition-transform flex items-center justify-center z-50"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 w-80 md:w-96 h-[550px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-100">
          
          {/* Header with Clear Button */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">MARLON AI</h3>
              <p className="text-xs text-blue-100">Library Assistant</p>
            </div>
            <button 
              onClick={clearChat} 
              className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition"
            >
              Clear Chat
            </button>
          </div>

          {/* Messages Area */}
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
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 p-3 rounded-2xl rounded-tl-sm text-sm animate-pulse shadow-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* QUICK REPLIES MENU */}
          <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
             <button 
               onClick={() => handleQuickReply("What books do I have borrowed?")} 
               className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-blue-100 hover:text-blue-600 transition border border-slate-200"
             >
               My Borrowings
             </button>
             <button 
               onClick={() => handleQuickReply("Do you have any books on Python?")} 
               className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-blue-100 hover:text-blue-600 transition border border-slate-200"
             >
               Find Python Books
             </button>
             <button 
               onClick={() => handleQuickReply("What are the library rules?")} 
               className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-blue-100 hover:text-blue-600 transition border border-slate-200"
             >
               Library Rules
             </button>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask me anything..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400 text-sm text-slate-700"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Send
            </button>
          </div>

        </div>
      )}
    </>
  );
}