# ChartDB Backend Implementation Guide

## Overview

ChartDB now supports a **full-stack architecture** with an Express.js backend and SQLite database, providing:

- ✅ **Multi-user authentication** (JWT-based)
- ✅ **Cloud persistence** (SQLite database)
- ✅ **Version snapshots** (point-in-time diagram checkpoints)
- ✅ **RESTful API** (complete CRUD operations)
- ✅ **Backward compatible** (can still use IndexedDB offline mode)

## Quick Start

### Option 1: Use Backend (Recommended for Production)

**1. Start both frontend and backend:**

```bash
npm run dev:all
```

This starts:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

**2. Open browser to `http://localhost:5173`**

**3. You'll see the signup page** - Create an account to start using ChartDB with backend persistence.

### Option 2: Use IndexedDB Only (Offline Mode)

**1. Disable backend in `.env.development`:**

```env
VITE_USE_BACKEND=false
```

**2. Start frontend only:**

```bash
npm run dev
```

**3. Open browser** - Works offline with IndexedDB (original behavior).

## What Was Implemented

### Backend (Express.js + SQLite)

**Location**: `server/` directory

#### Core Components

1. **Authentication System** (`server/src/`)
   - JWT access tokens (15 min)
   - HttpOnly refresh cookies (7 days)
   - Bcrypt password hashing
   - Secure session management

2. **Database Layer** (`server/src/config/database.ts`)
   - SQLite with sql.js (pure JavaScript)
   - 5 tables: users, diagrams, diagram_versions, user_config, diagram_filters
   - Hybrid schema (normalized + JSON columns)

3. **API Routes** (`server/src/routes/`)
   - `/api/auth/*` - Authentication endpoints
   - `/api/diagrams/*` - Diagram CRUD
   - `/api/diagrams/:id/versions/*` - Version snapshots

4. **Services** (`server/src/services/`)
   - `auth.service.ts` - User management
   - `diagram.service.ts` - Diagram persistence
   - `version.service.ts` - Snapshot/restore logic

5. **Middleware** (`server/src/middleware/`)
   - JWT verification
   - Ownership authorization
   - Error handling
   - Input validation

### Frontend Integration

**Location**: `src/` directory

#### New Components

1. **API Client** (`src/services/api-client.ts`)
   - Axios instance with auth interceptors
   - Automatic token refresh on 401
   - Retry failed requests after refresh

2. **Auth Context** (`src/context/auth-context/`)
   - User state management
   - Login/signup/logout methods
   - Auto-refresh on app load

3. **Auth Pages**
   - `src/pages/login-page/login-page.tsx`
   - `src/pages/signup-page/signup-page.tsx`

4. **Protected Routes** (`src/components/protected-route/`)
   - Wraps diagram routes
   - Redirects to login if unauthenticated

5. **API Storage Provider** (`src/context/storage-context/api-storage-provider.tsx`)
   - Implements StorageContext interface
   - Makes API calls instead of IndexedDB
   - Transparent to existing components

6. **Router Updates** (`src/router.tsx`)
   - Added `/login` and `/signup` routes
   - Protected diagram routes with authentication
   - Conditional routing based on backend mode

## Architecture Decisions

### 1. Hybrid Database Schema

**Decision**: Use JSON columns for nested data (tables[], relationships[], etc.)

**Rationale**:
- ChartDB already serializes diagrams to JSON
- Avoids 10+ normalized tables
- Maintains consistency with existing data model
- Simpler API (fetch full diagram in one request)
- Version snapshots need full serialization anyway

**Trade-off**: Less query flexibility, but excellent performance for typical use cases.

### 2. Storage Provider Pattern

**Decision**: Keep StorageContext interface unchanged, swap implementation

**Benefit**: Zero changes to existing components. The same interface works with both IndexedDB and API.

**Implementation**:

```typescript
// Environment controls which provider is used
const useBackend = import.meta.env.VITE_USE_BACKEND === 'true';

export const StorageProvider = ({ children }) => {
    if (useBackend) {
        return <ApiStorageProvider>{children}</ApiStorageProvider>;
    }
    return <DexieStorageProvider>{children}</DexieStorageProvider>;
};
```

