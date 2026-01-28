import { Company, User, WorkSession } from '@/types';
import { addDays, subDays, format } from 'date-fns';

export const MOCK_COMPANY: Company = {
    id: 'comp_123',
    name: 'Tech Solutions Inc.',
    plan: 'pro',
};

export const MOCK_USER: User = {
    id: 'user_123',
    full_name: 'Alex Developer',
    email: 'alex@techsolutions.com',
    role: 'user',
    company_id: 'comp_123',
    avatar_url: 'https://github.com/shadcn.png',
};

const today = new Date();

export const MOCK_SESSIONS: WorkSession[] = [
    {
        id: 'sess_1',
        user_id: 'user_123',
        company_id: 'comp_123',
        date: format(subDays(today, 2), 'yyyy-MM-dd'),
        check_in: subDays(today, 2).toISOString(),
        check_out: addDays(subDays(today, 2), 0).toISOString(), // need to fix hours but keeping simple
        status: 'completed',
        total_minutes: 480,
        breaks: [],
    },
    {
        id: 'sess_2',
        user_id: 'user_123',
        company_id: 'comp_123',
        date: format(subDays(today, 1), 'yyyy-MM-dd'),
        check_in: subDays(today, 1).toISOString(),
        check_out: undefined,
        status: 'completed',
        total_minutes: 450,
        breaks: [],
    }
];

export const MOCK_CURRENT_SESSION: WorkSession | null = null; // Start with no active session
