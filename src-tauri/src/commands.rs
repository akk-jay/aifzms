use tauri::{AppHandle, WebviewWindowBuilder, WebviewUrl};
use crate::store;

#[tauri::command]
pub async fn save_config(config_json: String) -> Result<String, String> {
    store::save_config(&config_json).map_err(|e| e.to_string())?;
    Ok("ok".to_string())
}

#[tauri::command]
pub async fn load_config() -> Result<String, String> {
    store::load_config().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_record(record_json: String) -> Result<String, String> {
    store::save_record(&record_json).map_err(|e| e.to_string())?;
    Ok("ok".to_string())
}

#[tauri::command]
pub async fn load_records() -> Result<String, String> {
    store::load_records().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start_interview_windows(app: AppHandle) -> Result<String, String> {
    // Create overlay window (semi-transparent, always on top)
    let overlay = WebviewWindowBuilder::new(&app, "overlay", WebviewUrl::App("overlay.html".into()))
        .title("面试辅助")
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .resizable(true)
        .focused(true)
        .devtools(true)
        .inner_size(420.0, 320.0)
        .min_inner_size(300.0, 200.0)
        .build()
        .map_err(|e| e.to_string())?;

    // Position overlay on the right side of screen
    if let Ok(Some(monitor)) = overlay.current_monitor() {
        let monitor_size = monitor.size();
        let window_size = overlay.outer_size().unwrap();
        let x = (monitor_size.width as i32 - window_size.width as i32) - 20;
        let y = 60i32;
        overlay.set_position(tauri::PhysicalPosition::new(x, y)).ok();
    // Auto-open devtools on overlay to see console logs
    overlay.open_devtools();
    }

    // Create record window
    let record = WebviewWindowBuilder::new(&app, "record", WebviewUrl::App("record.html".into()))
        .title("面试记录")
        .transparent(false)
        .decorations(true)
        .always_on_top(false)
        .resizable(true)
        .inner_size(420.0, 580.0)
        .min_inner_size(300.0, 300.0)
        .build()
        .map_err(|e| e.to_string())?;

    // Position record window next to overlay
    if let Ok(Some(monitor)) = record.current_monitor() {
        let monitor_size = monitor.size();
        let window_size = record.outer_size().unwrap();
        let x = (monitor_size.width as i32 - window_size.width as i32) - 20;
        let y = 400i32;
        record.set_position(tauri::PhysicalPosition::new(x, y)).ok();
    }

    Ok("ok".to_string())
}