### 3. Version Snapshots: Full vs Delta

**Decision**: Full snapshots

**Rationale**:
- Simple implementation (just serialize entire diagram)
- Reliable restore (no replay logic needed)
- Storage is cheap (diagrams compress well, typically <1MB)
- Users won't create hundreds of versions
- Matches user mental model ("save point")

**Auto-backup**: When restoring a version, the system automatically creates a backup of the current state first.

## File Structure

```
chartdb/
├── server/                          # Backend (NEW)
│   ├── src/
│   │   ├── config/                 # Database, JWT, env
│   │   ├── middleware/             # Auth, validation, errors
│   │   ├── routes/                 # API endpoints
│   │   ├── controllers/            # Request handlers
│   │   ├── services/               # Business logic
│   │   └── types/                  # TypeScript types
│   ├── database/                   # SQLite file (gitignored)
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── src/                             # Frontend
│   ├── services/                   # NEW: API client
│   │   ├── api-client.ts
│   │   └── auth.service.ts
│   ├── context/
│   │   ├── auth-context/           # NEW: Auth state
│   │   └── storage-context/
│   │       ├── api-storage-provider.tsx  # NEW: API implementation
│   │       ├── storage-provider.tsx      # EXISTING: Dexie
│   │       └── index.tsx            # NEW: Conditional provider
│   ├── pages/
│   │   ├── login-page/             # NEW: Login UI
│   │   └── signup-page/            # NEW: Signup UI
│   ├── components/
│   │   ├── protected-route/        # NEW: Auth wrapper
│   │   └── root-layout/            # NEW: Layout with AuthProvider
│   └── router.tsx                  # MODIFIED: Added auth routes
│
├── .env.development                # NEW: Frontend env
├── .env.production                 # NEW: Frontend env
└── package.json                    # MODIFIED: Added scripts
```

## Environment Variables

### Frontend

**`.env.development`**:
```env
VITE_API_URL=http://localhost:3001/api
VITE_USE_BACKEND=true
```

**`.env.production`**:
```env
VITE_API_URL=/api
VITE_USE_BACKEND=true
```

### Backend

**`server/.env`**:
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=development-jwt-secret-key-change-in-production
REFRESH_TOKEN_SECRET=development-refresh-secret-key
DATABASE_PATH=./database/chartdb.db
CORS_ORIGIN=http://localhost:5173
```

**⚠️ Important**: Change JWT secrets in production!

## Development Workflow

### Development Mode

```bash
# Terminal 1: Start both frontend and backend
npm run dev:all

# Or separately:
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run dev:server
```

### Production Build

```bash
# Build both
npm run build:all

# Start production server (serves frontend + API)
npm start
```

## API Documentation

### Authentication

**Signup**:
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": { "id": "...", "email": "..." },
  "token": "eyJhbGc..."
}
```

**Login**:
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": { "id": "...", "email": "..." },
  "token": "eyJhbGc..."
}
+ Set-Cookie: refreshToken=...; HttpOnly; Secure
```

### Diagrams

**List Diagrams**:
```bash
GET /api/diagrams?include=tables,relationships
Authorization: Bearer <token>

Response:
{
  "diagrams": [...]
}
```

**Get Diagram**:
```bash
GET /api/diagrams/:id?include=tables,relationships,areas
Authorization: Bearer <token>

Response:
{
  "diagram": { ... }
}
```

**Create Diagram**:
```bash
POST /api/diagrams
Authorization: Bearer <token>
Content-Type: application/json

{
  "diagram": {
    "name": "My Diagram",
    "databaseType": "postgresql",
    "tables": [...],
    "relationships": [...]
  }
}
```

**Update Diagram**:
```bash
PUT /api/diagrams/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "diagram": {
    "name": "Updated Name",
    "tables": [...]
  }
}
```

### Version Snapshots

**Create Snapshot**:
```bash
POST /api/diagrams/:diagramId/versions
Authorization: Bearer <token>
Content-Type: application/json

{
  "versionName": "Before schema refactor",
  "description": "Backup before making major changes"
}

