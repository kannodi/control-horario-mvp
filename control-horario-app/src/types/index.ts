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
    work_session_id: string;
    break_start: string; // ISO string
    break_end?: string | null; // ISO string
    duration_minutes: number;
    created_at?: string;
}

export interface WorkSession {
    id: string;
    user_id: string;
    company_id: string;
    date: string; // YYYY-MM-DD
    check_in: string; // ISO string
    check_out?: string | null; // ISO string
    total_minutes: number;
    accumulated_seconds: number;
    status: SessionStatus;
    breaks: Break[];
}

export interface LocationInfo {
    city: string;
    region: string;
    country_name: string;
    ip: string;
    timezone: string;
}
