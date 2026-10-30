/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { FestEvent, Venue } from '../types';
import { timeToMinutes, minutesToTime } from '../utils/scheduler';
import { formatTime12, formatDate } from '../utils/formatters';
import {
  Clock,
  MapPin,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  ChevronRight,
  Wand2,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

export const SmartScheduler: React.FC<{ onOpenEditEvent: (event: FestEvent) => void }> = ({ onOpenEditEvent }) => {
  const {
    activeFest,
    venues,
    events,
    conflicts,
    runAutoScheduler
  } = useFest();

  const [selectedDate, setSelectedDate] = useState<string>(activeFest.startDate || '2026-03-20');
  const [autoScheduleLogs, setAutoScheduleLogs] = useState<string[]>([]);

  // Timeline spans from 08:00 (480m) to 23:00 (1380m) = 900 minutes total
  const START_HOUR = 8;
  const END_HOUR = 23;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const TOTAL_MINUTES = TOTAL_HOURS * 60; // 900 mins

  const hoursArray = useMemo(() => {
    const list: string[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      list.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return list;
  }, []);

  // Events on currently selected date
  const dayEvents = useMemo(() => {
    return events.filter(e => e.date === selectedDate && e.status !== 'cancelled');
  }, [events, selectedDate]);

  // Unscheduled events (missing venue or start time)
  const unscheduledEvents = useMemo(() => {
    return events.filter(e => (!e.venueId || !e.startTime || !e.endTime) && e.status !== 'cancelled');
  }, [events]);

  const handleRunAuto = () => {
    const result = runAutoScheduler();
    setAutoScheduleLogs(result.details);
  };

  // Helper to compute CSS left & width percentages
  const getEventPosition = (ev: FestEvent) => {
    const startMins = timeToMinutes(ev.startTime);
    const endMins = timeToMinutes(ev.endTime);
    const timelineStart = START_HOUR * 60;

    const clampedStart = Math.max(timelineStart, Math.min(timelineStart + TOTAL_MINUTES, startMins));
    const clampedEnd = Math.max(timelineStart, Math.min(timelineStart + TOTAL_MINUTES, endMins));

    const leftPct = ((clampedStart - timelineStart) / TOTAL_MINUTES) * 100;
    const widthPct = Math.max(4, ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100);

    return { leftPct, widthPct };
  };

  // Available fest days tabs
  const festDates = useMemo(() => {
    const dates = [activeFest.startDate, activeFest.endDate].filter(Boolean);
    // Add unique dates from events
    for (const e of events) {
      if (e.date && !dates.includes(e.date)) {
        dates.push(e.date);
      }
    }
    dates.sort();
    return dates.length > 0 ? dates : ['2026-03-20', '2026-03-21', '2026-03-22'];
  }, [activeFest, events]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#101524]">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Smart Scheduler & Multi-Venue Timeline</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Deterministic Conflict Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize hall schedules, diagnose collisions, and auto-place unassigned programs without overlapping bookings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker Pills */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {festDates.map((d, index) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDate === d
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Day {index + 1} ({formatDate(d).slice(0, 6)})
              </button>
            ))}
          </div>

          {/* Auto Scheduler Button */}
          <button
            onClick={handleRunAuto}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Auto-Schedule Unassigned</span>
          </button>
        </div>
      </div>

      {/* Auto-Schedule Logs Alert (if any recently placed) */}
      {autoScheduleLogs.length > 0 && (
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs text-indigo-200">
          <div className="flex items-center justify-between mb-1 font-bold">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Auto-Scheduler Placement Log</span>
            </span>
            <button
              onClick={() => setAutoScheduleLogs([])}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-300">
            {autoScheduleLogs.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Timeline Grid */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#101524]/90 shadow-2xl overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Time axis header */}
          <div className="flex border-b border-slate-800 pb-3 mb-4 text-xs font-semibold text-slate-400">
            <div className="w-48 flex-shrink-0 text-slate-300">
              Campus Venue
            </div>
            <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] text-center text-[11px]">
              {hoursArray.map((h, i) => (
                <div key={h} className="text-slate-400 truncate">
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* Venue Rows */}
          <div className="space-y-4">
            {venues.map((venue) => {
              const venueEvents = dayEvents.filter(e => e.venueId === venue.id);

              return (
                <div
                  key={venue.id}
                  className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 transition-all flex items-center"
                >
                  {/* Left Venue Label */}
                  <div className="w-48 flex-shrink-0 pr-4 border-r border-slate-800">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{venue.name}</h4>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-0.5">
                      <span>Cap: {venue.capacity}</span>
                      <span>•</span>
                      <span>{venueEvents.length} Event{venueEvents.length === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  {/* Right Timeline Canvas */}
                  <div className="flex-1 relative h-16 ml-3 bg-slate-950/70 rounded-lg border border-slate-800/60 overflow-hidden">
                    {/* Hourly Guide Gridlines */}
                    <div className="absolute inset-0 grid grid-cols-[repeat(16,minmax(0,1fr))] pointer-events-none">
                      {hoursArray.map((_, i) => (
                        <div key={i} className="border-r border-slate-800/40 h-full" />
                      ))}
                    </div>

                    {/* Event Blocks */}
                    {venueEvents.map((ev) => {
                      const { leftPct, widthPct } = getEventPosition(ev);

                      // Check if this event has an active conflict
                      const eventConflict = conflicts.find(c => c.eventIds.includes(ev.id));
                      const isConflict = Boolean(eventConflict);

                      return (
                        <div
                          key={ev.id}
                          onClick={() => onOpenEditEvent(ev)}
                          title={`${ev.title}\nTime: ${ev.startTime} - ${ev.endTime}\nExpected: ${ev.expectedParticipants} attendees`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`
                          }}
                          className={`absolute top-2 bottom-2 rounded-lg p-2 text-left cursor-pointer transition-all border flex flex-col justify-between overflow-hidden group ${
                            isConflict
                              ? 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-md shadow-rose-950/50 animate-pulse z-20'
                              : 'bg-gradient-to-r from-violet-900/80 to-indigo-900/80 border-violet-500/50 hover:border-violet-400 text-white z-10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold truncate group-hover:text-violet-200">
                              {ev.title}
                            </span>
                            {isConflict && (
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-300">
                            <span>{ev.startTime} - {ev.endTime}</span>
                            <span className="font-medium text-slate-400">({ev.expectedParticipants}p)</span>
                          </div>
                        </div>
                      );
                    })}

                    {venueEvents.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-600 font-medium">
                        Venue Available All Day
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unscheduled Events Drawer Section */}
      {unscheduledEvents.length > 0 && (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-950/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-amber-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{unscheduledEvents.length} Unscheduled Event{unscheduledEvents.length > 1 ? 's' : ''}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                These events need venue assignment or time slot configuration.
              </p>
            </div>
            <button
              onClick={handleRunAuto}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Place All</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unscheduledEvents.map(e => (
              <div
                key={e.id}
                onClick={() => onOpenEditEvent(e)}
                className="p-3 rounded-xl border border-slate-700 bg-slate-900/80 hover:border-amber-400/50 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span className="truncate">{e.title}</span>
                  <span className="text-[10px] text-amber-400 font-bold">Unassigned</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Req. Capacity: {e.expectedParticipants}</span>
                  <span>Est: {formatTime12(e.startTime) || '90m'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
