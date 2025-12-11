# VisualizeDB Backend Server

Express.js backend with SQLite database for VisualizeDB diagram persistence and version control.

## Features

- **Multi-user Authentication**: JWT-based auth with access tokens (15min) and httpOnly refresh tokens (7 days)
- **Diagram Persistence**: Store diagrams in SQLite with all nested entities
- **Version Snapshots**: Create point-in-time snapshots and restore diagrams to previous states
- **RESTful API**: Complete CRUD operations for diagrams, tables, relationships, and more
- **Security**: bcrypt password hashing, CORS, helmet security headers, input validation

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Important**: Change the JWT secrets in production!

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key-here-change-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here
DATABASE_PATH=./database/visualizedb.db
CORS_ORIGIN=http://localhost:5173
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Development

### Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Development with Frontend

From the project root:

```bash
# Run both frontend and backend
npm run dev:all

# Or separately:
npm run dev        # Frontend (Vite)
npm run dev:server # Backend (Express)
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /signup` - Create user account
- `POST /login` - Login, returns JWT + sets refresh cookie
- `POST /logout` - Clear refresh token
- `POST /refresh` - Get new access token from refresh cookie
- `GET /me` - Get current user info

### Diagrams (`/api/diagrams`)

All require authentication.

- `GET /diagrams?include=tables,relationships,areas` - List user's diagrams
- `GET /diagrams/:id` - Get single diagram
- `POST /diagrams` - Create diagram
- `PUT /diagrams/:id` - Update diagram
- `DELETE /diagrams/:id` - Delete diagram
- Nested entity endpoints:
  - `GET|POST|DELETE /diagrams/:id/tables` and `/diagrams/:id/tables/:tableId`
  - `GET|POST|DELETE /diagrams/:id/relationships` and `/diagrams/:id/relationships/:relationshipId`
  - `GET|POST|DELETE /diagrams/:id/dependencies` and `/diagrams/:id/dependencies/:dependencyId`
  - `GET|POST|DELETE /diagrams/:id/areas` and `/diagrams/:id/areas/:areaId`
  - `GET|POST|DELETE /diagrams/:id/custom-types` and `/diagrams/:id/custom-types/:customTypeId`
  - `GET|POST|DELETE /diagrams/:id/notes` and `/diagrams/:id/notes/:noteId`
- Entity updates by ID (no diagramId needed):
  - `PUT /diagrams/tables/:tableId`
  - `PUT /diagrams/relationships/:relationshipId`
  - `PUT /diagrams/dependencies/:dependencyId`
  - `PUT /diagrams/areas/:areaId`
  - `PUT /diagrams/custom-types/:customTypeId`
  - `PUT /diagrams/notes/:noteId`

### Versions (`/api/diagrams/:diagramId/versions`)

- `GET /versions` - List versions (metadata only)
- `GET /versions/:versionId` - Get version with full snapshot
- `POST /versions` - Create new snapshot
- `POST /versions/:versionId/restore` - Restore diagram to this version
- `DELETE /versions/:versionId` - Delete a version

### Config & Filters

- `GET /api/diagrams/config` - Get user config
- `PUT /api/diagrams/config` - Update config
- `GET /api/diagrams/:id/filter` - Get diagram filters
- `PUT /api/diagrams/:id/filter` - Update filters
- `DELETE /api/diagrams/:id/filter` - Delete filters for a diagram

## API Docs

- OpenAPI JSON: `GET /api/openapi.json`
- Swagger UI: `GET /api/docs`

## Database Schema

SQLite database with 5 tables:

### users
- `id` (TEXT, PRIMARY KEY)
- `email` (TEXT, UNIQUE)
- `password_hash` (TEXT)
- `created_at` (INTEGER)
- `updated_at` (INTEGER)

