import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, TicketCheck, XCircle } from 'lucide-react';

type PublicTicket = { found: boolean; eventTitle?: string; eventDate?: string; status?: 'valid' | 'checked_in' };

/** Public QR landing page. Never exposes attendee names, emails or a check-in action. */
export const TicketVerification: React.FC = () => {
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [pending, setPending] = useState(true);
  const code = decodeURIComponent(window.location.pathname.split('/').pop() || '');
  useEffect(() => {
    fetch('/api/qr/public/verify/' + encodeURIComponent(code))
      .then(res => res.ok ? res.json() : ({ found: false }))
      .then(setTicket)
      .catch(() => setTicket({ found: false }))
      .finally(() => setPending(false));
  }, [code]);
  const valid = ticket?.found && ticket.status === 'valid';
  return <main className="flex min-h-screen items-center justify-center bg-[#0A0D14] px-4 text-slate-100">
    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827] p-8 text-center shadow-2xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300"><TicketCheck size={28}/></div>
      <h1 className="text-2xl font-bold">FESTOS AI · QR Pass</h1>
      <p className="mt-2 text-sm text-slate-400">Verify event registration. Entry is confirmed separately by an authorized organizer.</p>
      <div className="mt-6 rounded-2xl border border-slate-700 bg-[#0B101B] p-5">
        {pending ? <p>Checking ticket status…</p> : !ticket?.found ? <div className="text-rose-300"><XCircle className="mx-auto mb-2" size={30}/> Invalid or unavailable ticket</div> : <>
          {valid ? <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={32}/> : <ShieldCheck className="mx-auto mb-2 text-amber-300" size={32}/>}
          <p className={'font-semibold ' + (valid ? 'text-emerald-300' : 'text-amber-300')}>{valid ? 'Valid ticket · Not yet checked in' : 'Ticket already used'}</p>
          <p className="mt-3 text-sm text-white">{ticket.eventTitle}</p>
          <p className="mt-1 text-xs text-slate-400">{ticket.eventDate}</p>
        </>}
      </div>
      <a href="/" className="mt-6 inline-block text-sm text-violet-300 underline">Back to FESTOS AI</a>
    </div>
  </main>;
};
