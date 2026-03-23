# MAPIMS — Ticket Management System

A full-stack, role-based **Ticket Management System** purpose-built for hospitals. It manages the entire lifecycle of internal support/maintenance requests — from submission through assignment, resolution, and reporting — with SLA tracking, file attachments, activity auditing, and a rich analytics dashboard.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [User Roles & Permissions](#user-roles--permissions)
- [Ticket Lifecycle](#ticket-lifecycle)
- [SLA Management](#sla-management)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Seed & Default Credentials](#seed--default-credentials)
- [File Uploads](#file-uploads)
- [Dashboard & Reports](#dashboard--reports)
- [Project Conventions](#project-conventions)

---

## Features

### Core Ticket Management
- Create, view, update, and track support tickets with rich metadata
- Stable, human-friendly **ticket numbers** in the format `TKT-{CATEGORY_CODE}-{YEAR}-{SEQUENCE}`
- Full ticket lifecycle with server-side validation
- Role-scoped ticket visibility (Requesters see only their own; staff see all)
- **Claim / Assign** workflow to avoid duplicate handling across Helpdesk agents
- **Transfer to agent** (reassign `Handled By` to another helpdesk agent with audit log)
- Internal and external comments per ticket (Chat UI)
- File attachments (type allowlist + 10MB limit) with secure filename storage and in-app preview (where supported)

### SLA Tracking
- Configurable SLA policies per priority (LOW / MEDIUM / HIGH / CRITICAL)
- Three SLA timers: First Response, Resolution, and Escalation deadlines
- `isOverdue` flag + ticket list filter (All / Overdue / Not overdue)
- Pending escalations endpoint for proactive SLA management

### Role-Based Access Control
- Roles with granular permission checks at route and service level
- Admin-only user management (create, update, toggle active/inactive)
- HOD/Helpdesk/Admin can escalate, reopen, and close tickets
- Requesters are blocked from all administrative and assignment operations

### Analytics Dashboard
- KPI summary cards (open, resolved, overdue, etc.)
- Category-wise, department-wise, priority-wise, and status-wise ticket breakdowns
- Technician performance overview (assigned vs. resolved)
- Monthly ticket trend chart (configurable lookback, max 24 months)

### Reports
- Full paginated ticket report with multi-dimensional filters:
  - Date range, category, department, status, priority, assigned technician

### Master Data Management
- Admin-controlled reference data: Departments, Categories, Subcategories, Locations, SLA Configs
- All master entities support soft-enable/disable via `isActive` flag
- Generic factory pattern means all master data CRUD is zero-boilerplate

### Audit Trail
- Every ticket state change, assignment, creation, resolution, escalation, close, and reopen is written to `TicketActivityLog`
- Full activity timeline visible per ticket

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Backend Runtime | Node.js (CommonJS) | 18+ |
| Backend Framework | Express | 4.x |
| ODM | Mongoose | 8.x |
| Database | MongoDB | 6+ |
| Authentication | JWT (`jsonwebtoken`) + bcryptjs | — |
| File Uploads | Multer (disk storage) | — |
| HTTP Logging | Morgan | — |
| CORS | `cors` (origin-locked) | — |
| Frontend Framework | React | 18 |
| Frontend Bundler | Vite | 6 |
| Frontend Routing | React Router DOM | 6 |
| HTTP Client | Axios (with interceptors) | — |
| UI Framework | Bootstrap 5 + Bootstrap Icons | 5.x |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│                                                               │
│  AuthContext ─── Axios Client ─── React Router (role guards) │
│       │                │                    │                 │
│  Pages / Views    Service Layer        ProtectedRoute         │
└──────────────────────────┬──────────────────────────────────-┘
                           │ HTTP (REST JSON)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Express)                         │
│                                                               │
│  Middleware Chain:                                            │
│    cors → morgan → json → protect → authorizeRoles           │
│                                                               │
│  Modules:                                                     │
│    auth │ user │ department │ category │ subcategory          │
│    location │ slaConfig │ ticket │ dashboard │ report         │
│                                                               │
│  Each module: routes → controller → service → Mongoose Models │
└──────────────────────────┬──────────────────────────────────-┘
                           │ Mongoose ODM
                           ▼
                    ┌──────────────┐
                    │   MongoDB    │
                    └──────────────┘
```

**Key Design Patterns:**
- **Repository / Service / Controller** separation per module
- **Master Service Factory** — `createMasterService`, `createMasterController`, `createMasterRouter` generate full CRUD for all reference data with zero repetition
- **Result-style error handling** — `asyncHandler` wraps every controller; `ApiError` propagates domain errors; `globalErrorHandler` normalizes all responses
- **Stateless JWT auth** — no sessions, no refresh tokens; token is re-validated against the database on every protected request to handle deactivated users immediately

---

## Project Structure

```
MAPIMS/
├── README.md
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   └── src/
│       ├── server.js                  ← HTTP server entry point
│       ├── app.js                     ← Express app + middleware assembly
│       ├── config/
│       │   ├── env.js                 ← Env var validation (fails fast on missing keys)
│       │   ├── database.js            ← Mongoose connect/disconnect
│       │   └── index.js               ← Config barrel export
│       ├── middlewares/
│       │   ├── auth.middleware.js     ← protect + authorizeRoles
│       │   ├── upload.middleware.js   ← Multer (10MB, type-restricted)
│       │   ├── globalErrorHandler.js  ← Centralized error normalizer
│       │   └── notFoundHandler.js     ← 404 catch-all
│       ├── routes/
│       │   ├── base.routes.js         ← Mounts all module routers under /api
│       │   ├── index.js               ← Root route
│       │   └── health.route.js        ← GET /api/health
│       ├── modules/
│       │   ├── auth/                  ← register, login, getMe
│       │   ├── user/                  ← Admin-only CRUD + status toggle
│       │   ├── department/            ← Master data
│       │   ├── category/              ← Master data
│       │   ├── subcategory/           ← Master data (belongs to Category)
│       │   ├── location/              ← Master data (block/floor/ward/room/unit)
│       │   ├── slaConfig/             ← SLA thresholds per priority
│       │   ├── ticket/                ← Core ticket engine
│       │   │   ├── ticket.service.js
│       │   │   ├── ticket.controller.js
│       │   │   ├── ticket.routes.js
│       │   │   ├── ticket.utils.js
│       │   │   ├── ticket.constants.js
│       │   │   ├── ticketSla.service.js
│       │   │   ├── ticketActivity.service.js
│       │   │   ├── ticketActivityLog.service.js
│       │   │   ├── ticketActivityLog.controller.js
│       │   │   ├── ticketComment.service.js
│       │   │   ├── ticketComment.controller.js
│       │   │   ├── ticketAttachment.service.js
│       │   │   └── ticketAttachment.controller.js
│       │   ├── dashboard/             ← KPI + chart aggregations
│       │   └── report/                ← Paginated filtered ticket report
│       └── utils/
│           ├── ApiError.js
│           ├── asyncHandler.js
│           ├── sendResponse.js
│           ├── generateToken.js
│           ├── sanitizeUser.js
│           ├── parsePagination.js
│           ├── parsePositiveInt.js
│           ├── createMasterController.js
│           └── createMasterRouter.js
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx                   ← ReactDOM.createRoot entry
        ├── app/App.jsx                ← Root component (providers)
        ├── routes/AppRoutes.jsx       ← All routes + role-based guards
        ├── config/appConfig.js        ← APP_NAME, NAV_ITEMS, ROLE_LABELS
        ├── context/
        │   ├── AuthContext.jsx        ← Auth state (login/logout/hydrate)
        │   ├── ToastContext.jsx        ← Global toast notifications
        │   └── ConfirmDialogContext.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useToast.js
        │   └── useConfirmDialog.js
        ├── services/
        │   ├── apiClient.js           ← Axios + Bearer token interceptor
        │   ├── authService.js
        │   └── masterDataService.js
        ├── utils/
        │   ├── authStorage.js         ← localStorage token persistence
        │   ├── validators.js
        │   └── getErrorMessage.js
        ├── components/
        │   ├── auth/ProtectedRoute.jsx
        │   ├── layout/
        │   │   ├── MainLayout.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── TopNavbar.jsx
        │   ├── common/
        │   │   ├── FullPageLoader.jsx
        │   │   ├── LoadingCard.jsx
        │   │   ├── PageHeader.jsx
        │   │   └── ConfirmDialog.jsx
        │   ├── tickets/
        │   │   ├── TicketForm.jsx
        │   │   ├── TicketTable.jsx
        │   │   ├── TicketFilters.jsx
        │   │   ├── TicketStatusBadge.jsx
        │   │   ├── TicketActivityTimeline.jsx
        │   │   ├── TicketAttachmentsSection.jsx
        │   │   └── PaginationControls.jsx
        │   └── admin/
        │       └── EntityFormModal.jsx
        ├── pages/
        │   ├── auth/LoginPage.jsx
        │   ├── dashboard/DashboardPage.jsx
        │   ├── tickets/
        │   │   ├── TicketListPage.jsx
        │   │   ├── TicketCreatePage.jsx
        │   │   └── TicketDetailsPage.jsx
        │   ├── admin/
        │   │   ├── DepartmentsPage.jsx
        │   │   ├── CategoriesPage.jsx
        │   │   ├── SubcategoriesPage.jsx
        │   │   ├── LocationsPage.jsx
        │   │   ├── SlaSettingsPage.jsx
        │   │   └── UserManagementPage.jsx
        │   └── errors/
        │       ├── NotFoundPage.jsx
        │       └── UnauthorizedPage.jsx
        └── styles/global.css
```

---

## User Roles & Permissions

| Action | ADMIN | HELPDESK | HOD | REQUESTER |
|---|:---:|:---:|:---:|:---:|
| Create ticket | — | — | ✓ | ✓ |
| View all tickets | ✓ | ✓ | ✓ | — |
| View own tickets | ✓ | ✓ | ✓ | ✓ |
| Claim / handle ticket | ✓ | ✓ | ✓ | — |
| Transfer to another agent | ✓ | ✓ | ✓ | — |
| Update ticket status | ✓ | ✓ | ✓ | — |
| Resolve ticket | ✓ | ✓ | ✓ | — |
| Close ticket | ✓ | ✓ | ✓ | — |
| Reopen ticket | ✓ | ✓ | ✓ | — |
| Escalate ticket | ✓ | ✓ | ✓ | — |
| Add public comment (Chat) | ✓ | ✓ | ✓ | ✓ |
| Add internal comment | ✓ | ✓ | ✓ | — |
| Upload attachment | ✓ | ✓ | ✓ | ✓ |
| View dashboard | ✓ | ✓ | ✓ | ✓* |
| View helpdesk workload | ✓ | ✓ | ✓ | — |
| View reports | ✓ | ✓ | ✓ | — |
| Manage users | ✓ | — | — | — |
| Manage master data | ✓ | ✓ | ✓ | — |
| Manage SLA configs | ✓ | — | — | — |

> \* Requesters see a scoped dashboard limited to their own tickets.

---

## Ticket Lifecycle

```
NEW ──→ OPEN ──→ ASSIGNED ──→ IN_PROGRESS ──→ RESOLVED ──→ CLOSED
                    │               │                          │
                    └──────────→ ON_HOLD ←──────────────────── │
                                   │                        REOPENED
                              ESCALATED ←──────────────────────┘
                              
                         CANCELLED (from any state, admin only)
```

**State Transition Rules (enforced server-side):**

| From | Allowed Transitions |
|---|---|
| NEW | OPEN, CANCELLED |
| OPEN | ASSIGNED, CANCELLED |
| ASSIGNED | IN_PROGRESS, ON_HOLD, CANCELLED |
| IN_PROGRESS | ON_HOLD, RESOLVED, ESCALATED |
| ON_HOLD | IN_PROGRESS, ESCALATED, CANCELLED |
| ESCALATED | IN_PROGRESS, RESOLVED |
| RESOLVED | CLOSED, REOPENED |
| CLOSED | REOPENED |
| REOPENED | OPEN, ASSIGNED |
| CANCELLED | — (terminal) |

---

## SLA Management

SLA policies are configured per priority level in the Admin panel under **SLA Settings**.

| Setting | Description |
|---|---|
| `firstResponseMinutes` | Time from ticket creation to first staff response |
| `resolutionMinutes` | Time from creation to full resolution |
| `escalationMinutes` | Time after which unresolved ticket is auto-flagged |

- SLA deadlines (`dueAt`, `firstRespondedAt`, `escalatedAt`) are stamped on ticket creation.
- The `isOverdue` flag is re-evaluated on every ticket list or detail fetch.
- The `GET /api/tickets/escalations/pending` endpoint returns all tickets past their escalation threshold that haven't been escalated yet.

---

## Database Schema

### Enums

```
Role:         ADMIN | HELPDESK | HOD | REQUESTER
Priority:     LOW | MEDIUM | HIGH | CRITICAL
TicketStatus: NEW | OPEN | ASSIGNED | IN_PROGRESS | ON_HOLD |
              ESCALATED | RESOLVED | CLOSED | REOPENED | CANCELLED
```

### Models

#### User
| Field | Type | Notes |
|---|---|---|
| id | Int | PK, auto-increment |
| fullName | String | — |
| email | String | Unique |
| phone | String? | Optional |
| password | String | bcrypt hashed |
| role | Role | Default: REQUESTER |
| departmentId | Int? | FK → Department |
| isActive | Boolean | Default: true |
| createdAt / updatedAt | DateTime | Auto-managed |

#### Department / Category / Location
All share: `id`, `name` (unique), `code` (unique), `description?`, `isActive`, timestamps.

#### Subcategory
Belongs to a `Category`. Unique constraint on `(categoryId, name)` and `(categoryId, code)`.

#### SLAConfig
One record per `Priority` (unique). Stores `firstResponseMinutes`, `resolutionMinutes`, `escalationMinutes`.

#### Ticket
| Field | Type | Notes |
|---|---|---|
| id | Int | PK |
| ticketNumber | String | Unique, auto-generated |
| title | String | — |
| description | String | — |
| priority | Priority | — |
| status | TicketStatus | Default: NEW |
| departmentId | Int | FK |
| categoryId | Int | FK |
| subcategoryId | Int? | FK |
| locationId | Int? | FK |
| assetName / assetId | String? | Optional asset reference |
| requesterId | Int | FK → User |
| requesterContact | String? | — |
| assignedTeam | String? | — |
| assignedToId | Int? | FK → User (Technician) |
| dueAt | DateTime? | SLA resolution deadline |
| firstRespondedAt | DateTime? | — |
| escalatedAt | DateTime? | — |
| resolvedAt | DateTime? | — |
| closedAt | DateTime? | — |
| isOverdue | Boolean | Default: false |

Indexed on: `status`, `priority`, `departmentId`, `categoryId`, `assignedToId`, `requesterId`, `createdAt`, `isOverdue`, `escalatedAt`.

#### TicketComment
`ticketId`, `userId`, `comment`, `isInternal` (boolean — internal notes hidden from requesters).

#### TicketActivityLog
`ticketId`, `userId`, `action`, `oldValue`, `newValue`, `remarks` — written on every ticket mutation.

#### TicketAttachment
`ticketId`, `uploadedById`, `originalName`, `fileName`, `filePath`, `mimeType`, `fileSize`.

---

## API Reference

> All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login — returns JWT + user object |
| GET | `/auth/me` | Protected | Get the currently authenticated user |

### Users (Admin Only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users (filterable) |
| GET | `/users/:id` | Get user by ID |
| PATCH | `/users/:id` | Update user details |
| PATCH | `/users/:id/status` | Toggle user active/inactive |

### Master Data (Protected)

All master data endpoints follow the same pattern:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/{resource}` | List all (filterable by `isActive`) |
| POST | `/{resource}` | Create new record |
| GET | `/{resource}/:id` | Get by ID |
| PUT | `/{resource}/:id` | Update record |
| DELETE | `/{resource}/:id` | Delete record |

Resources: `departments`, `categories`, `subcategories`, `locations`, `sla-configs`

### Tickets (Protected)

| Method | Endpoint | Role Restriction | Description |
|---|---|---|---|
| GET | `/tickets` | All | List tickets (role-scoped) |
| POST | `/tickets` | All | Create new ticket |
| GET | `/tickets/:id` | All | Get ticket details |
| PATCH | `/tickets/:id` | Staff | Update ticket fields |
| PATCH | `/tickets/:id/claim` | Staff | Claim/assign ticket to self |
| PATCH | `/tickets/:id/transfer` | Staff | Transfer ticket to another helpdesk agent |
| PATCH | `/tickets/:id/status` | Staff | Change ticket status |
| PATCH | `/tickets/:id/resolve` | Staff | Mark as resolved |
| PATCH | `/tickets/:id/close` | ADMIN/HELPDESK/HOD | Close resolved ticket |
| PATCH | `/tickets/:id/reopen` | ADMIN/HELPDESK/HOD | Reopen ticket |
| PATCH | `/tickets/:id/escalate` | ADMIN/HELPDESK/HOD | Escalate ticket |
| GET | `/tickets/escalations/pending` | Protected | List SLA-pending escalations |

### Ticket Sub-Resources

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tickets/:id/comments` | List comments |
| POST | `/tickets/:id/comments` | Add comment |
| GET | `/tickets/:id/attachments` | List attachments |
| POST | `/tickets/:id/attachments` | Upload file (multipart/form-data) |
| GET | `/tickets/:id/activity-log` | View full activity log |

### Dashboard (Protected)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/summary` | KPI counts (open, resolved, overdue, etc.) |
| GET | `/dashboard/category-wise` | Tickets grouped by category |
| GET | `/dashboard/department-wise` | Tickets grouped by department |
| GET | `/dashboard/priority-wise` | Tickets grouped by priority |
| GET | `/dashboard/status-wise` | Tickets grouped by status |
| GET | `/dashboard/technician-performance` | Helpdesk workload (assigned vs resolved per agent) |
| GET | `/dashboard/monthly-trend` | Monthly ticket volume (default: 6 months, max: 24) |

### Reports (Protected)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/tickets` | Full paginated report with date/category/dept/status/priority filters |

### Static Files

| Path | Description |
|---|---|
| `GET /uploads/*` | Serve uploaded ticket attachments directly |

### Utility

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Root endpoint |
| GET | `/api/health` | Health check — returns server + DB status |

---

## Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher
- **MongoDB** running locally (or via Docker)

---

## Installation & Setup

### 1. Database Setup

You can run MongoDB either directly or via Docker Compose.

**Option A — Docker Compose (recommended):**

```bash
docker compose up -d
```

**Option B — Local MongoDB:**

- Ensure MongoDB is running and reachable at your `MONGODB_URI`

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment file
cp .env.example .env
```

Edit `backend/.env` with your values (see [Environment Variables](#environment-variables) below).

```bash
# Seed demo data (users, master data, tickets)
npm run seed

# Start backend
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment file
cp .env.example .env

# Start frontend
npm run dev
```

Edit `frontend/.env` — set `VITE_API_BASE_URL` to your backend URL (default: `http://localhost:5000/api`).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment |
| `PORT` | Yes | `5000` | Express server port |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | Yes | `1d` | JWT expiry (e.g. `1d`, `7d`, `12h`) |
| `CLIENT_URL` | Yes | `http://localhost:5173` | CORS allowed origin (frontend URL) |
| `BCRYPT_SALT_ROUNDS` | No | `10` | bcrypt cost factor |
| `SEED_ADMIN_EMAIL` | No | `admin@tmshospital.com` | Default admin email (seeder) |
| `SEED_ADMIN_PASSWORD` | No | `Admin@12345` | Default admin password (seeder) |
| `SEED_ADMIN_NAME` | No | `System Administrator` | Default admin full name (seeder) |
| `SEED_ADMIN_PHONE` | No | `9999999999` | Default admin phone (seeder) |

**`MONGODB_URI` example:**

```text
mongodb://localhost:27017/tms_hospital
```

> The backend validates all required env vars on startup and exits immediately with a clear error message if any are missing.

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|:---:|---|
| `VITE_API_BASE_URL` | Yes | Full URL to the backend API (e.g. `http://localhost:5000/api`) |

---

## Running the Application

### Development Mode

**Terminal 1 — Backend:**
```powershell
cd backend
npm run dev
```
Backend starts on `http://localhost:5000` with hot-reload via nodemon.

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm run dev
```
Frontend starts on `http://localhost:5173` with Vite HMR.

### Production Build (Frontend)

```powershell
cd frontend
npm run build
# Output goes to frontend/dist/
npm run preview  # Preview the production build locally
```

### Production Start (Backend)

```powershell
cd backend
npm start
```

---

## Seed & Default Credentials

After running `npm run seed`, use these credentials to log in:

See `credition.txt` for all seeded users (empId + password).

**Admin (example):**

| Field | Value |
|---|---|
| Employee ID | `EMP-ADMIN-001` |
| Password | `Admin@12345` |

> These can be customized via the `SEED_ADMIN_*` environment variables before seeding.

**Change the admin password immediately after your first login in a production environment.**

---

## File Uploads

Ticket attachments are stored on disk under `backend/uploads/tickets/`.

| Setting | Value |
|---|---|
| Maximum file size | 10 MB |
| Storage location | `backend/uploads/tickets/` |
| Filename format | `{timestamp}-{8-byte-hex}{ext}` |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain` |

Files are served statically at `GET /uploads/{filename}`.

> In a production deployment, serve the `uploads/` directory via a web server (Nginx, Apache) or move to object storage (AWS S3, etc.) for better performance and scalability.

---

## Dashboard & Reports

### Dashboard Endpoints

All dashboard data is role-scoped:
- **REQUESTER** — data filtered to their own tickets only
- **HELPDESK** — includes helpdesk workload and status breakdowns
- **HELPDESK / HOD / ADMIN** — all tickets

The monthly trend endpoint accepts a `months` query parameter (default: `6`, max: `24`).

### Reports

`GET /api/reports/tickets` supports the following query parameters:

| Parameter | Type | Description |
|---|---|---|
| `startDate` | ISO date string | Filter tickets created on or after this date |
| `endDate` | ISO date string | Filter tickets created on or before this date |
| `categoryId` | Integer | Filter by category |
| `departmentId` | Integer | Filter by department |
| `status` | TicketStatus enum | Filter by status |
| `priority` | Priority enum | Filter by priority |
| `assignedToId` | Integer | Filter by assigned technician |
| `page` | Integer | Page number (default: 1) |
| `limit` | Integer | Records per page (default: 20) |

---

## Project Conventions

### Backend

- All controllers are wrapped with `asyncHandler` — no try/catch boilerplate in controllers
- Domain errors throw `new ApiError(statusCode, message)` which is caught by `globalErrorHandler`
- All success responses use `sendResponse(res, statusCode, data, message)`
- Pagination is parsed with `parsePagination(query)` utility (returns `{ skip, take, page, limit }`)
- Input is never trusted — all IDs are parsed to integers, booleans parsed explicitly
- Master data modules are generated via `createMasterService` / `createMasterController` / `createMasterRouter` factory utilities to eliminate duplication

### Frontend

- All API calls go through `src/services/apiClient.js` (Axios instance with auto-attached Bearer token)
- Auth state is managed in `AuthContext` with localStorage persistence
- Toast notifications via `ToastContext` / `useToast` hook
- Confirm dialogs via `ConfirmDialogContext` / `useConfirmDialog` hook
- Route guards at the router level via `ProtectedRoute` — redirects unauthenticated users to `/login` and unauthorized roles to `/unauthorized`
- Navigation items in `appConfig.js` are filtered by `user.role` before rendering the sidebar

### Naming Conventions

| Pattern | Usage |
|---|---|
| `isX`, `hasX` | Boolean variables/props |
| `getX`, `fetchX` | Async data fetchers |
| `handleX` | Event handler functions |
| `onX` | Callback props |
| `useX` | Custom React hooks |
| `XService`, `XController`, `XRepository` | Backend class/module names |
