use std::io::Cursor;

use image::ImageFormat;
use serde::{Deserialize, Serialize};
use xcap::Window;

const TITLE_HINTS: &[&str] = &[
    "street fighter 6",
    "streetfighter6",
    "ストリートファイター6",
];

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaptureResult {
    pub png_bytes: Vec<u8>,
    pub window_title: String,
}

#[tauri::command]
pub fn capture_sf6_window() -> Result<CaptureResult, String> {
    let windows = Window::all().map_err(|e| format!("ウィンドウ一覧の取得に失敗しました: {e}"))?;

    let mut matches: Vec<Window> = windows
        .into_iter()
        .filter(|w| {
            let Ok(title) = w.title() else {
                return false;
            };
            if title.trim().is_empty() {
                return false;
            }
            let lower = title.to_lowercase();
            TITLE_HINTS.iter().any(|hint| lower.contains(hint))
        })
        .collect();

    if matches.is_empty() {
        return Err(
            "Street Fighter 6 のウィンドウが見つかりません。ゲームを起動した状態で F8 を押してください"
                .into(),
        );
    }

    matches.sort_by_key(|w| {
        let area = w
            .width()
            .ok()
            .zip(w.height().ok())
            .map(|(a, b)| a.saturating_mul(b))
            .unwrap_or(0);
        std::cmp::Reverse(area)
    });
    let win = &matches[0];
    let title = win
        .title()
        .map_err(|e| format!("ウィンドウタイトルの取得に失敗しました: {e}"))?;

    let image = win
        .capture_image()
        .map_err(|e| format!("ウィンドウキャプチャに失敗しました: {e}"))?;

    let mut buf = Cursor::new(Vec::new());
    image
        .write_to(&mut buf, ImageFormat::Png)
        .map_err(|e| format!("PNGエンコードに失敗しました: {e}"))?;

    Ok(CaptureResult {
        png_bytes: buf.into_inner(),
        window_title: title,
    })
}