### diagrams
- `id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT, FOREIGN KEY)
- `name` (TEXT)
- `database_type` (TEXT)
- `database_edition` (TEXT)
- `tables_json` (TEXT) - JSON array of tables
- `relationships_json` (TEXT) - JSON array of relationships
- `dependencies_json` (TEXT) - JSON array of dependencies
- `areas_json` (TEXT) - JSON array of areas
- `custom_types_json` (TEXT) - JSON array of custom types
- `notes_json` (TEXT) - JSON array of notes
- `created_at` (INTEGER)
- `updated_at` (INTEGER)

### diagram_versions
- `id` (TEXT, PRIMARY KEY)
- `diagram_id` (TEXT, FOREIGN KEY)
- `user_id` (TEXT, FOREIGN KEY)
- `version_name` (TEXT)
- `description` (TEXT)
- `snapshot_json` (TEXT) - Full diagram snapshot
- `created_at` (INTEGER)

### user_config
- `user_id` (TEXT, PRIMARY KEY)
- `default_diagram_id` (TEXT)
- `config_json` (TEXT)

### diagram_filters
- `diagram_id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT, FOREIGN KEY)
- `table_ids_json` (TEXT)
- `schema_ids_json` (TEXT)

## Production Deployment

### 1. Build Frontend and Backend

```bash
# From project root
npm run build:all
```

This builds:
- Frontend → `dist/`
- Backend → `server/dist/`

### 2. Set Production Environment

Update `server/.env`:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<strong-random-secret>
REFRESH_TOKEN_SECRET=<strong-random-secret>
DATABASE_PATH=./database/visualizedb.db
CORS_ORIGIN=https://yourdomain.com
```

### 3. Start Production Server

```bash
cd server
npm start
```

The Express server serves:
- API endpoints at `/api/*`
- Frontend static files from `../dist/`
- SPA fallback for client-side routing

### 4. Process Manager (Recommended)

Use PM2 for production:

```bash
npm install -g pm2
pm2 start dist/index.js --name visualizedb-server
pm2 save
pm2 startup
```

## Security Considerations

### Production Checklist

- ✅ Change `JWT_SECRET` and `REFRESH_TOKEN_SECRET` to strong random values
- ✅ Set `NODE_ENV=production`
- ✅ Enable HTTPS (use reverse proxy like nginx)
- ✅ Update `CORS_ORIGIN` to your domain
- ✅ Regular database backups
- ✅ Keep dependencies updated
- ✅ Use environment variables for secrets (never commit)

### Password Requirements

- Minimum 8 characters
- Hashed with bcrypt (10 rounds)

### Token Security

- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry, httpOnly cookies
- Automatic token refresh on 401 errors
- Secure flag in production (HTTPS only)

## Troubleshooting

### Database locked error

SQLite may have locking issues with high concurrency. The database uses WAL mode for better concurrency, but for very high traffic, consider PostgreSQL.

### Port already in use

Change the `PORT` in `.env` file.

### CORS errors

Make sure `CORS_ORIGIN` in `server/.env` matches your frontend URL.

## Development Tips

### Database Inspection

View the SQLite database:

```bash
sqlite3 server/database/visualizedb.db
.tables
.schema diagrams
SELECT * FROM users;
```

### API Testing

Use tools like:
- curl
- Postman
- Thunder Client (VS Code extension)

Example:

```bash
# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Clear Database

Delete the SQLite file to start fresh:

```bash
rm server/database/visualizedb.db
```

The database will be recreated on next server start.

## Architecture

### Hybrid Schema Design

The backend uses a **hybrid approach**:
- Core entities normalized (users, diagrams, versions)
- Nested data stored as JSON columns (tables, relationships, etc.)

**Rationale**:
- Maintains consistency with existing frontend data model
- Simplifies API (fetch diagram with all nested data in one request)
- Version snapshots need full serialization anyway
- Easier to migrate from IndexedDB
- Good performance for typical diagram sizes

### Storage Provider Pattern

The frontend `StorageContext` interface remains unchanged. The implementation switches between:
- `DexieStorageProvider` - IndexedDB (offline mode)
- `ApiStorageProvider` - HTTP API (backend mode)

Controlled by `VITE_USE_BACKEND` environment variable.

## License

Same as VisualizeDB main project.
