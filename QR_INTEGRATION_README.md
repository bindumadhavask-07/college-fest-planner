# FESTOS AI — QR Ticket Integration (local-only patch)

This integration adapts your friend's Flask QR-ticket ZIP to run **inside the current React/Express FESTOS AI app**, so no second Python server is required.

**It does not push any code to GitHub.** It targets the checked-out `feature/campus-map` version of `college-fest-planner`.

## 1. Install into your VS Code project

In Terminal, from the location of this ZIP:

```bash
cd ~/Desktop/college-fest-planner
git branch --show-current
git status
```

Make sure it says `feature/campus-map`. If it does not, do not run the installer yet.

Extract this archive somewhere accessible (e.g. Downloads). Then:

```bash
python3 ~/Downloads/festos_qr_bundle/integrate_qr.py
npm install
npm run lint
npm run build
```

If you extracted to a different folder, replace `~/Downloads/festos_qr_bundle/` with that folder's path.

The installer edits only `src/App.tsx`, `src/components/Header.tsx`, `src/types/index.ts`, `server.ts`, `package.json`, `.gitignore` and adds the QR components/server. It creates `.festos-qr-backup/` snapshots. Existing changes in other files are untouched.

## 2. Add admin secrets

Edit your existing **root** `.env` (create it if needed). Copy the three variable names from `.env.qr.example` and set strong values.

Generate a session secret on macOS:

```bash
openssl rand -hex 32
```

Set `QR_ADMIN_PASSWORD` to a unique strong password (12+ characters) and `QR_SESSION_SECRET` to the generated 64-character string.

Keep any existing GROQ or other secrets in `.env`; do not delete them. Never commit `.env`.

## 3. Start and test

Stop the previous server first (Ctrl+C in the terminal running it). If port 3000 is occupied, check with `lsof -nP -iTCP:3000 -sTCP:LISTEN` and only stop the old FESTOS server process.

```bash
npm run dev
```

Open the **QR Tickets** tab at `http://localhost:3000/`. Unlock with the QR administrator password.

1. Load your demo fest or create an event in FESTOS.
2. Select an existing event, enter an attendee name/email, click **Generate pass**.
3. A unique QR code appears and the ticket is saved to `data/qr-tickets.json`.
4. Copy/open its verification link (or scan it from a device that can reach your deployed app).
5. Return to **QR Tickets**, paste its code or link in **Verify and check in**, verify, then confirm check-in.
6. Verify again; it should report that the ticket is already used.

Ticket issuance and check-in are restricted to the QR administrator. The public scanned QR displays event and status **without revealing names/emails**.

## Local vs deployed QR links

A QR pointing to `localhost:3000` works on the same computer, **not other phones**. For a phone demo, deploy the same application on a reachable HTTPS domain and set `QR_PUBLIC_BASE_URL` to that origin (without a trailing slash). Don't claim phone scanning works before testing it on a real second device.

## Limits / security

- This is a **single-process hackathon demo** ticket service using local JSON storage. A cloud host with ephemeral storage will lose tickets after restarts. For production, migrate to Firestore/SQL with atomic check-in transactions.
- The administrator password is separate from Google/Firebase login. An admin session cookie protects issue/list/verify/check-in; no secret is embedded in frontend JS.
- No user notification/email sender was in the original ZIP or this integration. You can copy the QR pass link to share.
- The ZIP's separate Flask HTML pages, default password, exposed JavaScript API key and empty sample SQLite DB are deliberately not copied into FESTOS.
- The Event details are captured from the existing FESTOS event selected in the UI. If an event is renamed later, previously issued passes retain the original title snapshot.
- Do not store real student personal information until you've reviewed security, privacy and hosting.

## GitHub: push later

After testing, check `git status` and decide whether to commit on a new integration branch. **Do not run `git push` until you are ready.**
