CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    played_at TEXT NOT NULL,
    my_character TEXT NOT NULL,
    opponent_character TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
    mr_before INTEGER NOT NULL,
    mr_after INTEGER NOT NULL,
    memo TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    note TEXT NOT NULL DEFAULT ''
);
