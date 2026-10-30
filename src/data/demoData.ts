/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fest, Venue, FestEvent, BudgetItem } from '../types';

export const DEMO_FEST_ID = 'fest_technova_2026';

export const DEMO_FEST: Fest = {
  id: DEMO_FEST_ID,
  name: 'TechNova 2026',
  collegeName: 'National Institute of Technology Karnataka (NITK) Surathkal',
  edition: '18th Annual National Tech-Cultural Fest',
  startDate: '2026-03-20',
  endDate: '2026-03-22',
  totalBudget: 150000, // INR 1,50,000
  description: 'Annual flagship techno-cultural extravaganza bringing together 4,000+ students from 50+ engineering colleges across India. Featuring cutting-edge hackathons, national robotics arena, parliamentary debates, high-energy pro-nites, and AI research summits.',
  status: 'planning',
  ownerId: 'demo_user',
  ownerEmail: 'convenor@technova.ac.in',
  committee: [
    'Technical Affairs Council',
    'Cultural & Fine Arts Society',
    'Logistics & Venue Operations',
    'Finance & Sponsorship Board',
    'Security & Crowd Control'
  ],
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-03-01T15:30:00Z'
};

export const DEMO_VENUES: Venue[] = [
  {
    id: 'venue_convocation_hall',
    festId: DEMO_FEST_ID,
    name: 'Main Convocation Auditorium',
    location: 'Central Campus Quadrangle, Level 1',
    capacity: 1200,
    availableStart: '08:00',
    availableEnd: '22:00',
    pricingPerHour: 3500,
    facilities: [
      'Line Array Concert Audio',
      'Dual 4K Laser Projection',
      'Green Rooms (2x)',
      'High-Power HVAC System',
      'Backstage DMX Lighting Rig',
      'Press / Media Gallery'
    ],
    ownerId: 'demo_user',
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-01-15T10:30:00Z'
  },
  {
    id: 'venue_oat_grounds',
    festId: DEMO_FEST_ID,
    name: 'Open Air Theatre (OAT)',
    location: 'Lakeside Amphitheatre Complex',
    capacity: 2500,
    availableStart: '16:00',
    availableEnd: '23:00',
    pricingPerHour: 5000,
    facilities: [
      'Heavy Concert Sound Rig',
      'High-Voltage Strobe & Beam Towers',
      'Reinforced Metal Barricading',
      'VIP Tier Seating',
      'Dedicated Ambulance & Fire Exits',
      'Live Generator Backup'
    ],
    ownerId: 'demo_user',
    createdAt: '2026-01-15T10:35:00Z',
    updatedAt: '2026-01-15T10:35:00Z'
  },
  {
    id: 'venue_kalam_seminar',
    festId: DEMO_FEST_ID,
    name: 'Dr. APJ Abdul Kalam Seminar Complex',
    location: 'Mechanical Engineering Block, Ground Floor',
    capacity: 250,
    availableStart: '09:00',
    availableEnd: '18:00',
    pricingPerHour: 1200,
    facilities: [
      'Smart Touch Podiums',
      'Dual Synchronized TV Panels',
      'Acoustic Ceiling Baffles',
      'Tiered Executive Seating',
      'Dedicated Wireless Microphones (4x)',
      'Campus WiFi 6 Hotspot'
    ],
    ownerId: 'demo_user',
    createdAt: '2026-01-15T10:40:00Z',
    updatedAt: '2026-01-15T10:40:00Z'
  },
  {
    id: 'venue_turing_labs',
    festId: DEMO_FEST_ID,
    name: 'Alan Turing Computing Center',
    location: 'Computer Science & Engineering Tower, 3rd Floor',
    capacity: 120,
    availableStart: '08:30',
    availableEnd: '21:00',
    pricingPerHour: 1800,
    facilities: [
      '120 Intel i7 Workstations with RTX GPUs',
      '10 Gbps Redundant Optical Fibre LAN',
      '40 kVA Industrial Online UPS',
      'Hardware Prototyping Benches',
      'Central Climate Control',
      'Biometric Access Control'
    ],
    ownerId: 'demo_user',
    createdAt: '2026-01-15T10:45:00Z',
    updatedAt: '2026-01-15T10:45:00Z'
  }
];

