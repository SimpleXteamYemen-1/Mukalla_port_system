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
            const response = await api.get('/agent/stats');
            return response.data;
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

    submitArrival: async (data: { imo_number: string; name: string; type: string; flag?: string; eta: string; purpose?: string; cargo?: string; priority?: string; priority_reason?: string; priority_document?: FileList | null }) => {
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === 'priority_document' && value instanceof FileList && value.length > 0) {
                        formData.append(key, value[0]);
                    } else if (key !== 'priority_document') {
                        formData.append(key, value as string);
                    }
                }
            });
            const response = await api.post('/agent/vessels', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error submitting arrival', error);
            throw error;
        }
    },

    updateArrival: async (id: number, data: { eta: string; type?: string; flag?: string; name?: string; imo_number?: string; purpose?: string; cargo?: string; priority?: string; priority_reason?: string; priority_document?: FileList | null }) => {
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT'); // Laravel required for PUT with FormData
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === 'priority_document' && value instanceof FileList && value.length > 0) {
                        formData.append(key, value[0]);
                    } else if (key !== 'priority_document') {
                        formData.append(key, value as string);
                    }
                }
            });
            const response = await api.post(`/agent/vessels/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating arrival', error);
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

    updateAnchorageRequest: async (id: number, data: any) => {
        try {
            const response = await api.put(`/agent/anchorage/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating anchorage request', error);
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

    getTrackerData: async () => {
        try {
            const response = await api.get('/agent/tracker');
            return response.data;
        } catch (error) {
            console.error('Error fetching tracker data', error);
            return [];
        }
    },

    uploadManifest: async (formData: FormData) => {
        try {
            const response = await api.post('/agent/manifests', formData, {
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

    updateManifest: async (id: number, formData: FormData) => {
        try {
            // Need to use POST with _method=PUT to handle multipart/form-data with file upload in Laravel
            formData.append('_method', 'PUT');
            const response = await api.post(`/agent/manifests/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating manifest', error);
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
    },

    getClearances: async () => {
        try {
            const response = await api.get('/agent/clearances');
            return response.data.map((c: any) => {
                const expiry = new Date(c.expiry_date);
                const now = new Date();
                const hours = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));

                return {
                    id: c.id.toString(),
                    clearanceId: `CLR-${c.id}`,
                    vessel: c.vessel ? c.vessel.name : 'Unknown',
                    nextPort: c.next_port || 'Unknown',
                    issueTime: c.issue_date,
                    expiryTime: c.expiry_date,
                    status: hours < 0 ? 'expired' : (hours < 24 ? 'expiring-soon' : 'valid'),
                    hoursRemaining: hours
                };
            });
        } catch (error) {
            console.error('Error fetching clearances', error);
            return [];
        }
    },

    issueClearance: async (vesselName: string, nextPort: string) => {
        try {
            const response = await api.post('/agent/clearance', {
                vessel_name: vesselName,
                next_port: nextPort,
            });
            return response.data;
        } catch (error) {
            console.error('Error issuing clearance', error);
            throw error;
        }
    },

    updateClearance: async (id: number, nextPort: string) => {
        try {
            const response = await api.put(`/agent/clearance/${id}`, {
                next_port: nextPort,
            });
            return response.data;
        } catch (error) {
            console.error('Error updating clearance', error);
            throw error;
        }
    }
};
