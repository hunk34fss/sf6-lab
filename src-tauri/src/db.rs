use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

const MIGRATION_V1: &str = include_str!("../migrations/0001_init.sql");
const MIGRATION_V2: &str = include_str!("../migrations/0002_seasons.sql");

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(app_dir: &std::path::Path) -> Connection {
    std::fs::create_dir_all(app_dir).expect("failed to create app data dir");
    let db_path = app_dir.join("sf6lab.db");
    let conn = Connection::open(db_path).expect("failed to open database");
    run_migrations(&conn).expect("failed to run migrations");
    conn
}

fn run_migrations(conn: &Connection) -> rusqlite::Result<()> {
    let version: i32 = conn.query_row("PRAGMA user_version", [], |row| row.get(0))?;

    if version < 1 {
        conn.execute_batch(MIGRATION_V1)?;
        conn.execute_batch("PRAGMA user_version = 1")?;
    }

    if version < 2 {
        migrate_to_v2(conn)?;
        conn.execute_batch("PRAGMA user_version = 2")?;
    }

    Ok(())
}

fn migrate_to_v2(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(MIGRATION_V2)?;

    let has_season_id: bool = conn
        .prepare("PRAGMA table_info(matches)")?
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name)
        })?
        .filter_map(|r| r.ok())
        .any(|name| name == "season_id");

    if !has_season_id {
        let match_count: i64 =
            conn.query_row("SELECT COUNT(*) FROM matches", [], |row| row.get(0))?;
        let now = chrono_format_now();
        let season_name = if match_count > 0 {
            "既存データ"
        } else {
            "Season 1"
        };

        conn.execute(
            "INSERT INTO seasons (name, started_at, ended_at, starting_mr, note)
             VALUES (?1, ?2, NULL, 1500, '')",
            params![season_name, now],
        )?;
        let season_id = conn.last_insert_rowid();

        conn.execute_batch(
            "CREATE TABLE matches_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                played_at TEXT NOT NULL,
                my_character TEXT NOT NULL,
                opponent_character TEXT NOT NULL,
                result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
                mr_before INTEGER NOT NULL,
                mr_after INTEGER NOT NULL,
                memo TEXT NOT NULL DEFAULT '',
                season_id INTEGER NOT NULL REFERENCES seasons(id)
             );",
        )?;

        conn.execute(
            "INSERT INTO matches_new
             (id, played_at, my_character, opponent_character, result, mr_before, mr_after, memo, season_id)
             SELECT id, played_at, my_character, opponent_character, result, mr_before, mr_after, memo, ?1
             FROM matches",
            params![season_id],
        )?;

        conn.execute_batch(
            "DROP TABLE matches;
             ALTER TABLE matches_new RENAME TO matches;",
        )?;
    }

    let current: Option<i64> = conn
        .query_row(
            "SELECT id FROM seasons WHERE ended_at IS NULL ORDER BY id DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .optional()?;

    if current.is_none() {
        let now = chrono_format_now();
        conn.execute(
            "INSERT INTO seasons (name, started_at, ended_at, starting_mr, note)
             VALUES (?1, ?2, NULL, 1500, '')",
            params!["Season 1", now],
        )?;
    }

    Ok(())
}

fn chrono_format_now() -> String {
    chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Season {
    pub id: i64,
    pub name: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub starting_mr: i64,
    pub note: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Match {
    pub id: Option<i64>,
    pub played_at: String,
    pub my_character: String,
    pub opponent_character: String,
    pub result: String,
    pub mr_before: i64,
    pub mr_after: i64,
    pub memo: String,
    pub season_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct ResetSeasonInput {
    pub name: Option<String>,
    pub starting_mr: Option<i64>,
}

pub fn get_seasons(conn: &Connection) -> rusqlite::Result<Vec<Season>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, started_at, ended_at, starting_mr, note
         FROM seasons
         ORDER BY id DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Season {
            id: row.get(0)?,
            name: row.get(1)?,
            started_at: row.get(2)?,
            ended_at: row.get(3)?,
            starting_mr: row.get(4)?,
            note: row.get(5)?,
        })
    })?;
    rows.collect()
}

