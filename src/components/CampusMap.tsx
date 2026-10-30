import React, { FormEvent, useMemo, useState } from 'react';
import { Accessibility, ArrowUpRight, Bot, Clock3, LocateFixed, MapPin, MessageCircle, Search, Send, X } from 'lucide-react';
import { useFest } from '../context/FestContext';
import { CAMPUS_MAP_CONFIG } from '../data/campusMap';

type MapLocation = {
  venue: ReturnType<typeof useFest>['venues'][number];
  events: ReturnType<typeof useFest>['events'];
  x: number;
  y: number;
  photo?: string;
  directions?: string;
  accessibility: readonly string[];
  isSamplePosition: boolean;
};

export const CampusMap: React.FC = () => {
  const { venues, events, activeFest } = useFest();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mapBotOpen, setMapBotOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');

  // The supplied sample positions match the TechNova demo IDs. Other venues
  // receive a schematic grid position, NEVER a fabricated GPS coordinate.
  const locations = useMemo<MapLocation[]>(() => venues.map((venue, index) => {
    const sample = CAMPUS_MAP_CONFIG.locations.find(item => item.venueId === venue.id);
    return {
      venue,
      events: events.filter(event => event.venueId === venue.id && event.status !== 'cancelled'),
      x: sample?.x ?? (17 + (index % 4) * 22),
      y: sample?.y ?? (30 + Math.floor(index / 4) * 18) % 60,
      photo: sample?.photo,
      directions: sample?.directions,
      accessibility: sample?.accessibility ?? [],
      isSamplePosition: true
    };
  }), [venues, events]);

  const current = locations.find(loc => loc.venue.id === selectedId);
  const matches = locations.filter(loc =>
    (loc.venue.name + ' ' + loc.venue.location + ' ' + loc.events.map(e => e.title).join(' '))
      .toLowerCase().includes(search.toLowerCase())
  );

  const askMapBot = (e: FormEvent) => {
    e.preventDefault();
    const normalized = question.trim().toLowerCase();
    if (!normalized) return;
    const results = locations.filter(loc =>
      (loc.venue.name + ' ' + loc.venue.location + ' ' + loc.events.map(ev => ev.title).join(' '))
        .toLowerCase().includes(normalized)
    );
    if (results.length === 1) {
      const loc = results[0];
      setSelectedId(loc.venue.id);
      const upcoming = loc.events.map(ev => ev.title + ' (' + ev.date + ', ' + ev.startTime + ')').join('; ');
      setReply(loc.venue.name + ' is highlighted. Location: ' + loc.venue.location +
        '. ' + (upcoming ? 'Events: ' + upcoming + '.' : 'No events assigned yet.') +
        ' Map pin placement is illustrative; confirm real directions with your organizers.');
    } else if (results.length > 1) {
      setReply('I found ' + results.length + ' matching places. Select one from the suggestions below.');
    } else {
      setReply('No matching venue or event found. Try a venue name or an event title shown in FESTOS AI.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Explore your campus</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Campus Map</h1>
          <p className="mt-1 text-sm text-slate-400">
            Explore event venues for {activeFest?.name || 'your fest'}.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input value={search} onChange={event => setSearch(event.target.value)}
            placeholder="Search venues or events" aria-label="Search campus venues"
            className="w-full rounded-xl border border-slate-700 bg-[#101524] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-violet-500" />
          {search && <div className="absolute left-0 right-0 top-12 z-30 max-h-60 overflow-auto rounded-xl border border-slate-700 bg-[#101524] shadow-xl">
            {matches.length ? matches.map(loc => <button key={loc.venue.id} onClick={() => { setSelectedId(loc.venue.id); setSearch(''); }}
              className="block w-full border-b border-slate-800 px-3 py-2 text-left text-sm text-white hover:bg-slate-800">
              {loc.venue.name}<span className="block text-xs text-slate-400">{loc.events[0]?.title || loc.venue.location}</span>
            </button>) : <p className="p-3 text-xs text-slate-400">No matching venue.</p>}
          </div>}
        </div>
      </div>
      <div className="relative h-[min(72vh,760px)] min-h-[480px] overflow-hidden rounded-2xl border border-slate-800 bg-[#101a24] shadow-xl">
        {CAMPUS_MAP_CONFIG.mapImage ? (
          <img src={CAMPUS_MAP_CONFIG.mapImage} alt="Uploaded campus plan" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div aria-label="Illustrative campus diagram, not a geographic map" className="absolute inset-0"
            style={{backgroundImage:'linear-gradient(rgba(148,163,184,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.08) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
            <svg viewBox="0 0 1000 700" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <path d="M-20 160 C180 220 250 280 420 250 S720 180 1030 320 M-30 470 C200 400 280 500 510 440 S800 380 1040 550 M270 -20 C310 150 410 220 470 340 S560 520 620 730 M770 -20 C690 180 760 290 680 410 S610 550 520 730"
                fill="none" stroke="#314155" strokeWidth="40" />
              <path d="M-20 160 C180 220 250 280 420 250 S720 180 1030 320 M-30 470 C200 400 280 500 510 440 S800 380 1040 550 M270 -20 C310 150 410 220 470 340 S560 520 620 730 M770 -20 C690 180 760 290 680 410 S610 550 520 730"
                fill="none" stroke="#52647a" strokeWidth="2" strokeDasharray="8 12" />
            </svg>
            <div className="absolute left-[8%] top-[14%] h-[18%] w-[19%] rounded-[35%] border border-emerald-800 bg-emerald-950/60" />
            <div className="absolute left-[63%] top-[13%] h-[22%] w-[23%] rounded-[35%] border border-emerald-800 bg-emerald-950/60" />
            <div className="absolute left-[39%] top-[64%] h-[18%] w-[16%] rounded-[40%] border border-sky-900 bg-sky-950/70" />
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-xl border border-slate-700 bg-[#0A0D14]/90 px-3 py-2 text-xs text-slate-200">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
          {activeFest?.collegeName || CAMPUS_MAP_CONFIG.collegeName}
          <span className="ml-2 text-amber-300">· schematic layout</span>
        </div>
        <div className="absolute right-3 top-3 rounded-xl border border-slate-700 bg-[#0A0D14]/90 px-3 py-2 text-xs text-slate-300">
          {locations.length} venues
        </div>
        {locations.map(loc => (
          <button key={loc.venue.id} onClick={() => setSelectedId(loc.venue.id)}
            style={{left: loc.x + '%', top: loc.y + '%'}}
            aria-label={'Show ' + loc.venue.name}
            className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className={'flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-xl ' +
              (selectedId === loc.venue.id ? 'scale-110 border-white bg-violet-500 text-white' :
                'border-violet-400 bg-[#101524] text-violet-300 group-hover:bg-violet-600 group-hover:text-white')}>
              <MapPin className="h-5 w-5" />
            </span>
            <span className="mt-1 max-w-32 truncate rounded-md border border-slate-700 bg-[#0A0D14]/90 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
              {loc.venue.name}
            </span>
          </button>
        ))}
        {locations.length === 0 && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-300">
          Add venues from the Venues tab to see them on the campus map.
        </div>}
        {current && <article className="absolute bottom-3 right-3 z-20 max-h-[70%] w-[min(360px,calc(100%-24px))] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0B101B]/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="font-bold text-white">{current.venue.name}</h2>
              <p className="mt-1 text-xs text-slate-400">{current.venue.location}</p></div>
            <button onClick={() => setSelectedId(null)} aria-label="Close venue details" className="p-1 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          {current.photo && <img src={current.photo} alt="Illustrative venue photo (not verified)" className="mt-3 h-28 w-full rounded-lg object-cover" />}
          <p className="mt-3 text-xs text-slate-300">Capacity: {current.venue.capacity} people</p>
          <div className="mt-3 space-y-2">
            {current.events.length ? current.events.map(ev => <p key={ev.id} className="flex gap-2 text-xs text-slate-200">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
              <span>{ev.title} — {ev.date}, {ev.startTime}–{ev.endTime}</span>
            </p>) : <p className="text-xs text-slate-400">No events scheduled here yet.</p>}
          </div>
          {current.directions && <p className="mt-3 text-xs leading-relaxed text-slate-300">{current.directions}</p>}
          {current.accessibility.length > 0 && <p className="mt-3 flex gap-2 text-xs text-slate-400">
            <Accessibility className="h-4 w-4 shrink-0 text-emerald-400" />
            {current.accessibility.join(' · ')}
          </p>}
          <p className="mt-3 text-[10px] text-amber-300">Demo layout only — confirm real campus directions before use.</p>
          <button onClick={() => setSelectedId(current.venue.id)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600/20 px-3 py-2 text-xs font-semibold text-violet-200">
            <LocateFixed className="h-4 w-4" />Selected pin shown on map
          </button>
        </article>}
        {!mapBotOpen && <button onClick={() => setMapBotOpen(true)}
          className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <Bot className="h-5 w-5" /> Ask MapBot
        </button>}
        {mapBotOpen && <aside className="absolute bottom-3 left-3 top-14 z-30 flex w-[min(420px,calc(100%-24px))] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0B101B]/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white"><Bot className="h-5 w-5 text-violet-300" /> MapBot · Venue Guide</div>
            <button onClick={() => setMapBotOpen(false)} aria-label="Close MapBot" className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
            <p className="rounded-xl bg-slate-900 p-3 text-slate-200">
              Search by venue or event name. I'll highlight the matching location and show its fest schedule.
            </p>
            {reply && <p role="status" className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-indigo-100">{reply}</p>}
            {locations.slice(0, 6).map(loc => <button key={loc.venue.id} onClick={() => {
              setSelectedId(loc.venue.id);
              setReply(loc.venue.name + ' is highlighted on the map. This is a schematic pin, not a verified GPS location.');
            }} className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-[#101524] p-3 text-left text-slate-200 hover:border-violet-500/50">
              <span>{loc.venue.name}<span className="block text-xs text-slate-400">{loc.events.length} scheduled events</span></span>
              <ArrowUpRight className="h-4 w-4 text-violet-300" />
            </button>)}
          </div>
          <form onSubmit={askMapBot} className="flex gap-2 border-t border-slate-800 p-3">
            <input value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="Find a venue or event…" aria-label="Ask MapBot"
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
            <button type="submit" disabled={!question.trim()} aria-label="Search"
              className="rounded-xl bg-violet-600 px-3 text-white disabled:opacity-40"><Send className="h-4 w-4" /></button>
          </form>
        </aside>}
      </div>
      <p className="text-xs text-slate-500">
        Campus map pins are illustrative. The demo photo, directions and accessibility details require verification.
        To use a real campus plan, update src/data/campusMap.ts with an authorized map image and verified venue coordinates.
      </p>
    </section>
  );
};
