/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Database } from 'sql.js';
import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { config } from './env';

const dbPath = config.database.path;

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let sqlDb: Database | undefined;
let SQL: any;

// Initialize SQL.js
export const initializeSqlJs = async () => {
    // Prefer loading the wasm binary from the local sql.js package in Node.js
    try {
        const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
        const wasmBinary = new Uint8Array(fs.readFileSync(wasmPath));
        SQL = await initSqlJs({ wasmBinary: wasmBinary.buffer });
    } catch {
        // Fallback to default behavior if local wasm cannot be resolved
        SQL = await initSqlJs({
            locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
        });
    }

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        sqlDb = new SQL.Database(buffer);
    } else {
        sqlDb = new SQL.Database();
    }

    return sqlDb;
};

// Save database to file
export const saveDatabase = () => {
    if (sqlDb) {
        const data = sqlDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
};

// Get database instance
export const getDb = (): Database => {
    if (!sqlDb) {
        throw new Error(
            'Database not initialized. Call initializeSqlJs() first.'
        );
    }
    return sqlDb!;
};

// Wrapper class to make sql.js feel more like better-sqlite3
export class DbWrapper {
    prepare(sql: string) {
        return {
            run: (...params: any[]) => {
                const db = getDb();
                db.run(sql, params);
                saveDatabase();
                return { changes: db.getRowsModified() };
            },
            get: (...params: any[]) => {
                const db = getDb();
                const stmt = db.prepare(sql);
                stmt.bind(params);
                if (stmt.step()) {
                    const columns = stmt.getColumnNames();
                    const values = stmt.get();
                    const row: any = {};
                    columns.forEach((col, i) => {
                        row[col] = values[i];
                    });
                    stmt.free();
                    return row;
                }
                stmt.free();
                return undefined;
            },
            all: (...params: any[]) => {
                const db = getDb();
                const stmt = db.prepare(sql);
                stmt.bind(params);
                const rows: any[] = [];
                while (stmt.step()) {
                    const columns = stmt.getColumnNames();
                    const values = stmt.get();
                    const row: any = {};
                    columns.forEach((col, i) => {
                        row[col] = values[i];
                    });
                    rows.push(row);
                }
                stmt.free();
                return rows;
            },
        };
    }

    exec(sql: string) {
        const db = getDb();
        db.exec(sql);
        saveDatabase();
    }

    pragma(pragma: string) {
        // sql.js doesn't support pragmas like WAL mode
        // Pragmas are no-ops for sql.js
        console.log(`Pragma not supported in sql.js: ${pragma}`);
    }

    close() {
        if (sqlDb) {
            sqlDb.close();
        }
    }
}

export const db = new DbWrapper();

// Initialize database schema
export const initializeDatabase = async () => {
    await initializeSqlJs();

    db.exec(`
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        -- Diagrams table
        CREATE TABLE IF NOT EXISTS diagrams (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            database_type TEXT NOT NULL,
            database_edition TEXT,
            tables_json TEXT,
            relationships_json TEXT,
            dependencies_json TEXT,
            areas_json TEXT,
            custom_types_json TEXT,
            notes_json TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_diagrams_user_id ON diagrams(user_id);
        CREATE INDEX IF NOT EXISTS idx_diagrams_updated_at ON diagrams(updated_at DESC);

        -- Diagram versions (snapshots)
        CREATE TABLE IF NOT EXISTS diagram_versions (
            id TEXT PRIMARY KEY,
            diagram_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            version_name TEXT NOT NULL,
            description TEXT,
            snapshot_json TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_versions_diagram_id ON diagram_versions(diagram_id);
        CREATE INDEX IF NOT EXISTS idx_versions_created_at ON diagram_versions(created_at DESC);

        -- User config table
        CREATE TABLE IF NOT EXISTS user_config (
            user_id TEXT PRIMARY KEY,
            default_diagram_id TEXT,
            config_json TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Diagram filters (view state)
        CREATE TABLE IF NOT EXISTS diagram_filters (
            diagram_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            table_ids_json TEXT,
            schema_ids_json TEXT,
            FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    console.log('Database initialized successfully');
};

// Close database connection gracefully
export const closeDatabase = () => {
    saveDatabase();
    db.close();
    console.log('Database connection closed');
};

// Handle process termination
process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', () => {
    closeDatabase();
    process.exit(0);
});

// Periodic database save (every 30 seconds)
setInterval(saveDatabase, 30000);
