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

export function answerQuestion(question: string, fest: any, events: FestEvent[], venues: any[], budgetItems: any[] = []) {
  const q = normalize(question);
  const sorted = [...events].sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')));
  const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const listEvents = (items: FestEvent[]) => items.length ? items.map(eventDetails).join('\n') : 'No matching programs are listed in the current schedule.';

  if (/\b(hi|hello|hey|good morning|good evening)\b/.test(q)) return `Hi! I can help with ${fest.name} dates, program schedules, venues, contacts, requirements, and budget. What would you like to know?`;

  if (/(how many|number of|count|total)/.test(q) && /(program|event|activity|competition)/.test(q)) return `There ${events.length === 1 ? 'is' : 'are'} ${events.length} program${events.length === 1 ? '' : 's'} listed for ${fest.name}.`;
  if (/(how many|number of|count|list|what are|show)/.test(q) && /venue|hall|location/.test(q)) return venues.length ? `${venues.length} venues are listed: ${venues.map(v => v.name).join(', ')}.` : 'No venues are listed yet.';

  if (/(date|when|start|begin|end|finish|day)/.test(q) && /(fest|festival)/.test(q)) return `${fest.name} runs from ${formatDate(fest.startDate)} to ${formatDate(fest.endDate)}.`;
  if (/(where|location|address|held|happening)/.test(q) && /(fest|festival|college)/.test(q) && !/(event|program)/.test(q)) {
    const locations = venues.map(v => `${v.name}${v.location ? ` (${v.location})` : ''}`).join('; ');
    return `${fest.name} is hosted by ${fest.collegeName || 'the college'}${locations ? `. Listed fest venues: ${locations}` : '.'}`;
  }
  if (/(how much|total|overall|what is|whats).*(budget|money|fund|cost)|\b(budget|funding)\b/.test(q) && /(fest|total|overall|allocated|budget)/.test(q)) {
    const spent = budgetItems.reduce((sum, item) => sum + Number(item.spentAmount || 0), 0);
    return `The total fest budget is ${money(fest.totalBudget)}. ${budgetItems.length ? `Tracked spending is ${money(spent)} across ${budgetItems.length} budget items.` : 'No budget items are listed yet.'}`;
  }
  if (/description|about the fest|what is .*fest|tell me about/.test(q)) return fest.description || `${fest.name} is a ${fest.status || 'planned'} fest at ${fest.collegeName}.`;
  if (/committee|organizer|organiser|team/.test(q) && /(fest|who|committee|organizer|organiser|team)/.test(q)) return fest.committee?.length ? `The listed committees are: ${fest.committee.join(', ')}.` : 'Committee details are not listed for this fest yet.';

  if (/lunch|break|meal/.test(q)) {
    const matches = sorted.filter(e => /lunch|break|meal/i.test(e.title + ' ' + (e.description || '')));
    return matches.length ? listEvents(matches) : 'I can’t find a lunch or break time in the current fest schedule. Please check with the organizers; I don’t want to guess.';
  }

  const asksSchedule = /schedule|timetable|all programs|all events|programs list|list of events|what programs|which events/.test(q);
  const dayMatch = q.match(/\bday\s*(\d+)\b/);
  const dateMatch = q.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (asksSchedule && (dayMatch || dateMatch)) {
    const targetDate = dateMatch?.[1] || (() => {
      const d = new Date(`${fest.startDate}T12:00:00`);
      d.setDate(d.getDate() + Number(dayMatch?.[1] || 1) - 1);
      return d.toISOString().slice(0, 10);
    })();
    return `Schedule for ${formatDate(targetDate)}:\n${listEvents(sorted.filter(e => e.date === targetDate))}`;
  }
  if (asksSchedule) return `Here’s the schedule for ${fest.name}:\n${listEvents(sorted)}`;

  const venue = venues
    .map(v => ({ venue: v, score: normalize(v.name).split(' ').filter(word => word.length > 2 && q.includes(word)).length }))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.venue;
  if (venue) {
    if (/capacity|how many|people|seats|hold/.test(q)) return `${venue.name} has a capacity of ${venue.capacity ?? 'not listed'} people.`;
    if (/facility|facilities|equipment|available|resource/.test(q)) return `${venue.name} facilities: ${venue.facilities?.join(', ') || 'not listed'}.`;
    if (/hour|open|available|time/.test(q)) return `${venue.name} is available from ${formatTime(venue.availableStart)} to ${formatTime(venue.availableEnd)}.`;
    if (/cost|price|rate|rent|how much/.test(q)) return `${venue.name} costs ${money(venue.pricingPerHour)} per hour.`;
    return `${venue.name}${venue.location ? ` is located at ${venue.location}` : ''}. Capacity: ${venue.capacity ?? 'not listed'}${venue.facilities?.length ? `. Facilities: ${venue.facilities.join(', ')}` : ''}.`;
  }
  if (/(venue|hall|location|where)/.test(q) && /(event|program|available|fest)/.test(q)) return venues.length ? `Listed venues: ${venues.map(v => `${v.name}${v.location ? ` — ${v.location}` : ''} (capacity ${v.capacity ?? 'not listed'})`).join('; ')}.` : 'No venues are listed yet.';

  const stopWords = new Set(['what','when','where','which','show','tell','give','about','time','date','does','the','for','from','with','this','that','event','program','start','end','venue','contact','please','can','you','who','how','much','many','need','required']);
  const questionWords = q.split(' ').filter(word => word.length > 2 && !stopWords.has(word));
  const event = sorted.map(item => {
    const titleWords = normalize(item.title).split(' ').filter(word => word.length > 2 && !stopWords.has(word));
    const score = titleWords.filter(word => questionWords.includes(word)).length;
    return { item, score, titleSize: titleWords.length };
  }).filter(match => match.score > 0).sort((a, b) => b.score - a.score || a.titleSize - b.titleSize)[0]?.item;
  if (event) {
    if (/where|venue|location/.test(q)) {
      const eventVenue = venues.find(v => v.id === event.venueId);
      return event.venueName ? `${event.title} is at ${event.venueName}${eventVenue?.location ? `, ${eventVenue.location}` : ''}.` : `A venue hasn’t been listed for ${event.title} yet.`;
    }
    if (/when|time|start|finish|end|date|day/.test(q)) return eventDetails(event);
    if (/who|contact|coordinator|organizer|organiser/.test(q)) return event.leadCoordinator ? `${event.title} is coordinated by ${event.leadCoordinator}${event.leadContact ? ` (${event.leadContact})` : ''}.` : 'A coordinator is not listed for that program yet.';
    if (/resource|need|require|bring|equipment|facilit/.test(q)) return event.requiredResources?.length ? `Requirements for ${event.title}: ${event.requiredResources.join(', ')}.` : 'No special requirements are listed for that program.';
    if (/cost|budget|expense|price/.test(q)) return `The estimated cost for ${event.title} is ${money(event.estimatedCost)}.`;
    if (/participant|attend|people|capacity|register/.test(q)) return `The expected participation for ${event.title} is ${event.expectedParticipants ?? 'not listed'}.`;
    return eventDetails(event);
  }

  if (/(what time|when does|start time|fest start)/.test(q)) {
    const first = sorted.find(e => e.startTime);
    return first ? `The first scheduled program is ${eventDetails(first)}` : `The fest dates are ${formatDate(fest.startDate)} to ${formatDate(fest.endDate)}, but no program start time is listed yet.`;
  }
  if (/status|fest called|name of the fest/.test(q)) return `${fest.name} is currently marked as ${fest.status || 'not specified'}.`;
  return `I couldn’t find that detail in the information for ${fest.name}. I can answer from the current fest data about dates, programs, event venues and timings, contacts, requirements, venue facilities, and budget. If you tell me the program or venue name, I can look up its details. Details not entered in the planner need to be confirmed with an organizer.`;
}

export const AiCopilot: React.FC = () => {
  const { activeFest, events, venues, budgetItems } = useFest();
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
      { id: `answer-${stamp}`, role: 'assistant', content: answerQuestion(text, activeFest, events, venues, budgetItems), timestamp: now }
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
