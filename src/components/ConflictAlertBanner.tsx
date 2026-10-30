/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFest } from '../context/FestContext';
import { AlertOctagon, AlertTriangle, Info, ChevronDown, ChevronUp, ArrowRight, Wand2 } from 'lucide-react';

interface ConflictAlertBannerProps {
  onNavigateToScheduler: () => void;
}

export const ConflictAlertBanner: React.FC<ConflictAlertBannerProps> = ({ onNavigateToScheduler }) => {
  const { conflicts, runAutoScheduler } = useFest();
  const [expanded, setExpanded] = useState(false);

  if (!conflicts || conflicts.length === 0) return null;

  const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
  const highCount = conflicts.filter(c => c.severity === 'high').length;
  const warningCount = conflicts.filter(c => c.severity === 'warning').length;

  return (
    <div className="mb-6 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900/60 to-amber-950/30 backdrop-blur-md p-4 sm:p-5 shadow-lg shadow-rose-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex-shrink-0 mt-0.5">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h3 className="text-sm font-semibold text-rose-200">
                {conflicts.length} Active Schedule Conflict{conflicts.length > 1 ? 's' : ''} Detected
              </h3>
              <div className="flex items-center space-x-1.5 text-[11px]">
                {criticalCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    {criticalCount} Overlap{criticalCount > 1 ? 's' : ''}
                  </span>
                )}
                {highCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                    {highCount} Overcapacity
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {warningCount} Buffer Alert{warningCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Events have overlapping venue bookings or exceed maximum room capacity. Resolve manually or run the Smart Scheduler.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
          <button
            onClick={() => runAutoScheduler()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Auto-Resolve</span>
          </button>
          <button
            onClick={onNavigateToScheduler}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
          >
            <span>Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label={expanded ? "Collapse conflict list" : "Expand conflict list"}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2.5">
          {conflicts.map((c) => {
            const isCrit = c.severity === 'critical';
            return (
              <div
                key={c.id}
                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  isCrit
                    ? 'bg-rose-950/30 border-rose-500/25 text-rose-200'
                    : 'bg-amber-950/20 border-amber-500/25 text-amber-200'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  {isCrit ? (
                    <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">{c.title}</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{c.description}</p>
                    <p className="text-slate-400 mt-1 italic">💡 {c.recommendation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
