/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { FestEvent, EventCategory, EventStatus, Venue } from '../types';
import { formatINR, formatDate, formatTime12 } from '../utils/formatters';
import { isTimeOverlap, timeToMinutes } from '../utils/scheduler';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  IndianRupee,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Tag,
  Phone,
  User,
  X,
  Sparkles
} from 'lucide-react';

interface EventModalProps {
  event: Partial<FestEvent> | null;
  isOpen: boolean;
  venues: Venue[];
  allEvents: FestEvent[];
  defaultDate: string;
  onClose: () => void;
  onSave: (event: Omit<FestEvent, 'id'> & { id?: string }) => Promise<void>;
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  isOpen,
  venues,
  allEvents,
  defaultDate,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<FestEvent>>({
    title: '',
    category: 'technical',
    department: 'Technical Affairs Council',
    date: defaultDate || '2026-03-20',
    startTime: '10:00',
    endTime: '12:00',
    durationMinutes: 120,
    expectedParticipants: 100,
    estimatedCost: 15000,
    venueId: venues[0]?.id || '',
    requiredResources: [],
    leadCoordinator: '',
    leadContact: '',
    status: 'confirmed'
  });

  const [resourceInput, setResourceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        requiredResources: event.requiredResources || []
      });
    } else {
      setFormData({
        title: '',
        category: 'technical',
        department: 'Technical Affairs Council',
        date: defaultDate || '2026-03-20',
        startTime: '10:00',
        endTime: '12:00',
        durationMinutes: 120,
        expectedParticipants: 100,
        estimatedCost: 15000,
        venueId: venues[0]?.id || '',
        requiredResources: ['Stage Mics', 'Projector'],
        leadCoordinator: '',
        leadContact: '',
        status: 'confirmed'
      });
    }
  }, [event, isOpen, defaultDate, venues]);

  // Live pre-flight conflict check inside the modal
  const liveConflictWarning = useMemo(() => {
    if (!formData.venueId || !formData.date || !formData.startTime || !formData.endTime) {
      return null;
    }

    const selectedVenue = venues.find(v => v.id === formData.venueId);
    if (!selectedVenue) return null;

    // Check capacity
    const participants = Number(formData.expectedParticipants) || 0;
    if (participants > selectedVenue.capacity) {
      return {
        severity: 'high',
        text: `Overcapacity Warning: ${participants} participants exceeds ${selectedVenue.name} limit (${selectedVenue.capacity}).`
      };
    }

    // Check overlaps with other events on same date & venue
    const conflictingEvent = allEvents.find(e => {
      if (e.id === event?.id) return false;
      if (e.venueId !== formData.venueId || e.date !== formData.date) return false;
      if (e.status === 'cancelled') return false;
      return isTimeOverlap(formData.startTime!, formData.endTime!, e.startTime, e.endTime);
    });

    if (conflictingEvent) {
      return {
        severity: 'critical',
        text: `Schedule Conflict: Collides with "${conflictingEvent.title}" (${conflictingEvent.startTime} - ${conflictingEvent.endTime}) at this venue.`
      };
    }

    return null;
  }, [formData, venues, allEvents, event]);

  if (!isOpen) return null;

  const handleAddResource = () => {
    if (!resourceInput.trim()) return;
    const current = formData.requiredResources || [];
    if (!current.includes(resourceInput.trim())) {
      setFormData({ ...formData, requiredResources: [...current, resourceInput.trim()] });
    }
    setResourceInput('');
  };

  const handleRemoveResource = (res: string) => {
    setFormData({
      ...formData,
      requiredResources: (formData.requiredResources || []).filter(r => r !== res)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    setIsSubmitting(true);

    const s = timeToMinutes(formData.startTime || '10:00');
    const end = timeToMinutes(formData.endTime || '12:00');
    const calcDuration = Math.max(15, end - s);

    try {
      await onSave({
        festId: '', // Context will inject activeFest.id
        title: formData.title.trim(),
        category: formData.category || 'technical',
        department: formData.department?.trim() || 'General Committee',
        date: formData.date || defaultDate,
        startTime: formData.startTime || '10:00',
        endTime: formData.endTime || '12:00',
        durationMinutes: calcDuration,
        expectedParticipants: Number(formData.expectedParticipants) || 50,
        estimatedCost: Number(formData.estimatedCost) || 0,
        venueId: formData.venueId || undefined,
        requiredResources: formData.requiredResources || [],
        leadCoordinator: formData.leadCoordinator?.trim() || '',
        leadContact: formData.leadContact?.trim() || '',
        status: (formData.status as EventStatus) || 'confirmed',
        id: event?.id
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101524] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span>{event?.id ? 'Edit Fest Event' : 'Create New College Fest Event'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Pre-flight Conflict Warning */}
        {liveConflictWarning && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center space-x-2.5 ${
              liveConflictWarning.severity === 'critical'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{liveConflictWarning.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Event Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. CodeSprint 24-hr Hackathon, Battle of the Bands"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category || 'technical'}
                onChange={e => setFormData({ ...formData, category: e.target.value as EventCategory })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="technical">Technical / Hackathon / Robotics</option>
                <option value="cultural">Cultural / Dance / Music Society</option>
                <option value="sports">Sports & Athletics</option>
                <option value="workshop">Hands-on Workshop / Masterclass</option>
                <option value="gaming">Esports & Gaming</option>
                <option value="keynote">Distinguished Keynote / Panel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organizing Club / Dept
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Department of CSE, IEEE Branch"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Event Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date || defaultDate}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Time <span className="text-rose-400">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.startTime || '10:00'}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                End Time <span className="text-rose-400">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.endTime || '12:00'}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assigned Venue
              </label>
              <select
                value={formData.venueId || ''}
                onChange={e => setFormData({ ...formData, venueId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="">-- Unassigned (Schedule Later) --</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} (Cap: {v.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Expected Footfall <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.expectedParticipants ?? 50}
                onChange={e => setFormData({ ...formData, expectedParticipants: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estimated Cost (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.estimatedCost ?? 0}
                onChange={e => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Student Coordinator Name
              </label>
              <input
                type="text"
                value={formData.leadCoordinator || ''}
                onChange={e => setFormData({ ...formData, leadCoordinator: e.target.value })}
                placeholder="e.g. Rohan Sharma"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Coordinator Contact / Phone
              </label>
              <input
                type="text"
                value={formData.leadContact || ''}
                onChange={e => setFormData({ ...formData, leadContact: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Program Status
              </label>
              <select
                value={formData.status || 'confirmed'}
                onChange={e => setFormData({ ...formData, status: e.target.value as EventStatus })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="proposed">Proposed (Under review)</option>
                <option value="confirmed">Confirmed (Scheduled)</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Equipment & Resource Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Required Logistics & AV Gear
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={resourceInput}
                onChange={e => setResourceInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddResource();
                  }
                }}
                placeholder="e.g. LAN switches, Power strips, Lapel mics, Barricades"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <button
                type="button"
                onClick={handleAddResource}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 rounded-xl transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {(formData.requiredResources || []).map(r => (
                <span
                  key={r}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-200 border border-slate-700"
                >
                  <span>{r}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(r)}
                    className="text-slate-400 hover:text-rose-400 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EventManagement: React.FC<{ onOpenModalDirect?: boolean }> = () => {
  const { events, venues, activeFest, saveEvent, deleteEvent } = useFest();
  const [selectedEvent, setSelectedEvent] = useState<FestEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.department && e.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.leadCoordinator && e.leadCoordinator.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchVenue = venueFilter === 'all' || e.venueId === venueFilter;

      return matchSearch && matchCategory && matchVenue;
    });
  }, [events, searchQuery, categoryFilter, venueFilter]);

  const handleEdit = (ev: FestEvent) => {
    setSelectedEvent(ev);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (ev: FestEvent) => {
    if (window.confirm(`Delete event "${ev.title}"?`)) {
      await deleteEvent(ev.id);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'technical':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'cultural':
        return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
      case 'gaming':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'keynote':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'workshop':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#101524]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            <span>Fest Event Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add, update, reschedule, and budget competitions, hackathons, concerts, and workshops.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-[#101524]/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by event title, coordinator, or club..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            aria-label="Filter events by category"
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical / Hackathon</option>
            <option value="cultural">Cultural / Arts</option>
            <option value="keynote">Keynotes / Panels</option>
            <option value="workshop">Workshops</option>
            <option value="gaming">Esports</option>
          </select>

          <select
            value={venueFilter}
            onChange={e => setVenueFilter(e.target.value)}
            aria-label="Filter events by venue"
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="all">All Venues</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map((ev) => {
          const venue = venues.find(v => v.id === ev.venueId);

          return (
            <div
              key={ev.id}
              className="p-5 rounded-2xl border border-slate-800 bg-[#101524]/90 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(ev.category)}`}>
                    {ev.category}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(ev)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                      title="Edit event"
                      aria-label="Edit event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ev)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                      title="Delete event"
                      aria-label="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mt-2.5 line-clamp-1">
                  {ev.title}
                </h3>
                {ev.department && (
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {ev.department}
                  </p>
                )}

                {/* Logistics Info Row */}
                <div className="mt-3.5 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDate(ev.date)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatTime12(ev.startTime)} - {formatTime12(ev.endTime)} ({ev.durationMinutes}m)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className={venue ? 'text-cyan-300' : 'text-amber-400 italic'}>
                      {venue ? venue.name : 'No Venue Assigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="flex items-center space-x-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ev.expectedParticipants} Participants</span>
                    </span>
                    <span className="font-semibold text-emerald-400">
                      {formatINR(ev.estimatedCost)}
                    </span>
                  </div>
                </div>

                {/* Resources tags */}
                {ev.requiredResources && ev.requiredResources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {ev.requiredResources.slice(0, 3).map((r, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700/50"
                      >
                        {r}
                      </span>
                    ))}
                    {ev.requiredResources.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{ev.requiredResources.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Coordinator bar */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[150px]">
                  Coord: <strong className="text-slate-200">{ev.leadCoordinator || 'TBD'}</strong>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize">
                  {ev.status}
                </span>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="col-span-full p-8 rounded-2xl border border-dashed border-slate-800 text-center">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No matching events found</p>
            <p className="text-xs text-slate-500 mt-1">Adjust search parameters or create a new event</p>
          </div>
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        event={selectedEvent}
        venues={venues}
        allEvents={events}
        defaultDate={activeFest.startDate || '2026-03-20'}
        onClose={() => setIsModalOpen(false)}
        onSave={saveEvent}
      />
    </div>
  );
};
