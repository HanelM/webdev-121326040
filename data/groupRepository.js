const db = require('./database');

class GroupRepository {
    // --- Groups ---
    static create(name, description, ownerId, maxMembers = 10) {
        const stmt = db.prepare(`
            INSERT INTO groups (name, description, owner_id, max_members)
            VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(name, description, ownerId, maxMembers);
        return info.lastInsertRowid;
    }

    static findById(id) {
        return db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    }

    static listAll() {
        return db.prepare('SELECT * FROM groups').all();
    }

    static listJoinedByUser(userId) {
        return db.prepare(`
            SELECT g.* FROM groups g
            JOIN memberships m ON g.id = m.group_id
            WHERE m.user_id = ?
        `).all(userId);
    }

    static listNotJoinedByUser(userId) {
        return db.prepare(`
            SELECT * FROM groups 
            WHERE id NOT IN (SELECT group_id FROM memberships WHERE user_id = ?)
        `).all(userId);
    }

    // --- Memberships ---
    static addMember(userId, groupId) {
        const stmt = db.prepare('INSERT INTO memberships (user_id, group_id) VALUES (?, ?)');
        return stmt.run(userId, groupId);
    }

    static removeMember(userId, groupId) {
        const stmt = db.prepare('DELETE FROM memberships WHERE user_id = ? AND group_id = ?');
        return stmt.run(userId, groupId);
    }

    static countMembers(groupId) {
        const row = db.prepare('SELECT COUNT(*) as count FROM memberships WHERE group_id = ?').get(groupId);
        return row ? row.count : 0;
    }

    static getMembership(userId, groupId) {
        return db.prepare('SELECT * FROM memberships WHERE user_id = ? AND group_id = ?').get(userId, groupId);
    }

    static listMembers(groupId) {
        return db.prepare(`
            SELECT u.id, u.name, u.email FROM users u
            JOIN memberships m ON u.id = m.user_id
            WHERE m.group_id = ?
        `).all(groupId);
    }

    // --- Meetings ---
    static createMeeting(groupId, title, startTime, endTime, location) {
        const stmt = db.prepare(`
            INSERT INTO meetings (group_id, title, start_time, end_time, location)
            VALUES (?, ?, ?, ?, ?)
        `);
        const info = stmt.run(groupId, title, startTime, endTime, location);
        return info.lastInsertRowid;
    }

    static listMeetingsByGroup(groupId) {
        return db.prepare(`
            SELECT * FROM meetings 
            WHERE group_id = ? 
            ORDER BY start_time ASC
        `).all(groupId);
    }

    static listUpcomingByUser(userId) {
        const now = new Date().toISOString();
        return db.prepare(`
            SELECT m.*, g.name as group_name FROM meetings m
            JOIN groups g ON m.group_id = g.id
            JOIN memberships ms ON g.id = ms.group_id
            WHERE ms.user_id = ? AND m.start_time >= ?
            ORDER BY m.start_time ASC
        `).all(userId, now);
    }

    static findOverlappingMeeting(groupId, startTime, endTime) {
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

module.exports = GroupRepository;
