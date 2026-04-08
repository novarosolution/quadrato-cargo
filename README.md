# quadrato-cargo

Final full-stack project update by NovaRo team.

## Project Structure

- `quadrato-cargo/` — Next.js frontend (customer, admin, courier, agency UI)
- `server/` — **Canonical** Express + MongoDB API (PDFs, exports, full routes). Keep this in sync with production.
- `quadrato-cargo/server/` — Copy of `server/` for developers who prefer the app nested under the frontend folder (install and run the same way; do not let it drift).

## Frontend (`quadrato-cargo`)

### Install

```bash
cd quadrato-cargo
npm install
```

### Run (development)

From **`quadrato-cargo/`**:

```bash
npm run dev
```

From the **repo root** (same as `cd quadrato-cargo && npm run dev`):

```bash
npm run dev:web
```

Frontend defaults to **`http://localhost:3000`**. If that port is busy, Next prints another port (e.g. `3001`) — open the URL shown in the terminal.

**API in parallel:** in a second terminal, `cd server && npm run dev` (or from root: `npm run dev:api`). The app expects the API at `NEXT_PUBLIC_API_BASE_URL` (see `quadrato-cargo/.env.example`, usually `http://localhost:4010`).

**If dev says it cannot acquire `.next/dev/lock`:** stop any other `next dev` for this folder, or run `npm run dev:unlock` inside `quadrato-cargo/`, or `npm run dev:fresh` to wipe `.next` and start again.

## Backend (`server/` at repo root — recommended)

### Install

```bash
cd server
npm install
```

### Environment

Create `server/.env` from `server/.env.example` and set:

- `PORT`
- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_API_SECRET`

### Run (development)

```bash
npm run dev
```

Backend runs on `http://localhost:4010` (or your `PORT`).

### Alternate path (`quadrato-cargo/server`)

If you use the nested copy, run `npm install` and `npm run dev` there instead — it is kept aligned with `server/` so features like **`POST /api/public/bookings/pdf`** work the same.

## Main Features

- Public booking, tracking, profile, and auth
- Admin dashboard for users, bookings, contacts, reports, settings
- Courier flow: start job, pickup OTP, handover reference/OTP
- Agency flow: verify handover, process shipment status updates
- Booking status and notes sync to user/admin tracking views

## Admin & roles

- See [`quadrato-cargo/docs/ROLES_AND_FLOWS.md`](quadrato-cargo/docs/ROLES_AND_FLOWS.md) for who can do what.
- Planned admin improvements: [`quadrato-cargo/docs/ADMIN_IMPROVEMENT_ROADMAP.md`](quadrato-cargo/docs/ADMIN_IMPROVEMENT_ROADMAP.md).

## Notes

- Use the same `ADMIN_API_SECRET` in frontend and backend env.
- Keep `.env` files private and never commit secrets.
- For production, configure proper CORS origin and secure secrets.

# quadrato-cargo-novaro
# quadrato-cargo
# quadrato-cargo
