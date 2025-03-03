-- 如果需要外键功能，务必先开启
PRAGMA foreign_keys = ON;

-- 先建表
CREATE TABLE IF NOT EXISTS Story (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_address TEXT NOT NULL,
    title TEXT,
    story_content TEXT NOT NULL,
    whiskey_points INTEGER DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 分别创建索引
CREATE INDEX IF NOT EXISTS idx_author_address ON Story (author_address);

CREATE INDEX IF NOT EXISTS idx_created_at ON Story (created_at);