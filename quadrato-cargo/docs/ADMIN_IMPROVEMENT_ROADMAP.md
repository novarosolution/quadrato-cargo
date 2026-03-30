# Admin improvement roadmap — flows, fixes, full-site control

Goals: **reliable flows**, **fewer errors**, **one admin UI** that can run the public site and operations without jumping into raw JSON unless necessary.

---

## Phase A — Fix broken or misleading behavior (high priority)

| Item | Issue | Direction |
|------|--------|-----------|
| **CSV exports** | ~~Data & site used `href="#"`~~ | **Done:** `GET /api/admin/export/{users,contacts,bookings}` on Express + Next proxy [`api/admin/exports/[kind]/route.ts`](../src/app/api/admin/exports/[kind]/route.ts) (admin session + server secret). |
| **Admin login copy** | ~~Misleading “team accounts” text~~ | **Done:** Login page describes `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Optional later: staff DB login for `/admin`. |
| **README paths** | Root [README](../../README.md) references `server/` at repo root; backend lives in **`quadrato-cargo/server`** | Update instructions so new devs don’t run the wrong folder. |
| **Error surfacing** | Admin server actions often return generic “Cannot connect” | Map HTTP status / API `message` in one helper; toast or inline **actionable** text (e.g. 401 → “Session expired, log in again”). |

---

## Phase B — Admin controls for “whole website” (content & public UX)

| Area | Today | Improvement |
|------|--------|-------------|
| **Site settings** | Phone, email, banner, PDF, tracking toggles | Add optional **hours line** for footer/contact; **metadata** helpers (default title suffix) if you want SEO from admin later. |
| **Public pages** | About map fixed (CSP + OSM); other pages are code-only | Optional **CMS-lite**: store short blocks in `site_settings` or a `content_pages` collection for About/Service snippets (bigger scope). |
| **Legal / footer** | Hardcoded “NovaRo” etc. | Admin fields for **footer credit line** + **support hours** string (already partially static on contact). |

---

## Phase C — Booking flow: admin can finish jobs without JSON

| Item | Direction |
|------|-----------|
| **Recipient address** | ~~JSON only~~ | **Done:** Recipient street/city/postal/country on contact form + existing merge. |
| **Shipment block** | ~~JSON only~~ | **Done:** Zod `shipment` merge + [`AdminBookingShipmentForm`](../src/app/admin/bookings/AdminBookingShipmentForm.tsx). |
| **Status guardrails** | Optional: disallow impossible transitions in API or warn in UI (e.g. delivered → submitted). |
| **Bulk actions** | Later: multi-select on list → assign agency / export IDs (only after CSV works). |

---

## Phase D — UI / IA (easier to understand)

| Item | Direction |
|------|-----------|
| **Single “Operations hub”** | Dashboard: add **shortcuts row** — New booking (link to public book), Open bookings (preset filter), Data & site, Reports. |
| **Help drawer** | Link “How admin works” → internal doc or `/admin/help` rendering [`ROLES_AND_FLOWS.md`](./ROLES_AND_FLOWS.md) (sanitized markdown). |
| **Consistent page shells** | Same `AdminPageHeader` + max-width pattern on users/contacts/reports as bookings. |
| **Loading / empty states** | Skeleton rows on list pages; empty states with **one primary action** (e.g. “Go to bookings”). |

---

## Phase E — PDF & customer parity (optional)

| Item | Direction |
|------|-----------|
| **Server PDF** | `POST /api/public/bookings/pdf` is **not registered** — client fallback only. Add server route for parity, same A6 logic, auth + booking ownership checks. |
| **Preview invoice** | Admin “Preview PDF” button using same generator as profile (optional). |

---

## Phase F — Quality & security

- **E2E smoke**: admin login → open booking → save dispatch → public track shows update.
- **Rate limits**: Already on API; ensure **admin auth** route is limited.
- **Audit log** (future): who changed status / invoice (new collection `admin_audit`).

---

## Suggested order of work

1. **CSV exports** (biggest functional gap).  
2. **Admin login** copy fix or staff login implementation (choose one product decision).  
3. **Recipient + shipment forms** (reduce JSON reliance).  
4. **Dashboard shortcuts + help link**.  
5. README + error messages polish.  
6. Server PDF / CMS / audit as needed.

---

*Edit this file as you complete phases. Cross-link with [`ROLES_AND_FLOWS.md`](./ROLES_AND_FLOWS.md).*
