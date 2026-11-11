-- Migration: Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    start_time TEXT NOT NULL, -- ISO 8601 string (YYYY-MM-DDTHH:mm)
    end_time TEXT NOT NULL,   -- ISO 8601 string
    location TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_meetings_group_time ON meetings(group_id, start_time);
