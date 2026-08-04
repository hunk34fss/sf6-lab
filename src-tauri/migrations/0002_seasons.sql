-- Applied when PRAGMA user_version < 2
-- Creates seasons and attaches matches.season_id

CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    starting_mr INTEGER NOT NULL DEFAULT 1500,
    note TEXT NOT NULL DEFAULT ''
);
