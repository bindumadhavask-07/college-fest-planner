/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFest } from '../context/FestContext';
import { Venue } from '../types';
import { formatINR } from '../utils/formatters';
import { calculateVenueUtilization } from '../utils/scheduler';
import {
  MapPin,
  Users,
  Clock,
  IndianRupee,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface VenueModalProps {
  venue: Partial<Venue> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (venue: Omit<Venue, 'id'> & { id?: string }) => Promise<void>;
}

const VenueModal: React.FC<VenueModalProps> = ({ venue, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Venue>>({
    name: '',
    location: '',
    capacity: 250,
    availableStart: '08:00',
    availableEnd: '22:00',
    pricingPerHour: 1500,
    facilities: []
  });
  const [facilityInput, setFacilityInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (venue) {
      setFormData({
        ...venue,
        facilities: venue.facilities || []
      });
    } else {
      setFormData({
        name: '',
        location: '',
        capacity: 250,
        availableStart: '08:00',
        availableEnd: '22:00',
        pricingPerHour: 1500,
        facilities: ['Audio System', 'Projector', 'WiFi 6']
      });
    }
  }, [venue, isOpen]);

  if (!isOpen) return null;

  const handleAddFacility = () => {
    if (!facilityInput.trim()) return;
    const current = formData.facilities || [];
    if (!current.includes(facilityInput.trim())) {
      setFormData({ ...formData, facilities: [...current, facilityInput.trim()] });
    }
    setFacilityInput('');
  };

  const handleRemoveFacility = (fac: string) => {
    setFormData({
      ...formData,
      facilities: (formData.facilities || []).filter(f => f !== fac)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.location?.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        festId: '', // Context will populate
        name: formData.name.trim(),
        location: formData.location.trim(),
        capacity: Number(formData.capacity) || 100,
        availableStart: formData.availableStart || '08:00',
        availableEnd: formData.availableEnd || '22:00',
        pricingPerHour: Number(formData.pricingPerHour) || 0,
        facilities: formData.facilities || [],
        id: venue?.id
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101524] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>{venue?.id ? 'Edit Campus Venue' : 'Register New Campus Venue'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Venue Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Main Convocation Hall, OAT, CS Lab 1"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Campus Location / Building <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.location || ''}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Central Academic Quad, Level 1"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seating Capacity <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.capacity ?? 200}
                onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hourly Maintenance (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.pricingPerHour ?? 0}
                onChange={e => setFormData({ ...formData, pricingPerHour: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Opens At (Daily)
              </label>
              <input
                type="time"
                value={formData.availableStart || '08:00'}
                onChange={e => setFormData({ ...formData, availableStart: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Closes At (Daily)
              </label>
              <input
                type="time"
                value={formData.availableEnd || '22:00'}
                onChange={e => setFormData({ ...formData, availableEnd: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Facilities & AV Equipment
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={facilityInput}
                onChange={e => setFacilityInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFacility();
                  }
                }}
                placeholder="e.g. Line array audio, 4K Projector, UPS backup"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <button
                type="button"
                onClick={handleAddFacility}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 rounded-xl transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {(formData.facilities || []).map(fac => (
                <span
                  key={fac}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-200 border border-slate-700"
                >
                  <span>{fac}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFacility(fac)}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const VenueManagement: React.FC = () => {
  const { venues, events, activeFest, saveVenue, deleteVenue } = useFest();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (venue: Venue) => {
    setSelectedVenue(venue);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedVenue(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (venue: Venue) => {
    const assignedEvents = events.filter(e => e.venueId === venue.id);
    let msg = `Are you sure you want to delete "${venue.name}"?`;
    if (assignedEvents.length > 0) {
      msg += ` Warning: ${assignedEvents.length} event(s) are currently scheduled here!`;
    }
    if (window.confirm(msg)) {
      await deleteVenue(venue.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#101524]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <span>Campus Venues & Facilities</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage halls, labs, auditoriums, capacity constraints, available operating windows, and rental rates.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl shadow-md shadow-cyan-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Campus Venue</span>
        </button>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {venues.map((venue) => {
          const assignedEvents = events.filter(e => e.venueId === venue.id && e.status !== 'cancelled');
          const date = activeFest.startDate || '2026-03-20';
          const utilization = calculateVenueUtilization(venue, events, date);

          return (
            <div
              key={venue.id}
              className="p-5 rounded-2xl border border-slate-800 bg-[#101524]/90 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>{venue.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{venue.location}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(venue)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit venue"
                      aria-label="Edit venue"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(venue)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete venue"
                      aria-label="Delete venue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specs Pill Row */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Capacity</span>
                    <span className="text-sm font-extrabold text-white">
                      {venue.capacity.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Daily Hours</span>
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {venue.availableStart || '08:00'} - {venue.availableEnd || '22:00'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Hourly Rate</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {venue.pricingPerHour ? formatINR(venue.pricingPerHour) : 'Free'}
                    </span>
                  </div>
                </div>

                {/* Facilities Badges */}
                <div className="mt-4">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Equipped Facilities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(venue.facilities || []).map((fac) => (
                      <span
                        key={fac}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/60"
                      >
                        {fac}
                      </span>
                    ))}
                    {(!venue.facilities || venue.facilities.length === 0) && (
                      <span className="text-[11px] text-slate-500 italic">No equipment tags added</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Utilization Meter */}
              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{assignedEvents.length} Program{assignedEvents.length === 1 ? '' : 's'} Booked</span>
                  </span>
                  <span className="font-semibold text-slate-300">
                    {utilization.percentage}% Day 1 Load
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      utilization.percentage > 85 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${utilization.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <VenueModal
        isOpen={isModalOpen}
        venue={selectedVenue}
        onClose={() => setIsModalOpen(false)}
        onSave={saveVenue}
      />
    </div>
  );
};
