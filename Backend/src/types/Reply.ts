
export interface Reply {
    id: number;
    story_id: number;
    author_address: string;
    to_address: string;
    reply_content: string;
    unread: boolean;
    created_at: Date;
}
