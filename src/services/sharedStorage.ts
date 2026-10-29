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

const UPSTASH_URL = 'https://pleasant-gorilla-242644.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAA7PUAQIgcDFkMWMzNDc2MjQyMjE0MmNhOTgxMGU5OWZlOWQzZmNkOQ';
const CLOUD_KEY = 'equipguard:shared_data';

/**
 * Direct Serverless Cloud Read (Fast, works on Vercel, localhost, GitHub Pages, mobile)
 */
async function fetchFromCloudStore(): Promise<SharedStoreData | null> {
  try {
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['GET', CLOUD_KEY]),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          if (parsed.companySettings) {
            if (!parsed.companySettings.googleDriveFolderUrl || parsed.companySettings.googleDriveFolderUrl.includes('1_EquipGuard_Plant04_Uploads')) {
              parsed.companySettings.googleDriveFolderUrl = 'https://drive.google.com/drive/my-drive';
            }
            if (!parsed.companySettings.googleSpreadsheetUrl || parsed.companySettings.googleSpreadsheetUrl.includes('1_EquipGuard_Industrial_CMMS_DB')) {
              parsed.companySettings.googleSpreadsheetUrl = 'https://docs.google.com/spreadsheets/';
            }
          }
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Direct cloud store fetch error:', err);
  }
  return null;
}

/**
 * Direct Serverless Cloud Write (Persists across all browsers on Vercel)
 */
async function saveToCloudStore(partial: Partial<SharedStoreData>): Promise<boolean> {
  try {
    const existing = (await fetchFromCloudStore()) || {};

    let mergedEmployees = existing.employees || [];
    if (partial.employees && Array.isArray(partial.employees)) {
      const incomingMap = new Map(partial.employees.map((e) => [e.id, e]));
      const existingMap = new Map((existing.employees || []).map((e) => [e.id, e]));
      const allIds = new Set([...existingMap.keys(), ...incomingMap.keys()]);
      mergedEmployees = Array.from(allIds).map((id) => {
        const ex = existingMap.get(id);
        const inc = incomingMap.get(id);
        if (ex && inc) {
          return {
            ...ex,
            ...inc,
            avatarUrl: inc.avatarUrl && inc.avatarUrl.length > 5 ? inc.avatarUrl : (ex.avatarUrl || ''),
          };
        }
        return inc || ex!;
      });
    }

    const mergedCompanySettings = {
      ...(existing.companySettings || {}),
      ...(partial.companySettings || {}),
    };
    if (!mergedCompanySettings.googleDriveFolderUrl || mergedCompanySettings.googleDriveFolderUrl.includes('1_EquipGuard_Plant04_Uploads')) {
      mergedCompanySettings.googleDriveFolderUrl = 'https://drive.google.com/drive/my-drive';
    }
    if (!mergedCompanySettings.googleSpreadsheetUrl || mergedCompanySettings.googleSpreadsheetUrl.includes('1_EquipGuard_Industrial_CMMS_DB')) {
      mergedCompanySettings.googleSpreadsheetUrl = 'https://docs.google.com/spreadsheets/';
    }

    const mergedData: SharedStoreData = {
      ...existing,
      ...partial,
      companySettings: mergedCompanySettings,
      employees: mergedEmployees.length > 0 ? mergedEmployees : existing.employees,
      lastSyncedAt: new Date().toISOString(),
    };

    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', CLOUD_KEY, JSON.stringify(mergedData)]),
    });
    return res.ok;
  } catch (err) {
    console.warn('Direct cloud store save error:', err);
    return false;
  }
}

const FALLBACK_ENDPOINTS = [
  '/api/sync',
  './api/sync',
  './shared_data.json',
  '/shared_data.json',
  'https://raw.githubusercontent.com/engrarmanhossain/AkijIspatEquip/main/public/shared_data.json',
];

/**
 * Fetches cross-browser persistent data.
 * Prioritizes direct serverless cloud store so Vercel (Chrome vs Edge) syncs in real-time.
 */
export async function fetchSharedData(): Promise<SharedStoreData | null> {
  // 1. Try Cloud Store first
  const cloudData = await fetchFromCloudStore();
  if (cloudData && Object.keys(cloudData).length > 0) {
    return cloudData;
  }

  // 2. Fall back to local or static files
  for (const endpoint of FALLBACK_ENDPOINTS) {
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
      // Continue to next fallback
    }
  }
  return null;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingData: Partial<SharedStoreData> = {};

/**
 * Persists data across all browsers.
 * Simultaneously updates the persistent Cloud Store and the local `/api/sync` endpoint.
 */
export function saveSharedData(partial: Partial<SharedStoreData>) {
  pendingData = { ...pendingData, ...partial };

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    const payload = { ...pendingData };
    pendingData = {};

    // 1. Write directly to Cloud Store (works universally on Vercel, localhost, GitHub Pages)
    saveToCloudStore(payload);

    // 2. Also POST to local server / Vercel API endpoint
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
      } catch {
        // Fallback
      }
    }
  }, 200);
}
