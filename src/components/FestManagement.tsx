/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFest } from '../context/FestContext';
import { Fest } from '../types';
import { formatINR } from '../utils/formatters';
import {
  Building2,
  Calendar,
  IndianRupee,
  Users,
  CheckCircle,
  FolderSync,
  Save,
  Plus,
  Tag,
  X
} from 'lucide-react';

export const FestManagement: React.FC = () => {
  const { activeFest, fests, selectFest, saveFest, loadDemoData, isDemoMode } = useFest();

  const [formData, setFormData] = useState<Partial<Fest>>({
    name: activeFest.name,
    collegeName: activeFest.collegeName,
    edition: activeFest.edition || '',
    startDate: activeFest.startDate,
    endDate: activeFest.endDate,
    totalBudget: activeFest.totalBudget,
    description: activeFest.description || '',
    status: activeFest.status,
    committee: activeFest.committee || []
  });

  const [newCommitteeMember, setNewCommitteeMember] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if activeFest switches
  React.useEffect(() => {
    setFormData({
      name: activeFest.name,
      collegeName: activeFest.collegeName,
      edition: activeFest.edition || '',
      startDate: activeFest.startDate,
      endDate: activeFest.endDate,
      totalBudget: activeFest.totalBudget,
      description: activeFest.description || '',
      status: activeFest.status,
      committee: activeFest.committee || []
    });
  }, [activeFest]);

  const handleAddCommittee = () => {
    if (!newCommitteeMember.trim()) return;
    const current = formData.committee || [];
    if (!current.includes(newCommitteeMember.trim())) {
      setFormData({ ...formData, committee: [...current, newCommitteeMember.trim()] });
    }
    setNewCommitteeMember('');
  };

  const handleRemoveCommittee = (item: string) => {
    setFormData({
      ...formData,
      committee: (formData.committee || []).filter(c => c !== item)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveFest({
        ...formData,
        id: activeFest.id
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewFest = async () => {
    const newFestTitle = prompt('Enter New College Fest Name:', 'Vidyut 2026');
    if (!newFestTitle) return;
    await saveFest({
      name: newFestTitle,
      collegeName: 'College of Engineering & Technology',
      edition: '1st Edition',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      totalBudget: 150000,
      description: 'Annual college cultural and technical symposium.',
      status: 'planning',
      committee: ['Core Committee', 'Technical Club']
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner & Fest Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#101524]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>College Fest Profile & Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage festival metadata, date spans, multi-department committee, and overall budget allocation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadDemoData}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
          >
            <FolderSync className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Demo Fest</span>
          </button>
          <button
            onClick={handleCreateNewFest}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Fest</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-800 bg-[#101524]/90 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Fest Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Fest Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. TechNova 2026, Mood Indigo, Incident"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* College / University Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              College / University Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.collegeName || ''}
              onChange={e => setFormData({ ...formData, collegeName: e.target.value })}
              placeholder="e.g. National Institute of Technology Karnataka (NITK) Surathkal"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Edition / Tagline */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Edition / Subtitle
            </label>
            <input
              type="text"
              value={formData.edition || ''}
              onChange={e => setFormData({ ...formData, edition: e.target.value })}
              placeholder="e.g. 18th Annual National Techno-Cultural Fest"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Planning Status
            </label>
            <select
              value={formData.status || 'planning'}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="draft">Draft (Internal brainstorming)</option>
              <option value="planning">Planning (Events & budget in progress)</option>
              <option value="live">Live (Fest is currently ongoing!)</option>
              <option value="concluded">Concluded (Archived)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Fest Start Date <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={formData.startDate || ''}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Fest End Date <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={formData.endDate || ''}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Total Budget in INR */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Total Fest Sanctioned Budget (INR ₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={formData.totalBudget ?? 150000}
                onChange={e => setFormData({ ...formData, totalBudget: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Currently set to: <strong className="text-emerald-400">{formatINR(formData.totalBudget)}</strong>
            </p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Fest Description & Overview
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Highlight overarching theme, guest keynote speakers, sponsor details, and student participation target..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
            />
          </div>

          {/* Committee / Departments List */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Organizing Committees & Councils
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCommitteeMember}
                onChange={e => setNewCommitteeMember(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCommittee();
                  }
                }}
                placeholder="Add committee (e.g. Technical Council, Stage & Lights, Security)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="button"
                onClick={handleAddCommittee}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 rounded-xl transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(formData.committee || []).map(comm => (
                <span
                  key={comm}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700"
                >
                  <span>{comm}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCommittee(comm)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Fest Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
