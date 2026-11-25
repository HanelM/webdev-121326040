const Database = require('better-sqlite3');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let db;
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (isProduction) {
    // Production: Neon PostgreSQL configuration for Render
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    db = pool;
    console.log('Connected to Neon PostgreSQL database.');
} else {
    // Development / Local Testing: SQLite configuration
    const dbPath = path.join(__dirname, '../database.sqlite');
    const sqliteDb = new Database(dbPath);

    // Temporarily disable foreign keys during schema creation and migrations
    sqliteDb.exec('PRAGMA foreign_keys = OFF;');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        sqliteDb.exec(schema);
    }

    // Run migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).sort();
        files.forEach(file => {
            if (file.endsWith('.sql')) {
                const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                sqliteDb.exec(migration);
            }
        });
    }

    sqliteDb.exec('PRAGMA foreign_keys = ON;');
    db = sqliteDb;
    console.log('Connected to local SQLite database.');
}

module.exports = db;