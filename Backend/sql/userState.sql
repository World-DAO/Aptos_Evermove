PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS UserState (
    address TEXT NOT NULL,
    date TEXT NOT NULL,
    published_num INTEGER NOT NULL DEFAULT 0,
    received_num INTEGER NOT NULL DEFAULT 0,
    sent_whiskey_num INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (address, date),
    FOREIGN KEY (address) REFERENCES User (address) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_userstate_date ON UserState (date);