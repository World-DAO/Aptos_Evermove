import { query } from './index';

export interface Story {
    id: number;
    author_address: string;
    title: string;
    story_content: string;
    created_at: Date;
    // 还可能有 whiskey_points 等字段，看你表结构而定
}

export interface Reply {
    id: number;
    story_id: number;
    author_address: string;
    to_address: string;
    reply_content: string;
    created_at: Date;
    // 还可能有 unread 字段，看你表结构而定
}

/**
 * 发布故事
 * - 将 MySQL 的 NOW() 改为 SQLite 的 CURRENT_TIMESTAMP
 */
export async function publishStory(authorAddress: string, title: string, content: string): Promise<Story> {
    await query(
        `
        INSERT INTO Story
        (author_address, title, story_content, whiskey_points, created_at)
        VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
        `,
        [authorAddress, title, content]
    );

    // 取刚才插入的记录
    const rows = await query(
        'SELECT * FROM Story WHERE author_address = ? ORDER BY id DESC LIMIT 1',
        [authorAddress]
    );
    return rows[0];
}

/**
 * 删除故事
 */
export async function deleteStory(storyId: string): Promise<boolean> {
    try {
        await query('DELETE FROM Story WHERE id = ?', [storyId]);
        return true;
    } catch (error) {
        console.error('Error deleting story:', error);
        return false;
    }
}

/**
 * 获取随机故事
 * - 将 MySQL 的 ORDER BY RAND() 改为 SQLite 的 ORDER BY RANDOM()
 */
export async function getRandomStory(): Promise<Story> {
    const rows = await query(
        `
        SELECT id, author_address, title, story_content, whiskey_points, created_at
        FROM Story
        ORDER BY RANDOM()
        LIMIT 1
        `
    );
    return rows[0];
}

/**
 * 根据作者查询故事
 */
export async function getStoryByAuthor(authorAddress: string): Promise<Story[]> {
    const rows = await query(
        'SELECT * FROM Story WHERE author_address = ? ORDER BY created_at DESC',
        [authorAddress]
    );
    return rows;
}

/**
 * 通过 ID 查询故事
 */
export async function getStoryById(id: string): Promise<Story> {
    const rows = await query('SELECT * FROM Story WHERE id = ?', [id]);
    return rows[0];
}

/**
 * 回复故事
 * - 如果表中 created_at 默认是 CURRENT_TIMESTAMP，就无需手动插入时间
 */
export async function replyStory(address: string, id: string, content: string) {
    await query(
        `INSERT INTO StoryReply (story_id, author_address, reply_content)
         VALUES (?, ?, ?)`,
        [id, address, content]
    );
    const rows = await query(
        'SELECT * FROM StoryReply WHERE author_address = ? ORDER BY id DESC LIMIT 1',
        [address]
    );
    return rows[0];
}

/**
 * 回复用户
 */
export async function reply(address: string, id: string, content: string, to_address: string) {
    await query(
        `INSERT INTO StoryReply (story_id, author_address, reply_content, to_address)
         VALUES (?, ?, ?, ?)`,
        [id, address, content, to_address]
    );
    const rows = await query(
        'SELECT * FROM StoryReply WHERE author_address = ? ORDER BY id DESC LIMIT 1',
        [address]
    );
    return rows[0];
}

/**
 * 根据 to_address 查询回复
 */
export async function getReplyByToAddress(address: string): Promise<Reply[]> {
    const rows = await query(
        'SELECT * FROM StoryReply WHERE to_address = ? ORDER BY created_at DESC',
        [address]
    );
    return rows;
}

/**
 * 查询新回复 (unread=1)
 */
export async function getNewReplyByToAddress(address: string): Promise<Reply[]> {
    const rows = await query(
        'SELECT * FROM StoryReply WHERE to_address = ? AND unread = 1 ORDER BY created_at DESC',
        [address]
    );
    return rows;
}

/**
 * 根据 story_id 查询回复
 */
export async function getReplyByStoryId(story_id: number): Promise<Reply[]> {
    const rows = await query(
        'SELECT * FROM StoryReply WHERE story_id = ? ORDER BY created_at DESC',
        [story_id]
    );
    return rows;
}

/**
 * 标记回复为已读
 */
export async function markReplyRead(reply_id: string) {
    await query(
        'UPDATE StoryReply SET unread = 0 WHERE id = ?',
        [reply_id]
    );
}

/**
 * 标记回复为未读
 */
export async function markReplyUnread(reply_id: string) {
    await query(
        'UPDATE StoryReply SET unread = 1 WHERE id = ?',
        [reply_id]
    );
}

/**
 * 给故事增加威士忌积分
 */
export async function addWhiskeyPoints(storyId: string) {
    await query(
        'UPDATE Story SET whiskey_points = whiskey_points + 1 WHERE id = ?',
        [storyId]
    );
}