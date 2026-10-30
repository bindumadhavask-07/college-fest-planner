/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFest } from '../context/FestContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification, clearNotification } = useFest();

  if (!notification) return null;

  const bgStyles = {
    success: 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-900/30',
    error: 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-900/30',
    info: 'bg-slate-900/90 text-slate-200 border-indigo-500/40 shadow-indigo-900/30'
  }[notification.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info
  }[notification.type];

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className={`flex items-start space-x-3 p-3.5 rounded-xl border backdrop-blur-md shadow-lg ${bgStyles}`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs font-medium pr-2 leading-relaxed">
          {notification.message}
        </div>
        <button
          onClick={clearNotification}
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
