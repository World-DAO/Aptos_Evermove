PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS SuiTxn (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id TEXT NOT NULL UNIQUE,
    sender TEXT,
    receiver TEXT,
    amount NUMERIC, -- 或者 REAL / INTEGER / TEXT，视你的需求决定
    token_type TEXT CHECK (
        token_type IN ('SUI', 'CUSTOM')
    ) NOT NULL,
    status TEXT CHECK (
        status IN (
            'pending',
            'claimed',
            'failed'
        )
    ) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    claimed_at DATETIME
);