use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbState {
    pub conn: Mutex<Connection>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct FavoriteItem {
    pub id: i64,
    pub item_type: String, // "text", "image", "file"
    pub content: String,   // text content, or file path
    pub original_path: Option<String>,
    pub created_at: String,
}

pub fn init_db(db_path: PathBuf) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_type TEXT NOT NULL,
            content TEXT NOT NULL,
            original_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    Ok(conn)
}

pub fn add_favorite(
    conn: &Connection,
    item_type: &str,
    content: &str,
    original_path: Option<&str>,
) -> Result<i64> {
    conn.execute(
        "INSERT INTO favorites (item_type, content, original_path) VALUES (?1, ?2, ?3)",
        rusqlite::params![item_type, content, original_path],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_favorites(conn: &Connection, limit: u32, offset: u32) -> Result<Vec<FavoriteItem>> {
    let mut stmt = conn.prepare(
        "SELECT id, item_type, content, original_path, datetime(created_at, 'localtime') 
         FROM favorites ORDER BY id DESC LIMIT ?1 OFFSET ?2"
    )?;
    
    let iter = stmt.query_map(rusqlite::params![limit, offset], |row| {
        Ok(FavoriteItem {
            id: row.get(0)?,
            item_type: row.get(1)?,
            content: row.get(2)?,
            original_path: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;

    let mut items = Vec::new();
    for item in iter {
        items.push(item?);
    }
    Ok(items)
}
