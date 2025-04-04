import { Reply } from '../types/Reply';
import { Story } from '../types/Story';
import { query } from './index';

/**
 * 发布故事
 * - 如果用户有支付，则 isPay 为 true，对应数据库中的 paymentState 为 1；否则为 0。
 * - 将 SQLite 的 CURRENT_TIMESTAMP 用于 created_at 字段
 */
export async function publishStory(
    authorAddress: string,
    title: string,
    content: string,
    isPay: boolean = false  // 新增参数，默认 false 表示未支付
): Promise<Story> {
    // 将 isPay 转换为 paymentState 状态：true 转为 1，false 转为 0
    const paymentState = isPay ? 1 : 0;

    await query(
        `
        INSERT INTO Story
        (author_address, title, story_content, whiskey_points, paymentState, created_at)
        VALUES (?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
        `,
        [authorAddress, title, content, paymentState]
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

/**
 * 查询所有没有评分的pay to earn故事
 */
export async function getPaymentPendingStories(): Promise<Story[]> {
    const rows = await query(
        'SELECT * FROM Story WHERE paymentState = 1'
    );
    return rows;
}

/**
 * 更新故事的合约地址
 */
export async function updateStoryContractAddress(storyId: string, contractAddress: string): Promise<boolean> {
    try {
        await query(
            'UPDATE Story SET contract_address = ? WHERE id = ?',
            [contractAddress, storyId]
        );
        return true;
    } catch (error) {
        console.error('Error updating story contract address:', error);
        return false;
    }
}

/**
 * 获取故事的合约地址
 */
export async function getStoryContractAddress(storyId: string): Promise<string | null> {
    const rows = await query(
        'SELECT contract_address FROM Story WHERE id = ?',
        [storyId]
    );
    return rows[0]?.contract_address || null;
}

/**
 * 根据合约地址获取故事
 * @param contractAddress 合约地址
 * @returns 故事对象，如果未找到则返回 null
 */
export async function getStoryByContractAddress(contractAddress: string): Promise<Story | null> {
    const rows = await query(
        'SELECT * FROM Story WHERE contract_address = ?',
        [contractAddress]
    );
    return rows[0] || null;
}