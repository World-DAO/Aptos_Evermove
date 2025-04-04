export interface User {
    address: string;
    total_whiskey_points: number;
    intimacy: number;
    likedStories: JSON;
    receivedStories: JSON;
    isNewUser: boolean;
    created_at: Date;
    updated_at: Date;
}