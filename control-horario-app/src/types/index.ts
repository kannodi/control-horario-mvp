export type UserRole = 'user' | 'admin';

export interface Company {
    id: string;
    name: string;
    plan: 'free' | 'pro' | 'enterprise';
}

export interface User {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    company_id: string;
    avatar_url?: string;
}

export type SessionStatus = 'active' | 'paused' | 'completed';

export interface Break {
    id: string;
    session_id: string;
    start_time: string; // ISO string
    end_time?: string; // ISO string
    duration_minutes: number;
}

export interface WorkSession {
    id: string;
    user_id: string;
    company_id: string;
    date: string; // YYYY-MM-DD
    check_in: string; // ISO string
    check_out?: string; // ISO string
    total_minutes: number;
    accumulated_seconds: number;
    status: SessionStatus;
    breaks: Break[];
}
