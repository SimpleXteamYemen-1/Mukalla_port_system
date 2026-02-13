import api from './api';

export interface ExecutiveStats {
    pending_approvals: number;
    blocked_requests: number;
    approval_rate: string;
    today_decisions: number;
}

export interface PendingApproval {
    id: string;
    type: string;
    vessel: string;
    agent: string;
    priority: string;
    submittedDate: string;
    eta: string;
}

export interface RecentDecision {
    id: string;
    type: string;
    vessel: string;
    decision: string;
    time: string;
}

export const executiveService = {
    getDashboardStats: async () => {
        try {
            const response = await api.get('/executive/dashboard');
            return response.data as ExecutiveStats;
        } catch (error) {
            console.error('Error fetching executive stats:', error);
            throw error;
        }
    },

    getPendingApprovals: async () => {
        try {
            const response = await api.get('/executive/approvals');
            return response.data as PendingApproval[];
        } catch (error) {
            console.error('Error fetching pending approvals:', error);
            return [];
        }
    },

    getRecentDecisions: async () => {
        try {
            const response = await api.get('/executive/decisions');
            return response.data as RecentDecision[];
        } catch (error) {
            console.error('Error fetching recent decisions:', error);
            return [];
        }
    },

    initializeData: async () => {
        // No-op
        return { success: true };
    }
};
