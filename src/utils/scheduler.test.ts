import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isTimeOverlap,
  detectEventConflicts,
  autoPlaceEvents,
  timeToMinutes,
  minutesToTime,
  Venue,
  FestEvent
} from './scheduler';

test('timeToMinutes and minutesToTime conversions are accurate', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(timeToMinutes('14:45'), 885);
  assert.equal(timeToMinutes('23:59'), 1439);

  assert.equal(minutesToTime(0), '00:00');
  assert.equal(minutesToTime(570), '09:30');
  assert.equal(minutesToTime(885), '14:45');
});

test('isTimeOverlap identifies overlaps correctly', () => {
  // Overlapping intervals
  assert.equal(isTimeOverlap('10:00', '12:00', '11:00', '13:00'), true);
  assert.equal(isTimeOverlap('11:00', '13:00', '10:00', '12:00'), true);
  assert.equal(isTimeOverlap('10:00', '14:00', '11:00', '12:00'), true); // Enclosed

  // Non-overlapping intervals
  assert.equal(isTimeOverlap('10:00', '11:00', '11:00', '12:00'), false); // Abutting
  assert.equal(isTimeOverlap('09:00', '10:00', '11:00', '12:00'), false); // Disjoint
});

test('detectEventConflicts catches overlapping bookings at the same venue', () => {
  const venues: Venue[] = [
    {
      id: 'v1',
      festId: 'fest1',
      name: 'Main Auditorium',
      location: 'Block A',
      capacity: 1000,
      availableStart: '08:00',
      availableEnd: '22:00'
    }
  ];

  const events: FestEvent[] = [
    {
      id: 'ev1',
      festId: 'fest1',
      title: 'Inauguration Ceremony',
      category: 'cultural',
      date: '2026-03-20',
      startTime: '09:30',
      endTime: '11:30',
      durationMinutes: 120,
      expectedParticipants: 600,
      estimatedCost: 15000,
      venueId: 'v1',
      venueName: 'Main Auditorium',
      status: 'confirmed'
    },
    {
      id: 'ev2',
      festId: 'fest1',
      title: 'Keynote Lecture',
      category: 'technical',
      date: '2026-03-20',
      startTime: '11:00',
      endTime: '12:30',
      durationMinutes: 90,
      expectedParticipants: 400,
      estimatedCost: 20000,
      venueId: 'v1',
      venueName: 'Main Auditorium',
      status: 'confirmed'
    }
  ];

  const conflicts = detectEventConflicts(events, venues);
  assert.ok(conflicts.length >= 1);
  const overlap = conflicts.find(c => c.type === 'venue_overlap');
  assert.ok(overlap, 'Expected venue_overlap conflict');
  assert.equal(overlap?.severity, 'critical');
  assert.ok(overlap?.eventIds.includes('ev1'));
  assert.ok(overlap?.eventIds.includes('ev2'));
});

test('detectEventConflicts catches venue overcapacity', () => {
  const venues: Venue[] = [
    {
      id: 'v_lab',
      festId: 'fest1',
      name: 'CS Lab 3',
      location: 'IT Tower',
      capacity: 80,
      availableStart: '08:00',
      availableEnd: '20:00'
    }
  ];

  const events: FestEvent[] = [
    {
      id: 'ev_hack',
      festId: 'fest1',
      title: 'Overbooked Hackathon',
      category: 'technical',
      date: '2026-03-20',
      startTime: '10:00',
      endTime: '16:00',
      durationMinutes: 360,
      expectedParticipants: 250, // exceeds 80
      estimatedCost: 10000,
      venueId: 'v_lab',
      venueName: 'CS Lab 3',
      status: 'confirmed'
    }
  ];

  const conflicts = detectEventConflicts(events, venues);
  const capConflict = conflicts.find(c => c.type === 'capacity_exceeded');
  assert.ok(capConflict, 'Expected capacity_exceeded conflict');
  assert.ok(capConflict?.description.includes('overflow of 170 people'));
});

test('detectEventConflicts flags tight buffer (<30m)', () => {
  const venues: Venue[] = [
    {
      id: 'v1',
      festId: 'fest1',
      name: 'Main Auditorium',
      location: 'Block A',
      capacity: 1000,
      availableStart: '08:00',
      availableEnd: '22:00'
    }
  ];

  const events: FestEvent[] = [
    {
      id: 'ev1',
      festId: 'fest1',
      title: 'Robotics Showcase',
      category: 'technical',
      date: '2026-03-20',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      expectedParticipants: 200,
      estimatedCost: 5000,
      venueId: 'v1',
      status: 'confirmed'
    },
    {
      id: 'ev2',
      festId: 'fest1',
      title: 'Classical Solo Dance',
      category: 'cultural',
      date: '2026-03-20',
      startTime: '11:10', // 10m buffer only
      endTime: '12:00',
      durationMinutes: 50,
      expectedParticipants: 300,
      estimatedCost: 7000,
      venueId: 'v1',
      status: 'confirmed'
    }
  ];

  const conflicts = detectEventConflicts(events, venues);
  const bufferConflict = conflicts.find(c => c.type === 'buffer_violation');
  assert.ok(bufferConflict, 'Expected buffer_violation warning');
});

test('autoPlaceEvents places unscheduled events into fitting venues', () => {
  const venues: Venue[] = [
    {
      id: 'v_small',
      festId: 'fest1',
      name: 'Seminar Room 101',
      location: 'Library',
      capacity: 60,
      availableStart: '09:00',
      availableEnd: '17:00'
    },
    {
      id: 'v_aud',
      festId: 'fest1',
      name: 'Auditorium',
      location: 'Main Block',
      capacity: 500,
      availableStart: '09:00',
      availableEnd: '18:00'
    }
  ];

  const unassigned: FestEvent[] = [
    {
      id: 'ev_unassigned',
      festId: 'fest1',
      title: 'AI Prompt Engineering Workshop',
      category: 'workshop',
      date: '2026-03-21',
      startTime: '',
      endTime: '',
      durationMinutes: 90,
      expectedParticipants: 45,
      estimatedCost: 3000,
      status: 'proposed'
    }
  ];

  const result = autoPlaceEvents(unassigned, venues, [], ['2026-03-21']);
  assert.equal(result.updatedEvents.length, 1);
  assert.equal(result.updatedEvents[0].venueId, 'v_small'); // picks tightest fit
  assert.equal(result.updatedEvents[0].startTime, '09:00');
  assert.equal(result.updatedEvents[0].endTime, '10:30');
});
