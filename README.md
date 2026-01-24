# Secure Task Management System

A full-stack task management application with Role-Based Access Control (RBAC) built using NestJS, Angular, TypeORM, and TailwindCSS in an NX monorepo structure.

![Task Management Dashboard](https://via.placeholder.com/800x400/6366f1/ffffff?text=TaskFlow+Dashboard)

## 🚀 Live Demo

- **Frontend**: [https://your-username.github.io/task-management](https://your-username.github.io/task-management)
- **API Documentation**: See [API Docs](#api-documentation) section

### Demo Credentials
```
Owner Account:
Email: owner@demo.com
Password: demo123

Admin Account:
Email: admin@demo.com
Password: demo123

Viewer Account:
Email: viewer@demo.com
Password: demo123
```

## ✨ Features

### Core Features
- ✅ JWT-based authentication (login/register)
- ✅ Role-Based Access Control (Owner, Admin, Viewer)
- ✅ 2-level organizational hierarchy
- ✅ CRUD operations for tasks
- ✅ Drag-and-drop task management
- ✅ Real-time filtering and search
- ✅ Audit logging

### Frontend Features
- ✅ Responsive design (mobile → desktop)
- ✅ Dark/Light mode toggle
- ✅ Task categorization (Work, Personal, Urgent, Other)
- ✅ Kanban board view
- ✅ Task statistics dashboard

### Security Features
- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Permission-based guards and decorators
- ✅ Organization-scoped data access
- ✅ Audit trail logging

## 🏗️ Architecture

### Monorepo Structure (NX Workspace)
```
├── apps/
│   ├── api/                    # NestJS Backend
│   │   └── src/
│   │       ├── auth/           # Authentication module
│   │       ├── tasks/          # Tasks CRUD module
│   │       ├── users/          # Users management
│   │       ├── organizations/  # Org hierarchy
│   │       ├── audit/          # Audit logging
│   │       └── entities/       # TypeORM entities
│   │
│   └── dashboard/              # Angular Frontend
│       └── src/
│           └── app/
│               ├── components/ # Reusable components
│               ├── pages/      # Page components
│               ├── services/   # API services
│               ├── guards/     # Route guards
│               └── interceptors/
│
└── libs/
    ├── data/                   # Shared interfaces & DTOs
    └── auth/                   # Shared RBAC logic
```

### Data Model (ERD)

```
┌─────────────────┐       ┌─────────────────┐
│  Organization   │       │      User       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──┐   │ id (PK)         │
│ name            │   │   │ email           │
│ parentId (FK)   │───┘   │ password        │
│ createdAt       │       │ firstName       │
│ updatedAt       │       │ lastName        │
└────────┬────────┘       │ role            │
         │                │ organizationId  │──┐
         │                │ createdAt       │  │
         │                │ updatedAt       │  │
         │                └────────┬────────┘  │
         │                         │           │
         └─────────────────────────┼───────────┘
                                   │
┌─────────────────┐       ┌────────▼────────┐
│    AuditLog     │       │      Task       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ action          │       │ title           │
│ resource        │       │ description     │
│ resourceId      │       │ status          │
│ userId (FK)     │───────│ category        │
│ organizationId  │       │ priority        │
│ details         │       │ createdById(FK) │
│ timestamp       │       │ organizationId  │
└─────────────────┘       │ assignedToId    │
                          │ createdAt       │
                          │ updatedAt       │
                          └─────────────────┘
```

### Access Control Implementation

#### Roles & Permissions
| Role   | Permissions                                              |
|--------|----------------------------------------------------------|
| Owner  | CREATE, READ, UPDATE, DELETE tasks + VIEW_AUDIT + MANAGE_USERS |
| Admin  | CREATE, READ, UPDATE, DELETE tasks + VIEW_AUDIT          |
| Viewer | READ tasks only                                          |

#### Role Inheritance
- **Owner**: Can access all data in their org + child organizations
- **Admin**: Can access all data in their organization only
- **Viewer**: Can only view tasks in their organization

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/task-management.git
cd task-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
# JWT_SECRET=your-secure-secret-key
```

### 4. Run the Backend
```bash
cd apps/api
npm run start:dev
# API runs on http://localhost:3000
```

### 5. Run the Frontend
```bash
cd apps/dashboard
ng serve
# Dashboard runs on http://localhost:4200
```

### 6. Access the Application
1. Open http://localhost:4200
2. Register a new account (first user becomes Owner)
3. Start managing tasks!

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user.
```json
// Request
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "owner",
    "organizationId": "uuid"
  }
}
```

#### POST /api/auth/login
Login with credentials.
```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### Task Endpoints

#### GET /api/tasks
List accessible tasks (scoped by role/org).
```
Headers: Authorization: Bearer <token>
Query: ?status=todo&category=work
```

#### POST /api/tasks
Create a new task.
```json
// Request
{
  "title": "Complete project",
  "description": "Finish the task management system",
  "status": "todo",
  "category": "work",
  "priority": 2
}
```

#### PUT /api/tasks/:id
Update a task.
```json
{
  "status": "in_progress"
}
```

#### DELETE /api/tasks/:id
Delete a task (if permitted).

### Audit Endpoints

#### GET /api/audit-log
View access logs (Owner/Admin only).

## 🧪 Testing

### Backend Tests
```bash
cd apps/api
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

### Frontend Tests
```bash
cd apps/dashboard
ng test             # Unit tests
```

## 🚀 Deployment

### Deploy Frontend to GitHub Pages

1. Build the Angular app:
```bash
cd apps/dashboard
ng build --base-href /task-management/
```

2. Deploy to GitHub Pages:
```bash
npx angular-cli-ghpages --dir=dist/dashboard/browser
```

### Deploy Backend to Railway/Render

1. Push your code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables:
   - `JWT_SECRET`
   - `DATABASE_URL` (for PostgreSQL)
4. Deploy!

## 🔮 Future Considerations

- [ ] JWT refresh tokens for enhanced security
- [ ] CSRF protection
- [ ] RBAC caching with Redis
- [ ] Advanced role delegation
- [ ] WebSocket for real-time updates
- [ ] Email notifications
- [ ] Task comments and attachments
- [ ] Team collaboration features

## 📄 License

MIT License - feel free to use this project for learning and development.

## 👤 Author

**Leo Duong**
- GitHub: [@LeoDuong28](https://github.com/LeoDuong28)
- LinkedIn: [leo-duong-la](https://linkedin.com/in/leo-duong-la)
