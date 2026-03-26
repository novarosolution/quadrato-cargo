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

Set `NEXT_PUBLIC_API_BASE_URL` in frontend env to your backend URL (default `http://localhost:4000`).

Open [http://localhost:3000](http://localhost:3000).

## Phase 1 connected features

- Register (`/register`)
- Login (`/login`)
- Logout (header account menu)
- Profile read/update (`/profile`)
- Profile bookings list/detail (`/profile/bookings/:id`)

Admin/courier APIs are planned for next phase.

# quadrato-cargo
