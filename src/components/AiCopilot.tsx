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
};

type VenueInfo = {
  id: string;
  name: string;
  location?: string;
};

type ChatEvent = FestEvent & {
  description?: string;
  leadCoordinator?: string;
  leadContact?: string;
  requiredResources?: string[];
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatTime = (value?: string) => {
  if (!value) return 'time not specified';

  const [hours, minutes = 0] = value.split(':').map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
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
): string {
  if (!fest) {
    return 'Please select a fest first so I can show its information.';
  }

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

  const showSchedule = () =>
    sorted.length
      ? `Here are the ${sorted.length} events for ${fest.name}:\n\n${sorted
          .map((event, index) => `${index + 1}. ${eventDetails(event)}`)
          .join('\n\n')}`
      : 'There are no events scheduled yet. Add an event in Event Management and ask me again.';

  const asksLocation = /\b(where|locations?|venues?)\b/.test(q);
  const asksCount = /\b(how many|number of|count)\b/.test(q);
  const mentionsEvents = /\b(events?|programs?|activities|activity)\b/.test(q);
  const mentionsFest = /\b(fest|festival)\b/.test(q);
  const asksTime = /\b(time|timing|timings)\b/.test(q);

  if (/^(hi|hello|hey|good morning|good evening)$/.test(q)) {
    return `Hi! I’m the ${fest.name} Fest Assistant. Ask me about events, timings, venues, dates, coordinators, or breaks.`;
  }

  if (asksCount && mentionsEvents) {
    return `There ${events.length === 1 ? 'is' : 'are'} ${
      events.length
    } event${events.length === 1 ? '' : 's'} listed for ${fest.name}.`;
  }

  if (asksCount && /\bvenues?\b/.test(q)) {
    return `There ${venues.length === 1 ? 'is' : 'are'} ${
      venues.length
    } venue${venues.length === 1 ? '' : 's'} listed for ${fest.name}.`;
  }

  // Prefer a complete event title, then distinctive title words.
  // Generic words such as "event" must not match an arbitrary event.
  const ignoredWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'event',
    'events',
    'program',
    'programs',
    'fest',
    'festival',
    'day',
  ]);

  const paddedQuestion = ` ${q} `;

  const fullTitleMatches = sorted.filter(event => {
    const title = normalize(event.title);
    return title && paddedQuestion.includes(` ${title} `);
  });

  const matches = fullTitleMatches.length
    ? fullTitleMatches
    : sorted.filter(event =>
        normalize(event.title)
          .split(' ')
          .some(
            word =>
              word.length > 3 &&
              !ignoredWords.has(word) &&
              paddedQuestion.includes(` ${word} `),
          ),
      );

  if (matches.length > 1) {
    return `I found several matching events. Please ask using the full event name:\n\n${matches
      .map(event => `• ${event.title}`)
      .join('\n')}`;
  }

  const event = matches[0];

  if (event) {
    if (asksLocation) {
      const venue = getVenue(event);
      const venueName = event.venueName || venue?.name;

      return venueName
        ? `${event.title} is at ${venueName}${
            venue?.location ? `, ${venue.location}` : ''
          }.`
        : `A venue hasn’t been listed for ${event.title} yet.`;
    }

    if (/\b(who|contact|coordinator|organizer|organiser)\b/.test(q)) {
      return event.leadCoordinator
        ? `${event.title} is coordinated by ${event.leadCoordinator}${
            event.leadContact ? ` (${event.leadContact})` : ''
          }.`
        : `A coordinator is not listed for ${event.title} yet.`;
    }

    if (/\b(resources?|need|require|requirements?|bring)\b/.test(q)) {
      return event.requiredResources?.length
        ? `For ${event.title}: ${event.requiredResources.join(', ')}.`
        : `No special requirements are listed for ${event.title}.`;
    }

    return eventDetails(event);
  }

  if (/\b(lunch|break|breaks|meal|meals)\b/.test(q)) {
    const breaks = sorted.filter(item =>
      /\b(lunch|break|breaks|meal|meals)\b/i.test(
        `${item.title} ${item.description || ''}`,
      ),
    );

    return breaks.length
      ? breaks.map(eventDetails).join('\n\n')
      : 'No lunch or break time is listed in the current schedule. Please check with the organizers.';
  }

  if (asksLocation && mentionsFest && !mentionsEvents) {
    const location = fest.collegeName
      ? `${fest.name} is at ${fest.collegeName}.`
      : `A college location has not been listed for ${fest.name}.`;

    const venueList = venues.length
      ? venues
          .map(
            venue =>
              `• ${venue.name}${
                venue.location ? ` — ${venue.location}` : ''
              }`,
          )
          .join('\n')
      : 'No venues are listed yet.';

    return `${location}\n\nAvailable venues:\n${venueList}`;
  }

  // Handle start-time questions before general fest-date questions.
  if (
    mentionsFest &&
    (asksTime || /\b(start|begin)\b/.test(q)) &&
    !/\b(date|dates)\b/.test(q)
  ) {
    const first = sorted.find(item => item.startTime);

    return first
      ? `The first scheduled event is:\n\n${eventDetails(first)}`
      : 'No event start time is listed yet.';
  }

  if (
    mentionsFest &&
    /\b(when|date|dates|start|begin|end|finish)\b/.test(q)
  ) {
    return `${fest.name} runs from ${formatDate(
      fest.startDate,
    )} to ${formatDate(fest.endDate)}.`;
  }

  if (asksLocation) {
    if (mentionsEvents) {
      return sorted.length
        ? `Event venues:\n\n${sorted
            .map(
              item =>
                `• ${item.title} — ${
                  item.venueName ||
                  getVenue(item)?.name ||
                  'Venue not assigned'
                }`,
            )
            .join('\n')}`
        : 'There are no events scheduled yet.';
    }

    return venues.length
      ? `Available venues:\n\n${venues
          .map(
            venue =>
              `• ${venue.name}${
                venue.location ? ` — ${venue.location}` : ''
              }`,
          )
          .join('\n')}`
      : 'No venues are listed yet.';
  }

  if (
    mentionsEvents ||
    /\b(schedule|timetable|agenda)\b/.test(q) ||
    /\bwhat is happening|whats happening\b/.test(q)
  ) {
    return showSchedule();
  }

  if (/\b(help|what can you do)\b/.test(q)) {
    return 'You can ask me:\n\n• What are the events?\n• Show me the schedule\n• Where is the fest?\n• How many events are there?\n• When is lunch break?\n• Where is [event name]?\n• Who coordinates [event name]?';
  }

  if (/^(thanks|thank you|thankyou)$/.test(q)) {
    return 'You’re welcome! Ask me if you need another fest detail.';
  }

  return 'I couldn’t find that in the current fest information. Try asking for the schedule, fest dates, venues, or a specific event by name.';
}

export const AiCopilot: React.FC = () => {
  const { activeFest, events, venues } = useFest();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I’m your Fest Assistant. Ask me about events, timings, venues, dates, or breaks.',
      timestamp: timestamp(),
    },
  ]);

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const messageId = useRef(0);

  const suggestions = [
    'What are the events?',
    'Where is the fest?',
    'When is lunch break?',
    'Show me the schedule',
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
      question,
      activeFest,
      events,
      venues,
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
              Answers from the current fest schedule and venue details
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
                {message.role === 'user' ? (
                  <UserRound size={16} />
                ) : (
                  <Bot size={16} />
                )}
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