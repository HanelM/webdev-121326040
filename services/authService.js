const db = require('../data/database');
const bcrypt = require('bcryptjs');

class AuthService {
    static async register(email, password, name) {
        const passwordHash = await bcrypt.hash(password, 10);
        try {
            const info = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
                .run(email, passwordHash, name);
            return { id: info.lastInsertRowid, email, name };
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    static async login(email, password) {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
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
        return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
    }

    static async findByEmail(email) {
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }
}

module.exports = AuthService;
