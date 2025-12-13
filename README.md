# Cultural Events Venue Locator (CSCI2720 Project)

Small web application for locating cultural venues and their events. This repository contains a backend API (Express + MongoDB) and a frontend SPA (React + Vite).

## Quick Links
- Backend: `backend/` (Express)
- Frontend: `frontend/` (React + Vite)

## Prerequisites
- Node.js (v16+ recommended) and npm
- MongoDB (local) or MongoDB Atlas. Docker can be used to run MongoDB locally.

Start a local MongoDB with Docker if you don't have one:

```bash
docker run --name csci2720-mongo -p 27017:27017 -d mongo:6.0
```

## Backend — Setup & Run

1. Install dependencies

```bash
cd backend
npm init -y
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

2. Create environment file `backend/.env` (a default file .env is provided):

```env
MONGODB_URI=mongodb://localhost:27017/cultural-events
PORT=5000
NODE_ENV=development
```

3. Run the server

- Development (auto-reload):

```bash
npm run dev
```

- Production:

```bash
npm start
```

4. Health check

```bash
curl http://localhost:5000/api/health
```

Expected response: JSON containing `{ "status": "OK" }`.

### Database seeding
The database connection code (`backend/config/db.js`) automatically seeds an admin user (`username: admin`, password stored as plain text in seed — change in production) and a `testuser`, and loads venues/events from `backend/data/processedVenues.json` when the DB is empty.

## Frontend — Setup & Run

1. Install dependencies

```bash
cd frontend
npm install
npm install axios react-router-dom leaflet react-leaflet
```

2. Run dev server

```bash
npm run dev
```

Vite will print the local URL (commonly `http://localhost:5173`). The frontend calls the backend API; ensure backend is running and `frontend/src/services/api.jsx` points to the correct API base URL (or use a proxy / environment variable).

## API Overview (common endpoints)

- `GET /api/health` — health check
- `POST /api/auth/register` — register user
- `POST /api/auth/login` — login (returns JWT)
- `GET /api/locations` — list venues
- `GET /api/locations/:id` — venue details
- `GET /api/random/pick` — random event page
- `GET /api/events` — list events
- `POST /api/comments` — add comment (authenticated)
- `GET /api/favorites` — user favorites (authenticated)
- `POST /api/admin/...` — admin routes (protected)

Use `curl` for a basic health check:

```bash
curl http://localhost:5000/api/health
```

Authentication: endpoints that require authentication expect a Bearer token in the `Authorization` header.

## Tests (none included yet)
This repo does not include automated tests by default. Suggested quick setups:

- Backend: `jest` + `supertest` + `mongodb-memory-server` (isolated HTTP + in-memory DB tests)
- Frontend: `vitest` + `@testing-library/react`

If you'd like, I can scaffold backend tests and add a sample `GET /api/health` test.

## Troubleshooting
- MongoDB connection errors: check `MONGODB_URI` and ensure the DB is running.
- Port conflict: change `PORT` in `backend/.env`.
- Frontend CORS: backend already uses `cors()`; ensure frontend requests use the correct host/port.

## Development notes & security
- The seeding code creates an admin and a test user for development convenience. Change or remove these credentials before deploying to production.
- Do not commit real `.env` files. Use `.env.example` for templates.



