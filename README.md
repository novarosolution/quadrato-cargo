# quadrato-cargo

Final full-stack project update by NovaRo team.

## Project Structure

- `quadrato-cargo/` — Next.js frontend (customer, admin, courier, agency UI)
- `quadrato-cargo/server/` — Express + MongoDB backend API

## Frontend (`quadrato-cargo`)

### Install

```bash
cd quadrato-cargo
npm install
```

### Run (development)

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Backend (`quadrato-cargo/server`)

### Install

```bash
cd quadrato-cargo/server
npm install
```

### Environment

Create `quadrato-cargo/server/.env` using `quadrato-cargo/server/.env.example` and set:

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

Backend runs on `http://localhost:4010`.

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