pub fn get_current_season(conn: &Connection) -> rusqlite::Result<Season> {
    conn.query_row(
        "SELECT id, name, started_at, ended_at, starting_mr, note
         FROM seasons
         WHERE ended_at IS NULL
         ORDER BY id DESC
         LIMIT 1",
        [],
        |row| {
            Ok(Season {
                id: row.get(0)?,
                name: row.get(1)?,
                started_at: row.get(2)?,
                ended_at: row.get(3)?,
                starting_mr: row.get(4)?,
                note: row.get(5)?,
            })
        },
    )
}

pub fn insert_match(conn: &Connection, m: &Match) -> rusqlite::Result<i64> {
    let season_id = match m.season_id {
        Some(id) => id,
        None => get_current_season(conn)?.id,
    };

    conn.execute(
        "INSERT INTO matches
         (played_at, my_character, opponent_character, result, mr_before, mr_after, memo, season_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            m.played_at,
            m.my_character,
            m.opponent_character,
            m.result,
            m.mr_before,
            m.mr_after,
            m.memo,
            season_id
        ],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_matches_by_season(
    conn: &Connection,
    season_id: Option<i64>,
) -> rusqlite::Result<Vec<Match>> {
    let sid = match season_id {
        Some(id) => id,
        None => get_current_season(conn)?.id,
    };

    let mut stmt = conn.prepare(
        "SELECT id, played_at, my_character, opponent_character, result, mr_before, mr_after, memo, season_id
         FROM matches
         WHERE season_id = ?1
         ORDER BY played_at DESC",
    )?;
    let rows = stmt.query_map(params![sid], |row| {
        Ok(Match {
            id: Some(row.get(0)?),
            played_at: row.get(1)?,
            my_character: row.get(2)?,
            opponent_character: row.get(3)?,
            result: row.get(4)?,
            mr_before: row.get(5)?,
            mr_after: row.get(6)?,
            memo: row.get(7)?,
            season_id: Some(row.get(8)?),
        })
    })?;
    rows.collect()
}

pub fn delete_match(conn: &Connection, id: i64) -> rusqlite::Result<usize> {
    conn.execute("DELETE FROM matches WHERE id = ?1", params![id])
}

pub fn reset_season(conn: &Connection, input: &ResetSeasonInput) -> rusqlite::Result<Season> {
    let now = chrono_format_now();
    let starting_mr = input.starting_mr.unwrap_or(1500);

    let tx = conn.unchecked_transaction()?;

    let current = get_current_season(&tx)?;
    tx.execute(
        "UPDATE seasons SET ended_at = ?1 WHERE id = ?2",
        params![now, current.id],
    )?;

    let closed_count: i64 = tx.query_row(
        "SELECT COUNT(*) FROM seasons WHERE ended_at IS NOT NULL",
        [],
        |row| row.get(0),
    )?;
    let next_name = input
        .name
        .clone()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| format!("Season {}", closed_count + 1));

    tx.execute(
        "INSERT INTO seasons (name, started_at, ended_at, starting_mr, note)
         VALUES (?1, ?2, NULL, ?3, '')",
        params![next_name, now, starting_mr],
    )?;
    let new_id = tx.last_insert_rowid();
    tx.commit()?;

    Ok(Season {
        id: new_id,
        name: next_name,
        started_at: now,
        ended_at: None,
        starting_mr,
        note: String::new(),
    })
}

pub fn count_matches_in_season(conn: &Connection, season_id: i64) -> rusqlite::Result<i64> {
    conn.query_row(
        "SELECT COUNT(*) FROM matches WHERE season_id = ?1",
        params![season_id],
        |row| row.get(0),
    )
}

pub fn latest_mr_in_season(conn: &Connection, season_id: i64) -> rusqlite::Result<Option<i64>> {
    conn.query_row(
        "SELECT mr_after FROM matches
         WHERE season_id = ?1
         ORDER BY played_at DESC, id DESC
         LIMIT 1",
        params![season_id],
        |row| row.get(0),
    )
    .optional()
}
