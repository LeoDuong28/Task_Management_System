# Leo Duong's Task Management System

A secure task management application with role-based access control. Built with NestJS and Angular 17.

## Getting Started

### Prerequisites

You'll need Node.js 18+ installed on your machine.

### Quick Start

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Start the backend:

```bash
npm run api:dev
```

4. In a new terminal, start the frontend:

```bash
cd apps/dashboard
npm install
npm start
```

5. Open http://localhost:4200 in your browser

### Default Admin Account

The system comes with a pre-configured admin account:

- **Email:** duongtrongnghia287@gmail.com
- **Password:** Password123@

## Environment Setup

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000

# Database (SQLite by default)
DB_PATH=taskdb.sqlite

# JWT Settings
JWT_SECRET=change-this-to-something-secure-in-production
JWT_EXPIRY=24h

# Frontend URL for CORS
CORS_ORIGIN=http://localhost:4200
```

For production, make sure to:

- Use a strong, random JWT_SECRET
- Consider switching to PostgreSQL for the database
- Set NODE_ENV=production

## Project Structure

I went with an NX monorepo setup because it makes sharing code between the frontend and backend really easy. Here's how everything is organized:

```
├── apps/
│   ├── api/                 # NestJS backend
│   │   └── src/
│   │       ├── auth/        # Login, registration, JWT
│   │       ├── tasks/       # Task CRUD operations
│   │       ├── users/       # User management
│   │       ├── organizations/
│   │       └── audit/       # Activity logging
│   │
│   └── dashboard/           # Angular frontend
│       └── src/app/
│           ├── core/        # Services and guards
│           └── pages/       # Login, Register, Dashboard
│
├── libs/
│   ├── data/               # Shared types and interfaces
│   └── auth/               # RBAC decorators and guards
```

### Why This Structure?

The `libs/` folder is the key here. Instead of duplicating types between frontend and backend, both apps import from the same place. When I add a new field to a Task, I change it once in `libs/data` and both apps get the update.

The `libs/auth` folder contains all the RBAC logic - decorators like `@Roles()` and `@Permissions()`, plus the guard implementations. This keeps authorization logic in one place instead of scattered across controllers.

## Data Model

### Overview

The app has four main entities: Organizations, Users, Tasks, and AuditLogs.

```
┌─────────────────┐
│  Organization   │
│  - id           │
│  - name         │
│  - parentId     │◄──┐ (self-reference for hierarchy)
└────────┬────────┘   │
         │            │
         │ has many   │
         ▼            │
┌─────────────────┐   │
│     User        │   │
│  - id           │   │
│  - email        │   │
│  - name         │   │
│  - password     │   │
│  - role         │   │
│  - orgId ───────┼───┘
└────────┬────────┘
         │
         │ owns
         ▼
