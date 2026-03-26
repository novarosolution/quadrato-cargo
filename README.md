# quadrato-cargo

Final full-stack project update by NovaRo team.

## Project Structure

- `quadrato-cargo/` -> Next.js frontend (customer, admin, courier, agency UI)
- `server/` -> Express + MongoDB backend API

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

## Backend (`server`)

### Install

```bash
cd server
npm install
```

### Environment

Create `server/.env` using `server/.env.example` and set:

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

## Notes

- Use the same `ADMIN_API_SECRET` in frontend and backend env.
- Keep `.env` files private and never commit secrets.
- For production, configure proper CORS origin and secure secrets.

# quadrato-cargo-novaro
# quadrato-cargo
# quadrato-cargo
