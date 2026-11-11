const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Run migrations
const migrationsDir = path.join(__dirname, 'migrations');
if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).sort();
    files.forEach(file => {
        if (file.endsWith('.sql')) {
            const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            db.exec(migration);
        }
    });
}

module.exports = db;
