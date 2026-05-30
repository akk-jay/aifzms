use tauri::Manager;

mod commands;
mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();
            main_window.set_title("AI面试助手 - 配置").ok();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_config,
            commands::load_config,
            commands::save_record,
            commands::load_records,
            commands::start_interview_windows,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
