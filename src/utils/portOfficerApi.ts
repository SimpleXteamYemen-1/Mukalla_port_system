import api from '../services/api';

// Types based on backend models but adapted for frontend display
export interface Vessel {
  id: string; // Backend uses number, but we can cast to string for frontend consistency
  name: string;
  type: string;
  arrival: string; // mapped from eta
  departure?: string; // mapped from etd
  agent: string; // mapped from owner.name
  status: 'awaiting' | 'scheduled' | 'assigned' | 'docked' | 'loading' | 'unloading' | 'ready'; // Backend status might need mapping
  currentWharf?: string; // mapped from wharf.name
  clearanceStatus: 'none' | 'pending' | 'issued';
}

export interface Wharf {
  id: string;
  name: string;
  status: 'available' | 'occupied';
  vessel?: string; // vessel name if occupied
  capacity: number;
}

export interface Clearance {
  id: string;
  clearanceId: string; // id
  vessel: string; // vessel name
  nextPort: string; // Not in backend yet? default to 'Unknown'
  issueTime: string; // issue_date
  expiryTime: string; // expiry_date
  status: 'valid' | 'expiring-soon' | 'expired';
  hoursRemaining: number;
}

export interface LogEntry {
  id: string;
  timestamp: string; // created_at
  action: 'berth_assignment' | 'clearance_issued' | 'berth_release'; // map from backend action strings
  vessel: string; // details parsed? or just use details
  details: string;
  officer: string; // user.name
  wharf?: string;
  clearanceId?: string;
}

// No initialization needed for real backend
export async function initializeData() {
  return {};
}

// Vessels
export async function getVessels(): Promise<Vessel[]> {
  try {
    // /officer/vessels returns Vessel with wharf and owner
    const response = await api.get('/officer/vessels');
    const backendVessels = response.data;

    // api.get('/officer/clearances') to map clearance status?
    // Optimization: fetch both or assume backend handles it. 
    // For now, simple mapping.

    return backendVessels.map((v: any) => ({
      id: v.id.toString(),
      name: v.name,
      type: v.type,
      arrival: v.eta,
      departure: v.etd,
      agent: v.owner ? v.owner.name : 'Unknown',
      status: v.status, // Ensure backend status matches frontend string literal or map it
      currentWharf: v.wharf ? v.wharf.name : undefined,
      clearanceStatus: 'none', // Default, need logic to check clearance
    }));
  } catch (error) {
    console.error('Error fetching vessels:', error);
    return [];
  }
}

// Wharves
export async function getWharves(): Promise<Wharf[]> {
  try {
    const response = await api.get('/officer/wharves');
    return response.data.map((w: any) => ({
      id: w.id.toString(),
      name: w.name,
      status: w.status,
      capacity: w.capacity,
      // vessel: w.current_vessel ? ... // Backend Wharf model doesn't explicitly link current vessel in default serialization, 
      // but we might infer from getVessels if needed or if Wharf model has 'vessels' relationship.
    }));
  } catch (error) {
    console.error('Error fetching wharves:', error);
    return [];
  }
}

// Berth Assignment
export async function assignBerth(vesselId: string, wharfId: string, eta: string, etd: string, officerName: string) {
  try {
    const response = await api.post(`/officer/vessels/${vesselId}/berth`, {
      wharf_id: wharfId,
      eta,
      etd,
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error assigning berth:', error);
    throw error;
  }
}

// Release Berth - Backend endpoint not created yet on PortOfficerController, 
// strictly speaking assignBerth handles 'docked'. Release might need 'update status' endpoint.
// For now, mock or leave throwing.
export async function releaseBerth(vesselId: string, wharfId: string, officerName: string) {
  try {
    const response = await api.delete(`/officer/vessels/${vesselId}/berth`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error releasing berth:', error);
    throw error;
  }
}

// Clearances
export async function getClearances(): Promise<Clearance[]> {
  try {
    const response = await api.get('/officer/clearances');
    return response.data.map((c: any) => {
      // Calculate hours remaining
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
    console.error('Error fetching clearances:', error);
    return [];
  }
}

export async function issueClearance(vessel: string, nextPort: string, officerName: string) {
  try {
    const response = await api.post('/officer/clearance', {
      vessel_name: vessel,
      next_port: nextPort,
      expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error issuing clearance:', error);
    throw error;
  }
}

// Logs
export async function getLogs(): Promise<LogEntry[]> {
  try {
    const response = await api.get('/officer/logs');
    return response.data.map((l: any) => ({
      id: l.id.toString(),
      timestamp: l.created_at,
      action: l.action, // backend uses snake_case, frontend expects same?
      vessel: 'Vessel', // parsing from details?
      details: l.details,
      officer: 'Officer', // l.user_id resolve?
    }));
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
}
