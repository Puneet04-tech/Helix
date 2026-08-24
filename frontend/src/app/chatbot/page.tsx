'use client';

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ChatbotPage() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      text: "Hello! I'm Helix's intelligent security assistant. Ask me anything about your incidents, services, threats, or system status. I can analyze patterns, provide insights, and help you understand what's happening in your infrastructure.",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !token) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      const projectId = user.projectIds?.[0];
      
      // Call backend chatbot endpoint - it returns a Server-Sent Events (SSE)
      // stream, so read it incrementally and reconstruct the final answer.
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chatbot/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userInput,
            projectId,
          }),
        }
      );

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to get response from AI');
      }

      // Read the SSE stream line by line.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Each SSE event is separated by a blank line.
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const line = event
            .split('\n')
            .find(l => l.startsWith('data: '));
          if (!line) continue;
          const payload = line.slice('data: '.length);
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.type === 'complete' && parsed.answer) {
              fullAnswer = parsed.answer;
            } else if (typeof parsed.word === 'string') {
              fullAnswer += parsed.word + ' ';
            }
          } catch {
            // Ignore non-JSON payloads; fall through.
          }
        }
      }

      if (!fullAnswer.trim()) {
        throw new Error('Empty response from AI.');
      }

      const aiMessage = {
        id: messages.length + 2,
        text: fullAnswer.trim(),
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Chatbot error:', error);

      // Fallback response if backend is not available
      const fallbackMessage = {
        id: messages.length + 2,
        text: 'Sorry, I could not connect to the backend. Please make sure the server is running. In the meantime, I can tell you that the chatbot will provide insights about your incidents based on your question.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Helix Intelligence Assistant
          </h1>
          <p className="text-slate-400 mt-1">
            Ask natural language questions about your threats, incidents, and system status. Helix will analyze your data and provide actionable insights.
          </p>
        </div>

        <div className="bg-[#112D5E] rounded-xl border border-[#1E3A5F] h-96 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
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
            <div ref={messagesEndRef} />
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
              disabled={loading || !user || !token}
              placeholder="What would you like to know?"
              className="flex-1 bg-[#0D1B3E] border border-[#1E3A5F] rounded-xl px-4 py-2 text-slate-200 text-sm placeholder-slate-500 focus:border-[#2979CC] focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !user || !token}
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
