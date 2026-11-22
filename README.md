# SkillBridge (SkillTrack + ResearchBridge)

Node.js + Express backend, plain HTML/JS frontend (in `public/`), JSON-file database (`data/db.json`).

## Run in VS Code
1. Install Node.js 18+ from https://nodejs.org
2. Unzip, then File > Open Folder... and choose the `skillbridge` folder
3. Open the terminal (Ctrl+`) and run:
   ```
   npm install
   npm start
   ```
4. Open http://localhost:3000

## Accounts
- Students: use the Register tab.
- Admin: Admin tab, `admin@skillbridge.edu` / `Admin@123` (change with env vars ADMIN_EMAIL / ADMIN_PASSWORD before the first run, and set SESSION_SECRET).

- Demo student (pre-filled with dummy skills, certificates and 2 fictional sample papers): `demo@skillbridge.edu` / `Demo@123`, or click **Try the demo** on the login page. The demo data is re-created automatically if it is missing.

## Structure
- `server.js`: auth (bcrypt + sessions), per-student data API, PDF text extraction (pdf-parse), admin routes
- `public/index.html`: all screens (dashboard, SkillTrack, ResearchBridge, Quick Research Reader)
- `data/db.json`: created automatically on first run

## Notes
- Summaries are extractive: built only from sentences in the uploaded PDF, so nothing is invented.
- Sessions are held in memory, so everyone is logged out when the server restarts.