export const DEMO_EVENTS: FestEvent[] = [
  {
    id: 'event_keynote_agi',
    festId: DEMO_FEST_ID,
    title: 'Future of AGI & Quantum Computing Keynote',
    category: 'keynote',
    department: 'Technical Affairs Council & IEEE Student Branch',
    date: '2026-03-20',
    startTime: '09:30',
    endTime: '11:30',
    durationMinutes: 120,
    expectedParticipants: 850,
    estimatedCost: 22000,
    venueId: 'venue_convocation_hall',
    venueName: 'Main Convocation Auditorium',
    requiredResources: ['Dual 4K Projector', '2 Lapel Mics', 'Stage Podium', 'Memento Plaques'],
    leadCoordinator: 'Rohan Sharma',
    leadContact: '+91 98765 43210',
    status: 'confirmed',
    ownerId: 'demo_user',
    createdAt: '2026-01-20T11:00:00Z',
    updatedAt: '2026-01-20T11:00:00Z'
  },
  {
    id: 'event_codesprint',
    festId: DEMO_FEST_ID,
    title: 'CodeSprint 24-Hour AI Hackathon',
    category: 'technical',
    department: 'Department of Computer Science & Engineering',
    date: '2026-03-20',
    startTime: '10:00',
    endTime: '18:00',
    durationMinutes: 480,
    expectedParticipants: 100,
    estimatedCost: 35000,
    venueId: 'venue_turing_labs',
    venueName: 'Alan Turing Computing Center',
    requiredResources: ['10 Gbps Switch ports', 'Power Strips', 'Snack Counter', 'Red Bull Dispensers', 'API Credits'],
    leadCoordinator: 'Ananya Iyer',
    leadContact: '+91 98450 11223',
    status: 'confirmed',
    ownerId: 'demo_user',
    createdAt: '2026-01-20T11:15:00Z',
    updatedAt: '2026-01-20T11:15:00Z'
  },
  {
    id: 'event_debate',
    festId: DEMO_FEST_ID,
    title: 'National Parliamentary Debate: Tech Ethics',
    category: 'cultural',
    department: 'Literary & Debating Society',
    date: '2026-03-20',
    startTime: '12:00',
    endTime: '15:00',
    durationMinutes: 180,
    expectedParticipants: 120,
    estimatedCost: 8000,
    venueId: 'venue_kalam_seminar',
    venueName: 'Dr. APJ Abdul Kalam Seminar Complex',
    requiredResources: ['Podium Microphones (4x)', 'Timer Display System', 'Certificates & Trophies'],
    leadCoordinator: 'Tanvi Nair',
    leadContact: '+91 97412 88990',
    status: 'confirmed',
    ownerId: 'demo_user',
    createdAt: '2026-01-20T11:30:00Z',
    updatedAt: '2026-01-20T11:30:00Z'
  },
  {
    id: 'event_robowars',
    festId: DEMO_FEST_ID,
    title: 'Electro-Combat: RoboWars Heavyweight Arena',
    category: 'technical',
    department: 'Robotics & Automation Club',
    date: '2026-03-20',
    startTime: '16:00',
    endTime: '18:00',
    durationMinutes: 120,
    expectedParticipants: 350,
    estimatedCost: 25000,
    venueId: 'venue_oat_grounds',
    venueName: 'Open Air Theatre (OAT)',
    requiredResources: ['Polycarbonate Combat Arena', 'CO2 Fire Extinguishers', 'Battery Charging Bay', 'Safety Helmets'],
    leadCoordinator: 'Vikramaditya Verma',
    leadContact: '+91 99160 55443',
    status: 'confirmed',
    ownerId: 'demo_user',
    createdAt: '2026-01-20T11:45:00Z',
    updatedAt: '2026-01-20T11:45:00Z'
  },
  {
    id: 'event_rockband',
    festId: DEMO_FEST_ID,
    title: 'Battle of the Bands: Rock-O-Phonia',
    category: 'cultural',
    department: 'Music & Fine Arts Society',
    date: '2026-03-20',
    startTime: '18:30',
    endTime: '22:30',
    durationMinutes: 240,
    expectedParticipants: 1800,
    estimatedCost: 40000,
    venueId: 'venue_oat_grounds',
    venueName: 'Open Air Theatre (OAT)',
    requiredResources: ['Drum Kit', 'Marshall Guitar Amplifiers (4x)', 'Stage Fog Machines', 'Crowd Barricades'],
    leadCoordinator: 'Siddharth Rao',
    leadContact: '+91 96200 44332',
    status: 'confirmed',
    ownerId: 'demo_user',
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-01-20T12:00:00Z'
  },
  {
    id: 'event_valorant',
    festId: DEMO_FEST_ID,
    title: 'Valorant Inter-College LAN Championship',
    category: 'gaming',
    department: 'Campus Esports & Gaming Guild',
    date: '2026-03-21',
    startTime: '11:00',
    endTime: '16:00',
    durationMinutes: 300,
    expectedParticipants: 64,
    estimatedCost: 12000,
    venueId: 'venue_turing_labs',
    venueName: 'Alan Turing Computing Center',
    requiredResources: ['144Hz Gaming Monitors', 'Mechanical Keyboards', 'Live Twitch Caster Setup', 'Championship Trophy'],
    leadCoordinator: 'Karthik Menon',
    leadContact: '+91 98860 33221',
    status: 'confirmed',
    ownerId: 'demo_user',
    createdAt: '2026-01-20T12:15:00Z',
    updatedAt: '2026-01-20T12:15:00Z'
  }
];