┌─────────────────┐       ┌─────────────────┐
│     Task        │       │   AuditLog      │
│  - id           │       │  - id           │
│  - title        │       │  - userId       │
│  - description  │       │  - action       │
│  - status       │       │  - resource     │
│  - priority     │       │  - details      │
│  - category     │       │  - timestamp    │
│  - ownerId      │       └─────────────────┘
│  - orgId        │
└─────────────────┘
```

### Organizations

Organizations support a two-level hierarchy. A parent org can have child orgs, and users in the parent can see tasks from child orgs. This is useful for companies with departments or teams.

### Users & Roles

Each user has one of three roles:

- **Owner** - Full access, can manage org settings
- **Admin** - Can create/edit/delete tasks, view audit logs
- **Viewer** - Read-only access to tasks

### Tasks

Tasks have status (todo, in_progress, done), priority (low, medium, high), and category (work, personal, etc.). The `order` field handles drag-and-drop sorting within each status column.

### Audit Logs

Every create, update, and delete operation gets logged with who did it and when. Owners and admins can view these logs to track activity.

## Access Control

### How It Works

The RBAC system has two layers: roles and permissions.

Roles are simple labels (owner, admin, viewer). Permissions are specific actions (create:task, delete:task, view:audit). Each role maps to a set of permissions:

| Role   | Permissions                                                                |
| ------ | -------------------------------------------------------------------------- |
| Owner  | Everything                                                                 |
| Admin  | create:task, read:task, update:task, delete:task, view:audit, manage:users |
| Viewer | read:task only                                                             |

### Backend Enforcement

Controllers use decorators to specify required roles or permissions:

```typescript
@Post()
@Roles(Role.OWNER, Role.ADMIN)
@Permissions(Permission.CREATE_TASK)
async create(@Body() dto: CreateTaskDto) {

}
```

Three guards run on each request:

1. **JwtAuthGuard** - Validates the JWT token
2. **RolesGuard** - Checks if user's role is in the allowed list
3. **PermissionsGuard** - Checks if user has required permissions

### Organization Scoping

Users can only see tasks from their own organization (and child orgs if they're in a parent org). This check happens in the service layer:

```typescript
const orgIds = [user.organizationId];
if (user.parentOrganizationId) {
  orgIds.push(user.parentOrganizationId);
}
```

### JWT Structure

The JWT token contains everything needed for authorization:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "organizationId": "org-uuid",
  "permissions": ["create:task", "read:task", ...]
}
```

The frontend reads this to show/hide UI elements, but actual enforcement happens server-side.

---

## API Reference

Base URL: `http://localhost:3000/api`

### Authentication

#### Register

```
POST /auth/register
```

Request:

```json
{
  "email": "user@example.com",
  "password": "mypassword",
  "name": "John Doe",
  "organizationName": "My Company"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner"
    }
  }
}
```

If you don't provide organizationName, you'll be added to the default org as a viewer.

#### Login

```
POST /auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

### Tasks

All task endpoints require the Authorization header:

```
Authorization: Bearer <your-token>
```

#### List Tasks

```
GET /tasks
```

Returns tasks visible to the current user based on their organization.

#### Create Task

```
POST /tasks
```

Request:

```json
{
  "title": "Fix login bug",
  "description": "Users can't log in on mobile",
  "priority": "high",
  "category": "work",
  "dueDate": "2024-02-15"
}
```

Requires: Owner or Admin role

#### Update Task

```
PUT /tasks/:id
```

Request:

```json
{
  "status": "in_progress",
  "priority": "medium"
}
```

Requires: Owner or Admin role

#### Delete Task

```
DELETE /tasks/:id
```

Requires: Owner or Admin role. Admins can only delete their own tasks.

#### Reorder Task (Drag & Drop)

```
PUT /tasks/:id/reorder
```

Request:

```json
{
  "order": 2,
  "status": "done"
}
```

### Audit Logs

#### Get Logs

```
GET /audit-log?limit=50
```

Requires: Owner or Admin role

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "CREATE",
      "resource": "task",
      "details": "Created task: Fix login bug",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Future Improvements

### Security Enhancements

**Refresh Tokens**

Right now, access tokens last 24 hours. For better security, I'd implement:

- Short-lived access tokens (15 minutes)
- Refresh tokens stored in HttpOnly cookies
- Token rotation on each refresh

**CSRF Protection**

The current setup is vulnerable to CSRF attacks. Would add:

- CSRF tokens for all state-changing requests
- SameSite=Strict on cookies

**Rate Limiting**

Need to add rate limiting to prevent:

- Brute force login attempts
- API abuse

### Role System Improvements

**Custom Roles**

Let organizations create their own roles with custom permission sets instead of the fixed three.

**Resource-Level Permissions**

Allow sharing individual tasks with specific users, not just org-wide access.

**Time-Based Access**

Support temporary access - like giving a contractor access for 2 weeks.

### Performance

**Permission Caching**

Cache permission checks in Redis to avoid repeated database lookups. Invalidate when roles change.

**Database**

For production with many users:

- Switch from SQLite to PostgreSQL
- Add indexes on frequently queried columns
- Consider read replicas for heavy read workloads

---

## Running Tests

Backend tests:

```bash
npm run test:api
```

Frontend tests:

```bash
cd apps/dashboard
npm test
```

The tests cover RBAC logic, authentication, and the main API endpoints.

---

## Troubleshooting

**"Cannot find module '@libs/data'"**

Make sure you have a `tsconfig.json` in the project root that extends `tsconfig.base.json`:

```json
{
  "extends": "./tsconfig.base.json"
}
```

**API returns 401 on all requests**

Check that:

1. You're including the Authorization header
2. The token hasn't expired
3. JWT_SECRET in .env matches what was used to sign the token

**Database errors on startup**

Delete `taskdb.sqlite` and restart - the app will recreate it with the correct schema.

Built by Leo Duong

## Docker (runs on any device)

From the repo root:

```bash
docker compose up --build
```

- Dashboard: http://localhost:8080
- API: http://localhost:3000/api

Default seeded admin (from the API startup seed):
- Email: duongtrongnghia287@gmail.com
- Password: Password123@

## Live demo (GitHub Pages)

This repo includes a GitHub Actions workflow that deploys the **Angular dashboard** to GitHub Pages on every push to `main`.

1) Push to GitHub.
2) In your repo: **Settings → Pages** → set Source to **GitHub Actions**.
3) (Recommended) Set a repo variable **API_URL** to your deployed backend, e.g. `https://your-api.onrender.com/api`.
4) Your demo URL will be:

