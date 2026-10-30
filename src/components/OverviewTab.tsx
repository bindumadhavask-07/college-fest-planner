/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFest } from '../context/FestContext';
import { formatINR, formatCompactINR, formatDate } from '../utils/formatters';
import {
  Calendar,
  IndianRupee,
  MapPin,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Building2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface OverviewTabProps {
  onNavigateTab: (tab: any) => void;
  onOpenNewEvent: () => void;
  onOpenNewVenue: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onNavigateTab,
  onOpenNewEvent,
  onOpenNewVenue
}) => {
  const {
    activeFest,
    events,
    venues,
    budgetItems,
    conflicts,
    loadDemoData,
    runAutoScheduler
  } = useFest();

  // Metrics calculations
  const totalBudget = activeFest.totalBudget || 150000;
  const totalAllocated = budgetItems.reduce((acc, b) => acc + (b.allocatedAmount || 0), 0);
  const totalSpent = budgetItems.reduce((acc, b) => acc + (b.spentAmount || 0), 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetUtilization = Math.round((totalSpent / totalBudget) * 100);

  const totalCapacityAvailable = venues.reduce((acc, v) => acc + (v.capacity || 0), 0);
  const totalExpectedFootfall = events.reduce((acc, e) => acc + (e.expectedParticipants || 0), 0);

  const confirmedEvents = events.filter(e => e.status === 'confirmed');
  const unscheduledEvents = events.filter(e => !e.venueId || !e.startTime);

  // Category breakdown for chart
  const categoryData = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of budgetItems) {
      map.set(item.category, (map.get(item.category) || 0) + item.spentAmount);
    }
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }, [budgetItems]);

  const COLORS = ['#8B5CF6', '#6366F1', '#38BDF8', '#34D399', '#F59E0B', '#EC4899'];

  // Venue load breakdown
  const venueLoadData = React.useMemo(() => {
    return venues.map(v => {
      const vEvents = events.filter(e => e.venueId === v.id);
      return {
        name: v.name.length > 18 ? v.name.slice(0, 16) + '...' : v.name,
        eventsCount: vEvents.length,
        capacity: v.capacity
      };
    });
  }, [venues, events]);

  return (
    <div className="space-y-6">
      {/* Fest Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#121829] via-[#0E1322] to-[#0A0D14] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {activeFest.edition || 'Annual Edition'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 capitalize">
                Status: {activeFest.status}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {formatDate(activeFest.startDate)} — {formatDate(activeFest.endDate)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeFest.name}
            </h1>
            <p className="text-sm text-indigo-300/90 font-medium flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>{activeFest.collegeName}</span>
            </p>
            {activeFest.description && (
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl line-clamp-2 leading-relaxed pt-1">
                {activeFest.description}
              </p>
            )}
          </div>

          {/* Quick Header CTA buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={() => onNavigateTab('fests')}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
              Configure Fest
            </button>
            <button
              onClick={onOpenNewEvent}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              + Create Event
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div
          onClick={() => onNavigateTab('events')}
          className="group p-5 rounded-2xl border border-slate-800 bg-[#101524]/80 hover:border-violet-500/40 hover:bg-[#131a2e] transition-all cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Fest Events</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-white">{events.length}</span>
            <span className="text-xs text-emerald-400 font-medium">
              {confirmedEvents.length} Confirmed
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{unscheduledEvents.length} Unscheduled</span>
            <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center">
              View events <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Budget Usage */}
        <div
          onClick={() => onNavigateTab('budget')}
          className="group p-5 rounded-2xl border border-slate-800 bg-[#101524]/80 hover:border-emerald-500/40 hover:bg-[#131a2e] transition-all cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Fest Budget</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-white">{formatINR(totalBudget)}</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Spent: {formatCompactINR(totalSpent)}</span>
              <span className={remainingBudget < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                Rem: {formatCompactINR(remainingBudget)}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  budgetUtilization > 95 ? 'bg-rose-500' : budgetUtilization > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Venues Available */}
        <div
          onClick={() => onNavigateTab('venues')}
          className="group p-5 rounded-2xl border border-slate-800 bg-[#101524]/80 hover:border-cyan-500/40 hover:bg-[#131a2e] transition-all cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Campus Venues</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-white">{venues.length}</span>
            <span className="text-xs text-slate-400">Venues Active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Peak Capacity: {totalCapacityAvailable.toLocaleString('en-IN')}</span>
            <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center">
              Manage <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Schedule Conflicts */}
        <div
          onClick={() => onNavigateTab('scheduler')}
          className={`group p-5 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            conflicts.length > 0
              ? 'border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/30'
              : 'border-slate-800 bg-[#101524]/80 hover:border-indigo-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Schedule Integrity</span>
            <div
              className={`p-2 rounded-xl ${
                conflicts.length > 0
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {conflicts.length > 0 ? (
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-2xl font-extrabold ${conflicts.length > 0 ? 'text-rose-300' : 'text-emerald-400'}`}>
              {conflicts.length}
            </span>
            <span className="text-xs text-slate-400">
              {conflicts.length === 0 ? 'Zero Conflicts' : 'Conflicts Found'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{unscheduledEvents.length} unscheduled</span>
            <span className="text-violet-400 group-hover:translate-x-0.5 transition-transform flex items-center">
              Open Timeline <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Allocation Pie Chart */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-[#101524]/90 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Expense Distribution by Category</h3>
              <p className="text-xs text-slate-400 mt-0.5">Calculated in Indian Rupees (INR ₹)</p>
            </div>
            <button
              onClick={() => onNavigateTab('budget')}
              className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              Full Budget →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatINR(Number(value)), 'Spent']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-2 text-[11px]">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-slate-300 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Venue Load Bar Chart */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-[#101524]/90 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Venue Activity & Event Density</h3>
              <p className="text-xs text-slate-400 mt-0.5">Events hosted per venue</p>
            </div>
            <button
              onClick={() => onNavigateTab('venues')}
              className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              All Venues →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={venueLoadData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} Events`, 'Assigned']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="eventsCount" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Expected Footfall: <strong className="text-white">{totalExpectedFootfall}</strong></span>
            <span>Capacity Limit: <strong className="text-white">{totalCapacityAvailable}</strong></span>
          </div>
        </div>
      </div>

      {/* Featured Schedule Preview & Quick Planner Actions */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#101524]/80 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Upcoming Fest Programs</h3>
            <p className="text-xs text-slate-400">Next scheduled competitions and keynote sessions</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={runAutoScheduler}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Smart Placement</span>
            </button>
            <button
              onClick={() => onNavigateTab('scheduler')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:text-white bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg transition-all"
            >
              <span>Full Schedule</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {events.slice(0, 4).map((event) => (
            <div key={event.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-violet-400 flex-shrink-0">
                  {event.category.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white hover:text-violet-300 transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                    <span>{formatDate(event.date)}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{event.startTime || 'TBD'} - {event.endTime || 'TBD'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{event.venueName || 'Unassigned Venue'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <span className="text-xs font-medium text-slate-300">
                  {formatINR(event.estimatedCost)}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                  {event.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
