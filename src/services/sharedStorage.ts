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

const SYNC_ENDPOINTS = [
  '/api/sync',
  './api/sync',
  './shared_data.json',
  '/shared_data.json',
  'https://raw.githubusercontent.com/engrarmanhossain/AkijIspatEquip/main/public/shared_data.json',
];

/**
 * Fetches cross-browser persistent data from the backend / shared data store.
 * Works seamlessly across Chrome, Edge, Firefox, Safari, Mobile, Incognito, and GitHub Pages.
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
      // Continue to next fallback endpoint
    }
  }
  return null;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingData: Partial<SharedStoreData> = {};

/**
 * Persists data across all browsers by posting to the local backend server,
 * which writes directly to disk in public/shared_data.json and dist/shared_data.json,
 * and automatically triggers an auto-push to GitHub origin/main.
 */
export function saveSharedData(partial: Partial<SharedStoreData>) {
  pendingData = { ...pendingData, ...partial };

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    const payload = { ...pendingData };
    pendingData = {};

    const targets = ['/api/sync', './api/sync'];
    for (const target of targets) {
      try {
        const res = await fetch(target, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          break;
        }
      } catch (err) {
        // Continue to fallback
      }
    }
  }, 200);
}
