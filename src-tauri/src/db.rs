use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

const MIGRATION_SQL: &str = include_str!("../migrations/0001_init.sql");

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(app_dir: &std::path::Path) -> Connection {
    std::fs::create_dir_all(app_dir).expect("failed to create app data dir");
    let db_path = app_dir.join("sf6lab.db");
    let conn = Connection::open(db_path).expect("failed to open database");
    conn.execute_batch(MIGRATION_SQL).expect("failed to run migrations");
    conn
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
}

pub fn insert_match(conn: &Connection, m: &Match) -> rusqlite::Result<i64> {
    conn.execute(
        "INSERT INTO matches (played_at, my_character, opponent_character, result, mr_before, mr_after, memo)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![m.played_at, m.my_character, m.opponent_character, m.result, m.mr_before, m.mr_after, m.memo],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_all_matches(conn: &Connection) -> rusqlite::Result<Vec<Match>> {
    let mut stmt = conn.prepare(
        "SELECT id, played_at, my_character, opponent_character, result, mr_before, mr_after, memo
         FROM matches ORDER BY played_at DESC"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Match {
            id: Some(row.get(0)?),
            played_at: row.get(1)?,
            my_character: row.get(2)?,
            opponent_character: row.get(3)?,
            result: row.get(4)?,
            mr_before: row.get(5)?,
            mr_after: row.get(6)?,
            memo: row.get(7)?,
        })
    })?;
    rows.collect()
}

pub fn delete_match(conn: &Connection, id: i64) -> rusqlite::Result<usize> {
    conn.execute("DELETE FROM matches WHERE id = ?1", params![id])
}
