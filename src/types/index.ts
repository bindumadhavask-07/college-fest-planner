/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Venue, FestEvent, ConflictReport, EventCategory, EventStatus, ConflictSeverity, ConflictType } from '../utils/scheduler';

export interface Fest {
  id: string;
  name: string;
  collegeName: string;
  edition?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalBudget: number; // in INR
  description?: string;
  status: 'draft' | 'planning' | 'live' | 'concluded';
  ownerId: string;
  ownerEmail?: string;
  committee?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetItem {
  id: string;
  festId: string;
  category: 'Tech Infrastructure' | 'Prize Pool' | 'Celebrity & Artists' | 'Stage & AV Production' | 'Logistics & Hospitality' | 'Marketing & PR' | string;
  title: string;
  allocatedAmount: number;
  spentAmount: number;
  notes?: string;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  error?: boolean;
}

export type ActiveTab = 'overview' | 'fests' | 'events' | 'venues' | 'scheduler' | 'budget' | 'copilot' | 'campus-map';

export type {
  Venue,
  FestEvent,
  ConflictReport,
  EventCategory,
  EventStatus,
  ConflictSeverity,
  ConflictType
};
