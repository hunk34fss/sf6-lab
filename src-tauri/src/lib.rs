mod capture;
mod db;
mod ocr;

use db::{DbState, Match, ResetSeasonInput, Season};
use tauri::Manager;

#[tauri::command]
fn create_match(state: tauri::State<'_, DbState>, m: Match) -> Result<i64, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::insert_match(&conn, &m).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_matches(
    state: tauri::State<'_, DbState>,
    season_id: Option<i64>,
) -> Result<Vec<Match>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_matches_by_season(&conn, season_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_match(state: tauri::State<'_, DbState>, id: i64) -> Result<usize, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_match(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_seasons(state: tauri::State<'_, DbState>) -> Result<Vec<Season>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_seasons(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_current_season(state: tauri::State<'_, DbState>) -> Result<Season, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_current_season(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn reset_season(
    state: tauri::State<'_, DbState>,
    input: ResetSeasonInput,
) -> Result<Season, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::reset_season(&conn, &input).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_season_summary(
    state: tauri::State<'_, DbState>,
    season_id: i64,
) -> Result<SeasonSummary, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let match_count = db::count_matches_in_season(&conn, season_id).map_err(|e| e.to_string())?;
    let latest_mr = db::latest_mr_in_season(&conn, season_id).map_err(|e| e.to_string())?;
    Ok(SeasonSummary {
        match_count,
        latest_mr,
    })
}

#[derive(serde::Serialize)]
struct SeasonSummary {
    match_count: i64,
    latest_mr: Option<i64>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            let conn = db::init_db(&app_dir);
            app.manage(DbState(std::sync::Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_match,
            get_matches,
            delete_match,
            get_seasons,
            get_current_season,
            reset_season,
            get_season_summary,
            ocr::ocr_match_screenshot,
            capture::capture_sf6_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
