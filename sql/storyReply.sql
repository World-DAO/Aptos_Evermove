PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS StoryReply (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL,
    author_address TEXT NOT NULL,
    reply_content TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    to_address TEXT NOT NULL,
    unread INTEGER DEFAULT 1,
    FOREIGN KEY (story_id) REFERENCES Story (id) ON DELETE CASCADE
);

-- 分别创建索引
CREATE INDEX IF NOT EXISTS idx_story_id ON StoryReply (story_id);

CREATE INDEX IF NOT EXISTS idx_to_address ON StoryReply (to_address);

CREATE INDEX IF NOT EXISTS idx_author_address ON StoryReply (author_address);

CREATE INDEX IF NOT EXISTS idx_created_at ON StoryReply (created_at);