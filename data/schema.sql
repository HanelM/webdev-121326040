CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    google_id TEXT UNIQUE,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL,
    max_members INTEGER DEFAULT 10,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS memberships (
    user_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Seed data
INSERT OR IGNORE INTO users (email, password_hash, name) VALUES 
('alice@example.com', '$2a$10$u0N.S7Z1rQp9k.l.Fk.L6.y.v.R.S.W.Z.G.F.H.I.J.K.L.M.N.O.P.Q', 'Alice'),
('bob@example.com', '$2a$10$u0N.S7Z1rQp9k.l.Fk.L6.y.v.R.S.W.Z.G.F.H.I.J.K.L.M.N.O.P.Q', 'Bob');

INSERT OR IGNORE INTO groups (name, description, owner_id) VALUES 
('Node.js Enthusiasts', 'A group to study Node.js and its ecosystem.', 1),
('React Masters', 'Let''s master React together.', 2);

INSERT OR IGNORE INTO memberships (user_id, group_id) VALUES 
(1, 1),
(2, 2);