`https://<your-username>.github.io/<your-repo>/`

> Note: GitHub Pages hosts static sites only. For a full live demo, deploy the NestJS API to a host like Render/Fly/Railway and point `API_URL` to it.

## 🐳 Docker Quickstart (Runs Anywhere)

### Local (API + Dashboard)

```bash
# from repo root
docker compose up --build
```

- Dashboard: http://localhost:8080
- API: http://localhost:3000/api

The API uses a SQLite database stored in a Docker volume (`api-data`).

### Stop

```bash
docker compose down
```

## 🌐 Live Demo on GitHub Pages (Dashboard)

This repo includes a GitHub Actions workflow that deploys the **Angular dashboard** to GitHub Pages.

1) Push to the `main` branch.
2) In GitHub: **Settings → Pages** → set **Build and deployment** to **GitHub Actions**.
3) (Optional) Set a repo variable for the backend URL:
   - **Settings → Secrets and variables → Actions → Variables**
   - Add `API_URL` = `https://YOUR_BACKEND_URL/api`

Your demo link will be:

```
https://<your-username>.github.io/<your-repo-name>/
```

> Note: GitHub Pages is static hosting. To make the demo fully functional, deploy the NestJS API to a host (Render/Fly.io/Railway/etc.) and set `API_URL` accordingly.

## Docker (runs on any device)

This repo includes a ready-to-go Docker setup for the API + Dashboard.

### Prerequisites
- Docker Desktop (or Docker Engine + Compose)

### Run

```bash
docker compose up --build
```

Then open:
- Dashboard: http://localhost:8080
- API: http://localhost:3000/api

A default admin account is auto-seeded on first run:
- Email: duongtrongnghia287@gmail.com
- Password: Password123@

The SQLite database is persisted in a named Docker volume (`api_data`).

## Live Demo (GitHub Pages)

GitHub Pages can host the **Dashboard**. The API must be hosted elsewhere (Render/Fly.io/Railway/etc.), then point the dashboard to that API URL.

1) Deploy your API (recommended: use the `Dockerfile.api`).
2) In your GitHub repo, go to **Settings → Variables and secrets → Actions → Variables** and add:
   - `API_URL` = `https://YOUR_BACKEND_DOMAIN/api`
3) In your GitHub repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4) Push to `main`.

Your demo will be available at:
`https://<your-github-username>.github.io/<your-repo-name>/`
