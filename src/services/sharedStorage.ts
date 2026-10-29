import type {
  Employee,
  CompanySettings,
  Equipment,
  ParameterInputLog,
  EquipmentRequest,
  MaintenanceRecord,
  AlertItem,
} from '../types';

export interface SharedStoreData {
  companySettings?: CompanySettings;
  employees?: Employee[];
  equipmentList?: Equipment[];
  parameterInputLogs?: ParameterInputLog[];
  equipmentRequests?: EquipmentRequest[];
  maintenanceRecords?: MaintenanceRecord[];
  alerts?: AlertItem[];
  lastSyncedAt?: string;
}

const SYNC_ENDPOINTS = ['/api/sync', '/shared_data.json', './shared_data.json'];

/**
 * Fetches cross-browser persistent data from the backend / shared data store.
 * Works across different browsers (Chrome, Edge, Firefox, Safari, Incognito, Network devices).
 */
export async function fetchSharedData(): Promise<SharedStoreData | null> {
  for (const endpoint of SYNC_ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          return data;
        }
      }
    } catch {
      // Continue to next endpoint fallback
    }
  }
  return null;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingData: Partial<SharedStoreData> = {};

/**
 * Persists data across all browsers by posting to the local backend server,
 * which writes directly to disk in public/shared_data.json.
 */
export function saveSharedData(partial: Partial<SharedStoreData>) {
  pendingData = { ...pendingData, ...partial };

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    const payload = { ...pendingData };
    pendingData = {};

    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Backend shared storage sync skipped (standalone/static mode):', err);
    }
  }, 250);
}
