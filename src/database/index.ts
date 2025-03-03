import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const databaseUrl = process.env.DATABASE_URL;
console.log("Database URL:", databaseUrl);
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in environment variables.");
}

const dbPromise = open({
    filename: databaseUrl,
    driver: sqlite3.Database
});

export async function query(sql: string, params?: any[]): Promise<any[]> {
    const db = await dbPromise;
    const rows = await db.all(sql, params);
    return rows;
}
