/**
 * FESTOS AI QR tickets.
 * Adapted from the team's Flask/SQLite prototype to run in FESTOS' existing
 * Express server. The password/session secret never leave the server.
 * Local demo storage is a file and is intentionally not appropriate for
 * high-traffic production or multi-instance deployments.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { randomBytes, createHmac, timingSafeEqual, scryptSync } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import * as QRCode from 'qrcode';
import dotenv from 'dotenv';

// The router is imported before server.ts executes its own dotenv.config().
dotenv.config();

export const qrTicketRouter = Router();

type TicketStatus = 'valid' | 'checked_in';
interface TicketRecord {
  id: string;
  festId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  attendeeName: string;
  attendeeEmail: string;
  status: TicketStatus;
  createdAt: string;
  checkedInAt?: string;
}

const dbPath = path.resolve(process.cwd(), 'data', 'qr-tickets.json');
const adminPassword = process.env.QR_ADMIN_PASSWORD || '';
const sessionSecret = process.env.QR_SESSION_SECRET || '';
const isConfigured = adminPassword.length >= 12 && !adminPassword.startsWith('REPLACE_') && adminPassword !== 'ChangeMe123!' && /^[a-f0-9]{64}$/i.test(sessionSecret);
const cookieName = 'festos_qr_session';
const sessionSeconds = 8 * 60 * 60;

// Single-node, synchronous, atomic writes to preserve tickets during restarts.
// For a hosted multi-instance system, replace with a transactional database.
function readTickets(): TicketRecord[] {
  if (!existsSync(dbPath)) return [];
  try {
    const data: unknown = JSON.parse(readFileSync(dbPath, 'utf8'));
    if (!Array.isArray(data)) throw new Error('QR ticket store must be an array');
    return data as TicketRecord[];
  } catch (error) {
    console.error('[QR] Cannot read ticket database:', error);
    throw new Error('Ticket database is unavailable; refusing to overwrite data');
  }
}
function saveTickets(tickets: TicketRecord[]) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const tempFile = dbPath + '.' + process.pid + '.tmp';
  writeFileSync(tempFile, JSON.stringify(tickets, null, 2), { mode: 0o600 });
  renameSync(tempFile, dbPath);
}
function sign(payload: string) {
  return createHmac('sha256', sessionSecret).update(payload).digest('base64url');
}
function getCookie(req: Request, name: string): string {
  const raw = (req.headers.cookie || '').split(';').map(s => s.trim());
  return raw.find(value => value.startsWith(name + '='))?.slice(name.length + 1) || '';
}
function authenticated(req: Request) {
  if (!isConfigured) return false;
  const token = getCookie(req, cookieName);
  const pos = token.lastIndexOf('.');
  if (pos < 0) return false;
  const payload = token.slice(0, pos);
  const signature = token.slice(pos + 1);
  const expected = sign(payload);
  if (signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const parsed: { expires: number } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof parsed.expires === 'number' && parsed.expires > Date.now();
  } catch { return false; }
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!authenticated(req)) { res.status(401).json({ error: 'Sign in to QR Tickets first' }); return; }
  next();
}
function sameOriginAction(req: Request, res: Response, next: NextFunction) {
  // Custom header prevents ordinary cross-site HTML forms from mutating data.
  if (req.header('X-Festos-QR') !== '1') {
    res.status(403).json({ error: 'Missing QR action header' }); return;
  }
  const origin = req.header('Origin');
  const host = req.header('Host');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        res.status(403).json({ error: 'Cross-origin request is not allowed' }); return;
      }
    } catch {
      res.status(403).json({ error: 'Invalid origin' }); return;
    }
  }
  next();
}
function sendError(res: Response, error: unknown) {
  console.error('[QR] Error:', error);
  return res.status(500).json({ error: 'Ticket service encountered an error' });
}
function safeText(v: unknown, max: number) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
function passwordMatches(submitted: string): boolean {
  const salt = 'festos-qr-admin-local';
  const input = scryptSync(submitted, salt, 32);
  const expected = scryptSync(adminPassword, salt, 32);
  return timingSafeEqual(input, expected);
}

// All POST actions require a non-simple same-origin header.
qrTicketRouter.use((req, res, next) => req.method === 'POST' ? sameOriginAction(req, res, next) : next());
qrTicketRouter.get('/status', (req, res) => res.json({ configured: isConfigured, authenticated: authenticated(req) }));
let loginAttempts = new Map<string, { count: number; until: number }>();
qrTicketRouter.post('/login', (req, res) => {
  if (!isConfigured) return res.status(503).json({ error: 'Set QR_ADMIN_PASSWORD and QR_SESSION_SECRET in .env first' });
  const ip = req.ip || 'unknown';
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.count >= 8 && attempt.until > Date.now()) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }
  if (!passwordMatches(safeText(req.body?.password, 256))) {
    loginAttempts.set(ip, { count: (attempt?.until && attempt.until > Date.now() ? attempt.count : 0) + 1, until: Date.now() + 15 * 60_000 });
    return res.status(401).json({ error: 'Incorrect administrator password' });
  }
  loginAttempts.delete(ip);
  const payload = Buffer.from(JSON.stringify({ expires: Date.now() + sessionSeconds * 1000, nonce: randomBytes(12).toString('hex') })).toString('base64url');
  res.cookie(cookieName, payload + '.' + sign(payload), {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production',
    path: '/api/qr', maxAge: sessionSeconds * 1000
  });
  return res.json({ authenticated: true });
});
qrTicketRouter.post('/logout', (_req, res) => {
  res.clearCookie(cookieName, { path: '/api/qr' });
  return res.json({ authenticated: false });
});

qrTicketRouter.get('/tickets', requireAdmin, (req, res) => {
  try {
    const festId = safeText(req.query.festId, 120);
    if (!festId) return res.status(400).json({ error: 'festId is required' });
    return res.json({ tickets: readTickets().filter(t => t.festId === festId).reverse() });
  } catch (error) { return sendError(res, error); }
});
qrTicketRouter.post('/tickets', requireAdmin, (req, res) => {
  const festId = safeText(req.body?.festId, 120);
  const eventId = safeText(req.body?.eventId, 120);
  const eventTitle = safeText(req.body?.eventTitle, 200);
  const eventDate = safeText(req.body?.eventDate, 40);
  const attendeeName = safeText(req.body?.attendeeName, 120);
  const attendeeEmail = safeText(req.body?.attendeeEmail, 200);
  if (!festId || !eventId || !eventTitle || !attendeeName || !/^\S+@\S+\.\S+$/.test(attendeeEmail)) {
    return res.status(400).json({ error: 'Choose an event and enter a valid attendee name and email' });
  }
  try {
    const tickets = readTickets();
    const existing = tickets.find(t => t.festId === festId && t.eventId === eventId && t.attendeeEmail.toLowerCase() === attendeeEmail.toLowerCase());
    if (existing) return res.status(409).json({ error: 'This attendee already has a ticket for the selected event' });
    const ticket: TicketRecord = {
      id: 'TKT-' + randomBytes(20).toString('base64url'), festId, eventId, eventTitle, eventDate,
      attendeeName, attendeeEmail, status: 'valid', createdAt: new Date().toISOString()
    };
    tickets.push(ticket);
    saveTickets(tickets);
    return res.status(201).json({ ticket });
  } catch (error) { return sendError(res, error); }
});
qrTicketRouter.post('/verify', requireAdmin, (req, res) => {
  try {
    const code = safeText(req.body?.ticketId, 160);
    const festId = safeText(req.body?.festId, 120);
    const ticket = readTickets().find(t => t.id === code && t.festId === festId);
    if (!ticket) return res.status(404).json({ valid: false, error: 'Ticket not found for this fest' });
    return res.json({ valid: ticket.status === 'valid', ticket });
  } catch (error) { return sendError(res, error); }
});
qrTicketRouter.post('/checkin', requireAdmin, (req, res) => {
  try {
    const code = safeText(req.body?.ticketId, 160);
    const festId = safeText(req.body?.festId, 120);
    const tickets = readTickets();
    const ticket = tickets.find(t => t.id === code && t.festId === festId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found for this fest' });
    if (ticket.status !== 'valid') return res.status(409).json({ error: 'Ticket has already been checked in' });
    ticket.status = 'checked_in';
    ticket.checkedInAt = new Date().toISOString();
    saveTickets(tickets);
    return res.json({ ticket });
  } catch (error) { return sendError(res, error); }
});

// A scanned QR reveals no attendee email, name, or admin privileges.
qrTicketRouter.get('/public/verify/:ticketId', (req, res) => {
  try {
    const ticket = readTickets().find(t => t.id === req.params.ticketId);
    if (!ticket) return res.status(404).json({ found: false });
    return res.json({ found: true, eventTitle: ticket.eventTitle, eventDate: ticket.eventDate, status: ticket.status });
  } catch (error) { return sendError(res, error); }
});
qrTicketRouter.get('/tickets/:ticketId/qr', async (req, res) => {
  try {
    const ticket = readTickets().find(t => t.id === req.params.ticketId);
    if (!ticket) return res.sendStatus(404);
    const configuredBase = process.env.QR_PUBLIC_BASE_URL;
    const base = (configuredBase || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const url = `${base}/ticket/verify/${encodeURIComponent(ticket.id)}`;
    const png = await QRCode.toBuffer(url, { type: 'png', width: 280, margin: 2, errorCorrectionLevel: 'M' });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(png);
  } catch (error) { return sendError(res, error); }
});
