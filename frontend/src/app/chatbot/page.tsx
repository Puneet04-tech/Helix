'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Send, MessageSquare } from 'lucide-react';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      text: "Hello! I'm AI Guardian's intelligent assistant. Ask me anything about your incidents, services, or system status.",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000));

    const aiMessage = {
      id: messages.length + 2,
      text: 'Based on your incidents, I can see that your service has been operating smoothly with 99.97% uptime. Would you like more details about recent events?',
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            AI Guardian Assistant
          </h1>
          <p className="text-slate-400 mt-1">
            Ask natural language questions about your incidents
          </p>
        </div>

        <div className="bg-[#112D5E] rounded-xl border border-[#1E3A5F] h-96 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#2979CC] text-white rounded-tr-sm'
                      : 'bg-[#1A3A6E] text-slate-200 rounded-tl-sm border border-[#1E3A5F]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1A3A6E] text-slate-200 rounded-2xl rounded-tl-sm px-4 py-2 border border-[#1E3A5F]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-[#1E3A5F] px-4 py-3 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              placeholder="What would you like to know?"
              className="flex-1 bg-[#0D1B3E] border border-[#1E3A5F] rounded-xl px-4 py-2 text-slate-200 text-sm placeholder-slate-500 focus:border-[#2979CC] focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#2979CC] hover:bg-[#1A56A0] text-white rounded-xl p-2 disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
