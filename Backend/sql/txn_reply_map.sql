PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS transaction_reply_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id TEXT NOT NULL,
    reply_id INTEGER NOT NULL,
    FOREIGN KEY (object_id) REFERENCES SuiTxn (object_id) ON DELETE CASCADE,
    FOREIGN KEY (reply_id) REFERENCES StoryReply (id) ON DELETE CASCADE
);