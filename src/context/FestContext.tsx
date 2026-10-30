/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  testConnection,
  handleFirestoreError,
  OperationType
} from '../services/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import {
  Fest,
  Venue,
  FestEvent,
  BudgetItem,
  ConflictReport
} from '../types';
import {
  detectEventConflicts,
  autoPlaceEvents
} from '../utils/scheduler';
import {
  DEMO_FEST,
  DEMO_VENUES,
  DEMO_EVENTS,
  DEMO_BUDGET_ITEMS
} from '../data/demoData';

interface FestContextType {
  user: User | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  
  fests: Fest[];
  activeFest: Fest | null;
  venues: Venue[];
  events: FestEvent[];
  budgetItems: BudgetItem[];
  conflicts: ConflictReport[];
  isDemoMode: boolean;
  isLoadingData: boolean;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  clearNotification: () => void;

  selectFest: (festId: string) => void;
  loadDemoData: () => void;
  saveFest: (festData: Partial<Fest>) => Promise<void>;
  
  saveVenue: (venueData: Omit<Venue, 'id'> & { id?: string }) => Promise<void>;
  deleteVenue: (venueId: string) => Promise<void>;

  saveEvent: (eventData: Omit<FestEvent, 'id'> & { id?: string }) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  saveBudgetItem: (itemData: Omit<BudgetItem, 'id'> & { id?: string }) => Promise<void>;
  deleteBudgetItem: (itemId: string) => Promise<void>;

  runAutoScheduler: () => { scheduledCount: number; unplacedCount: number; details: string[] };
}

const FestContext = createContext<FestContextType | undefined>(undefined);

