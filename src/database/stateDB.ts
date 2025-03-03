import { query } from "../database/index";

export interface UserState {
    address: string;
    date: string;
    published_num: number;
    received_num: number;
    sent_whiskey_num: number;
}

/**
 * 获取当天用户状态
 * - 将 `CURDATE()` 改为 `DATE('now')`，只取到“年-月-日”
 */
export async function getUserState(address: string): Promise<UserState | null> {
    const rows = await query(
        `
        SELECT address, date, published_num, received_num, sent_whiskey_num
        FROM UserState
        WHERE address = ? AND date = DATE('now')
        LIMIT 1
        `,
        [address]
    );
    return rows.length > 0 ? rows[0] : null;
}

/**
 * 设置 / 更新用户当天状态
 * - 在 SQLite 中，用 `ON CONFLICT(address, date) DO UPDATE ...`
 * - (address, date) 必须是PRIMARY KEY或UNIQUE
 */
export async function setUserState(
    address: string,
    published_num: number,
    received_num: number,
    sent_whiskey_num: number
): Promise<void> {
    await query(
        `
        INSERT INTO UserState (address, date, published_num, received_num, sent_whiskey_num)
        VALUES (?, DATE('now'), ?, ?, ?)
        ON CONFLICT(address, date) DO UPDATE
        SET published_num = excluded.published_num,
            received_num = excluded.received_num,
            sent_whiskey_num = excluded.sent_whiskey_num
        `,
        [address, published_num, received_num, sent_whiskey_num]
    );
}

/**
 * 初始化用户当天状态
 * - MySQL: `INSERT IGNORE`
 * - SQLite: `INSERT OR IGNORE`
 */
export async function initializeUserState(address: string): Promise<void> {
    await query(
        `
        INSERT OR IGNORE INTO UserState (address, date, published_num, received_num, sent_whiskey_num)
        VALUES (?, DATE('now'), 0, 0, 0)
        `,
        [address]
    );
}

/**
 * 当天已发布故事 +1
 */
export async function addUserPublishedStory(address: string): Promise<void> {
    await query(
        `
        UPDATE UserState
        SET published_num = published_num + 1
        WHERE address = ? AND date = DATE('now')
        `,
        [address]
    );
}

/**
 * 当天收到故事 +1
 */
export async function addUserReceivedStory(address: string): Promise<void> {
    await query(
        `
        UPDATE UserState
        SET received_num = received_num + 1
        WHERE address = ? AND date = DATE('now')
        `,
        [address]
    );
}

/**
 * 当天送出威士忌次数 +1
 */
export async function addUserSentWhiskey(address: string): Promise<void> {
    await query(
        `
        UPDATE UserState
        SET sent_whiskey_num = sent_whiskey_num + 1
        WHERE address = ? AND date = DATE('now')
        `,
        [address]
    );
}