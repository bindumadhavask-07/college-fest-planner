/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FestProvider, useFest } from './context/FestContext';
import { Header } from './components/Header';
import { ConflictAlertBanner } from './components/ConflictAlertBanner';
import { NotificationToast } from './components/NotificationToast';
import { OverviewTab } from './components/OverviewTab';
import { FestManagement } from './components/FestManagement';
import { EventManagement, EventModal } from './components/EventManagement';
import { VenueManagement } from './components/VenueManagement';
import { SmartScheduler } from './components/SmartScheduler';
import { BudgetPlanner } from './components/BudgetPlanner';
import { AiCopilot } from './components/AiCopilot';
import { FloatingFestChat } from './components/FloatingFestChat';
import { ActiveTab, FestEvent, Venue } from './types';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [editingEvent, setEditingEvent] = useState<FestEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const { venues, events, activeFest, saveEvent } = useFest();

  const handleOpenNewEvent = () => {
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (ev: FestEvent) => {
    setEditingEvent(ev);
    setIsEventModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewEvent={handleOpenNewEvent}
        onOpenNewVenue={() => setActiveTab('venues')}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ConflictAlertBanner onNavigateToScheduler={() => setActiveTab('scheduler')} />
        {activeTab === 'overview' && (
          <OverviewTab onNavigateTab={setActiveTab} onOpenNewEvent={handleOpenNewEvent} onOpenNewVenue={() => setActiveTab('venues')} />
        )}
        {activeTab === 'fests' && <FestManagement />}
        {activeTab === 'events' && <EventManagement />}
        {activeTab === 'venues' && <VenueManagement />}
        {activeTab === 'scheduler' && <SmartScheduler onOpenEditEvent={handleOpenEditEvent} />}
        {activeTab === 'budget' && <BudgetPlanner />}
        {activeTab === 'copilot' && <AiCopilot />}
      </main>
      <footer className="border-t border-slate-900 bg-[#07090F] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FESTOS AI &bull; Intelligent College Fest Planner &bull; Indian Engineering Colleges</span>
          <span className="text-slate-600">Powered by Cloud Firestore &bull; Google Auth &bull; Deterministic Conflict Engine</span>
        </div>
      </footer>
      <EventModal isOpen={isEventModalOpen} event={editingEvent} venues={venues} allEvents={events} defaultDate={activeFest.startDate || '2026-03-20'} onClose={() => setIsEventModalOpen(false)} onSave={saveEvent} />
      <NotificationToast />
      <FloatingFestChat />
    </div>
  );
};

export default function App() {
  return <FestProvider><MainAppContent /></FestProvider>;
}
