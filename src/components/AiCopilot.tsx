import React, { FormEvent, useRef, useState } from 'react';
import { Bot, Send, Sparkles, UserRound } from 'lucide-react';
import { useFest } from '../context/FestContext';
import { AiChatMessage, FestEvent } from '../types';

const formatTime = (value?: string) => {
  if (!value) return 'time not specified';
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours)) return value;
  return `${hours % 12 || 12}:${String(minutes || 0).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
};
const formatDate = (value?: string) => value
  ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  : 'date not specified';
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const eventDetails = (event: FestEvent) => `${event.title} — ${formatDate(event.date)}, ${formatTime(event.startTime)} to ${formatTime(event.endTime)}${event.venueName ? `, at ${event.venueName}` : ''}.`;

export function answerQuestion(question: string, fest: any, events: FestEvent[], venues: any[]) {
  const q = normalize(question);
  const sorted = [...events].sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')));
  if (/\b(hi|hello|hey|good morning|good evening)\b/.test(q)) return `Hi! Ask me about ${fest.name}: event times, venues, dates, breaks, or the schedule.`;
  if (/how many|number of|count/.test(q) && /program|event|activity/.test(q)) return `There ${events.length === 1 ? 'is' : 'are'} ${events.length} program${events.length === 1 ? '' : 's'} listed for ${fest.name}.`;
  if (/where|location|venue/.test(q) && /fest|festival|held/.test(q) && !/event|program/.test(q)) return `${fest.name} is at ${fest.collegeName}. Available venues include: ${venues.map(v => v.name + (v.location ? ` (${v.location})` : '')).join('; ') || 'No venues are listed yet'}.`;
  if (/when|what date|which date/.test(q) && /fest|festival|start|begin/.test(q)) return `${fest.name} runs from ${formatDate(fest.startDate)} to ${formatDate(fest.endDate)}.`;
  if (/lunch|break|meal/.test(q)) {
    const matches = sorted.filter(e => /lunch|break|meal/i.test(e.title + ' ' + (e.description || '')));
    return matches.length ? matches.map(eventDetails).join('\n') : 'I can’t find a lunch or break time in the current fest schedule. Please check with the organizers; I don’t want to guess.';
  }
  if (/what time|when does.*(start|begin)|fest.*start/.test(q) && /fest|festival|day/.test(q)) {
    const first = sorted.find(e => e.startTime);
    return first ? `The first scheduled program is ${eventDetails(first)}` : `The fest dates are ${formatDate(fest.startDate)} to ${formatDate(fest.endDate)}, but no program start time is listed yet.`;
  }
  if (/all (the )?(program|event)|schedule|timetable|programs/.test(q) && !/where.*event/.test(q)) return sorted.length ? `Here’s the schedule:\n${sorted.map(eventDetails).join('\n')}` : 'There are no programs in the schedule yet.';
  const event = sorted.find(e => normalize(e.title).split(' ').some(word => word.length > 3 && q.includes(word)));
  if (event) {
    if (/where|venue|location/.test(q)) {
      const venue = venues.find(v => v.id === event.venueId);
      return event.venueName ? `${event.title} is at ${event.venueName}${venue?.location ? `, ${venue.location}` : ''}.` : `A venue hasn’t been listed for ${event.title} yet.`;
    }
    if (/when|time|start|finish|end|date/.test(q)) return eventDetails(event);
    if (/who|contact|coordinator/.test(q)) return event.leadCoordinator ? `${event.title} is coordinated by ${event.leadCoordinator}${event.leadContact ? ` (${event.leadContact})` : ''}.` : 'A coordinator is not listed for that program yet.';
    if (/resource|need|require|bring/.test(q)) return event.requiredResources?.length ? `For ${event.title}: ${event.requiredResources.join(', ')}.` : 'No special requirements are listed for that program.';
    return eventDetails(event);
  }
  if (/where|venue|location/.test(q) && /event|program/.test(q)) return venues.length ? `Venues: ${venues.map(v => `${v.name}${v.location ? ` — ${v.location}` : ''}`).join('; ')}.` : 'No venues are listed yet.';
  return 'I couldn’t find that in the current fest information. Try asking about the fest dates, a program name, venue, schedule, or lunch break. If the detail isn’t listed, please confirm it with an organizer.';
}

export const AiCopilot: React.FC = () => {
  const { activeFest, events, venues } = useFest();
  const [messages, setMessages] = useState<AiChatMessage[]>([{
    id: 'welcome', role: 'assistant',
    content: `Hi! I’m the ${activeFest.name} Fest Assistant. Ask me about program timings, venues, dates, breaks, or the schedule.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const suggestions = ['Where is the fest?', 'How many programs are there?', 'When is lunch break?', 'Show me the schedule'];

  const send = (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stamp = Date.now();
    setMessages(previous => [...previous,
      { id: `user-${stamp}`, role: 'user', content: text.trim(), timestamp: now },
      { id: `answer-${stamp}`, role: 'assistant', content: answerQuestion(text, activeFest, events, venues), timestamp: now }
    ]);
    setInput('');
    window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
  };

  return <section className="mx-auto max-w-4xl space-y-5">
    <header className="rounded-2xl border border-slate-800 bg-[#101524] p-5">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/15 p-2 text-violet-300"><Sparkles size={20}/></div>
        <div><h2 className="font-bold text-white">Fest Assistant</h2><p className="text-xs text-slate-400">Answers from the current fest schedule and venue details</p></div>
      </div>
    </header>
    <div className="flex h-[520px] flex-col rounded-2xl border border-slate-800 bg-[#101524]/90 p-4 sm:p-6">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map(message => <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${message.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-violet-300'}`}>
            {message.role === 'user' ? <UserRound size={16}/> : <Bot size={16}/>}
          </div>
          <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-violet-600 text-white' : 'border border-slate-800 bg-slate-900 text-slate-200'}`}>
            {message.content}<div className="mt-1 text-right text-[10px] opacity-60">{message.timestamp}</div>
          </div>
        </div>)}
        <div ref={endRef}/>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-slate-800 py-3">
        {suggestions.map(s => <button key={s} onClick={() => send(s)} className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500 hover:text-white">{s}</button>)}
      </div>
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); send(input); }} className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about the fest..." className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
        <button aria-label="Send message" disabled={!input.trim()} className="rounded-xl bg-violet-600 px-4 text-white hover:bg-violet-500 disabled:opacity-40"><Send size={17}/></button>
      </form>
    </div>
  </section>;
};
