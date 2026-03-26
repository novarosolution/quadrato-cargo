## Getting Started

This project now runs with:

- Frontend: Next.js app in `quadrato-cargo`
- Backend: Express + MongoDB API in `/Users/kuldip/2 day/server`

### 1) Start backend API

```bash
cd "/Users/kuldip/2 day/server"
cp .env.example .env
npm install
npm run dev
```

### 2) Start frontend

```bash
cd "/Users/kuldip/2 day/quadrato-cargo"
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` in frontend env to your API URL (default `http://localhost:4010`).

For production cross-domain deploys (frontend domain != backend domain), use same-origin API proxy:

- Set frontend `NEXT_PUBLIC_API_BASE_URL` to your frontend domain (for example `https://www.quadratocargo.com`)
- Set frontend `BACKEND_API_BASE_URL` to backend domain (for example `https://api.quadratocargo.com`)
- Keep backend CORS/cookie envs aligned (`CORS_ORIGIN`, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`)

Open [http://localhost:3000](http://localhost:3000).

## Phase 1 connected features

- Register (`/register`)
- Login (`/login`)
- Logout (header account menu)
- Profile read/update (`/profile`)
- Profile bookings list/detail (`/profile/bookings/:id`)

Admin/courier APIs are planned for next phase.

# quadrato-cargo
