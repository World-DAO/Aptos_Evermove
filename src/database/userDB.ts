import { query } from "./index";

export interface User {
    address: string;
    total_whiskey_points: number; // 这与数据库中的 total_points 字段可能不一致，留意命名
    likedStories: JSON;
    created_at: Date;
    updated_at: Date;
}

/**
 * 通过 address 查询用户
 */
export async function getUserByAddress(address: string) {
    const rows = await query("SELECT * FROM User WHERE address = ? LIMIT 1", [address]);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * 创建用户, 默认 likedStories 为空数组
 */
export async function createUser(address: string): Promise<User> {
    // 用空数组来初始化 likedStories
    const defaultLikedStories: string[] = [];

    // SQLite 中用 CURRENT_TIMESTAMP 替代 NOW()
    await query(
        `
    INSERT INTO User (address, total_points, likedStories, created_at, updated_at)
    VALUES (?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `,
        [address, JSON.stringify(defaultLikedStories)]
    );

    const user = await getUserByAddress(address);
    return user!;
}

/**
 * 获取用户的 total_points
 */
export async function getUserPoints(address: string): Promise<number> {
    const rows = await query("SELECT total_points FROM User WHERE address = ?", [address]);
    if (rows.length === 0) {
        throw new Error(`User not found: ${address}`);
    }
    const { total_points } = rows[0];
    if (typeof total_points !== "number") {
        throw new Error(`Invalid total_points value for user ${address}.`);
    }
    return total_points;
}

/**
 * 更新用户 points
 */
export async function updateUserPoints(address: string, newPoints: number): Promise<User | null> {
    // 用 CURRENT_TIMESTAMP 更新
    await query(
        `
    UPDATE User
    SET total_points = ?, updated_at = CURRENT_TIMESTAMP
    WHERE address = ?
  `,
        [newPoints, address]
    );
    return await getUserByAddress(address);
}

/**
 * 标记收藏故事
 * 
 * - 将 likedStories 作为字符串存储在 SQLite
 * - 取出时需要用 JSON.parse()
 */
export async function markLikedStory(address: string, storyId: string): Promise<User | null> {
    const result = await query("SELECT likedStories FROM User WHERE address = ?", [address]);
    if (result.length === 0) {
        throw new Error("User not found.");
    }

    let rawLikedStories = result[0].likedStories;
    console.log("rawLikedStories:", rawLikedStories, "Type:", typeof rawLikedStories);

    // 默认空数组
    let likedStories: string[] = [];

    // 先尝试 parse 成数组
    if (rawLikedStories) {
        try {
            const parsed = JSON.parse(rawLikedStories);
            if (Array.isArray(parsed)) {
                likedStories = parsed;
            } else {
                // 如果不是数组，就视为空
                likedStories = [];
            }
        } catch (e) {
            // 解析失败也视为空
            likedStories = [];
        }
    }

    console.log("Before adding:", likedStories, "Type:", typeof likedStories);

    // 如果已经包含 storyId 就跳过
    if (likedStories.includes(storyId)) {
        console.warn(`Story ID "${storyId}" already exists in likedStories.`);
        return null; // 或者返回用户、或其他自定义处理
    }

    // 不包含则添加
    likedStories.push(storyId);
    console.log("Updated likedStories:", likedStories);

    // 写回数据库
    await query(
        "UPDATE User SET likedStories = ? WHERE address = ?",
        [JSON.stringify(likedStories), address]
    );

    // 返回更新后的用户信息
    const updatedUser = await getUserByAddress(address);
    return updatedUser;
}

/**
 * 获取用户 intimacy
 */
export async function getIntimacy(address: string): Promise<number> {
    const rows = await query("SELECT intimacy FROM User WHERE address = ?", [address]);
    if (rows.length === 0) {
        throw new Error(`User not found: ${address}`);
    }
    const { intimacy } = rows[0];
    if (typeof intimacy !== "number") {
        throw new Error(`Invalid intimacy value for user ${address}.`);
    }
    return intimacy;
}

/**
 * 更新用户 intimacy
 */
export async function updateIntimacy(address: string, newIntimacy: number): Promise<User | null> {
    await query(
        `UPDATE User SET intimacy = ?, updated_at = CURRENT_TIMESTAMP WHERE address = ?`,
        [newIntimacy, address]
    );
    return await getUserByAddress(address);
}