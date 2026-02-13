import api from './api';

export interface AgentStats {
    activeVessels: number;
    pendingClearances: number;
    completedOperations: number;
    notifications: number;
}

export interface Activity {
    id: number;
    user_id: number;
    action: string;
    details: string;
    ip_address: string;
    created_at: string;
    updated_at: string;
}

export interface Arrival {
    id: number;
    vessel_name: string;
    imo_number: string;
    status: string;
    eta: string;
}

export interface Vessel {
    id: number;
    name: string;
    type: string;
    flag: string;
    eta: string;
    status: string;
    owner_id: number;
}

export interface CargoManifest {
    id: number;
    vessel_id: number;
    vessel?: Vessel;
    uploaded_by: number;
    status: string;
    file_path: string;
    total_weight: number;
    container_count: number;
    created_at: string;
}

export const agentService = {
    getStats: async () => {
        try {
            const vesselsResponse = await api.get('/agent/vessels');
            const vessels = vesselsResponse.data;
            return {
                activeVessels: vessels.length,
                pendingClearances: 0,
                completedOperations: 0,
                notifications: 0,
            };
        } catch (error) {
            console.error('Error fetching stats', error);
            return {
                activeVessels: 0,
                pendingClearances: 0,
                completedOperations: 0,
                notifications: 0
            };
        }
    },

    getRecentActivity: async () => {
        return [];
    },

    getUpcomingArrivals: async () => {
        try {
            const response = await api.get('/agent/vessels');
            return response.data; // This returns all vessels, which serves as arrival history too
        } catch (error) {
            console.error('Error fetching arrivals', error);
            return [];
        }
    },

    checkIMO: async (imo: string) => {
        try {
            const response = await api.get(`/agent/vessels/check-imo/${imo}`);
            return response.data;
        } catch (error) {
            console.error('Error checking IMO', error);
            throw error;
        }
    },

    submitArrival: async (data: { imo_number: string; name: string; type: string; flag?: string; eta: string }) => {
        try {
            const response = await api.post('/agent/vessels', data);
            return response.data;
        } catch (error) {
            console.error('Error submitting arrival', error);
            throw error;
        }
    },

    getManifests: async () => {
        try {
            const response = await api.get('/agent/manifests');
            return response.data;
        } catch (error) {
            console.error('Error fetching manifests', error);
            return [];
        }
    },

    submitAnchorageRequest: async (data: any) => {
        try {
            const response = await api.post('/agent/anchorage', data);
            return response.data;
        } catch (error) {
            console.error('Error submitting anchorage request', error);
            throw error;
        }
    },

    getAnchorageRequests: async () => {
        try {
            const response = await api.get('/agent/anchorage');
            return response.data;
        } catch (error) {
            console.error('Error fetching anchorage requests', error);
            return [];
        }
    },

    uploadManifest: async (formData: FormData) => {
        try {
            const response = await api.post('/agent/manifest', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading manifest', error);
            throw error;
        }
    },

    // Alias for explicit vessel fetching
    getVessels: async () => {
        try {
            const response = await api.get('/agent/vessels');
            return response.data;
        } catch (error) {
            console.error('Error fetching vessels', error);
            return [];
        }
    }
};
