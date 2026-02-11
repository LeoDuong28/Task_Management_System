# Task Management System

A full-stack task management app with role-based access control (RBAC), multi-tenant organization support, and audit logging.

**Live Demo:** [task-management-system-78zx.onrender.com](https://task-management-system-78zx.onrender.com)

| Role | Email | Password |
|------|-------|----------|
| Owner | admin@demo.com | admin123 |
| Viewer | viewer@demo.com | viewer123 |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 10, TypeORM, SQLite |
| Frontend | Angular 17, Tailwind CSS |
| Auth | JWT (HS256), bcrypt (12 rounds) |
| Validation | class-validator + ValidationPipe |
| Deployment | Docker (multi-stage), Render |

## Architecture

### Monorepo Structure

```
├── apps/
│   ├── api/                  # NestJS REST API
│   │   └── src/
│   │       ├── auth/         # JWT authentication, login/register
│   │       ├── tasks/        # CRUD + drag-and-drop reorder
│   │       ├── users/        # User management
│   │       ├── organizations/# Multi-tenant org hierarchy
│   │       └── audit/        # Activity logging
│   │
│   └── dashboard/            # Angular SPA
│       └── src/app/
│           ├── core/         # Auth service, HTTP interceptor, route guards
│           └── pages/        # Login, Register, Dashboard views
│
├── libs/
│   ├── data/                 # Shared DTOs, enums, interfaces
│   └── auth/                 # RBAC guards and decorators
│
├── Dockerfile                # Multi-stage production build
└── .env.example
```

**Why a monorepo?** The `libs/` folder lets both apps share the same TypeScript types, DTOs, enums, and RBAC definitions. When I add a field to a Task, I change it once in `libs/data` and both frontend and backend get the update — no type drift.

**Why `libs/auth`?** All authorization logic lives in one place: `@Roles()` and `@Permissions()` decorators plus the three guard implementations (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`). Controllers just declare what's needed.

## Security

### Authentication
- **Password hashing:** bcrypt with cost factor 12
- **JWT tokens:** signed with HS256, configurable expiry (default 24h)
- **Production safety:** app refuses to start without `JWT_SECRET` in production
- **Email enumeration prevention:** registration returns a generic error on duplicate emails
- **CORS:** explicitly configured per-origin, warns if unset in production

### Input Validation
- **ValidationPipe** with `whitelist: true` and `forbidNonWhitelisted: true` — strips unknown fields and rejects unexpected properties
- All DTOs use `class-validator` decorators (`@IsEmail`, `@MaxLength`, `@IsEnum`, etc.)
- Explicit field assignment on updates — no `Object.assign()` mass-assignment

### Rate Limiting
- Global: 10 requests/minute per IP (`@nestjs/throttler`)
- Login: 5 requests/minute
- Register: 3 requests/minute

### Data Isolation
- All queries are scoped to the user's organization
- Audit logs are filtered by `organizationId` — users cannot see other orgs' activity

## Access Control (RBAC)

### Three-Layer Authorization

Every protected request passes through three guards in sequence:

```
Request → JwtAuthGuard → RolesGuard → PermissionsGuard → Controller
```

1. **JwtAuthGuard** — extracts and verifies the Bearer token, attaches the decoded payload to `req.user`
2. **RolesGuard** — checks if the user's role is in the `@Roles()` decorator list
3. **PermissionsGuard** — checks if the user's role has all required `@Permissions()`

### Role-Permission Mapping

| Role | Permissions |
|------|-------------|
| Owner | All (create, read, update, delete tasks + view audit + manage users + manage org) |
| Admin | create, read, update, delete tasks + view audit + manage users |
| Viewer | read tasks only |

### How It Works in Code

```typescript
// Controller declares requirements
@Delete(':id')
@Roles(Role.OWNER, Role.ADMIN)
@Permissions(Permission.DELETE_TASK)
async remove(@Param('id') id: string, @Req() req: AuthRequest) { ... }
```

```typescript
// Service enforces business rules
if (user.role === Role.ADMIN && task.ownerId !== user.sub) {
  throw new ForbiddenException('Admins can only delete their own tasks');
}
```

**Frontend** reads the JWT payload to show/hide UI elements (buttons, menus), but all enforcement happens server-side.

### JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "organizationId": "org-uuid",
  "parentOrganizationId": "parent-org-uuid",
  "permissions": ["create:task", "read:task", "update:task", "delete:task", "view:audit"]
}
```

## Data Model

```
Organization (multi-tenant, supports parent → child hierarchy)
  │
  ├── User (belongs to one org, has one role)
  │     │
  │     ├── Task (scoped to org, has status/priority/category/order)
  │     │
  │     └── AuditLog (tracks every create/update/delete with IP + timestamp)
  │
  └── Child Organization (optional sub-org)
```

### Organization Scoping

Users in a parent org can see tasks from child orgs. This enables department/team visibility:

```typescript
const orgIds = [user.organizationId];
if (user.parentOrganizationId) {
  orgIds.push(user.parentOrganizationId);
}
return this.taskRepo.find({ where: { organizationId: In(orgIds) } });
```

### Task Reordering

Drag-and-drop reorder uses database transactions to atomically shift order values:

```typescript
await this.dataSource.transaction(async (manager) => {
  // Shift existing tasks, then place the moved task
});
```

This prevents race conditions when multiple users reorder simultaneously.

## API Endpoints

Base URL: `/api`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /auth/register | No | — | Create account (3 req/min) |
| POST | /auth/login | No | — | Get JWT token (5 req/min) |
| GET | /tasks | Yes | All | List tasks (org-scoped) |
| POST | /tasks | Yes | Owner, Admin | Create task |
| PUT | /tasks/:id | Yes | Owner, Admin | Update task |
| DELETE | /tasks/:id | Yes | Owner, Admin | Delete task (admins: own only) |
| PUT | /tasks/:id/reorder | Yes | Owner, Admin | Drag-and-drop reorder |
| GET | /audit-log?limit=50 | Yes | Owner, Admin | Activity logs (org-scoped, max 500) |

## Getting Started

### Prerequisites

Node.js 18+

### Local Development

```bash
npm install
cp .env.example .env

# Terminal 1: API
npm run api:dev

# Terminal 2: Frontend
cd apps/dashboard && npm install && npm start
```

Open http://localhost:4200

### Docker

```bash
docker build -t task-management .
docker run -p 3000:3000 -e SEED_DEMO_USERS=true -e JWT_SECRET=your-secret task-management
```

Open http://localhost:3000

## Design Decisions & Trade-offs

| Decision | Reasoning |
|----------|-----------|
| **SQLite over PostgreSQL** | Zero-config for demos and development. Production would use PostgreSQL. |
| **JWT over sessions** | Stateless — no server-side session store. Trade-off: can't revoke tokens before expiry. |
| **Permissions in JWT payload** | Avoids a DB lookup on every request. Trade-off: role changes don't take effect until token refresh. |
| **class-validator DTOs in shared lib** | Single source of truth for validation. Both compile-time types and runtime validation from one definition. |
| **Explicit field assignment** | `if (dto.title !== undefined) task.title = dto.title` instead of `Object.assign` — prevents mass-assignment attacks. |
| **Transaction for reorder** | Atomic order updates prevent inconsistent state during concurrent drag-and-drop. |

## What I'd Improve

- **Refresh tokens** — short-lived access tokens (15 min) + HttpOnly cookie refresh tokens with rotation
- **CSRF protection** — SameSite=Strict cookies + CSRF tokens for state-changing requests
- **Custom roles** — let organizations define their own roles with custom permission sets
- **PostgreSQL + Redis** — PostgreSQL for production data, Redis for permission caching and rate limiting
- **WebSocket notifications** — real-time task updates across team members
- **Resource-level sharing** — share individual tasks with specific users, not just org-wide

Built by Leo Duong