export const DEMO_BUDGET_ITEMS: BudgetItem[] = [
  {
    id: 'budget_tech_infra',
    festId: DEMO_FEST_ID,
    category: 'Tech Infrastructure',
    title: 'Hackathon Cloud Servers, LAN & Hardware Prototyping Kits',
    allocatedAmount: 35000,
    spentAmount: 28500,
    notes: 'AWS credits, Arduino / ESP32 kits, Gigabit switch rentals and power strips',
    ownerId: 'demo_user',
    createdAt: '2026-01-16T09:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z'
  },
  {
    id: 'budget_prizes',
    festId: DEMO_FEST_ID,
    category: 'Prize Pool',
    title: 'Hackathon, RoboWars & Debate Cash Awards & Mementos',
    allocatedAmount: 40000,
    spentAmount: 35000,
    notes: '₹20k Hackathon top prize, ₹10k RoboWars, ₹5k Debate, custom laser-cut mementos',
    ownerId: 'demo_user',
    createdAt: '2026-01-16T09:15:00Z',
    updatedAt: '2026-02-12T11:00:00Z'
  },
  {
    id: 'budget_production',
    festId: DEMO_FEST_ID,
    category: 'Stage & AV Production',
    title: 'OAT Concert Rig, DMX Stage Lights & Sound Engineering',
    allocatedAmount: 35000,
    spentAmount: 34000,
    notes: 'Sound vendor contract, sound engineer fees, stage scaffolding & power generator diesel',
    ownerId: 'demo_user',
    createdAt: '2026-01-16T09:30:00Z',
    updatedAt: '2026-02-15T16:00:00Z'
  },
  {
    id: 'budget_hospitality',
    festId: DEMO_FEST_ID,
    category: 'Logistics & Hospitality',
    title: 'Keynote Speaker Travel, Guest House Lodging & Judge Meals',
    allocatedAmount: 20000,
    spentAmount: 16800,
    notes: 'Flight tickets for Chief Guest from Bengaluru, campus guest house, judge catering vouchers',
    ownerId: 'demo_user',
    createdAt: '2026-01-16T09:45:00Z',
    updatedAt: '2026-02-18T10:30:00Z'
  },
  {
    id: 'budget_marketing',
    festId: DEMO_FEST_ID,
    category: 'Marketing & PR',
    title: 'Fest T-Shirts, ID Lanyards, Standees & Social Media Ads',
    allocatedAmount: 12000,
    spentAmount: 11200,
    notes: 'Committee custom hoodies, 1500 badge lanyards, gate arches and digital sponsorship reels',
    ownerId: 'demo_user',
    createdAt: '2026-01-16T10:00:00Z',
    updatedAt: '2026-02-20T12:00:00Z'
  },
  {
    id: 'budget_contingency',
    festId: DEMO_FEST_ID,
    category: 'Contingency & Emergency Buffer',
    title: 'Emergency Medical, Fire Safety & Unforeseen Logistics Reserve',
    allocatedAmount: 8000,
    spentAmount: 1500,
    notes: 'Paramedic first aid kits, emergency electrician stand-by and spare extension boards',
    ownerId: 'demo_user',
    createdAt: '2026-01-16T10:15:00Z',
    updatedAt: '2026-02-22T09:00:00Z'
  }
];
