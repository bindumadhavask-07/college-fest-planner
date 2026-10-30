/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFest } from '../context/FestContext';
import { ActiveTab } from '../types';
import {
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  IndianRupee,
  Bot,
  LayoutDashboard,
  AlertTriangle,
  LogIn,
  LogOut,
  FolderSync,
  ChevronDown,
  Building2
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewEvent: () => void;
  onOpenNewVenue: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewEvent,
  onOpenNewVenue
}) => {
  const {
    user,
    signInWithGoogle,
    signOutUser,
    activeFest,
    fests,
    selectFest,
    loadDemoData,
    conflicts,
    isDemoMode
  } = useFest();

  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'fests', label: 'Fest Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { id: 'venues', label: 'Venues', icon: <MapPin className="w-4 h-4" /> },
    {
      id: 'scheduler',
      label: 'Scheduler',
      icon: <Clock className="w-4 h-4" />,
      badge: conflicts.length > 0 ? conflicts.length : undefined
    },
    { id: 'budget', label: 'Budget Planner', icon: <IndianRupee className="w-4 h-4" /> },
    { id: 'copilot', label: 'AI Copilot', icon: <Bot className="w-4 h-4" /> }
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0A0D14]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Fest Selector */}
          <div className="flex items-center space-x-4">
            <div
              onClick={() => setActiveTab('overview')}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/35 transition-all">
                <div className="w-full h-full bg-[#0E131F] rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    FESTOS
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Campus Fest Planner
                </p>
              </div>
            </div>

            {/* Active Fest Selector dropdown */}
            <div className="relative group hidden md:block">
              <select
                aria-label="Active College Fest"
                value={activeFest.id}
                onChange={(e) => selectFest(e.target.value)}
                className="appearance-none bg-slate-900/80 hover:bg-slate-800/90 text-xs text-slate-200 border border-slate-700/80 rounded-lg pl-3 pr-8 py-1.5 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
              >
                {fests.map(f => (
                  <option key={f.id} value={f.id} className="bg-slate-900 text-slate-200">
                    {f.name} ({f.startDate.slice(0, 4) || '2026'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {isDemoMode && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hidden lg:inline-flex items-center space-x-1">
                <span>Demo Fest Active</span>
              </span>
            )}
          </div>

          {/* Action Bar & User Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Quick Demo Reset Button */}
            <button
              onClick={loadDemoData}
              title="Reload TechNova 2026 Demo Dataset"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-all"
            >
              <FolderSync className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Demo Fest</span>
            </button>

            {/* Conflicts Alert Indicator */}
            {conflicts.length > 0 && (
              <button
                onClick={() => setActiveTab('scheduler')}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  criticalConflicts.length > 0
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25 animate-pulse'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}</span>
              </button>
            )}

            {/* New Event Shortcut */}
            <button
              onClick={onOpenNewEvent}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>+ Event</span>
            </button>

            {/* Auth / Profile */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Coordinator'}
                    className="w-7 h-7 rounded-full border border-violet-400/40 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-violet-600/40 border border-violet-500 text-violet-200 flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={signOutUser}
                  title="Sign out of Firebase"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Google Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-800/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-violet-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
