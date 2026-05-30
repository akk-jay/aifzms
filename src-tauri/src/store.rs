use std::fs;
use std::path::PathBuf;

fn config_path() -> PathBuf {
    let mut path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    path.push("aifzms_config.json");
    path
}

fn records_path() -> PathBuf {
    let mut path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    path.push("aifzms_records.json");
    path
}

pub fn save_config(json: &str) -> Result<(), Box<dyn std::error::Error>> {
    fs::write(config_path(), json)?;
    Ok(())
}

pub fn load_config() -> Result<String, Box<dyn std::error::Error>> {
    let path = config_path();
    if path.exists() {
        Ok(fs::read_to_string(path)?)
    } else {
        Ok("{}".to_string())
    }
}

pub fn save_record(json: &str) -> Result<(), Box<dyn std::error::Error>> {
    fs::write(records_path(), json)?;
    Ok(())
}

pub fn load_records() -> Result<String, Box<dyn std::error::Error>> {
    let path = records_path();
    if path.exists() {
        Ok(fs::read_to_string(path)?)
    } else {
        Ok("{\"records\":[]}".to_string())
    }
}
