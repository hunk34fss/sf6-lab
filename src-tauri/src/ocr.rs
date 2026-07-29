#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct OcrResult {
    pub text: String,
}

#[tauri::command]
pub fn ocr_match_screenshot(image_bytes: Vec<u8>) -> Result<OcrResult, String> {
    if image_bytes.is_empty() {
        return Err("画像データが空です".into());
    }

    #[cfg(windows)]
    {
        let text = win::recognize_image_bytes(&image_bytes)?;
        Ok(OcrResult { text })
    }

    #[cfg(not(windows))]
    {
        let _ = image_bytes;
        Err("Windows OCR はこの環境では利用できません".into())
    }
}

#[cfg(windows)]
mod win {
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};
    use windows::{
        core::HSTRING,
        Globalization::Language,
        Graphics::Imaging::BitmapDecoder,
        Media::Ocr::OcrEngine,
        Storage::{FileAccessMode, StorageFile},
    };

    pub fn recognize_image_bytes(bytes: &[u8]) -> Result<String, String> {
        let ext = detect_extension(bytes);
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0);
        let path = std::env::temp_dir().join(format!("sf6lab-ocr-{stamp}.{ext}"));
        fs::write(&path, bytes).map_err(|e| format!("一時ファイルの作成に失敗しました: {e}"))?;

        let result = recognize_file(&path);
        let _ = fs::remove_file(&path);
        result
    }

    fn detect_extension(bytes: &[u8]) -> &'static str {
        if bytes.starts_with(&[0x89, b'P', b'N', b'G']) {
            "png"
        } else if bytes.len() >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF {
            "jpg"
        } else if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
            "webp"
        } else if bytes.len() >= 2 && bytes[0] == b'B' && bytes[1] == b'M' {
            "bmp"
        } else {
            "png"
        }
    }

    fn recognize_file(path: &std::path::Path) -> Result<String, String> {
        let abs = fs::canonicalize(path).map_err(|e| format!("画像パスの解決に失敗しました: {e}"))?;
        let path_str = abs.to_string_lossy().replacen(r"\\?\", "", 1);

        let file = StorageFile::GetFileFromPathAsync(&HSTRING::from(path_str))
            .map_err(|e| format!("画像ファイルを開けませんでした: {e}"))?
            .get()
            .map_err(|e| format!("画像ファイルを開けませんでした: {e}"))?;

        let stream = file
            .OpenAsync(FileAccessMode::Read)
            .map_err(|e| format!("画像ストリームを開けませんでした: {e}"))?
            .get()
            .map_err(|e| format!("画像ストリームを開けませんでした: {e}"))?;

        let decoder = BitmapDecoder::CreateAsync(&stream)
            .map_err(|e| format!("画像デコードに失敗しました: {e}"))?
            .get()
            .map_err(|e| format!("画像デコードに失敗しました: {e}"))?;

        let bitmap = decoder
            .GetSoftwareBitmapAsync()
            .map_err(|e| format!("ビットマップ取得に失敗しました: {e}"))?
            .get()
            .map_err(|e| format!("ビットマップ取得に失敗しました: {e}"))?;

        let engine = create_engine()?;
        let result = engine
            .RecognizeAsync(&bitmap)
            .map_err(|e| format!("OCR開始に失敗しました: {e}"))?
            .get()
            .map_err(|e| format!("OCR認識に失敗しました: {e}"))?;

        let text = result
            .Text()
            .map_err(|e| format!("OCRテキスト取得に失敗しました: {e}"))?
            .to_string();

        if text.trim().is_empty() {
            return Err("文字を認識できませんでした。別のスクリーンショットを試してください".into());
        }

        Ok(text)
    }

    fn create_engine() -> Result<OcrEngine, String> {
        if let Ok(engine) = OcrEngine::TryCreateFromUserProfileLanguages() {
            return Ok(engine);
        }

        for tag in ["ja", "ja-JP", "en", "en-US"] {
            if let Ok(lang) = Language::CreateLanguage(&HSTRING::from(tag)) {
                if let Ok(engine) = OcrEngine::TryCreateFromLanguage(&lang) {
                    return Ok(engine);
                }
            }
        }

        Err("Windows OCR エンジンを初期化できませんでした。OCR言語パックのインストールを確認してください".into())
    }
}
