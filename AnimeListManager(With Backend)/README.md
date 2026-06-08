# AnimeListManager

A full-stack anime watchlist manager where users can track their anime, manage episodes, view stats, and share their list publicly. Built with the MERN stack.

**Live Demo:** [animelistmanager.netlify.app](https://animelistmanager.netlify.app)

**Demo List (My List):** [animelistmanager.netlify.app/list/ZalaJi](https://animelistmanager.netlify.app/list/ZalaJi)

---

## Features

### Authentication
- Email/password sign up & sign in with **bcrypt** hashing
- **Google OAuth 2.0** one-click login
- **JWT-based** session management (7-day tokens) with auto-logout and redirect on token expiry
- Passwords are never returned in API responses
- Disabled accounts are blocked at sign-in — Google sign-in included

### Anime List Management
- Full **CRUD** — add, edit, delete anime entries
- Separate **Series** and **Movies** tabs with independent state, each persisted across page refreshes via localStorage
- **Inline episode tracking** with +/- controls (hidden for Finished and Dropped entries)
- Optimistic UI updates with debounced server sync — rapid clicking stays accurate without hammering the API
- **Status tracking** — Finished, CaughtUp, Watching, OnHold, Pending, Dropped (color-coded badges)
- **Jikan API integration** — search anime by name with autocomplete sourced from MyAnimeList
- **Cover images and detail modal** — click any entry to view cover art, synopsis, rating, rank, and genres (fetched on-demand from Jikan, cached in browser)
- **Duplicate prevention** — checked by MAL ID first, then case-insensitive name match
- **Input sanitization** — HTML tags stripped and regex-safe on the backend before any DB operation
- **Rating system** — 0–10 rating picker in the detail modal, stored per entry

### Search, Filter, Sort and Pagination
- **Server-side** search, status filter, and multi-field sorting (Name, Episodes, Date, Rating)
- **Debounced search** input (400ms) to reduce API traffic
- **Numbered pagination** — page buttons shown with ellipsis for large ranges (e.g. 1 2 3 ... 10)
- Scroll position resets to top on page change
- Page resets to 1 when search, filter, or sort changes
- Auto-steps back when the current page becomes empty (e.g. after a delete)

### Export
- Export the full anime list (series and movies combined) directly from the browser
- **CSV** — compatible with Excel, Google Sheets, and any spreadsheet tool
- **JSON** — raw data backup, suitable for external scripts
- All formatting is done client-side; the backend returns a plain array
- Downloaded file is named with the current date (e.g. `AnimeList_2026-05-28.csv`)

### Stats Dashboard (Private)
- Accessible at `/stats` — requires login
- **Metric cards** — total anime, episodes watched, completion rate, and this month's episode count
- **Status donut chart** — visual breakdown of Finished / Watching / etc.
- **Monthly episode bar chart** — tracks episodes watched per month via a server-side log (`episodeLog` on the User document); every +/- press updates the log atomically
- **Top rated** — your 5 highest-rated entries
- **Currently watching** list
- **Longest series** and **latest addition** cards
- **Rating overview** — average rating with a 0–10 distribution histogram
- **Genre chart** — aggregated from Jikan metadata, loads progressively in the background with rate limiting
- **Share Stats** button — copies a public stats link

### Public Stats Page
- Shareable at `/list/:id/stats` — no login required
- Shows: total series and movies, episodes, completion rate, average rating, status donut chart, and top rated entries
- Monthly episode activity is **always private** — it never appears on the public stats page
- Clicking the Stats button on a public list navigates to the stats page and copies the link

### Public Profile
- Shareable read-only list at `/list/:id`
- Share links use the user's **MongoDB `_id`** instead of username — links stay valid even if the user renames their account
- The displayed username is always fetched fresh from the server, not read from the URL
- No login required to view
- Search, filter, sort, and pagination available on public view

### Profile Page
- Change username (with uniqueness check and a warning that old share links will break)
- Change password (requires current password verification)
- Google accounts cannot change their password (detected via bcrypt prefix check)
- Account info card: email, join date, account type (Email / Google)

### Admin Dashboard
- Accessible at `/admin` — admin accounts only (verified server-side, not just from JWT)
- User list with search, pagination, and per-user anime count
- **Disable / re-enable** user accounts — disabled users are blocked at every sign-in method
- **Permanently delete** users and all their data (cascades to anime entries)
- Admin accounts are protected from disable and delete

### Cross-Device Sync
- On every app load, a silent `GET /user/me` call fetches fresh profile data
- If username or admin status changed on another device, localStorage is updated and the page reloads automatically
- If the account was disabled on another device, the user is logged out immediately with a toast notification

### UX Details
- **Loading skeletons** replace spinner while data loads (shimmer rows)
- **Empty state illustrations** — distinct inline SVG for no results, empty movies tab, and empty series list
- **Image error fallback** — broken or missing cover images show a placeholder
- **Delete confirmation modal** — custom styled, replaces browser `confirm`
- **Logout confirmation modal** — same pattern, with signed-in username shown
- **Session expiry handling** — 401 responses trigger an auto-redirect to login with a toast notification
- **Keyboard shortcuts** — `N` to focus the add form, `Escape` to close any open modal, arrow keys to paginate (all disabled when typing in an input field)
- **Server wake-up screen** — shown when the Render backend is cold-starting (free tier); automatically disappears when the server responds

### Security
- **Rate limiting** — 100 req/15min (API), 20 req/15min (auth routes)
- **Input validation** — express-validator on all write routes (sign-up, sign-in, anime CRUD, profile updates)
- **Sort field allowlist** — prevents arbitrary field injection in DB queries
- **Per-user data isolation** — all queries are scoped to the authenticated user's ID
- **Ownership check** before every update and delete
- **Admin re-verified from DB** on every admin route — a crafted JWT with `isAdmin: true` cannot bypass it
- **CORS** locked to `FRONTEND_URL` env variable in production
- **Auto-logout** on token expiry via Axios response interceptor

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Redux + Thunk, TailwindCSS |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| Auth | JWT, bcryptjs, Google OAuth 2.0 |
| Security | express-rate-limit, express-validator |
| External API | [Jikan v4](https://jikan.moe) (MyAnimeList) |
| Hosting | Netlify (frontend), Render (backend), MongoDB Atlas (database) |

---

## Project Structure

```
├── Frontend/
│   ├── src/
│   │   ├── api/index.js              # Axios instance, all API calls, interceptors
│   │   ├── actions/                   # Redux action creators
│   │   ├── reducers/                  # Redux reducers (paginated state)
│   │   ├── utils/jikanCache.js        # Browser-side Jikan API cache + schedule cache
│   │   ├── pages/
│   │   │   ├── Stats.jsx              # Private stats dashboard
│   │   │   ├── PublicStats.jsx        # Public stats page (no login required)
│   │   │   ├── Profile.jsx            # Username and password management
│   │   │   ├── AiringCalendar.jsx     # Weekly airing schedule from Jikan
│   │   │   └── AdminDashboard.jsx     # Admin-only user management
│   │   └── components/
│   │       ├── auth/auth.jsx          # Login / Signup / Google OAuth
│   │       ├── Manager.jsx            # Main dashboard, tabs, pagination, keyboard shortcuts
│   │       ├── AnimeForm.jsx          # Add/edit form with Jikan search dropdown
│   │       ├── AnimeTable.jsx         # Table (desktop) and card (mobile) views, detail modal, rating picker
│   │       ├── PublicList.jsx         # Read-only public list view
│   │       ├── Navbar.jsx             # Nav with Share, Stats, Calendar, Export, and Logout controls
│   │       ├── AdminRoute.jsx         # Route guard for admin pages
│   │       └── ServerWakeUp.jsx       # Cold-start splash screen for Render free tier
│   └── .env                           # VITE_API_URL
│
└── Server/
    ├── Index.js                       # Express app, CORS, and MongoDB connection
    ├── models/
    │   ├── user.js                    # username, email, password, isAdmin, isDisabled, episodeLog
    │   └── userAnime.js               # name, status, episodes, movies, malId, entryType, rating, creator
    ├── controllers/
    │   ├── user.js                    # signIn, signUp, googleSignIn, updateProfile, getMe, getUserStats
    │   ├── userAnime.js               # CRUD, pagination, episode controls, getAllAnime
    │   ├── publicList.js              # Public list and public stats (no auth)
    │   └── admin.js                   # Admin: list users, disable, delete
    ├── middleware/
    │   ├── auth.js                    # JWT verification + requireAdmin DB check
    │   ├── rateLimiter.js             # API and auth rate limiters
    │   └── validators.js              # Input validation rules (signUp, signIn, anime, profile)
    ├── routs/
    │   ├── users.js                   # Auth and profile routes
    │   ├── userAnime.js               # Protected anime routes
    │   ├── publicList.js              # Public list and stats routes
    │   └── admin.js                   # Admin routes
    └── .env                           # CONNECTION_URL, JWT_SECRET, PORT, FRONTEND_URL
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Console project (for OAuth)

### Backend Setup
```bash
cd Server
npm install
```

Create `Server/.env`:
```
CONNECTION_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

```bash
npm run start
```

### Frontend Setup
```bash
cd Frontend
npm install
```

Create `Frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

---

## Deployment

### Backend (Render)
1. Push `Server/` to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set environment variables: `CONNECTION_URL`, `JWT_SECRET`, `FRONTEND_URL`
4. Deploy

### Frontend (Netlify)
1. Push `Frontend/` to GitHub
2. Create a new site on [Netlify](https://netlify.com)
3. Build command: `npm run build` | Publish directory: `dist`
4. Set environment variable: `VITE_API_URL=https://your-render-url.onrender.com`
5. After adding env vars, trigger **"Clear cache and deploy site"**

### Google OAuth
Add your Netlify domain to Google Cloud Console:
- Authorized JavaScript origins: `https://your-site.netlify.app`
- Authorized redirect URIs: `https://your-site.netlify.app`

---

## API Endpoints

### Auth & Profile (`/user`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/user/signin` | No | Email/password login |
| POST | `/user/signup` | No | Register new account |
| POST | `/user/googleSignIn` | No | Google OAuth login |
| PATCH | `/user/profile` | Yes | Update username or password |
| GET | `/user/me` | Yes | Fetch fresh profile + new token (used for cross-device sync) |
| GET | `/user/stats` | Yes | Fetch user's episodeLog (monthly activity) |

### Anime (`/userAnime`) — All require JWT
| Method | Endpoint | Description |
|---|---|---|
| GET | `/userAnime?page=1&limit=20&search=&status=&sort=createdAt&order=desc&entryType=series` | Get paginated list |
| GET | `/userAnime/all` | Get full list (no pagination) — used for export |
| POST | `/userAnime` | Add new anime |
| PATCH | `/userAnime/:id` | Update anime |
| DELETE | `/userAnime/:id` | Delete anime |
| PATCH | `/userAnime/:id/increaseEp` | Increment episode count + update episodeLog |
| PATCH | `/userAnime/:id/decreaseEp` | Decrement episode count + update episodeLog |

### Public (`/list`) — No auth required
| Method | Endpoint | Description |
|---|---|---|
| GET | `/list/:id?page=1&limit=20&...` | View a user's public list (accepts username or MongoDB `_id`) |
| GET | `/list/:id/stats` | View a user's public stats |

### Admin (`/admin`) — Admin JWT required
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users?page=1&limit=20&search=` | List all users with anime count |
| PATCH | `/admin/users/:id/disable` | Toggle a user's disabled state |
| DELETE | `/admin/users/:id` | Permanently delete a user and all their data |

---

## License

This project is for personal and educational use.
