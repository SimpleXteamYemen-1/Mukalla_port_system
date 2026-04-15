import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { User } from '../App';

export interface NotificationItem {
  id: string | number;
  operationId: string | number;
  senderName: string;
  senderRole: string;
  operationType: string;
  submittedTimestamp: string;
  status: string;
  message: string;
  route?: string; // Optional route for the item
}

const fetchNotifications = async (user: User): Promise<NotificationItem[]> => {
  let notifications: NotificationItem[] = [];

  try {
    switch (user.role) {
      case 'executive':
        // Fetch pending arrivals
        const { data: approvals } = await api.get('/executive/approvals');
        const arrivalNotifs = (approvals || []).map((item: any) => ({
          id: `arr-${item.id}`,
          operationId: item.id,
          senderName: item.agent?.name || 'Agent',
          senderRole: 'agent',
          operationType: 'Arrival Approval',
          submittedTimestamp: item.submittedDate,
          status: 'pending',
          message: `Arrival Request ${item.id} awaiting approval`,
          route: `/executive/approvals`,
        }));

        notifications = [...arrivalNotifs];
        break;

      case 'officer':
        // Fetch awaiting berths/pending clearances (simplified for Officer, focusing on awaiting vessels)
        const { data: vessels } = await api.get('/officer/vessels');
        const officerNotifs = (vessels || [])
          .filter((v: any) => v.status === 'awaiting' || v.status === 'scheduled')
          .map((v: any) => ({
            id: `vess-${v.id}`,
            operationId: `REQ-${v.id}`,
            senderName: v.owner?.name || 'Agent',
            senderRole: 'agent',
            operationType: v.status === 'awaiting' ? 'Arrival Approval' : 'Berth Assignment',
            submittedTimestamp: v.created_at,
            status: v.status === 'awaiting' ? 'pending' : 'unread',
            message: `Vessel ${v.name} is ${v.status === 'awaiting' ? 'awaiting arrival approval' : 'scheduled'}`,
            route: `/officer/active-vessels`,
          }));
        notifications = [...officerNotifs];
        break;

      case 'agent':
        // Fetch tracker data for recent updates
        const { data: trackerData } = await api.get('/agent/tracker');
        const agentNotifs = (trackerData || [])
          .filter((item: any) => item.status === 'pending' || item.status === 'rejected')
          .map((item: any) => ({
            id: `trk-${item.id}`,
            operationId: item.id,
            senderName: 'System / Port Officer',
            senderRole: 'system',
            operationType: item.title,
            submittedTimestamp: item.submittedDate,
            status: item.status,
            message: `${item.title} for ${item.vessel} is ${item.status}`,
            route: `/agent/tracker`,
          }));
        notifications = [...agentNotifs];
        break;

      case 'wharf':
        // Fetch wharf anchorage requests and active wharves
        const [wharvesRes, anchorageRes] = await Promise.all([
          api.get('/wharf/wharves').catch(() => ({ data: [] })),
          api.get('/wharf/anchorage-requests').catch(() => ({ data: { requests: [] } }))
        ]);
        
        const availableCount = (wharvesRes.data || []).filter((w: any) => w.status === 'available').length;
        // Depending on backend, anchorage requests might be in data or data.requests
        const requestsData = Array.isArray(anchorageRes.data) ? anchorageRes.data : (anchorageRes.data?.requests || []);
        
        const wharfNotifs = requestsData
          .filter((r: any) => r.status === 'pending' || r.status === 'waiting')
          .map((r: any) => ({
            id: `wharf-ar-${r.id}`,
            operationId: `AR-${r.id}`,
            senderName: r.agent?.name || r.vessel?.owner?.name || 'Agent',
            senderRole: 'agent',
            operationType: 'Anchorage Request',
            submittedTimestamp: r.created_at,
            status: r.status === 'waiting' ? 'unread' : 'pending',
            message: r.status === 'waiting' 
                ? (availableCount > 0 ? `Capacity available: ${availableCount} wharves free for waiting vessel ${r.vessel?.name || 'Unknown'}` : `Vessel ${r.vessel?.name || 'Unknown'} is waitlisted.`)
                : `New anchorage request for ${r.vessel?.name || 'Unknown'}`,
            route: `/wharf/availability`,
          }));
        notifications = [...wharfNotifs];
        break;

      default:
        // Generic fallback
        notifications = [];
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }

  // Sort by newest first
  return notifications.sort((a, b) => new Date(b.submittedTimestamp).getTime() - new Date(a.submittedTimestamp).getTime());
};

export const useNotifications = (user: User | null) => {
  return useQuery({
    queryKey: ['notifications', user?.id, user?.role],
    queryFn: () => fetchNotifications(user!),
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  });
};