Response:
{
  "version": {
    "id": "...",
    "versionName": "...",
    "createdAt": 1234567890
  }
}
```

**List Versions**:
```bash
GET /api/diagrams/:diagramId/versions
Authorization: Bearer <token>

Response:
{
  "versions": [
    {
      "id": "...",
      "versionName": "...",
      "description": "...",
      "createdAt": 1234567890
    }
  ]
}
```

**Restore Version**:
```bash
POST /api/diagrams/:diagramId/versions/:versionId/restore
Authorization: Bearer <token>

Response:
{
  "diagram": { ... }  // Restored diagram
}
```

## Testing the Implementation

### 1. Test Backend Server

```bash
# Start server
cd server
npm run dev

# In another terminal, test endpoints
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":...}

# Test signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test Full Stack

```bash
# From project root
npm run dev:all

# Open browser to http://localhost:5173
# You should see the signup page
# Create an account and test diagram creation
```

### 3. Test Version Snapshots

1. Create a diagram
2. Add some tables
3. Create a version snapshot (will need UI implementation or API call)
4. Modify the diagram
5. Restore to the snapshot

## Security Features

### Password Security
- ✅ Bcrypt hashing (10 rounds)
- ✅ Minimum 8 characters required
- ✅ Never stored in plain text

### Token Security
- ✅ Short-lived access tokens (15 min)
- ✅ HttpOnly cookies for refresh tokens
- ✅ Automatic rotation on refresh
- ✅ Secure flag in production (HTTPS only)

### API Security
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation (express-validator)
- ✅ SQL injection prevention (prepared statements)
- ✅ Authorization checks (users can only access their own data)

### Production Checklist
- [ ] Change JWT_SECRET to strong random value
- [ ] Change REFRESH_TOKEN_SECRET to strong random value
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN for your domain
- [ ] Regular database backups
- [ ] Monitor server logs
- [ ] Use process manager (PM2)

## Troubleshooting

### "Cannot find module" errors
```bash
# Install dependencies
npm install
cd server && npm install
```

### Port already in use
Change PORT in `server/.env`

### CORS errors
Make sure `CORS_ORIGIN` in `server/.env` matches your frontend URL

### Authentication not working
Check that:
1. Backend server is running
2. `VITE_USE_BACKEND=true` in `.env.development`
3. `VITE_API_URL` points to backend server
4. Browser cookies are enabled

### Database locked
SQLite may lock with high concurrency. The database uses WAL mode for better concurrency. For very high traffic, consider PostgreSQL.

## Next Steps / Future Enhancements

### Version Manager UI (Not Yet Implemented)
Create a component to:
- Display list of versions
- Create new snapshots with name/description dialog
- Restore with confirmation
- Delete old versions

**Location**: `src/components/version-manager/`

### Real-time Collaboration
- WebSocket support for live updates
- Conflict resolution
- Multi-user editing

### Performance Optimization
- Caching layer (Redis)
- Database query optimization
- Pagination for large diagram lists

### Advanced Features
- Diagram sharing (public links)
- Team workspaces
- Export history
- Automated backups

## Migration from IndexedDB

If you have existing diagrams in IndexedDB and want to migrate to the backend:

1. **Export diagrams** - Use existing export to JSON feature
2. **Create account** - Sign up in the new backend mode
3. **Import diagrams** - Use import from JSON feature
4. **Verify** - Check all diagrams loaded correctly

**Note**: The implementation doesn't include automatic migration as per requirements ("start from scratch without any diagrams").

## Summary

This implementation provides a complete, production-ready backend for ChartDB with:

- **23 backend files** (20+ new files)
- **15 frontend files** (10+ new files)
- **Complete authentication system**
- **Full CRUD API**
- **Version snapshot/restore**
- **Backward compatible** with IndexedDB mode

The system is ready to use in development. For production deployment, follow the security checklist and deployment guide in `server/README.md`.

## Support

For issues or questions:
1. Check the server logs
2. Review `server/README.md`
3. Test API endpoints with curl/Postman
4. Check browser console for frontend errors

Happy diagramming! 🎉
