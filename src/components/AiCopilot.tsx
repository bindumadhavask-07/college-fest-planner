import React, { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, Send, Sparkles, UserRound } from 'lucide-react';
import { useFest } from '../context/FestContext';
import type { AiChatMessage, FestEvent } from '../types';

type FestInfo = {
  name: string;
  collegeName?: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  description?: string;
  status?: string;
  committee?: string[];
};

type VenueInfo = {
  id: string;
  name: string;
  location?: string;
  capacity?: number;
  facilities?: string[];
  availableStart?: string;
  availableEnd?: string;
  pricingPerHour?: number;
};

type BudgetInfo = {
  spentAmount?: number;
};

type ChatEvent = FestEvent & {
  description?: string;
  leadCoordinator?: string;
  leadContact?: string;
  requiredResources?: string[];
  estimatedCost?: number;
  expectedParticipants?: number;
};

const normalize = (value: string) =>
  value.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatTime = (value?: string) => {
  if (!value) return 'time not specified';

  const [hours, minutes = 0] = value.split(':').map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 || hours > 23 ||
    minutes < 0 || minutes > 59
  ) {
    return value;
  }

  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${
    hours >= 12 ? 'PM' : 'AM'
  }`;
};

const formatDate = (value?: string) => {
  if (!value) return 'date not specified';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const money = (value?: number) =>
  value == null || !Number.isFinite(Number(value))
    ? 'not listed'
    : `₹${Number(value).toLocaleString('en-IN')}`;

const timestamp = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

export function answerQuestion(
  question: string,
  fest: FestInfo | null | undefined,
  events: FestEvent[],
  venues: VenueInfo[],
  budgetItems?: BudgetInfo[],
): string {
  if (!fest) return 'Please select a fest first.';

  const q = normalize(question);
  if (!q) return 'Please type a question about your fest.';

  const sorted: ChatEvent[] = [...events].sort((a, b) =>
    `${a.date || ''} ${a.startTime || ''}`.localeCompare(
      `${b.date || ''} ${b.startTime || ''}`,
    ),
  );

  const getVenue = (event: ChatEvent) =>
    venues.find(venue => venue.id === event.venueId);

  const eventDetails = (event: ChatEvent) => {
    const venueName = event.venueName || getVenue(event)?.name;

    return `${event.title} — ${formatDate(event.date)}, ${formatTime(
      event.startTime,
    )} to ${formatTime(event.endTime)}${
      venueName ? `, at ${venueName}` : ''
    }.`;
  };

  const listEvents = (items: ChatEvent[]) =>
    items.length
      ? items.map((item, index) =>
          `${index + 1}. ${eventDetails(item)}`,
        ).join('\n\n')
      : 'No matching events are listed in the current schedule.';

  const asksLocation = /\b(where|locations?|venues?|address)\b/.test(q);
  const asksCount = /\b(how many|number of|count|total)\b/.test(q);
  const mentionsEvents =
    /\b(events?|programs?|activities|activity|competitions?)\b/.test(q);
  const mentionsFest = /\b(fest|festival)\b/.test(q);
  const asksSchedule =
    mentionsEvents || /\b(schedule|timetable|agenda)\b/.test(q) ||
    /\b(what is happening|whats happening)\b/.test(q);

  if (/^(hi|hello|hey|good morning|good evening)$/.test(q)) {
    return `Hi! I can help with ${fest.name} events, dates, venues, contacts, requirements, and budget.`;
  }

  if (/^(thanks|thank you|thankyou)$/.test(q)) {
    return 'You’re welcome! Ask me if you need another fest detail.';
  }

  // Look for a named event before general schedule or budget answers.
  const stopWords = new Set([
    'what', 'when', 'where', 'which', 'show', 'tell', 'give',
    'about', 'time', 'date', 'does', 'the', 'for', 'from',
    'with', 'this', 'that', 'event', 'events', 'program',
    'programs', 'start', 'end', 'venue', 'contact', 'please',
    'can', 'you', 'who', 'how', 'much', 'many', 'need',
    'required', 'fest', 'festival', 'day', 'and',
  ]);

  const paddedQuestion = ` ${q} `;
  const fullMatches = sorted.filter(item => {
    const title = normalize(item.title);
    return title.length > 0 && paddedQuestion.includes(` ${title} `);
  });

  const questionWords = new Set(
    q.split(' ').filter(word => word.length > 2 && !stopWords.has(word)),
  );

  const scored = sorted.map(item => ({
    item,
    score: normalize(item.title).split(' ').filter(
      word => !stopWords.has(word) && questionWords.has(word),
    ).length,
  })).filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score);

  const eventMatches = fullMatches.length
    ? fullMatches
    : scored.filter(match => match.score === scored[0]?.score)
        .map(match => match.item);

  if (eventMatches.length > 1) {
    return `Which event do you mean?\n\n${eventMatches
      .map(item => `• ${item.title}`).join('\n')}`;
  }

  const event = eventMatches[0];

  if (event) {
    if (asksLocation) {
      const venue = getVenue(event);
      const name = event.venueName || venue?.name;

      return name
        ? `${event.title} is at ${name}${
            venue?.location ? `, ${venue.location}` : ''
          }.`
        : `A venue hasn’t been assigned to ${event.title} yet.`;
    }

    if (/\b(who|contact|coordinator|organizer|organiser)\b/.test(q)) {
      return event.leadCoordinator
        ? `${event.title} is coordinated by ${event.leadCoordinator}${
            event.leadContact ? ` (${event.leadContact})` : ''
          }.`
        : `A coordinator is not listed for ${event.title}.`;
    }

    if (/\b(resources?|need|require|requirements?|bring|equipment|facilities)\b/.test(q)) {
      return event.requiredResources?.length
        ? `Requirements for ${event.title}: ${event.requiredResources.join(', ')}.`
        : `No special requirements are listed for ${event.title}.`;
    }

    if (/\b(cost|budget|expense|price)\b/.test(q)) {
      return `Estimated cost for ${event.title}: ${money(event.estimatedCost)}.`;
    }

    if (/\b(participants?|participation|attend|people|capacity|register)\b/.test(q)) {
      return `Expected participation for ${event.title}: ${
        event.expectedParticipants ?? 'not listed'
      }.`;
    }

    return eventDetails(event);
  }

  // Preserve the date's hyphens by reading the original question.
  const dateMatch = question.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const dayMatch = q.match(/\bday\s*(\d+)\b/);

  if (asksSchedule && (dateMatch || dayMatch)) {
    let targetDate = dateMatch?.[1];

    if (!targetDate) {
      const day = Number(dayMatch?.[1]);
      const start = new Date(`${fest.startDate}T12:00:00`);

      if (!Number.isInteger(day) || day < 1 || Number.isNaN(start.getTime())) {
        return 'Please use a valid fest day, such as “Show the schedule for day 1”. The fest start date must also be set.';
      }

      start.setDate(start.getDate() + day - 1);
      targetDate = [
        start.getFullYear(),
        String(start.getMonth() + 1).padStart(2, '0'),
        String(start.getDate()).padStart(2, '0'),
      ].join('-');
    }

    const matchingEvents = sorted.filter(item => item.date === targetDate);

    if (asksCount) {
      return `${matchingEvents.length} events are listed for ${formatDate(targetDate)}.`;
    }

    return `Schedule for ${formatDate(targetDate)}:\n\n${listEvents(matchingEvents)}`;
  }

  // Handle questions about a named venue.
  const venueMatches = venues.map(venue => {
    const name = normalize(venue.name);
    const exact = name.length > 0 && paddedQuestion.includes(` ${name} `);
    const score = exact ? 1000 : name.split(' ').filter(
      word => word.length > 2 && !stopWords.has(word) &&
        paddedQuestion.includes(` ${word} `),
    ).length;

    return { venue, score };
  }).filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score);

  const bestVenues = venueMatches.filter(
    match => match.score === venueMatches[0]?.score,
  );

  if (bestVenues.length > 1) {
    return `Which venue do you mean?\n\n${bestVenues
      .map(match => `• ${match.venue.name}`).join('\n')}`;
  }

  const venue = bestVenues[0]?.venue;

  if (venue) {
    if (mentionsEvents || /\b(schedule|timetable)\b/.test(q)) {
      const venueEvents = sorted.filter(item =>
        item.venueId === venue.id ||
        normalize(item.venueName || '') === normalize(venue.name),
      );

      return asksCount
        ? `${venueEvents.length} events are listed at ${venue.name}.`
        : `Events at ${venue.name}:\n\n${listEvents(venueEvents)}`;
    }

    if (/\b(capacity|how many|people|seats|hold)\b/.test(q)) {
      return `${venue.name} capacity: ${venue.capacity ?? 'not listed'}.`;
    }

    if (/\b(facility|facilities|equipment|resources?)\b/.test(q)) {
      return `${venue.name} facilities: ${venue.facilities?.join(', ') || 'not listed'}.`;
    }

    if (/\b(cost|price|rate|rent|how much)\b/.test(q)) {
      return `${venue.name} hourly rate: ${money(venue.pricingPerHour)}.`;
    }

    if (/\b(hours?|open|available|time)\b/.test(q)) {
      return `${venue.name} has listed hours from ${formatTime(
        venue.availableStart,
      )} to ${formatTime(venue.availableEnd)}. Check the schedule for existing bookings.`;
    }

    return `${venue.name}${
      venue.location ? ` is located at ${venue.location}` : ''
    }. Capacity: ${venue.capacity ?? 'not listed'}.${
      venue.facilities?.length
        ? ` Facilities: ${venue.facilities.join(', ')}.`
        : ''
    }`;
  }

  if (asksCount && mentionsEvents) {
    return `${events.length} events are listed for ${fest.name}.`;
  }

  if (asksCount && /\b(venues?|halls?|locations?)\b/.test(q)) {
    return `${venues.length} venues are listed for ${fest.name}.`;
  }

  if (/\b(lunch|break|breaks|meal|meals)\b/.test(q)) {
    const breaks = sorted.filter(item =>
      /\b(lunch|break|breaks|meal|meals)\b/i.test(
        `${item.title} ${item.description || ''}`,
      ),
    );

    return breaks.length
      ? listEvents(breaks)
      : 'No lunch or break time is listed. Please check with the organizers.';
  }

  if (/\b(budget|funding|funds|spending|spent|money)\b/.test(q)) {
    const total = `The total fest budget is ${money(fest.totalBudget)}.`;

    if (!budgetItems) {
      return `${total} Spending data has not been supplied to this chat.`;
    }

    const spent = budgetItems.reduce(
      (sum, item) => sum + (Number(item.spentAmount) || 0), 0,
    );

    return `${total} ${
      budgetItems.length
        ? `Tracked spending is ${money(spent)} across ${budgetItems.length} budget items.`
        : 'No budget items are listed yet.'
    }`;
  }

  if (/\b(committee|committees|organizer|organiser|team)\b/.test(q)) {
    return fest.committee?.length
      ? `The listed committees are: ${fest.committee.join(', ')}.`
      : 'Committee details are not listed yet.';
  }

  if (/description|about the fest|what is .*fest|tell me about/.test(q)) {
    return fest.description ||
      `${fest.name} is a ${fest.status || 'planned'} fest${
        fest.collegeName ? ` at ${fest.collegeName}` : ''
      }.`;
  }

  if (asksLocation && mentionsFest && !mentionsEvents) {
    return `${fest.name}${
      fest.collegeName ? ` is hosted at ${fest.collegeName}` : ''
    }.\n\nListed venues:\n${
      venues.map(item =>
        `• ${item.name}${item.location ? ` — ${item.location}` : ''}`,
      ).join('\n') || 'No venues are listed yet.'
    }`;
  }

  if (
    mentionsFest &&
    /\b(what time|start time|when does.*start|when does.*begin)\b/.test(q)
  ) {
    const first = sorted.find(item => item.startTime);

    return first
      ? `The first scheduled event is:\n\n${eventDetails(first)}`
      : 'No event start time is listed yet.';
  }

  if (mentionsFest && /\b(when|dates?|start|begin|end|finish|day)\b/.test(q)) {
    return `${fest.name} runs from ${formatDate(fest.startDate)} to ${formatDate(fest.endDate)}.`;
  }

  if (asksLocation || /\b(venues?|halls?)\b/.test(q)) {
    if (mentionsEvents) {
      return sorted.length
        ? `Event venues:\n\n${sorted.map(item =>
            `• ${item.title} — ${
              item.venueName || getVenue(item)?.name || 'Venue not assigned'
            }`,
          ).join('\n')}`
        : 'There are no events scheduled yet.';
    }

    return venues.length
      ? `Available venues:\n\n${venues.map(item =>
          `• ${item.name}${item.location ? ` — ${item.location}` : ''}`,
        ).join('\n')}`
      : 'No venues are listed yet.';
  }

  if (asksSchedule) {
    return `Schedule for ${fest.name}:\n\n${listEvents(sorted)}`;
  }

  if (/status|fest called|name of the fest/.test(q)) {
    return `${fest.name} is currently marked as ${fest.status || 'not specified'}.`;
  }

  if (/\b(help|what can you do)\b/.test(q)) {
    return 'Try asking:\n\n• What are the events?\n• Show the schedule for day 1\n• Where is the fest?\n• What is the total budget?\n• Where is [event name]?\n• Who coordinates [event name]?\n• What facilities does [venue name] have?';
  }

  return `I couldn’t find that detail for ${fest.name}. Ask about the schedule, dates, a named event, venues, contacts, requirements, or budget. Details not entered in the planner need to be confirmed with an organizer.`;
}

export const AiCopilot: React.FC = () => {
  const { activeFest, events, venues, budgetItems } = useFest();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I’m your Fest Assistant. Ask me about events, venues, dates, contacts, or budget.',
      timestamp: timestamp(),
    },
  ]);

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const messageId = useRef(0);

  const suggestions = [
    'What are the events?',
    'Where is the fest?',
    'What is the total budget?',
    'Show the schedule for day 1',
  ];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question) return;

    const now = timestamp();
    const id = ++messageId.current;
    const answer = answerQuestion(
      question, activeFest, events, venues, budgetItems,
    );

    setMessages(previous => [
      ...previous,
      {
        id: `user-${id}`,
        role: 'user',
        content: question,
        timestamp: now,
      },
      {
        id: `answer-${id}`,
        role: 'assistant',
        content: answer,
        timestamp: now,
      },
    ]);

    setInput('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(input);
  };

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl border border-slate-800 bg-[#101524] p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/15 p-2 text-violet-300">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-bold text-white">Fest Assistant</h2>
            <p className="text-xs text-slate-400">
              Answers from your current fest data
            </p>
          </div>
        </div>
      </header>

      <div className="flex h-[520px] flex-col rounded-2xl border border-slate-800 bg-[#101524]/90 p-4 sm:p-6">
        <div
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          className="flex-1 space-y-4 overflow-y-auto pr-1"
        >
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  message.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-violet-300'
                }`}
              >
                {message.role === 'user'
                  ? <UserRound size={16} />
                  : <Bot size={16} />}
              </div>

              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'border border-slate-800 bg-slate-900 text-slate-200'
                }`}
              >
                {message.content}
                <div className="mt-1 text-right text-[10px] opacity-60">
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 overflow-x-auto border-t border-slate-800 py-3">
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500 hover:text-white"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={event => setInput(event.target.value)}
            aria-label="Your question"
            placeholder="Ask about the fest..."
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim()}
            className="rounded-xl bg-violet-600 px-4 text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </section>
  );
};