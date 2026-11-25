const db = require('../data/database');
const bcrypt = require('bcryptjs');

class AuthService {
    static async register(email, password, name) {
        const passwordHash = await bcrypt.hash(password, 10);
        try {
            if (typeof db.query === 'function') {
                // PostgreSQL (Render / Production)
                const result = await db.query(
                    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
                    [email, passwordHash, name]
                );
                return result.rows[0];
            } else {
                // SQLite (Local Development)
                const info = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
                    .run(email, passwordHash, name);
                return { id: info.lastInsertRowid, email, name };
            }
        } catch (error) {
            if (error.code === '23505' || error.code === 'SQLITE_CONSTRAINT') {
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    static async login(email, password) {
        let user;
        if (typeof db.query === 'function') {
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            user = result.rows[0];
        } else {
            user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        }

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        return { id: user.id, email: user.email, name: user.name };
    }

    static async findByGoogleId(googleId) {
        if (typeof db.query === 'function') {
            const result = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
            return result.rows[0];
        }
        return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
    }

    static async findByEmail(email) {
        if (typeof db.query === 'function') {
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows[0];
        }
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }
}

module.exports = AuthService;