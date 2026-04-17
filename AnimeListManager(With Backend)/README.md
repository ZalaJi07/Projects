# AnimeListManager

A full-stack anime watchlist manager where users can track their anime, manage episodes, and share their list publicly. Built with the MERN stack.

**Live Demo**: [animelistmanager.netlify.app](https://animelistmanager.netlify.app)

---

## Features

### Authentication
- Email/password sign up & sign in with **bcrypt** hashing
- **Google OAuth 2.0** one-click login
- **JWT-based** session management (auto-logout on expiry)
- Passwords stripped from API responses

### Anime List Management
- Full **CRUD** — add, edit, delete anime entries
- **Inline episode tracking** with +/- buttons
- **Status tracking** — Finished, CaughtUp, Watching, OnHold, Pending, Dropped (color-coded)
- **Jikan API integration** — search anime by name with autocomplete from MyAnimeList
- **Cover images & details** — click any anime to view cover art, synopsis, rating, rank, and genres (fetched on-demand from Jikan, cached in browser)

### Search, Filter, Sort & Pagination
- **Server-side** search, status filter, and multi-field sorting (Name, Episodes, Date)
- **Debounced search** input (400ms)
- **Pagination** with Prev/Next controls (20 items per page)

### Public Profile
- Shareable read-only list at `/list/:username`
- **Share button** copies public URL to clipboard
- Anyone can view — no login required
- Search, filter, sort, and pagination available on public view

### Security
- **Rate limiting** — 100 req/15min (API), 20 req/15min (auth routes)
- **Input validation** — express-validator on all routes
- **Per-user data isolation** — users can only access their own data
- **Auto-logout** on token expiry via Axios interceptor

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
│   │   ├── api/index.js              # Axios instance & all API calls
│   │   ├── actions/                   # Redux action creators
│   │   ├── reducers/                  # Redux reducers (paginated state)
│   │   ├── utils/jikanCache.js        # Browser-side Jikan API cache
│   │   └── components/
│   │       ├── auth/auth.jsx          # Login / Signup / Google OAuth
│   │       ├── Manager.jsx            # Main dashboard
│   │       ├── AnimeForm.jsx          # Add/edit form with Jikan search
│   │       ├── AnimeTable.jsx         # Table with images & detail modal
│   │       ├── PublicList.jsx         # Read-only public list view
│   │       └── Navbar.jsx             # Nav with Share & context-aware buttons
│   └── .env                           # VITE_API_URL
│
└── Server/
    ├── Index.js                       # Express app & MongoDB connection
    ├── models/
    │   ├── user.js                    # username (unique), email, password
    │   └── userAnime.js               # name, status, episodes, movies, malId, creator
    ├── controllers/
    │   ├── user.js                    # signIn, signUp, googleSignIn
    │   ├── userAnime.js               # CRUD + pagination + episode controls
    │   └── publicList.js              # Public list (no auth)
    ├── middleware/
    │   ├── auth.js                    # JWT verification
    │   ├── rateLimiter.js             # API & auth rate limiters
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
5. **Important**: After adding env vars, trigger **"Clear cache and deploy site"**

### Google OAuth
Add your Netlify domain to Google Cloud Console:
- Authorized JavaScript origins: `https://your-site.netlify.app`
- Authorized redirect URIs: `https://your-site.netlify.app`

---

## API Endpoints

### Auth (`/user`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/user/signin` | ❌ | Email/password login |
| POST | `/user/signup` | ❌ | Register new account |
| POST | `/user/googleSignIn` | ❌ | Google OAuth login |

### Anime (`/userAnime`) — All require JWT
| Method | Endpoint | Description |
|---|---|---|
| GET | `/userAnime?page=1&limit=20&search=&status=&sort=createdAt&order=desc` | Get paginated list |
| POST | `/userAnime` | Add new anime |
| PATCH | `/userAnime/:id` | Update anime |
| DELETE | `/userAnime/:id` | Delete anime |
| PATCH | `/userAnime/:id/increaseEp` | Increment episodes |
| PATCH | `/userAnime/:id/decreaseEp` | Decrement episodes |

### Public (`/list`) — No auth required
| Method | Endpoint | Description |
|---|---|---|
| GET | `/list/:username?page=1&limit=20&...` | View user's public list |

---

## License

This project is for personal and educational use.
