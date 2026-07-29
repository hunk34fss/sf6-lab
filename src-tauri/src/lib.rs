mod db;
mod ocr;

use db::{DbState, Match};
use tauri::Manager;

#[tauri::command]
fn create_match(state: tauri::State<'_, DbState>, m: Match) -> Result<i64, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::insert_match(&conn, &m).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_matches(state: tauri::State<'_, DbState>) -> Result<Vec<Match>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_all_matches(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_match(state: tauri::State<'_, DbState>, id: i64) -> Result<usize, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_match(&conn, id).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
            ocr::ocr_match_screenshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
