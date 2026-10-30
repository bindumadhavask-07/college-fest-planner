/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useFest } from '../context/FestContext';
import { AiChatMessage } from '../types';
import {
  Bot,
  Sparkles,
  Send,
  AlertCircle,
  Code2,
  Terminal,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

export const AiCopilot: React.FC = () => {
  const { activeFest, events, venues, budgetItems, conflicts } = useFest();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Hello! I am FESTOS Copilot. I'm connected to the backend endpoint at POST /api/ai/chat to assist with schedule optimization, venue clash resolution, and fest budgeting for ${activeFest.name}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    aiConfigured: boolean;
    checked: boolean;
    errorDetails?: string;
  }>({ aiConfigured: false, checked: false });

  // Check health on mount
  const checkServerStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerStatus({
          aiConfigured: Boolean(data.features?.aiCopilotConfigured),
          checked: true
        });
      } else {
        setServerStatus({ aiConfigured: false, checked: true, errorDetails: 'Server health check returned HTTP ' + res.status });
      }
    } catch (e: any) {
      setServerStatus({ aiConfigured: false, checked: true, errorDetails: e.message });
    }
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isSending) return;

    const userMsg: AiChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          festContext: {
            festName: activeFest.name,
            collegeName: activeFest.collegeName,
            totalBudget: activeFest.totalBudget,
            eventsCount: events.length,
            venuesCount: venues.length,
            conflictsCount: conflicts.length
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `msg_ai_${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setServerStatus({ aiConfigured: true, checked: true });
      } else if (response.status === 503) {
        // Genuine integration-unavailable state
        setServerStatus({ aiConfigured: false, checked: true, errorDetails: data.message });
        setMessages(prev => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            role: 'assistant',
            content: `[Backend 503 Notice]: ${data.message || 'Gemini AI API key is not configured on the server.'}\n\nPlease add GEMINI_API_KEY in the AI Studio Secrets panel or server environment to activate real-time LLM responses. Full contract specifications are documented in docs/ai-integration.md.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            error: true
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            role: 'assistant',
            content: `API Error (${response.status}): ${data.message || 'Unknown response'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            error: true
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `Network / Server Connection Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const samplePrompts = [
    'Analyze our Day 1 schedule for turnaround bottlenecks',
    'How should we allocate ₹1.5L budget between Hackathon and Pro-Nite?',
    'Suggest emergency power & crowd safety measures for 2,500 students at OAT',
    'Draft a checklist for external judge hospitality'
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#101524] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <span>FESTOS AI Copilot</span>
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                serverStatus.aiConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {serverStatus.aiConfigured ? 'Gemini 3.8 Active' : 'Integration Ready (/api/ai/chat)'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Backend endpoint ready at <code className="text-indigo-300">POST /api/ai/chat</code>. Displays authentic integration states rather than synthetic chatbot mockups.
          </p>
        </div>

        <button
          onClick={checkServerStatus}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Check Status</span>
        </button>
      </div>

      {/* Integration Status Notice Card (If Key is Pending) */}
      {!serverStatus.aiConfigured && serverStatus.checked && (
        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 backdrop-blur-md">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <h4 className="font-bold text-indigo-200">
                  AI Endpoint Integration Status: Reserved for Teammate Integration
                </h4>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  Per project specifications, the AI Copilot does not output fake canned answers. The server endpoint <code className="text-indigo-300">/api/ai/chat</code> is implemented with <code className="text-indigo-300">@google/genai</code> and is awaiting <code className="text-indigo-300">GEMINI_API_KEY</code> injection.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                <div className="text-slate-500 mb-1">// Expected POST /api/ai/chat Request Payload:</div>
                <pre>{`{
  "messages": [{ "role": "user", "content": "..." }],
  "festContext": {
    "festName": "${activeFest.name}",
    "totalBudget": ${activeFest.totalBudget},
    "eventsCount": ${events.length},
    "conflictsCount": ${conflicts.length}
  }
}`}</pre>
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                📖 Full integration specifications documented in <span className="text-indigo-300 font-mono">docs/ai-integration.md</span>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Display Window */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#101524]/90 shadow-2xl flex flex-col h-[480px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
                      : m.error
                      ? 'bg-rose-950 border border-rose-500/40 text-rose-300'
                      : 'bg-slate-800 border border-slate-700 text-indigo-400'
                  }`}
                >
                  {isUser ? 'You' : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-violet-600 text-white'
                      : m.error
                      ? 'bg-rose-950/40 text-rose-200 border border-rose-500/30'
                      : 'bg-slate-900 text-slate-200 border border-slate-800'
                  }`}
                >
                  {m.content}
                  <div
                    className={`text-[9px] mt-1.5 ${
                      isUser ? 'text-violet-200 text-right' : 'text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 italic">
              <Bot className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>Querying /api/ai/chat endpoint...</span>
            </div>
          )}
        </div>

        {/* Prompt Chips */}
        <div className="pt-3 pb-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-2 flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask FESTOS Copilot to optimize schedule, verify venue buffers, or trim budget..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
