import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Copy, LockKeyhole, QrCode, RefreshCw, ScanLine, ShieldCheck, Ticket, TicketCheck, XCircle } from 'lucide-react';
import { useFest } from '../context/FestContext';

type TicketStatus = 'valid' | 'checked_in';
type TicketRecord = {
  id: string; festId: string; eventId: string; eventTitle: string; eventDate: string;
  attendeeName: string; attendeeEmail: string; status: TicketStatus;
  createdAt: string; checkedInAt?: string;
};

type ApiError = { error?: string };
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch('/api/qr' + url, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Festos-QR': '1', ...(options?.headers || {}) }
  });
  const json = await response.json() as T & ApiError;
  if (!response.ok) throw new Error(json.error || 'Request failed');
  return json;
}

const fieldStyle = 'w-full rounded-xl border border-slate-700 bg-[#0B101B] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40';

export const QRTickets: React.FC = () => {
  const { activeFest, events } = useFest();
  const [status, setStatus] = useState<{ configured: boolean; authenticated: boolean } | null>(null);
  const [password, setPassword] = useState('');
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [eventId, setEventId] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [verified, setVerified] = useState<TicketRecord | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const validEvents = events.filter(event => event.status !== 'cancelled');
  const chosenEvent = validEvents.find(event => event.id === eventId) || validEvents[0];

  const refresh = useCallback(async () => {
    const next = await request<{ configured: boolean; authenticated: boolean }>('/status');
    setStatus(next);
    if (next.authenticated) {
      const result = await request<{ tickets: TicketRecord[] }>('/tickets?festId=' + encodeURIComponent(activeFest.id));
      setTickets(result.tickets);
    } else { setTickets([]); }
  }, [activeFest.id]);

  useEffect(() => { refresh().catch(e => setError(e.message)); }, [refresh]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setBusy(false); }
  };

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await request('/login', { method: 'POST', body: JSON.stringify({ password }) });
      setPassword(''); await refresh(); setMessage('QR ticket administration unlocked');
    });
  };
  const logout = () => void run(async () => {
    await request('/logout', { method: 'POST', body: '{}' });
    setVerified(null); setSelectedTicket(null); await refresh(); setMessage('Signed out');
  });
  const issueTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenEvent) return;
    void run(async () => {
      const result = await request<{ ticket: TicketRecord }>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          festId: activeFest.id, eventId: chosenEvent.id,
          eventTitle: chosenEvent.title, eventDate: chosenEvent.date,
          attendeeName, attendeeEmail
        })
      });
      setSelectedTicket(result.ticket);
      setAttendeeName(''); setAttendeeEmail('');
      await refresh();
      setMessage('Ticket issued successfully. Share the QR with the attendee.');
    });
  };
  const verify = (e: React.FormEvent) => {
    e.preventDefault(); setVerified(null);
    void run(async () => {
      const result = await request<{ ticket: TicketRecord }>('/verify', {
        method: 'POST', body: JSON.stringify({ ticketId: scanCode.trim(), festId: activeFest.id })
      });
      setVerified(result.ticket);
      setMessage(result.ticket.status === 'valid' ? 'Valid ticket. Ready for check-in.' : 'Already checked in.');
    });
  };
  const checkIn = (ticket: TicketRecord) => void run(async () => {
    await request('/checkin', { method: 'POST', body: JSON.stringify({ ticketId: ticket.id, festId: activeFest.id }) });
    setVerified(null); setSelectedTicket(null); setScanCode(''); await refresh();
    setMessage('Check-in confirmed. The ticket cannot be used again.');
  });

  const qrUrl = selectedTicket ? '/api/qr/tickets/' + encodeURIComponent(selectedTicket.id) + '/qr' : '';
  const publicUrl = selectedTicket ? window.location.origin + '/ticket/verify/' + encodeURIComponent(selectedTicket.id) : '';
  const scannedTickets = tickets.filter(ticket => ticket.status === 'checked_in').length;

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Entry management</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">QR Tickets & Check-In</h1>
        <p className="mt-1 text-sm text-slate-400">Issue unique passes for {activeFest.name}, verify tickets, and prevent duplicate entry.</p>
      </div>
      <button onClick={() => void run(refresh)} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">
        <RefreshCw size={14}/> Refresh
      </button>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {[
        { label: 'Tickets issued', value: tickets.length, icon: <Ticket size={19}/> },
        { label: 'Checked in', value: scannedTickets, icon: <TicketCheck size={19}/> },
        { label: 'Still valid', value: tickets.length - scannedTickets, icon: <ShieldCheck size={19}/> }
      ].map(item => <div key={item.label} className="rounded-2xl border border-slate-800 bg-[#111827] p-4">
        <div className="flex justify-between text-violet-300">{item.icon}<span className="text-2xl font-bold text-white">{item.value}</span></div>
        <p className="mt-3 text-xs text-slate-400">{item.label}</p>
      </div>)}
    </div>
    {error && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
    {message && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}
    {!status?.configured && <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
      <strong>One-time setup required:</strong> Add QR_ADMIN_PASSWORD (at least 12 characters) and QR_SESSION_SECRET (at least 32 characters) to the root .env file, then restart npm run dev. See QR_INTEGRATION_README.md.
    </div>}
    {status?.configured && !status.authenticated && <form onSubmit={login} className="max-w-lg rounded-2xl border border-slate-800 bg-[#111827] p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><LockKeyhole size={18} className="text-violet-300"/> Organizer sign-in</h2>
      <p className="mb-4 mt-2 text-sm text-slate-400">Ticket issuing and admission require the separate QR administrator password.</p>
      <input className={fieldStyle} value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="QR administrator password" required autoComplete="current-password" />
      <button className={'mt-3 ' + primaryButton} disabled={busy}>Unlock ticket management</button>
    </form>}
    {status?.authenticated && <>
      <div className="flex justify-end"><button onClick={logout} className="text-xs text-slate-400 underline hover:text-white">Sign out of ticket admin</button></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={issueTicket} className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white"><QrCode size={19} className="text-violet-300"/> Generate QR ticket</h2>
          <p className="mb-4 text-xs text-slate-400">Select an existing FESTOS event and register an attendee.</p>
          <label className="mb-1 block text-xs text-slate-300">Event</label>
          <select className={fieldStyle} value={chosenEvent?.id || ''} onChange={e => setEventId(e.target.value)} required>
            {validEvents.length ? validEvents.map(event => <option key={event.id} value={event.id}>{event.title}</option>) : <option value="">Create an event first</option>}
          </select>
          <label className="mb-1 mt-3 block text-xs text-slate-300">Attendee name</label>
          <input className={fieldStyle} value={attendeeName} onChange={e => setAttendeeName(e.target.value)} placeholder="Full name" maxLength={120} required />
          <label className="mb-1 mt-3 block text-xs text-slate-300">Attendee email</label>
          <input className={fieldStyle} type="email" value={attendeeEmail} onChange={e => setAttendeeEmail(e.target.value)} placeholder="student@college.edu" maxLength={200} required />
          <button disabled={busy || !chosenEvent} className={'mt-4 w-full ' + primaryButton}><Ticket size={18}/> Generate pass</button>
        </form>
        <form onSubmit={verify} className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white"><ScanLine size={19} className="text-cyan-300"/> Verify and check in</h2>
          <p className="mb-4 text-xs text-slate-400">Enter a ticket code or paste the scanned QR link. Verification alone does not check the attendee in.</p>
          <input className={fieldStyle} value={scanCode} onChange={e => {
            const raw = e.target.value;
            const match = raw.match(/\/ticket\/verify\/(TKT-[A-Za-z0-9_-]+)/);
            setScanCode(match ? match[1] : raw);
          }} placeholder="TKT-... or QR verification link" required />
          <button disabled={busy || !scanCode.trim()} className={'mt-3 w-full ' + primaryButton}><ClipboardCheck size={18}/> Verify ticket</button>
          {verified && <div className="mt-4 rounded-xl border border-slate-700 bg-[#0B101B] p-4 text-sm">
            <p className="font-semibold text-white">{verified.attendeeName}</p>
            <p className="mt-1 text-xs text-slate-400">{verified.eventTitle}</p>
            <p className={'mt-2 font-semibold ' + (verified.status === 'valid' ? 'text-emerald-400' : 'text-rose-400')}>{verified.status === 'valid' ? 'VALID · Not checked in' : 'ALREADY USED'}</p>
            {verified.status === 'valid' && <button type="button" onClick={() => checkIn(verified)} disabled={busy} className={'mt-3 w-full ' + primaryButton}><CheckCircle2 size={17}/> Confirm check-in</button>}
          </div>}
        </form>
      </div>
      {selectedTicket && <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-500/30 bg-[#111827] p-5 sm:flex-row sm:items-start">
        <img className="h-44 w-44 rounded-xl bg-white p-2" src={qrUrl} alt={'QR pass for ' + selectedTicket.attendeeName} />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="font-semibold text-white">New ticket: {selectedTicket.attendeeName}</h2>
          <p className="text-sm text-slate-300">{selectedTicket.eventTitle}</p>
          <p className="break-all font-mono text-xs text-violet-300">{selectedTicket.id}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { void navigator.clipboard.writeText(publicUrl).then(() => setMessage('Verification link copied')); }} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-white hover:bg-slate-800"><Copy size={15}/> Copy pass link</button>
            <a href={qrUrl} download={'FESTOS-' + selectedTicket.id + '.png'} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-white hover:bg-slate-800">Open QR image</a>
          </div>
          {['localhost','127.0.0.1'].includes(window.location.hostname) && <p className="text-xs text-amber-300">QR links use localhost here. For scanning on phones, deploy the app to a reachable HTTPS address and set QR_PUBLIC_BASE_URL.</p>}
        </div>
      </div>}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-white">Issued passes</h2><span className="text-xs text-slate-400">{tickets.length} ticket(s)</span></div>
        {!tickets.length ? <p className="text-sm text-slate-400">No tickets issued for this fest yet.</p> : <div className="grid gap-2 md:grid-cols-2">
          {tickets.map(ticket => <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="flex items-start justify-between gap-2 rounded-xl border border-slate-800 bg-[#0B101B] p-3 text-left hover:border-violet-500/40">
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{ticket.attendeeName}</p><p className="mt-1 truncate text-xs text-slate-400">{ticket.eventTitle}</p><p className="mt-1 truncate font-mono text-[10px] text-slate-500">{ticket.id}</p></div>
            <span className={'flex shrink-0 items-center gap-1 text-xs ' + (ticket.status === 'valid' ? 'text-emerald-400' : 'text-rose-400')}>
              {ticket.status === 'valid' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} {ticket.status === 'valid' ? 'Valid' : 'Used'}
            </span>
          </button>)}
        </div>}
      </div>
    </>}
  </section>;
};
