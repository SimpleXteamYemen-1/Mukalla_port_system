import api from './api';

export interface ExecutiveStats {
    pending_approvals: number;
    pending_users: number;
    blocked_requests: number;
    approval_rate: string;
    today_decisions: number;
}

export interface PendingApproval {
    id: string;
    vesselId: number;
    type: string;
    vessel: {
        name: string;
        imo: string;
        flag: string;
        type: string;
    };
    agent: {
        name: string;
        contact: string;
    };
    purpose: string;
    priority: string;
    priorityReason?: string;
    priorityDocumentPath?: string;
    riskLevel: string;
    cargoType: string;
    containers: number;
    documents: { 
        id: number;
        name: string; 
        url: string; 
        storage_type: string; 
        consignee_name: string;
        extraction_status: 'success' | 'incomplete' | 'failed';
        extraction_errors?: string[] | null;
    }[];
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

    getPendingApprovals: async (): Promise<PendingApproval[]> => {
        try {
            const response = await api.get('/executive/approvals');
            return response.data;
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

    approveArrival: async (id: number) => {
        try {
            const response = await api.post(`/executive/arrivals/${id}/approve`);
            return response.data;
        } catch (error) {
            console.error('Error approving arrival:', error);
            throw error;
        }
    },

    rejectArrival: async (id: number, reason: string, rejectedManifestIds: number[] = []) => {
        try {
            const response = await api.post(`/executive/arrivals/${id}/reject`, { 
                status: 'rejected', 
                requestId: `REQ-${id}`, 
                reason: reason 
            });
            return response.data;
        } catch (error) {
            console.error('Error rejecting arrival:', error);
            throw error;
        }
    },

    getAnalytics: async () => {
        try {
            const response = await api.get('/executive/analytics');
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    },

    getAnchorageRequests: async () => {
        try {
            const response = await api.get('/executive/anchorage/requests');
            return response.data;
        } catch (error) {
            console.error('Error fetching anchorage requests:', error);
            return [];
        }
    },

    approveAnchorage: async (id: number) => {
        try {
            const response = await api.post(`/executive/anchorage/${id}/approve`);
            return response.data;
        } catch (error) {
            console.error('Error approving anchorage:', error);
            throw error;
        }
    },

    rejectAnchorage: async (id: number, reason: string) => {
        try {
            const response = await api.post(`/executive/anchorage/${id}/reject`, { reason });
            return response.data;
        } catch (error) {
            console.error('Error rejecting anchorage:', error);
            throw error;
        }
    },

    getPendingUsers: async () => {
        try {
            const response = await api.get('/executive/users/pending');
            return response.data;
        } catch (error) {
            console.error('Error fetching pending users:', error);
            return [];
        }
    },

    approveUser: async (id: number | string) => {
        try {
            const response = await api.post(`/executive/users/${id}/approve`);
            return response.data;
        } catch (error) {
            console.error('Error approving user:', error);
            throw error;
        }
    },

    rejectUser: async (id: number | string, reason: string) => {
        try {
            const response = await api.post(`/executive/users/${id}/reject`, { reason });
            return response.data;
        } catch (error) {
            console.error('Error rejecting user:', error);
            throw error;
        }
    },

    initializeData: async () => {
        // No-op
        return { success: true };
    },

    generateCustomReport: async (params: { dateRange: string; reportType: string; format: string }) => {
        try {
            const response = await api.post('/executive/reports/generate', params);
            return response.data;
        } catch (error) {
            console.error('Error generating custom report:', error);
            throw error;
        }
    },

    getVesselHistory: async (vesselId: string | number, page: number = 1) => {
        try {
            const response = await api.get(`/executive/vessels/${vesselId}/history?page=${page}`);
            return response.data;
        } catch (error) {
            console.error('Error loading vessel history:', error);
            throw error;
        }
    }
};
