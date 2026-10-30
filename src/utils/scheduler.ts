/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Venue {
  id: string;
  festId: string;
  name: string;
  location: string;
  capacity: number;
  availableStart: string; // "HH:mm"
  availableEnd: string;   // "HH:mm"
  pricingPerHour?: number;
  facilities?: string[];
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EventCategory = 'technical' | 'cultural' | 'sports' | 'workshop' | 'gaming' | 'keynote';
export type EventStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled';

export interface FestEvent {
  id: string;
  festId: string;
  title: string;
  category: EventCategory | string;
  department?: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  durationMinutes: number;
  expectedParticipants: number;
  estimatedCost: number;
  venueId?: string;
  venueName?: string;
  requiredResources?: string[];
  leadCoordinator?: string;
  leadContact?: string;
  status: EventStatus;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ConflictSeverity = 'critical' | 'high' | 'warning';
export type ConflictType = 'venue_overlap' | 'capacity_exceeded' | 'buffer_violation' | 'outside_hours';

export interface ConflictReport {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  eventIds: string[];
  venueId?: string;
  title: string;
  description: string;
  recommendation: string;
}

/**
 * Converts "HH:mm" to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Converts minutes since midnight back to "HH:mm"
 */
export function minutesToTime(totalMinutes: number): string {
  const norm = Math.max(0, Math.min(23 * 60 + 59, Math.floor(totalMinutes)));
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Checks if two time intervals overlap (strictly positive intersection)
 */
export function isTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  if (eA <= sA || eB <= sB) return false;
  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Calculates buffer (in minutes) between event A and event B on the same date/venue
 * Returns positive number if disjoint, 0 if abutting, negative if overlapping
 */
export function calculateBufferMinutes(startA: string, endA: string, startB: string, endB: string): number {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);

  if (eA <= sB) {
    return sB - eA;
  }
  if (eB <= sA) {
    return sA - eB;
  }
  return -1; // Overlaps
}

/**
 * Deterministically scans a collection of events and venues for:
 * 1. Overlapping bookings in the same venue on the same date
 * 2. Overcapacity (expected participants > venue capacity)
 * 3. Buffer violations (< 30 minutes turnaround between events)
 * 4. Outside operating hours (starts before opening or ends after closing)
 */
export function detectEventConflicts(events: FestEvent[], venues: Venue[]): ConflictReport[] {
  const conflicts: ConflictReport[] = [];
  const venueMap = new Map<string, Venue>(venues.map(v => [v.id, v]));

  // Active events only (ignore cancelled)
  const activeEvents = events.filter(e => e.status !== 'cancelled');

  // Check 1: Capacity & Venue Operating Hours
  for (const event of activeEvents) {
    if (!event.venueId) continue;
    const venue = venueMap.get(event.venueId);
    if (!venue) continue;

    // Capacity Check
    if (event.expectedParticipants > venue.capacity) {
      const overflow = event.expectedParticipants - venue.capacity;
      conflicts.push({
        id: `cap_${event.id}_${venue.id}`,
        type: 'capacity_exceeded',
        severity: overflow > 50 ? 'critical' : 'high',
        eventIds: [event.id],
        venueId: venue.id,
        title: `Capacity Exceeded: ${event.title}`,
        description: `Expected footfall of ${event.expectedParticipants} exceeds ${venue.name} capacity of ${venue.capacity} (overflow of ${overflow} people).`,
        recommendation: `Relocate "${event.title}" to a larger venue (e.g. Main Auditorium or OAT) or split into multiple batches.`
      });
    }

    // Operating Hours Check
    if (venue.availableStart && venue.availableEnd) {
      const eventStart = timeToMinutes(event.startTime);
      const eventEnd = timeToMinutes(event.endTime);
      const venueStart = timeToMinutes(venue.availableStart);
      const venueEnd = timeToMinutes(venue.availableEnd);

      if (eventStart < venueStart || eventEnd > venueEnd) {
        conflicts.push({
          id: `hours_${event.id}_${venue.id}`,
          type: 'outside_hours',
          severity: 'high',
          eventIds: [event.id],
          venueId: venue.id,
          title: `Outside Venue Hours: ${event.title}`,
          description: `Event time (${event.startTime} - ${event.endTime}) is outside ${venue.name}'s available window (${venue.availableStart} - ${venue.availableEnd}).`,
          recommendation: `Adjust the event timing or request special campus security clearance to extend venue access.`
        });
      }
    }
  }

  // Check 2: Pairwise Overlaps and Tight Buffers on the same date & venue
  for (let i = 0; i < activeEvents.length; i++) {
    for (let j = i + 1; j < activeEvents.length; j++) {
      const evA = activeEvents[i];
      const evB = activeEvents[j];

      // Must share date and venue
      if (!evA.venueId || !evB.venueId || evA.venueId !== evB.venueId) continue;
      if (evA.date !== evB.date) continue;

      const venue = venueMap.get(evA.venueId);
      const venueName = venue?.name || 'Selected Venue';

      if (isTimeOverlap(evA.startTime, evA.endTime, evB.startTime, evB.endTime)) {
        conflicts.push({
          id: `overlap_${evA.id}_${evB.id}`,
          type: 'venue_overlap',
          severity: 'critical',
          eventIds: [evA.id, evB.id],
          venueId: evA.venueId,
          title: `Venue Collision: "${evA.title}" & "${evB.title}"`,
          description: `Both events are scheduled at "${venueName}" simultaneously on ${evA.date} (A: ${evA.startTime}-${evA.endTime}, B: ${evB.startTime}-${evB.endTime}).`,
          recommendation: `Reschedule one event to an open time window or assign a secondary seminar hall/lab.`
        });
      } else {
        // Check buffer between consecutive events
        const buffer = calculateBufferMinutes(evA.startTime, evA.endTime, evB.startTime, evB.endTime);
        if (buffer >= 0 && buffer < 30) {
          conflicts.push({
            id: `buffer_${evA.id}_${evB.id}`,
            type: 'buffer_violation',
            severity: 'warning',
            eventIds: [evA.id, evB.id],
            venueId: evA.venueId,
            title: `Tight Turnaround (${buffer} mins): "${evA.title}" & "${evB.title}"`,
            description: `Only ${buffer} minutes between these events at ${venueName}. Sound/lighting checks and crowd egress require at least 30 minutes.`,
            recommendation: `Add at least 30 minutes buffer between programs for stage reset and AV transition.`
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Calculates venue occupancy metrics for a given date
 */
export function calculateVenueUtilization(
  venue: Venue,
  events: FestEvent[],
  date: string
): { bookedMinutes: number; totalAvailableMinutes: number; percentage: number } {
  const venueStart = timeToMinutes(venue.availableStart || '08:00');
  const venueEnd = timeToMinutes(venue.availableEnd || '22:00');
  const totalAvailable = Math.max(0, venueEnd - venueStart);

  if (totalAvailable === 0) {
    return { bookedMinutes: 0, totalAvailableMinutes: 0, percentage: 0 };
  }

  const dayEvents = events.filter(
    e => e.venueId === venue.id && e.date === date && e.status !== 'cancelled'
  );

  let bookedMinutes = 0;
  for (const ev of dayEvents) {
    const s = Math.max(venueStart, timeToMinutes(ev.startTime));
    const e = Math.min(venueEnd, timeToMinutes(ev.endTime));
    if (e > s) {
      bookedMinutes += (e - s);
    }
  }

  const percentage = Math.min(100, Math.round((bookedMinutes / totalAvailable) * 100));
  return { bookedMinutes, totalAvailableMinutes: totalAvailable, percentage };
}

/**
 * Greedy automatic event placement into open venue slots
 */
export function autoPlaceEvents(
  unassignedEvents: FestEvent[],
  venues: Venue[],
  allScheduledEvents: FestEvent[],
  targetDates: string[]
): { updatedEvents: FestEvent[]; unplaced: { event: FestEvent; reason: string }[] } {
  const updatedEvents: FestEvent[] = [];
  const unplaced: { event: FestEvent; reason: string }[] = [];

  // Create mutable schedule tracking: date -> venueId -> array of { start: number, end: number }
  const scheduleMap = new Map<string, Map<string, Array<{ start: number; end: number }>>>();

  for (const d of targetDates) {
    const dateVenues = new Map<string, Array<{ start: number; end: number }>>();
    for (const v of venues) {
      dateVenues.set(v.id, []);
    }
    scheduleMap.set(d, dateVenues);
  }

  // Populate existing commitments
  for (const ev of allScheduledEvents) {
    if (!ev.venueId || !scheduleMap.has(ev.date)) continue;
    const venueIntervals = scheduleMap.get(ev.date)!.get(ev.venueId);
    if (venueIntervals) {
      venueIntervals.push({
        start: timeToMinutes(ev.startTime),
        end: timeToMinutes(ev.endTime) + 30 // include 30-min buffer
      });
    }
  }

  // Sort intervals by start time
  for (const [, venueMap] of scheduleMap) {
    for (const [, intervals] of venueMap) {
      intervals.sort((a, b) => a.start - b.start);
    }
  }

  // Sort candidates by capacity required (descending)
  const sortedCandidates = [...unassignedEvents].sort(
    (a, b) => b.expectedParticipants - a.expectedParticipants
  );

  for (const event of sortedCandidates) {
    let placed = false;
    const duration = event.durationMinutes > 0 ? event.durationMinutes : 90;

    // Filter venues that fit capacity
    const eligibleVenues = venues
      .filter(v => v.capacity >= event.expectedParticipants)
      .sort((a, b) => a.capacity - b.capacity); // Tightest fit first

    if (eligibleVenues.length === 0) {
      unplaced.push({
        event,
        reason: `No venue on campus has sufficient capacity (${event.expectedParticipants} needed)`
      });
      continue;
    }

    const searchDates = event.date ? [event.date] : targetDates;

    outerLoop:
    for (const d of searchDates) {
      if (!scheduleMap.has(d)) continue;
      const dayVenues = scheduleMap.get(d)!;

      for (const venue of eligibleVenues) {
        const vStart = timeToMinutes(venue.availableStart || '09:00');
        const vEnd = timeToMinutes(venue.availableEnd || '21:00');
        const intervals = dayVenues.get(venue.id) || [];

        // Try candidate start times from vStart up to vEnd - duration
        let candidateStart = vStart;
        for (const interval of intervals) {
          if (candidateStart + duration <= interval.start) {
            // Found a free slot before this interval!
            break;
          }
          candidateStart = Math.max(candidateStart, interval.end);
        }

        if (candidateStart + duration <= vEnd) {
          // Successfully placed!
          const startTime = minutesToTime(candidateStart);
          const endTime = minutesToTime(candidateStart + duration);

          updatedEvents.push({
            ...event,
            date: d,
            venueId: venue.id,
            venueName: venue.name,
            startTime,
            endTime,
            status: 'confirmed'
          });

          intervals.push({
            start: candidateStart,
            end: candidateStart + duration + 30
          });
          intervals.sort((a, b) => a.start - b.start);

          placed = true;
          break outerLoop;
        }
      }
    }

    if (!placed) {
      unplaced.push({
        event,
        reason: 'No open schedule window found in matching venues without conflicts'
      });
    }
  }

  return { updatedEvents, unplaced };
}
