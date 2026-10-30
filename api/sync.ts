const UPSTASH_URL = 'https://pleasant-gorilla-242644.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAA7PUAQIgcDFkMWMzNDc2MjQyMjE0MmNhOTgxMGU5OWZlOWQzZmNkOQ';
const CLOUD_KEY = 'equipguard:shared_data';

export default async function handler(req: any, res: any) {
  // Universal CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const upstashRes = await fetch(UPSTASH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', CLOUD_KEY]),
      });
      const data = await upstashRes.json();
      const parsed = data.result ? JSON.parse(data.result) : {};
      if (parsed.companySettings) {
        if (!parsed.companySettings.googleDriveFolderUrl || parsed.companySettings.googleDriveFolderUrl.includes('1_EquipGuard_Plant04_Uploads')) {
          parsed.companySettings.googleDriveFolderUrl = 'https://drive.google.com/drive/my-drive';
        }
        if (!parsed.companySettings.googleSpreadsheetUrl || parsed.companySettings.googleSpreadsheetUrl.includes('1_EquipGuard_Industrial_CMMS_DB')) {
          parsed.companySettings.googleSpreadsheetUrl = 'https://docs.google.com/spreadsheets/';
        }
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(200).json(parsed);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      let incoming = req.body || {};
      if (typeof incoming === 'string') {
        try {
          incoming = JSON.parse(incoming);
        } catch {
          incoming = {};
        }
      }

      // Fetch existing state
      let existing: any = {};
      try {
        const getRes = await fetch(UPSTASH_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(['GET', CLOUD_KEY]),
        });
        const existingData = await getRes.json();
        existing = existingData.result ? JSON.parse(existingData.result) : {};
      } catch {
        existing = {};
      }

      // Merge employees (preserve avatarUrl)
      let mergedEmployees = existing.employees || [];
      if (incoming.employees && Array.isArray(incoming.employees)) {
        const incomingMap = new Map(incoming.employees.map((e: any) => [e.id, e]));
        const existingMap = new Map((existing.employees || []).map((e: any) => [e.id, e]));
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
          return inc || ex;
        });
      }

      const mergedCompanySettings = {
        ...(existing.companySettings || {}),
        ...(incoming.companySettings || {}),
      };
      if (!mergedCompanySettings.googleDriveFolderUrl || mergedCompanySettings.googleDriveFolderUrl.includes('1_EquipGuard_Plant04_Uploads')) {
        mergedCompanySettings.googleDriveFolderUrl = 'https://drive.google.com/drive/my-drive';
      }
      if (!mergedCompanySettings.googleSpreadsheetUrl || mergedCompanySettings.googleSpreadsheetUrl.includes('1_EquipGuard_Industrial_CMMS_DB')) {
        mergedCompanySettings.googleSpreadsheetUrl = 'https://docs.google.com/spreadsheets/';
      }

      // Merge parameter input logs (keep unique by id, sort newest first)
      let mergedLogs = existing.parameterInputLogs || [];
      if (incoming.parameterInputLogs && Array.isArray(incoming.parameterInputLogs)) {
        const existingMap = new Map((existing.parameterInputLogs || []).map((l: any) => [l.id, l]));
        incoming.parameterInputLogs.forEach((l: any) => existingMap.set(l.id, l));
        mergedLogs = Array.from(existingMap.values()).sort(
          (a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || '')
        );
      }

      const merged = {
        ...existing,
        ...incoming,
        companySettings: mergedCompanySettings,
        employees: mergedEmployees.length > 0 ? mergedEmployees : existing.employees,
        parameterInputLogs: mergedLogs.length > 0 ? mergedLogs : existing.parameterInputLogs,
        lastSyncedAt: new Date().toISOString(),
      };

      await fetch(UPSTASH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', CLOUD_KEY, JSON.stringify(merged)]),
      });

      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ success: true, lastSyncedAt: merged.lastSyncedAt });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
