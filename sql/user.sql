PRAGMA foreign_keys = ON;

-- 1) 创建表
CREATE TABLE IF NOT EXISTS User (
    address TEXT NOT NULL PRIMARY KEY,
    total_points INTEGER NOT NULL DEFAULT 0,
    intimacy INTEGER NOT NULL DEFAULT 0,
    likedStories TEXT, -- 用 TEXT 存 JSON 字符串
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2) 如果需要在每次更新行时自动更新 updated_at，可以定义一个触发器
--    这能模仿 MySQL "ON UPDATE CURRENT_TIMESTAMP" 的行为
CREATE TRIGGER IF NOT EXISTS user_update_timestamp
AFTER UPDATE ON User
FOR EACH ROW
BEGIN
    UPDATE User
    SET updated_at = CURRENT_TIMESTAMP
    WHERE rowid = NEW.rowid;
END;

CREATE INDEX IF NOT EXISTS idx_user_total_points ON User (total_points);

CREATE INDEX IF NOT EXISTS idx_user_created_at ON User (created_at);