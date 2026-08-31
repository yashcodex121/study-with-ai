# Samadhan

Doubt solver + sticky notes + quiz app, ab real backend (Node.js + Express) ke saath, jo [Groq](https://console.groq.com) API se live AI responses leta hai.

## Setup

```bash
npm install
cp .env.example .env
```

`.env` file kholo aur apni Groq API key daalo (free key yahan se milegi: https://console.groq.com/keys):

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```

## Run

```bash
npm start
```

Fir browser mein kholo: **http://localhost:3000**

Dev mode (auto-restart on file change):

```bash
npm run dev
```

## Kya badla hai

**Sabse aasan login: Email + Password (zero setup, turant kaam karta hai)**
- Koi Google/Twitter developer account, redirect URI, ya waiting nahi chahiye.
- Login page pe "Login" / "Sign up" tabs — naya account banao (naam optional, email + password 6+ chars) aur turant andar.
- Password `bcryptjs` se hash hoke DB mein save hota hai (plain text kabhi nahi).
- **Yeh hi recommended tareeka hai jab tak Google/Twitter keys na mil jayein.**

**Google + Twitter/X login (optional, keys milne par chalu ho jayega)**
- `public/login.html` — glass-style login page, "Continue with Google" aur "Continue with X" buttons.
- `auth.js` — Passport.js strategies (Google OAuth 2.0, Twitter OAuth 1.0a). Har naya login `users` table mein user create/find karta hai.
- Poora app (`/`) ab login ke peeche gated hai — bina login `/login.html` par redirect ho jaata hai. Agar keys `.env` mein set nahi hain, button click karne par saaf error message dikhta hai (button crash nahi karta).
- Header mein user ka naam/avatar + Logout button.

**Keys kaise milengi:**

*Google:*
1. https://console.cloud.google.com → naya project
2. "OAuth consent screen" set karo (External)
3. "Credentials" → "Create Credentials" → "OAuth Client ID" → "Web application"
4. Authorized redirect URI: `http://localhost:3000/auth/google/callback`
5. Client ID + Secret ko `.env` mein daalo

*Twitter / X:*
1. https://developer.twitter.com → developer account + Project/App banao
2. App ke "User authentication settings" mein OAuth 1.0a enable karo
3. Callback URL: `http://localhost:3000/auth/twitter/callback`
4. "API Key" = `TWITTER_CONSUMER_KEY`, "API Key Secret" = `TWITTER_CONSUMER_SECRET`

**Database add kiya:**
- SQLite (`samadhan.db`, apne aap ban jaati hai, koi separate DB server nahi chahiye), via `db.js`.
- `users` table — provider, name, avatar, xp.
- `sticky_notes` table — per-user notes.
- XP aur sticky notes ab localStorage ki jagah is DB mein save hote hain — login karke kahin se bhi access karo to same progress milega.
- Note: session store abhi default in-memory hai (dev/demo ke liye theek hai). Real deployment ke liye `connect-sqlite3` ya `connect-redis` jaisa persistent session store use karna.

**Backend add kiya (pehle se):**
- `server.js` — Express server jo `/api/solve` aur `/api/quiz` endpoints expose karta hai (login-protected), jo Groq ke chat completions API ko call karte hain aur structured JSON return karte hain.
- Frontend mock data ki jagah in real endpoints ko `fetch()` se call karta hai.

**Quiz bug fix kiya (pehle se):**
- `localStorage` fail hone par (sandboxed preview, `file://` se seedha kholna) poora script ek uncaught error par ruk jaata tha, isliye Quiz tab ka topic input gayab dikhta tha. Safe storage wrapper se fix kiya.

## Project structure

```
samadhan-app/
├── server.js          # Express backend, auth routes, API routes
├── auth.js            # Passport Google + Twitter strategies
├── db.js              # SQLite (better-sqlite3) — users + sticky notes
├── package.json
├── .env.example        # Copy to .env and add your keys
├── samadhan.db         # auto-created on first run
└── public/
    ├── login.html      # Login page (Google + Twitter buttons)
    └── index.html       # Main app (gated behind login)
```
