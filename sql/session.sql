PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    user_address TEXT NOT NULL,
    txn_object_id TEXT NOT NULL,
    status TEXT CHECK (
        status IN ('active', 'closed')
    ) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (txn_object_id) REFERENCES SuiTxn (object_id) ON DELETE CASCADE
);