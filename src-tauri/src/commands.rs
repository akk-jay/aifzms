use tauri::{AppHandle, WebviewWindowBuilder, WebviewUrl};

#[tauri::command]
pub async fn save_config(config_json: String) -> Result<String, String> {
    crate::store::save_config(&config_json).map_err(|e| e.to_string())?;
    Ok("ok".to_string())
}

#[tauri::command]
pub async fn load_config() -> Result<String, String> {
    crate::store::load_config().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_record(record_json: String) -> Result<String, String> {
    crate::store::save_record(&record_json).map_err(|e| e.to_string())?;
    Ok("ok".to_string())
}

#[tauri::command]
pub async fn load_records() -> Result<String, String> {
    crate::store::load_records().map_err(|e| e.to_string())
}

/// Start interview windows with config passed via URL hash
#[tauri::command]
pub async fn start_interview_windows(app: AppHandle, config_json: String) -> Result<String, String> {
    // Base64-encode the config to pass in URL hash
    let encoded = base64_encode(&config_json);

    // Create overlay window
    let overlay_url = format!("overlay.html#{}", encoded);
    let overlay = WebviewWindowBuilder::new(&app, "overlay", WebviewUrl::App(overlay_url.into()))
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

    if let Ok(Some(monitor)) = overlay.current_monitor() {
        let monitor_size = monitor.size();
        let window_size = overlay.outer_size().unwrap();
        let x = (monitor_size.width as i32 - window_size.width as i32) - 20;
        let y = 60i32;
        overlay.set_position(tauri::PhysicalPosition::new(x, y)).ok();
        overlay.open_devtools();
    }

    // Create record window
    let record_url = format!("record.html#{}", encoded);
    let record = WebviewWindowBuilder::new(&app, "record", WebviewUrl::App(record_url.into()))
        .title("面试记录")
        .transparent(false)
        .decorations(true)
        .always_on_top(false)
        .resizable(true)
        .inner_size(420.0, 580.0)
        .min_inner_size(300.0, 300.0)
        .build()
        .map_err(|e| e.to_string())?;

    if let Ok(Some(monitor)) = record.current_monitor() {
        let monitor_size = monitor.size();
        let window_size = record.outer_size().unwrap();
        let x = (monitor_size.width as i32 - window_size.width as i32) - 20;
        let y = 400i32;
        record.set_position(tauri::PhysicalPosition::new(x, y)).ok();
    }

    Ok("ok".to_string())
}

fn base64_encode(input: &str) -> String {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::URL_SAFE_NO_PAD.encode(input.as_bytes())
}