export const FestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Application Data States
  const [fests, setFests] = useState<Fest[]>([DEMO_FEST]);
  const [activeFestId, setActiveFestId] = useState<string>(DEMO_FEST.id);
  const [venues, setVenues] = useState<Venue[]>(DEMO_VENUES);
  const [events, setEvents] = useState<FestEvent[]>(DEMO_EVENTS);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(DEMO_BUDGET_ITEMS);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Listen to Auth state and test Firestore connection on boot
  useEffect(() => {
    testConnection().then(connected => {
      if (connected) {
        console.log('[FESTOS AI] Cloud Firestore connection verified.');
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setIsDemoMode(false);
        // Load user's cloud festivals
        await loadCloudData(currentUser.uid);
      } else {
        // Fallback to demo mode if logged out
        setIsDemoMode(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load cloud data for authenticated user
  const loadCloudData = async (userId: string) => {
    setIsLoadingData(true);
    try {
      const festsRef = collection(db, 'fests');
      const q = query(festsRef, where('ownerId', '==', userId));
      const snap = await getDocs(q);
      const userFests: Fest[] = [];
      snap.forEach(d => {
        userFests.push(d.data() as Fest);
      });

      if (userFests.length > 0) {
        setFests(userFests);
        setActiveFestId(userFests[0].id);
        await loadFestSubcollections(userFests[0].id);
      } else {
        // First-time user: keep demo fest available so they don't see an empty void
        setFests([DEMO_FEST]);
        setActiveFestId(DEMO_FEST.id);
        setVenues(DEMO_VENUES);
        setEvents(DEMO_EVENTS);
        setBudgetItems(DEMO_BUDGET_ITEMS);
      }
    } catch (err) {
      console.warn('Could not fetch cloud fests:', err);
      showNotification('Operating in local mode. Log in with Google to sync to cloud.', 'info');
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadFestSubcollections = async (festId: string) => {
    if (!festId || festId === DEMO_FEST.id) return;
    try {
      // Venues
      const venuesSnap = await getDocs(collection(db, 'fests', festId, 'venues'));
      const loadedVenues: Venue[] = [];
      venuesSnap.forEach(d => loadedVenues.push(d.data() as Venue));
      setVenues(loadedVenues);

      // Events
      const eventsSnap = await getDocs(collection(db, 'fests', festId, 'events'));
      const loadedEvents: FestEvent[] = [];
      eventsSnap.forEach(d => loadedEvents.push(d.data() as FestEvent));
      setEvents(loadedEvents);

      // Budget items
      const budgetSnap = await getDocs(collection(db, 'fests', festId, 'budgetItems'));
      const loadedBudget: BudgetItem[] = [];
      budgetSnap.forEach(d => loadedBudget.push(d.data() as BudgetItem));
      setBudgetItems(loadedBudget);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `fests/${festId}`);
    }
  };

  // Google Sign-In
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      showNotification(`Signed in as ${result.user.displayName || result.user.email}`, 'success');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      showNotification(err.message || 'Failed to sign in with Google.', 'error');
    }
  };

  // Sign-Out
  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsDemoMode(true);
      setFests([DEMO_FEST]);
      setActiveFestId(DEMO_FEST.id);
      setVenues(DEMO_VENUES);
      setEvents(DEMO_EVENTS);
      setBudgetItems(DEMO_BUDGET_ITEMS);
      showNotification('Signed out. Loaded TechNova 2026 demo data.', 'info');
    } catch (err: any) {
      showNotification('Failed to sign out: ' + err.message, 'error');
    }
  };

  // Load Demo Fest explicitly
  const loadDemoData = () => {
    setIsDemoMode(true);
    setFests(prev => {
      const exists = prev.some(f => f.id === DEMO_FEST.id);
      return exists ? prev : [DEMO_FEST, ...prev];
    });
    setActiveFestId(DEMO_FEST.id);
    setVenues(DEMO_VENUES);
    setEvents(DEMO_EVENTS);
    setBudgetItems(DEMO_BUDGET_ITEMS);
    showNotification('Loaded TechNova 2026 demo fest with ₹1.5L budget, 4 venues & 6 events.', 'success');
  };

  // Active Fest object
  const activeFest = useMemo(() => {
    return fests.find(f => f.id === activeFestId) || fests[0] || DEMO_FEST;
  }, [fests, activeFestId]);

  // Select Fest
  const selectFest = async (festId: string) => {
    setActiveFestId(festId);
    if (festId === DEMO_FEST.id) {
      setIsDemoMode(true);
      setVenues(DEMO_VENUES);
      setEvents(DEMO_EVENTS);
      setBudgetItems(DEMO_BUDGET_ITEMS);
    } else {
      setIsDemoMode(false);
      await loadFestSubcollections(festId);
    }
  };

  // Save/Update Fest
  const saveFest = async (festData: Partial<Fest>) => {
    const isEditing = Boolean(festData.id && fests.some(f => f.id === festData.id));
    const festId = festData.id || `fest_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const updatedFest: Fest = {
      id: festId,
      name: festData.name || 'Annual College Fest',
      collegeName: festData.collegeName || 'Engineering College',
      edition: festData.edition || 'Annual Edition',
      startDate: festData.startDate || '2026-03-20',
      endDate: festData.endDate || '2026-03-22',
      totalBudget: Number(festData.totalBudget) || 150000,
      description: festData.description || '',
      status: festData.status || 'planning',
      ownerId: user?.uid || 'local_user',
      ownerEmail: user?.email || 'coordinator@college.ac.in',
      committee: festData.committee || ['Technical Council', 'Cultural Society'],
      createdAt: isEditing ? (festData.createdAt || timestamp) : timestamp,
      updatedAt: timestamp
    };

    if (user && !isDemoMode) {
      try {
        await setDoc(doc(db, 'fests', festId), updatedFest);
      } catch (err) {
        handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, `fests/${festId}`);
      }
    }

    setFests(prev => {
      const idx = prev.findIndex(f => f.id === festId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedFest;
        return copy;
      }
      return [...prev, updatedFest];
    });
    setActiveFestId(festId);
    showNotification(`Fest "${updatedFest.name}" successfully ${isEditing ? 'updated' : 'created'}!`, 'success');
  };

  // Save/Update Venue
  const saveVenue = async (venueData: Omit<Venue, 'id'> & { id?: string }) => {
    const festId = activeFest.id;
    const isEditing = Boolean(venueData.id);
    const venueId = venueData.id || `venue_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newVenue: Venue = {
      ...venueData,
      id: venueId,
      festId,
      ownerId: user?.uid || 'local_user',
      createdAt: isEditing ? (venueData.createdAt || timestamp) : timestamp,
      updatedAt: timestamp
    };

    if (user && !isDemoMode && festId !== DEMO_FEST.id) {
      try {
        await setDoc(doc(db, 'fests', festId, 'venues', venueId), newVenue);
      } catch (err) {
        handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, `fests/${festId}/venues/${venueId}`);
      }
    }

    setVenues(prev => {
      const idx = prev.findIndex(v => v.id === venueId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newVenue;
        return copy;
      }
      return [...prev, newVenue];
    });

    showNotification(`Venue "${newVenue.name}" saved.`, 'success');
  };

  // Delete Venue
  const deleteVenue = async (venueId: string) => {
    const festId = activeFest.id;
    if (user && !isDemoMode && festId !== DEMO_FEST.id) {
      try {
        await deleteDoc(doc(db, 'fests', festId, 'venues', venueId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `fests/${festId}/venues/${venueId}`);
      }
    }
    setVenues(prev => prev.filter(v => v.id !== venueId));
    // Clear venue reference from affected events
    setEvents(prev => prev.map(e => e.venueId === venueId ? { ...e, venueId: undefined, venueName: undefined } : e));
    showNotification('Venue removed.', 'info');
  };

  // Save/Update Event
  const saveEvent = async (eventData: Omit<FestEvent, 'id'> & { id?: string }) => {
    const festId = activeFest.id;
    const isEditing = Boolean(eventData.id);
    const eventId = eventData.id || `event_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Resolve venue name if assigned
    const assignedVenue = venues.find(v => v.id === eventData.venueId);

    const newEvent: FestEvent = {
      ...eventData,
      id: eventId,
      festId,
      venueName: assignedVenue?.name || eventData.venueName || undefined,
      ownerId: user?.uid || 'local_user',
      createdAt: isEditing ? (eventData.createdAt || timestamp) : timestamp,
      updatedAt: timestamp
    };

    if (user && !isDemoMode && festId !== DEMO_FEST.id) {
      try {
        await setDoc(doc(db, 'fests', festId, 'events', eventId), newEvent);
      } catch (err) {
        handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, `fests/${festId}/events/${eventId}`);
      }
    }

    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === eventId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newEvent;
        return copy;
      }
      return [...prev, newEvent];
    });

    showNotification(`Event "${newEvent.title}" saved.`, 'success');
  };

  // Delete Event
  const deleteEvent = async (eventId: string) => {
    const festId = activeFest.id;
    if (user && !isDemoMode && festId !== DEMO_FEST.id) {
      try {
        await deleteDoc(doc(db, 'fests', festId, 'events', eventId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `fests/${festId}/events/${eventId}`);
      }
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    showNotification('Event removed.', 'info');
  };

  // Save/Update BudgetItem
  const saveBudgetItem = async (itemData: Omit<BudgetItem, 'id'> & { id?: string }) => {
    const festId = activeFest.id;
    const isEditing = Boolean(itemData.id);
    const itemId = itemData.id || `budget_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newItem: BudgetItem = {
      ...itemData,
      id: itemId,
      festId,
      ownerId: user?.uid || 'local_user',
      createdAt: isEditing ? (itemData.createdAt || timestamp) : timestamp,
      updatedAt: timestamp
    };

    if (user && !isDemoMode && festId !== DEMO_FEST.id) {
      try {
        await setDoc(doc(db, 'fests', festId, 'budgetItems', itemId), newItem);
      } catch (err) {
        handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, `fests/${festId}/budgetItems/${itemId}`);
      }
    }

    setBudgetItems(prev => {
      const idx = prev.findIndex(b => b.id === itemId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newItem;
        return copy;
      }
      return [...prev, newItem];
    });

    showNotification(`Budget line item "${newItem.title}" saved.`, 'success');
  };

  // Delete BudgetItem
  const deleteBudgetItem = async (itemId: string) => {
    const festId = activeFest.id;
    if (user && !isDemoMode && festId !== DEMO_FEST.id) {
      try {
        await deleteDoc(doc(db, 'fests', festId, 'budgetItems', itemId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `fests/${festId}/budgetItems/${itemId}`);
      }
    }
    setBudgetItems(prev => prev.filter(b => b.id !== itemId));
    showNotification('Budget item removed.', 'info');
  };

  // Automatic scheduler run
  const runAutoScheduler = () => {
    const unassigned = events.filter(e => !e.venueId || !e.startTime || !e.endTime);
    const alreadyScheduled = events.filter(e => e.venueId && e.startTime && e.endTime);
    const dates = [activeFest.startDate, activeFest.endDate].filter(Boolean);

    const { updatedEvents, unplaced } = autoPlaceEvents(
      unassigned,
      venues,
      alreadyScheduled,
      dates.length > 0 ? dates : ['2026-03-20', '2026-03-21']
    );

    if (updatedEvents.length > 0) {
      setEvents(prev => {
        const map = new Map(prev.map(e => [e.id, e]));
        for (const u of updatedEvents) {
          map.set(u.id, u);
        }
        return Array.from(map.values());
      });
    }

    const messages = [
      ...updatedEvents.map(e => `Assigned "${e.title}" to ${e.venueName} (${e.date} ${e.startTime}-${e.endTime})`),
      ...unplaced.map(u => `Could not place "${u.event.title}": ${u.reason}`)
    ];

    showNotification(`Smart Scheduler placed ${updatedEvents.length} events (${unplaced.length} unplaced).`, 'success');
    return {
      scheduledCount: updatedEvents.length,
      unplacedCount: unplaced.length,
      details: messages
    };
  };

  // Live conflict detection on all active events and venues
  const conflicts = useMemo(() => {
    return detectEventConflicts(events, venues);
  }, [events, venues]);

  return (
    <FestContext.Provider
      value={{
        user,
        authLoading,
        signInWithGoogle,
        signOutUser,
        fests,
        activeFest,
        venues,
        events,
        budgetItems,
        conflicts,
        isDemoMode,
        isLoadingData,
        notification,
        clearNotification,
        selectFest,
        loadDemoData,
        saveFest,
        saveVenue,
        deleteVenue,
        saveEvent,
        deleteEvent,
        saveBudgetItem,
        deleteBudgetItem,
        runAutoScheduler
      }}
    >
      {children}
    </FestContext.Provider>
  );
};

export function useFest() {
  const ctx = useContext(FestContext);
  if (!ctx) {
    throw new Error('useFest must be used within a FestProvider');
  }
  return ctx;
}
