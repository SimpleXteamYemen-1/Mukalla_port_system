import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-85dcafc8/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// PORT OFFICER API ROUTES
// ============================================

// Get all vessels
app.get("/make-server-85dcafc8/vessels", async (c) => {
  try {
    const vessels = await kv.getByPrefix("vessel:");
    return c.json({ success: true, vessels });
  } catch (error) {
    console.error("Error fetching vessels:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all wharves
app.get("/make-server-85dcafc8/wharves", async (c) => {
  try {
    const wharves = await kv.getByPrefix("wharf:");
    return c.json({ success: true, wharves });
  } catch (error) {
    console.error("Error fetching wharves:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Assign vessel to berth
app.post("/make-server-85dcafc8/berth-assignment", async (c) => {
  try {
    const { vesselId, wharfId, officerName } = await c.req.json();
    
    // Get vessel and wharf data
    const vessel = await kv.get(`vessel:${vesselId}`);
    const wharf = await kv.get(`wharf:${wharfId}`);
    
    if (!vessel || !wharf) {
      return c.json({ success: false, error: "Vessel or wharf not found" }, 404);
    }
    
    if (wharf.status === "occupied") {
      return c.json({ success: false, error: "Wharf is already occupied" }, 400);
    }
    
    // Update vessel status
    vessel.status = "docked";
    vessel.currentWharf = wharfId;
    await kv.set(`vessel:${vesselId}`, vessel);
    
    // Update wharf status
    wharf.status = "occupied";
    wharf.vessel = vessel.name;
    await kv.set(`wharf:${wharfId}`, wharf);
    
    // Create log entry
    const logId = `log:${Date.now()}`;
    const log = {
      id: logId,
      timestamp: new Date().toISOString(),
      action: "berth_assignment",
      vessel: vessel.name,
      details: `Assigned vessel to Wharf ${wharfId}`,
      officer: officerName,
      wharf: wharfId
    };
    await kv.set(logId, log);
    
    return c.json({ success: true, vessel, wharf, log });
  } catch (error) {
    console.error("Error assigning berth:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Release berth
app.post("/make-server-85dcafc8/berth-release", async (c) => {
  try {
    const { vesselId, wharfId, officerName } = await c.req.json();
    
    // Get vessel and wharf data
    const vessel = await kv.get(`vessel:${vesselId}`);
    const wharf = await kv.get(`wharf:${wharfId}`);
    
    if (!vessel || !wharf) {
      return c.json({ success: false, error: "Vessel or wharf not found" }, 404);
    }
    
    // Update vessel status
    vessel.status = "awaiting";
    vessel.currentWharf = null;
    await kv.set(`vessel:${vesselId}`, vessel);
    
    // Update wharf status
    wharf.status = "available";
    wharf.vessel = null;
    await kv.set(`wharf:${wharfId}`, wharf);
    
    // Create log entry
    const logId = `log:${Date.now()}`;
    const log = {
      id: logId,
      timestamp: new Date().toISOString(),
      action: "berth_release",
      vessel: vessel.name,
      details: `Released berth ${wharfId} - vessel departed`,
      officer: officerName,
      wharf: wharfId
    };
    await kv.set(logId, log);
    
    return c.json({ success: true, vessel, wharf, log });
  } catch (error) {
    console.error("Error releasing berth:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all clearances
app.get("/make-server-85dcafc8/clearances", async (c) => {
  try {
    const clearances = await kv.getByPrefix("clearance:");
    return c.json({ success: true, clearances });
  } catch (error) {
    console.error("Error fetching clearances:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Issue new clearance
app.post("/make-server-85dcafc8/clearance", async (c) => {
  try {
    const { vessel, nextPort, officerName } = await c.req.json();
    
    // Get all clearances to generate next ID
    const allClearances = await kv.getByPrefix("clearance:");
    const nextNumber = 1245 + allClearances.length;
    const clearanceId = `PO.Mukalla.NO.${nextNumber}`;
    
    const issueTime = new Date();
    const expiryTime = new Date(issueTime.getTime() + 24 * 60 * 60 * 1000);
    
    const clearance = {
      id: `clearance:${clearanceId}`,
      clearanceId: clearanceId,
      vessel: vessel,
      nextPort: nextPort,
      issueTime: issueTime.toISOString(),
      expiryTime: expiryTime.toISOString(),
      status: "valid",
      hoursRemaining: 24
    };
    
    await kv.set(`clearance:${clearanceId}`, clearance);
    
    // Create log entry
    const logId = `log:${Date.now()}`;
    const log = {
      id: logId,
      timestamp: new Date().toISOString(),
      action: "clearance_issued",
      vessel: vessel,
      details: `Port clearance issued for departure to ${nextPort}`,
      officer: officerName,
      clearanceId: clearanceId
    };
    await kv.set(logId, log);
    
    return c.json({ success: true, clearance, log });
  } catch (error) {
    console.error("Error issuing clearance:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all operational logs
app.get("/make-server-85dcafc8/logs", async (c) => {
  try {
    const logs = await kv.getByPrefix("log:");
    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return c.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Initialize sample data (call this once to populate)
app.post("/make-server-85dcafc8/init-data", async (c) => {
  try {
    // Initialize Wharves
    const wharves = [
      { id: "W-01", name: "Wharf 01 - North", status: "occupied", vessel: "MV Atlantic Pride", capacity: 75000 },
      { id: "W-02", name: "Wharf 02 - North", status: "available", capacity: 75000 },
      { id: "W-03", name: "Wharf 03 - Central", status: "occupied", vessel: "MV Eastern Star", capacity: 50000 },
      { id: "W-04", name: "Wharf 04 - Central", status: "available", capacity: 50000 },
      { id: "W-05", name: "Wharf 05 - South", status: "available", capacity: 100000 },
      { id: "W-06", name: "Wharf 06 - South", status: "occupied", vessel: "MV Southern Cross", capacity: 100000 },
    ];
    
    for (const wharf of wharves) {
      await kv.set(`wharf:${wharf.id}`, wharf);
    }
    
    // Initialize Vessels
    const vessels = [
      { id: "V001", name: "MV Atlantic Pride", type: "Container Ship", arrival: "2026-02-06 14:30", agent: "SeaTrans Maritime", status: "docked", currentWharf: "W-01", clearanceStatus: "issued" },
      { id: "V002", name: "MV Eastern Star", type: "Bulk Carrier", arrival: "2026-02-06 16:45", agent: "Global Shipping Co.", status: "loading", currentWharf: "W-03", clearanceStatus: "pending" },
      { id: "V003", name: "MV Southern Cross", type: "Tanker", arrival: "2026-02-07 08:15", agent: "Maritime Solutions", status: "unloading", currentWharf: "W-06", clearanceStatus: "none" },
      { id: "V004", name: "MV Pacific Dawn", type: "Container Ship", arrival: "2026-02-07 08:30", agent: "SeaTrans Maritime", status: "awaiting", clearanceStatus: "none" },
      { id: "V005", name: "MV Ocean Star", type: "Bulk Carrier", arrival: "2026-02-07 09:15", agent: "Global Shipping Co.", status: "awaiting", clearanceStatus: "none" },
      { id: "V006", name: "MV Golden Wave", type: "Tanker", arrival: "2026-02-07 10:00", agent: "Maritime Solutions", status: "awaiting", clearanceStatus: "none" },
      { id: "V007", name: "MV Blue Horizon", type: "Container", arrival: "2026-02-07 11:30", agent: "Pacific Logistics", status: "awaiting", clearanceStatus: "none" },
    ];
    
    for (const vessel of vessels) {
      await kv.set(`vessel:${vessel.id}`, vessel);
    }
    
    // Initialize sample clearance
    const clearance = {
      id: "clearance:PO.Mukalla.NO.1245",
      clearanceId: "PO.Mukalla.NO.1245",
      vessel: "MV Atlantic Pride",
      nextPort: "Aden Port",
      issueTime: "2026-02-07 08:00:00",
      expiryTime: "2026-02-08 08:00:00",
      status: "expiring-soon",
      hoursRemaining: 2
    };
    await kv.set("clearance:PO.Mukalla.NO.1245", clearance);
    
    return c.json({ 
      success: true, 
      message: "Sample data initialized",
      counts: {
        wharves: wharves.length,
        vessels: vessels.length,
        clearances: 1
      }
    });
  } catch (error) {
    console.error("Error initializing data:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============================================
// WHARF & STORAGE OFFICER API ROUTES
// ============================================

// Get wharf statistics for dashboard
app.get("/make-server-85dcafc8/wharf-stats", async (c) => {
  try {
    const availabilityRequests = await kv.getByPrefix("availability:");
    const storageAreas = await kv.getByPrefix("storage:");
    const containers = await kv.getByPrefix("container:");
    const wharves = await kv.getByPrefix("wharf:");
    
    const pending = availabilityRequests.filter((r: any) => r.status === 'pending').length;
    const approved = wharves.filter((w: any) => w.status === 'available').length;
    const occupied = wharves.filter((w: any) => w.status === 'occupied').length;
    
    const totalStorage = storageAreas.reduce((sum: number, area: any) => sum + area.capacity, 0);
    const usedStorage = storageAreas.reduce((sum: number, area: any) => sum + area.used, 0);
    
    const awaitingContainers = containers.filter((c: any) => c.status === 'awaiting').length;
    
    // Generate alerts
    const alerts = [];
    storageAreas.forEach((area: any) => {
      const percentage = (area.used / area.capacity) * 100;
      if (percentage >= 90) {
        alerts.push({
          id: `alert-${area.id}`,
          type: 'critical',
          message: `Storage area ${area.name} is at ${percentage.toFixed(0)}% capacity`,
          timestamp: new Date().toISOString()
        });
      } else if (percentage >= 75) {
        alerts.push({
          id: `alert-${area.id}`,
          type: 'warning',
          message: `Storage area ${area.name} is nearing capacity at ${percentage.toFixed(0)}%`,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return c.json({
      success: true,
      stats: {
        pendingAvailability: pending,
        approvedWharves: approved,
        occupiedWharves: occupied,
        storageUsed: usedStorage,
        storageAvailable: totalStorage - usedStorage,
        containersAwaiting: awaitingContainers
      },
      alerts
    });
  } catch (error) {
    console.error("Error fetching wharf stats:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get availability requests
app.get("/make-server-85dcafc8/availability-requests", async (c) => {
  try {
    const requests = await kv.getByPrefix("availability:");
    return c.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching availability requests:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Approve availability request
app.post("/make-server-85dcafc8/approve-availability", async (c) => {
  try {
    const { requestId, officerName } = await c.req.json();
    
    const request = await kv.get(requestId);
    if (!request) {
      return c.json({ success: false, error: "Request not found" }, 404);
    }
    
    request.status = 'approved';
    await kv.set(requestId, request);
    
    // Create log
    const logId = `wharflog:${Date.now()}`;
    await kv.set(logId, {
      id: logId,
      timestamp: new Date().toISOString(),
      action: 'availability_approved',
      vessel: request.vesselName,
      details: `Approved availability for ${request.vesselName} at ${request.wharfId}`,
      officer: officerName
    });
    
    return c.json({ success: true, request });
  } catch (error) {
    console.error("Error approving availability:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Reject availability request
app.post("/make-server-85dcafc8/reject-availability", async (c) => {
  try {
    const { requestId, officerName } = await c.req.json();
    
    const request = await kv.get(requestId);
    if (!request) {
      return c.json({ success: false, error: "Request not found" }, 404);
    }
    
    request.status = 'rejected';
    await kv.set(requestId, request);
    
    // Create log
    const logId = `wharflog:${Date.now()}`;
    await kv.set(logId, {
      id: logId,
      timestamp: new Date().toISOString(),
      action: 'availability_rejected',
      vessel: request.vesselName,
      details: `Rejected availability for ${request.vesselName} at ${request.wharfId}`,
      officer: officerName
    });
    
    return c.json({ success: true, request });
  } catch (error) {
    console.error("Error rejecting availability:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get storage areas
app.get("/make-server-85dcafc8/storage-areas", async (c) => {
  try {
    const areas = await kv.getByPrefix("storage:");
    return c.json({ success: true, areas });
  } catch (error) {
    console.error("Error fetching storage areas:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get containers
app.get("/make-server-85dcafc8/containers", async (c) => {
  try {
    const containers = await kv.getByPrefix("container:");
    return c.json({ success: true, containers });
  } catch (error) {
    console.error("Error fetching containers:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Assign container to storage
app.post("/make-server-85dcafc8/assign-container", async (c) => {
  try {
    const { containerId, storageId, officerName } = await c.req.json();
    
    const container = await kv.get(containerId);
    const storage = await kv.get(storageId);
    
    if (!container || !storage) {
      return c.json({ success: false, error: "Container or storage not found" }, 404);
    }
    
    // Check capacity
    const available = storage.capacity - storage.used;
    if (available < container.weight) {
      return c.json({ success: false, error: "Insufficient storage capacity" }, 400);
    }
    
    // Update container
    container.status = 'assigned';
    container.assignedStorage = storage.name;
    await kv.set(containerId, container);
    
    // Update storage
    storage.used += container.weight;
    const percentage = (storage.used / storage.capacity) * 100;
    storage.status = percentage >= 90 ? 'full' : percentage >= 70 ? 'near_full' : 'available';
    await kv.set(storageId, storage);
    
    // Create log
    const logId = `wharflog:${Date.now()}`;
    await kv.set(logId, {
      id: logId,
      timestamp: new Date().toISOString(),
      action: 'container_assigned',
      container: container.id,
      details: `Assigned container ${container.id} to ${storage.name}`,
      officer: officerName
    });
    
    return c.json({ success: true, container, storage });
  } catch (error) {
    console.error("Error assigning container:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get capacity overview
app.get("/make-server-85dcafc8/capacity-overview", async (c) => {
  try {
    const storageAreas = await kv.getByPrefix("storage:");
    
    const totalCapacity = storageAreas.reduce((sum: number, area: any) => sum + area.capacity, 0);
    const totalUsed = storageAreas.reduce((sum: number, area: any) => sum + area.used, 0);
    
    const byType = storageAreas.map((area: any) => ({
      type: area.type,
      capacity: area.capacity,
      used: area.used
    }));
    
    return c.json({
      success: true,
      overview: {
        totalCapacity,
        totalUsed,
        byType,
        trend: {
          daily: '+2.5%',
          weekly: '+12%',
          monthly: '+28%'
        },
        predictions: {
          capacityFull: '3 days',
          recommendedAction: 'Increase bulk storage'
        }
      }
    });
  } catch (error) {
    console.error("Error fetching capacity overview:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Initialize wharf data
app.post("/make-server-85dcafc8/init-wharf-data", async (c) => {
  try {
    // Create storage areas
    const storageAreas = [
      { id: 'storage:general-1', name: 'General Storage A', capacity: 20000, used: 15000, type: 'general', status: 'near_full' },
      { id: 'storage:refrigerated-1', name: 'Cold Storage 1', capacity: 10000, used: 7500, type: 'refrigerated', status: 'available' },
      { id: 'storage:hazardous-1', name: 'Hazmat Zone', capacity: 10000, used: 8000, type: 'hazardous', status: 'near_full' },
      { id: 'storage:bulk-1', name: 'Bulk Storage B', capacity: 10000, used: 8000, type: 'bulk', status: 'near_full' }
    ];
    
    for (const area of storageAreas) {
      await kv.set(area.id, area);
    }
    
    // Create availability requests
    const requests = [
      {
        id: 'availability:001',
        vesselName: 'MV Global Trader',
        vesselId: 'GT-2024-001',
        requestedArrival: new Date(Date.now() + 86400000).toISOString(),
        wharfId: 'Wharf A1',
        currentLoad: 18000,
        maxCapacity: 20000,
        status: 'pending',
        requestDate: new Date().toISOString()
      },
      {
        id: 'availability:002',
        vesselName: 'MV Ocean Star',
        vesselId: 'OS-2024-002',
        requestedArrival: new Date(Date.now() + 172800000).toISOString(),
        wharfId: 'Wharf B2',
        currentLoad: 14000,
        maxCapacity: 20000,
        status: 'pending',
        requestDate: new Date().toISOString()
      }
    ];
    
    for (const request of requests) {
      await kv.set(request.id, request);
    }
    
    // Create containers
    const containers = [
      {
        id: 'container:CONT-001',
        vesselName: 'MV Global Trader',
        trader: 'Maritime Trading Co.',
        weight: 500,
        type: 'general',
        status: 'awaiting',
        arrivalDate: new Date().toISOString()
      },
      {
        id: 'container:CONT-002',
        vesselName: 'MV Ocean Star',
        trader: 'Ocean Logistics Ltd.',
        weight: 300,
        type: 'refrigerated',
        status: 'awaiting',
        arrivalDate: new Date().toISOString()
      },
      {
        id: 'container:CONT-003',
        vesselName: 'MV Global Trader',
        trader: 'Global Shipping Inc.',
        weight: 450,
        type: 'bulk',
        status: 'awaiting',
        arrivalDate: new Date().toISOString()
      }
    ];
    
    for (const container of containers) {
      await kv.set(container.id, container);
    }
    
    return c.json({
      success: true,
      message: 'Wharf data initialized',
      created: {
        storageAreas: storageAreas.length,
        requests: requests.length,
        containers: containers.length
      }
    });
  } catch (error) {
    console.error("Error initializing wharf data:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);