# AnimeListManager

A full-stack anime watchlist manager where users can track their anime, manage episodes, and share their list publicly. Built with the MERN stack.

**Live Demo:** [animelistmanager.netlify.app](https://animelistmanager.netlify.app)

**Demo List (My List):** [animelistmanager.netlify.app/list/ZalaJi](https://animelistmanager.netlify.app/list/ZalaJi)

---

## Features

### Authentication
- Email/password sign up & sign in with **bcrypt** hashing
- **Google OAuth 2.0** one-click login
- **JWT-based** session management with auto-logout and redirect on token expiry
- Passwords stripped from API responses

### Anime List Management
- Full **CRUD** — add, edit, delete anime entries
- Separate **Series** and **Movies** tabs with independent state, each persisted across page refreshes via localStorage
- **Inline episode tracking** with +/- controls (hidden for Finished and Dropped entries)
- **Status tracking** — Finished, CaughtUp, Watching, OnHold, Pending, Dropped (color-coded badges)
- **Jikan API integration** — search anime by name with autocomplete sourced from MyAnimeList
- **Cover images and detail modal** — click any entry to view cover art, synopsis, rating, rank, and genres (fetched on-demand from Jikan, cached in browser)
- **Duplicate prevention** — checked by MAL ID first, then case-insensitive name match
- **Input sanitization** — HTML tags stripped and regex-safe on the backend before any DB operation

### Search, Filter, Sort and Pagination
- **Server-side** search, status filter, and multi-field sorting (Name, Episodes, Date)
- **Debounced search** input (400ms) to reduce API traffic
- **Numbered pagination** — page buttons shown with ellipsis for large ranges (e.g. 1 2 3 ... 10)
- Scroll position resets to top on page change
- Page resets to 1 when search, filter, or sort changes

### Export
- Export the full anime list (series and movies combined) directly from the browser
- **CSV** — compatible with Excel, Google Sheets, and any spreadsheet tool
- **JSON** — raw data backup, suitable for re-import or external scripts
- All formatting is done client-side; the backend only returns a plain JSON array
- Downloaded file is named with the current date (e.g. `AnimeList_2026-05-28.csv`)

### Public Profile
- Shareable read-only list at `/list/:username`
- Share button copies the public URL to clipboard
- No login required to view
- Search, filter, sort, and pagination available on public view

### UX Details
- **Loading skeletons** replace spinner while data loads (shimmer rows)
- **Empty state illustrations** — distinct inline SVG for no results, empty movies tab, and empty series list
- **Image error fallback** — broken or missing cover images show a placeholder instead of a broken frame
- **Delete confirmation modal** — custom styled, replaces browser confirm dialog
- **Logout confirmation modal** — same pattern, with signed-in username shown
- **Session expiry handling** — 401 responses trigger an auto-redirect to login with a toast notification
- **Keyboard shortcuts** — N to focus the add form, Escape to close any open modal, arrow keys to paginate (all disabled when typing in an input field)

### Security
- **Rate limiting** — 100 req/15min (API), 20 req/15min (auth routes)
- **Input validation** — express-validator on all write routes
- **Per-user data isolation** — all queries are scoped to the authenticated user
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
│   │   ├── utils/jikanCache.js        # Browser-side Jikan API cache
│   │   └── components/
│   │       ├── auth/auth.jsx          # Login / Signup / Google OAuth
│   │       ├── Manager.jsx            # Main dashboard, tabs, pagination, keyboard shortcuts
│   │       ├── AnimeForm.jsx          # Add/edit form with Jikan search dropdown
│   │       ├── AnimeTable.jsx         # Table (desktop) and card (mobile) views, detail modal
│   │       ├── PublicList.jsx         # Read-only public list view
│   │       └── Navbar.jsx             # Nav with Share, Export, and Logout controls
│   └── .env                           # VITE_API_URL
│
└── Server/
    ├── Index.js                       # Express app and MongoDB connection
    ├── models/
    │   ├── user.js                    # username (unique), email, password
    │   └── userAnime.js               # name, status, episodes, movies, malId, entryType, creator
    ├── controllers/
    │   ├── user.js                    # signIn, signUp, googleSignIn
    │   ├── userAnime.js               # CRUD, pagination, episode controls, export (getAllAnime)
    │   └── publicList.js              # Public list (no auth)
    ├── middleware/
    │   ├── auth.js                    # JWT verification
    │   ├── rateLimiter.js             # API and auth rate limiters
    │   └── validators.js              # Input validation rules
    ├── routs/
    │   ├── users.js                   # Auth routes
    │   ├── userAnime.js               # Protected anime routes
    │   └── publicList.js              # Public list route
    └── .env                           # CONNECTION_URL, JWT_SECRET, PORT
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
3. Set environment variables: `CONNECTION_URL`, `JWT_SECRET`
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

### Auth (`/user`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/user/signin` | No | Email/password login |
| POST | `/user/signup` | No | Register new account |
| POST | `/user/googleSignIn` | No | Google OAuth login |

### Anime (`/userAnime`) — All require JWT
| Method | Endpoint | Description |
|---|---|---|
| GET | `/userAnime?page=1&limit=20&search=&status=&sort=createdAt&order=desc&entryType=series` | Get paginated list |
| GET | `/userAnime/all` | Get full list (no pagination) — used for client-side export |
| POST | `/userAnime` | Add new anime |
| PATCH | `/userAnime/:id` | Update anime |
| DELETE | `/userAnime/:id` | Delete anime |
| PATCH | `/userAnime/:id/increaseEp` | Increment episode count |
| PATCH | `/userAnime/:id/decreaseEp` | Decrement episode count |

### Public (`/list`) — No auth required
| Method | Endpoint | Description |
|---|---|---|
| GET | `/list/:username?page=1&limit=20&...` | View a user's public list |

---

## License

This project is for personal and educational use.
