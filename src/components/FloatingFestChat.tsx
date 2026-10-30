import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, UserRound, X } from 'lucide-react';
import { useFest } from '../context/FestContext';
import { AiChatMessage } from '../types';
import { answerQuestion } from './AiCopilot';

export const FloatingFestChat: React.FC = () => {
  const { activeFest, events, venues, budgetItems } = useFest();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;
    const id = Date.now();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: AiChatMessage = { id: `user-${id}`, role: 'user', content: question, timestamp };
    setMessages(current => [...current, userMessage]);
    setInput('');
    setIsSending(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          messages: [...messages, userMessage].map(message => ({ role: message.role, content: message.content })),
          festContext: { fest: activeFest, events, venues, budgetItems }
        })
      });
      const data = await response.json().catch(() => ({}));
      const reply = response.ok && typeof data.reply === 'string'
        ? data.reply
        : `AI is not available right now, so here’s what I can find in the fest planner: ${answerQuestion(question, activeFest, events, venues, budgetItems)}${data.message ? `\n\n${data.message}` : ''}`;
      setMessages(current => [...current, { id: `bot-${id}`, role: 'assistant', content: reply, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch {
      setMessages(current => [...current, {
        id: `bot-${id}`, role: 'assistant',
        content: `I couldn’t reach the AI service. Here’s what I can find in the fest planner: ${answerQuestion(question, activeFest, events, venues, budgetItems)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
    {isOpen && <section aria-label="Fest chatbot" className="flex h-[min(72vh,560px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#101524] shadow-2xl shadow-black/50">
      <header className="flex items-center justify-between border-b border-slate-800 bg-[#151c2d] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-violet-500/20 p-2 text-violet-300"><Bot size={19}/></span>
          <div><h2 className="text-sm font-semibold text-white">Fest Assistant</h2><p className="text-[11px] text-slate-400">Ask about {activeFest.name}</p></div>
        </div>
        <button onClick={() => setIsOpen(false)} aria-label="Close chatbot" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18}/></button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && <div className="flex gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-violet-300"><Bot size={15}/></span>
          <p className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm leading-relaxed text-slate-200">Hi! Ask me about program times, venues, fest dates, or breaks. I’ll answer from the information currently listed.</p>
        </div>}
        {messages.map(message => <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${message.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-violet-300'}`}>
            {message.role === 'user' ? <UserRound size={15}/> : <Bot size={15}/>}
          </span>
          <div className={`max-w-[82%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'bg-violet-600 text-white' : 'border border-slate-800 bg-slate-900 text-slate-200'}`}>
            {message.content}<div className="mt-1 text-right text-[10px] opacity-60">{message.timestamp}</div>
          </div>
        </div>)}
        {isSending && <div className="flex items-center gap-2 text-xs text-slate-400"><Bot className="h-4 w-4 animate-pulse text-violet-300"/>Thinking about the fest…</div>}
        <div ref={bottomRef}/>
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-slate-800 p-3">
        <input autoFocus value={input} onChange={event => setInput(event.target.value)} placeholder="Ask a question..." aria-label="Your question" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"/>
        <button type="submit" disabled={!input.trim() || isSending} aria-label="Send question" className="rounded-xl bg-violet-600 px-3 text-white hover:bg-violet-500 disabled:opacity-40"><Send size={17}/></button>
      </form>
    </section>}

    <button onClick={() => setIsOpen(open => !open)} aria-label={isOpen ? 'Close fest chatbot' : 'Open fest chatbot'} aria-expanded={isOpen} className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-950/50 transition hover:scale-105 hover:bg-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-400/40">
      {isOpen ? <X size={23}/> : <MessageCircle size={24}/>}
    </button>
  </div>;
};
