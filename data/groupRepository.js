const db = require('./database');

class GroupRepository {
    // Helper to check if we are using PostgreSQL
    static isPostgres() {
        return typeof db.query === 'function';
    }

    // --- Groups ---
    static async create(name, description, ownerId, maxMembers = 10) {
        if (this.isPostgres()) {
            const result = await db.query(
                'INSERT INTO groups (name, description, owner_id, max_members) VALUES ($1, $2, $3, $4) RETURNING id',
                [name, description, ownerId, maxMembers]
            );
            return result.rows[0].id;
        } else {
            const stmt = db.prepare(`
                INSERT INTO groups (name, description, owner_id, max_members)
                VALUES (?, ?, ?, ?)
            `);
            const info = stmt.run(name, description, ownerId, maxMembers);
            return info.lastInsertRowid;
        }
    }

    static async findById(id) {
        if (this.isPostgres()) {
            const result = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
            return result.rows[0];
        } else {
            return db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
        }
    }

    static async listAll() {
        if (this.isPostgres()) {
            const result = await db.query('SELECT * FROM groups');
            return result.rows;
        } else {
            return db.prepare('SELECT * FROM groups').all();
        }
    }

    static async listJoinedByUser(userId) {
        if (this.isPostgres()) {
            const result = await db.query(`
                SELECT g.* FROM groups g
                JOIN memberships m ON g.id = m.group_id
                WHERE m.user_id = $1
            `, [userId]);
            return result.rows;
        } else {
            return db.prepare(`
                SELECT g.* FROM groups g
                JOIN memberships m ON g.id = m.group_id
                WHERE m.user_id = ?
            `).all(userId);
        }
    }

    static async listNotJoinedByUser(userId) {
        if (this.isPostgres()) {
            const result = await db.query(`
                SELECT * FROM groups
                WHERE id NOT IN (SELECT group_id FROM memberships WHERE user_id = $1)
            `, [userId]);
            return result.rows;
        } else {
            return db.prepare(`
                SELECT * FROM groups
                WHERE id NOT IN (SELECT group_id FROM memberships WHERE user_id = ?)
            `).all(userId);
        }
    }

    // --- Memberships ---
    static async addMember(userId, groupId) {
        if (this.isPostgres()) {
            return await db.query('INSERT INTO memberships (user_id, group_id) VALUES ($1, $2)', [userId, groupId]);
        } else {
            const stmt = db.prepare('INSERT INTO memberships (user_id, group_id) VALUES (?, ?)');
            return stmt.run(userId, groupId);
        }
    }

    static async removeMember(userId, groupId) {
        if (this.isPostgres()) {
            return await db.query('DELETE FROM memberships WHERE user_id = $1 AND group_id = $2', [userId, groupId]);
        } else {
            const stmt = db.prepare('DELETE FROM memberships WHERE user_id = ? AND group_id = ?');
            return stmt.run(userId, groupId);
        }
    }

    static async countMembers(groupId) {
        if (this.isPostgres()) {
            const result = await db.query('SELECT COUNT(*) as count FROM memberships WHERE group_id = $1', [groupId]);
            return parseInt(result.rows[0].count, 10);
        } else {
            const row = db.prepare('SELECT COUNT(*) as count FROM memberships WHERE group_id = ?').get(groupId);
            return row ? row.count : 0;
        }
    }

    static async getMembership(userId, groupId) {
        if (this.isPostgres()) {
            const result = await db.query('SELECT * FROM memberships WHERE user_id = $1 AND group_id = $2', [userId, groupId]);
            return result.rows[0];
        } else {
            return db.prepare('SELECT * FROM memberships WHERE user_id = ? AND group_id = ?').get(userId, groupId);
        }
    }

    static async listMembers(groupId) {
        if (this.isPostgres()) {
            const result = await db.query(`
                SELECT u.id, u.name, u.email FROM users u
                JOIN memberships m ON u.id = m.user_id
                WHERE m.group_id = $1
            `, [groupId]);
            return result.rows;
        } else {
            return db.prepare(`
                SELECT u.id, u.name, u.email FROM users u
                JOIN memberships m ON u.id = m.user_id
                WHERE m.group_id = ?
            `).all(groupId);
        }
    }

    // --- Meetings ---
    static async createMeeting(groupId, title, startTime, endTime, location) {
        if (this.isPostgres()) {
            const result = await db.query(`
                INSERT INTO meetings (group_id, title, start_time, end_time, location)
                VALUES ($1, $2, $3, $4, $5) RETURNING id
            `, [groupId, title, startTime, endTime, location]);
            return result.rows[0].id;
        } else {
            const stmt = db.prepare(`
                INSERT INTO meetings (group_id, title, start_time, end_time, location)
                VALUES (?, ?, ?, ?, ?)
            `);
            const info = stmt.run(groupId, title, startTime, endTime, location);
            return info.lastInsertRowid;
        }
    }

    static async listMeetingsByGroup(groupId) {
        if (this.isPostgres()) {
            const result = await db.query(`
                SELECT * FROM meetings
                WHERE group_id = $1
                ORDER BY start_time ASC
            `, [groupId]);
            return result.rows;
        } else {
            return db.prepare(`
                SELECT * FROM meetings
                WHERE group_id = ?
                ORDER BY start_time ASC
            `).all(groupId);
        }
    }

    static async listUpcomingByUser(userId) {
        const now = new Date().toISOString();
        if (this.isPostgres()) {
            const result = await db.query(`
                SELECT m.*, g.name as group_name FROM meetings m
                JOIN groups g ON m.group_id = g.id
                JOIN memberships ms ON g.id = ms.group_id
                WHERE ms.user_id = $1 AND m.start_time >= $2
                ORDER BY m.start_time ASC
            `, [userId, now]);
            return result.rows;
        } else {
            return db.prepare(`
                SELECT m.*, g.name as group_name FROM meetings m
                JOIN groups g ON m.group_id = g.id
                JOIN memberships ms ON g.id = ms.group_id
                WHERE ms.user_id = ? AND m.start_time >= ?
                ORDER BY m.start_time ASC
            `).all(userId, now);
        }
    }

    static async findOverlappingMeeting(groupId, startTime, endTime) {
        if (this.isPostgres()) {
            const result = await db.query(`
                SELECT * FROM meetings
                WHERE group_id = $1
                AND (
                    (start_time <= $2 AND end_time > $3) OR
                    (start_time < $4 AND end_time >= $5) OR
                    (start_time >= $6 AND start_time < $7)
                )
                LIMIT 1
            `, [groupId, startTime, startTime, endTime, endTime, startTime, endTime]);
            return result.rows[0];
        } else {
            return db.prepare(`
                SELECT * FROM meetings
                WHERE group_id = ?
                AND (
                    (start_time <= ? AND end_time > ?) OR
                    (start_time < ? AND end_time >= ?) OR
                    (start_time >= ? AND start_time < ?)
                )
                LIMIT 1
            `).get(groupId, startTime, startTime, endTime, endTime, startTime, endTime);
        }
    }
}

module.exports = GroupRepository;