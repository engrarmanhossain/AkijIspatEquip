import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import type {
  Equipment,
  MaintenanceRecord,
  TroubleshootingGuide,
  AlertItem,
  ReliabilityStats,
  MaintenanceStatus,
  PriorityLevel,
  MaintenanceType,
  EquipmentTelemetry,
  EquipmentRequest,
  WorkProgressUpdate,
  HealthParameterItem,
  ParameterInputLog,
  EquipmentPhysicalData,
} from '../types';
import {
  INITIAL_EQUIPMENT,
  INITIAL_ALERTS,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_TROUBLESHOOTING_GUIDES,
  INITIAL_EQUIPMENT_REQUESTS,
  INITIAL_PARAMETER_INPUT_LOGS,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import { calculateEquipmentHealth, synchronizeTelemetryFromParameters } from '../utils/healthCalculator';
import { fetchSharedData, saveSharedData } from '../services/sharedStorage';

interface DashboardContextType {
  equipmentList: Equipment[];
  equipmentRequests: EquipmentRequest[];
  maintenanceRecords: MaintenanceRecord[];
  troubleshootingGuides: TroubleshootingGuide[];
  alerts: AlertItem[];
  selectedEquipmentId: string;
  selectedEquipment: Equipment | undefined;
  activeTab: 'overview' | 'health' | 'troubleshoot' | 'register' | 'analytics' | 'employees';
  searchQuery: string;
  activeDiagnosticFaultCode: string | null;
  activeWorkOrderModal: boolean;
  editingWorkOrder: MaintenanceRecord | null;
  addEquipmentModalOpen: boolean;
  workUpdateModalOpen: boolean;
  equipmentForWorkUpdate: Equipment | null;
  equipmentRequestModalOpen: boolean;
  stats: ReliabilityStats;

  // Actions
  setActiveTab: (tab: 'overview' | 'health' | 'troubleshoot' | 'register' | 'analytics' | 'employees') => void;
  setSelectedEquipmentId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlert: (alertId: string) => void;
  injectFault: (equipmentId: string, faultType: 'bearing_vibration' | 'thermal_runaway' | 'pressure_drop' | 'motor_overload') => void;
  resetEquipmentToNominal: (equipmentId: string) => void;
  openCreateWorkOrder: (initialData?: Partial<MaintenanceRecord>) => void;
  openEditWorkOrder: (record: MaintenanceRecord) => void;
  closeWorkOrderModal: () => void;
  saveWorkOrder: (record: Partial<MaintenanceRecord>) => void;
  deleteMaintenanceRecord: (id: string) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceStatus) => void;
  startTroubleshootForEquipment: (equipmentId: string, faultCode?: string) => void;

  // Equipment Actions
  addEquipmentDirect: (data: Partial<Equipment>) => void;
  deleteEquipmentDirect: (id: string) => void;
  submitEquipmentRequest: (req: Omit<EquipmentRequest, 'id' | 'requestDate' | 'status'>) => void;
  approveEquipmentRequest: (requestId: string, reviewedBy: string, reviewNotes?: string) => void;
  rejectEquipmentRequest: (requestId: string, reviewedBy: string, reviewNotes?: string) => void;
  uploadEquipmentPicture: (equipmentId: string, imageUrl: string) => void;
  addWorkProgressUpdate: (equipmentId: string, update: Omit<WorkProgressUpdate, 'id' | 'timestamp'>) => void;
  openAddEquipmentModal: () => void;
  closeAddEquipmentModal: () => void;
  openWorkUpdateModal: (equipment: Equipment) => void;
  closeWorkUpdateModal: () => void;
  openEquipmentRequestModal: () => void;
  closeEquipmentRequestModal: () => void;

  // Parameter Manual Input & Management Data Editing
  parameterInputLogs: ParameterInputLog[];
  manualInputModalOpen: boolean;
  targetParamForInput: { equipment: Equipment; parameter?: HealthParameterItem } | null;
  openManualInputModal: (equipment: Equipment, parameter?: HealthParameterItem) => void;
  closeManualInputModal: () => void;
  recordParameterValue: (params: {
    equipmentId: string;
    parameterId: string;
    value: string;
    status: 'healthy' | 'warning' | 'critical';
    notes?: string;
    shift?: 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)' | 'General Shift';
  }) => { success: boolean; error?: string };
  batchRecordParameters: (
    equipmentId: string,
    updates: {
      parameterId: string;
      value: string;
      status: 'healthy' | 'warning' | 'critical';
      notes?: string;
    }[],
    shift?: 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)' | 'General Shift'
  ) => { success: boolean; error?: string };
  editPhysicalStandardModalOpen: boolean;
  targetEquipmentForPhysicalEdit: Equipment | null;
  openEditPhysicalStandardModal: (equipment: Equipment) => void;
  closeEditPhysicalStandardModal: () => void;
  updatePhysicalAndStandardData: (
    equipmentId: string,
    physicalUpdates: Partial<Equipment>,
    parameterUpdates?: HealthParameterItem[]
  ) => { success: boolean; error?: string };
  auditModalOpen: boolean;
  auditEquipmentId: string | null;
  auditParameterId: string | null;
  openAuditModal: (equipmentId?: string, parameterId?: string) => void;
  closeAuditModal: () => void;

  resetAllDataToDefaults: () => void;
  exportRecordsToCSV: () => void;
  exportRecordsToJSON: () => void;
}

const STORAGE_KEYS = {
  EQUIPMENT: 'equipguard_equipment_v4',
  EQUIPMENT_REQUESTS: 'equipguard_equipment_requests_v3',
  RECORDS: 'equipguard_records_v3',
  ALERTS: 'equipguard_alerts_v4',
  PARAM_LOGS: 'equipguard_param_logs_v4',
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isManagementEmployee } = useAuth();

  const [equipmentList, setEquipmentList] = useState<Equipment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT) || localStorage.getItem('equipguard_equipment_v3');
      if (saved) {
        const parsed: Equipment[] = JSON.parse(saved);
        const initialMap = new Map(INITIAL_EQUIPMENT.map((e) => [e.id, e]));
        // Smart merge with INITIAL_EQUIPMENT to guarantee parameters, voltage, current, and physicalData are hydrated
        const merged = parsed.map((item) => {
          const initial = initialMap.get(item.id);
          const raw = initial
            ? {
                ...initial,
                ...item,
                physicalData: item.physicalData || initial.physicalData,
                parameters: item.parameters && item.parameters.length > 0 ? item.parameters : initial.parameters,
                telemetry: {
                  ...initial.telemetry,
                  ...item.telemetry,
                  voltage: item.telemetry?.voltage || initial.telemetry?.voltage,
                  current: item.telemetry?.current || initial.telemetry?.current,
                },
              }
            : item;

          // Equipment health score & status strictly derived from manual parameter update data!
          const assessment = calculateEquipmentHealth(raw.parameters);
          const syncedTelemetry = synchronizeTelemetryFromParameters(raw.telemetry, raw.parameters || []);
          const status = raw.status === 'maintenance' || raw.status === 'offline' ? raw.status : assessment.status;
          return {
            ...raw,
            healthScore: assessment.healthScore,
            status,
            telemetry: syncedTelemetry,
          };
        });
        const existingIds = new Set(merged.map((e) => e.id));
        const missing = INITIAL_EQUIPMENT.filter((e) => !existingIds.has(e.id)).map((eq) => {
          const assessment = calculateEquipmentHealth(eq.parameters);
          const syncedTelemetry = synchronizeTelemetryFromParameters(eq.telemetry, eq.parameters || []);
          return {
            ...eq,
            healthScore: assessment.healthScore,
            status: eq.status === 'maintenance' || eq.status === 'offline' ? eq.status : assessment.status,
            telemetry: syncedTelemetry,
          };
        });
        return [...merged, ...missing];
      }
      return INITIAL_EQUIPMENT.map((eq) => {
        const assessment = calculateEquipmentHealth(eq.parameters);
        const syncedTelemetry = synchronizeTelemetryFromParameters(eq.telemetry, eq.parameters || []);
        return {
          ...eq,
          healthScore: assessment.healthScore,
          status: eq.status === 'maintenance' || eq.status === 'offline' ? eq.status : assessment.status,
          telemetry: syncedTelemetry,
        };
      });
    } catch {
      return INITIAL_EQUIPMENT.map((eq) => {
        const assessment = calculateEquipmentHealth(eq.parameters);
        const syncedTelemetry = synchronizeTelemetryFromParameters(eq.telemetry, eq.parameters || []);
        return {
          ...eq,
          healthScore: assessment.healthScore,
          status: eq.status === 'maintenance' || eq.status === 'offline' ? eq.status : assessment.status,
          telemetry: syncedTelemetry,
        };
      });
    }
  });

  const [parameterInputLogs, setParameterInputLogs] = useState<ParameterInputLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PARAM_LOGS) || localStorage.getItem('equipguard_param_logs_v3');
      if (saved) {
        const parsed: ParameterInputLog[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((l) => l.id));
        const missing = INITIAL_PARAMETER_INPUT_LOGS.filter((l) => !existingIds.has(l.id));
        return [...parsed, ...missing].sort(
          (a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')
        );
      }
      return [...INITIAL_PARAMETER_INPUT_LOGS].sort(
        (a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')
      );
    } catch {
      return [...INITIAL_PARAMETER_INPUT_LOGS].sort(
        (a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')
      );
    }
  });

  const [equipmentRequests, setEquipmentRequests] = useState<EquipmentRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT_REQUESTS);
      return saved ? JSON.parse(saved) : (INITIAL_EQUIPMENT_REQUESTS as EquipmentRequest[]);
    } catch {
      return INITIAL_EQUIPMENT_REQUESTS as EquipmentRequest[];
    }
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_RECORDS;
    } catch {
      return INITIAL_MAINTENANCE_RECORDS;
    }
  });

  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return saved ? JSON.parse(saved) : INITIAL_ALERTS;
    } catch {
      return INITIAL_ALERTS;
    }
  });

  const [troubleshootingGuides] = useState<TroubleshootingGuide[]>(INITIAL_TROUBLESHOOTING_GUIDES);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(INITIAL_EQUIPMENT[0].id);
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'troubleshoot' | 'register' | 'analytics' | 'employees'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDiagnosticFaultCode, setActiveDiagnosticFaultCode] = useState<string | null>(null);

  // Modal states
  const [activeWorkOrderModal, setActiveWorkOrderModal] = useState<boolean>(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<MaintenanceRecord | null>(null);
  const [addEquipmentModalOpen, setAddEquipmentModalOpen] = useState<boolean>(false);
  const [workUpdateModalOpen, setWorkUpdateModalOpen] = useState<boolean>(false);
  const [equipmentForWorkUpdate, setEquipmentForWorkUpdate] = useState<Equipment | null>(null);
  const [equipmentRequestModalOpen, setEquipmentRequestModalOpen] = useState<boolean>(false);

  // Parameter & Audit Modals
  const [manualInputModalOpen, setManualInputModalOpen] = useState<boolean>(false);
  const [targetParamForInput, setTargetParamForInput] = useState<{ equipment: Equipment; parameter?: HealthParameterItem } | null>(null);
  const [editPhysicalStandardModalOpen, setEditPhysicalStandardModalOpen] = useState<boolean>(false);
  const [targetEquipmentForPhysicalEdit, setTargetEquipmentForPhysicalEdit] = useState<Equipment | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [auditEquipmentId, setAuditEquipmentId] = useState<string | null>(null);
  const [auditParameterId, setAuditParameterId] = useState<string | null>(null);

  // Cross-tab Real-time Broadcast Channel
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastRef.current = new BroadcastChannel('equipguard_realtime_sync');
      } catch (err) {
        console.warn('BroadcastChannel initialization skipped', err);
      }
    }
    return () => {
      broadcastRef.current?.close();
    };
  }, []);

  const isRemoteSyncRef = useRef(false);

  const broadcastUpdate = (type: string, data: any) => {
    try {
      broadcastRef.current?.postMessage({ type, data });
    } catch {
      // Fallback
    }
  };

  // Sync to LocalStorage, Shared Disk Storage & Broadcast across open tabs/windows
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipmentList));
      broadcastUpdate('EQUIPMENT_SYNC', equipmentList);
      if (!isRemoteSyncRef.current) {
        saveSharedData({ equipmentList });
      }
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [equipmentList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PARAM_LOGS, JSON.stringify(parameterInputLogs));
      broadcastUpdate('LOGS_SYNC', parameterInputLogs);
      if (!isRemoteSyncRef.current) {
        saveSharedData({ parameterInputLogs });
      }
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [parameterInputLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EQUIPMENT_REQUESTS, JSON.stringify(equipmentRequests));
      broadcastUpdate('REQUESTS_SYNC', equipmentRequests);
      if (!isRemoteSyncRef.current) {
        saveSharedData({ equipmentRequests });
      }
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [equipmentRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(maintenanceRecords));
      broadcastUpdate('RECORDS_SYNC', maintenanceRecords);
      if (!isRemoteSyncRef.current) {
        saveSharedData({ maintenanceRecords });
      }
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [maintenanceRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      broadcastUpdate('ALERTS_SYNC', alerts);
      if (!isRemoteSyncRef.current) {
        saveSharedData({ alerts });
      }
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [alerts]);

  // Periodic cross-browser shared sync from server disk
  useEffect(() => {
    let isMounted = true;
    let lastSeenTimestamp = '';

    const syncFleetFromSharedStore = async () => {
      try {
        const shared = await fetchSharedData();
        if (!shared || !isMounted) return;

        if (shared.lastSyncedAt && shared.lastSyncedAt === lastSeenTimestamp) {
          return;
        }
        if (shared.lastSyncedAt) {
          lastSeenTimestamp = shared.lastSyncedAt;
        }

        // Upstream reconciliation: If this browser has active requests or modified equipment count that shared store lacks, upload it!
        const hasLocalRequests = equipmentRequests && equipmentRequests.length > 0;
        const sharedHasRequests = shared.equipmentRequests && shared.equipmentRequests.length > 0;
        if (hasLocalRequests && !sharedHasRequests) {
          saveSharedData({
            equipmentList,
            equipmentRequests,
            maintenanceRecords,
          });
        }

        isRemoteSyncRef.current = true;

        if (shared.equipmentList && Array.isArray(shared.equipmentList) && shared.equipmentList.length > 0) {
          setEquipmentList((prev) => {
            const syncedList = shared.equipmentList!.map((eq) => {
              const assessment = calculateEquipmentHealth(eq.parameters);
              const syncedTelemetry = synchronizeTelemetryFromParameters(eq.telemetry, eq.parameters || []);
              const status = eq.status === 'maintenance' || eq.status === 'offline' ? eq.status : assessment.status;
              return {
                ...eq,
                healthScore: assessment.healthScore,
                status,
                telemetry: syncedTelemetry,
              };
            });
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(syncedList);
            return hasChanged ? syncedList : prev;
          });
        }

        if (shared.parameterInputLogs && Array.isArray(shared.parameterInputLogs) && shared.parameterInputLogs.length > 0) {
          setParameterInputLogs((prev) => {
            const sorted = [...shared.parameterInputLogs!].sort(
              (a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')
            );
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(sorted);
            return hasChanged ? sorted : prev;
          });
        }

        if (shared.maintenanceRecords && Array.isArray(shared.maintenanceRecords) && shared.maintenanceRecords.length > 0) {
          setMaintenanceRecords((prev) => {
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(shared.maintenanceRecords);
            return hasChanged ? shared.maintenanceRecords! : prev;
          });
        }

        if (shared.equipmentRequests && Array.isArray(shared.equipmentRequests)) {
          setEquipmentRequests((prev) => {
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(shared.equipmentRequests);
            return hasChanged ? shared.equipmentRequests! : prev;
          });
        }

        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 150);
      } catch (err) {
        console.warn('Cross-browser fleet sync error:', err);
      }
    };

    syncFleetFromSharedStore();
    const interval = setInterval(syncFleetFromSharedStore, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Listen for broadcasts and storage changes from other tabs/employees in real time
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('equipguard_realtime_sync');
        channel.onmessage = (event) => {
          if (!event.data) return;
          const { type, data } = event.data;
          if (type === 'EQUIPMENT_SYNC' && Array.isArray(data)) {
            setEquipmentList(data);
          } else if (type === 'LOGS_SYNC' && Array.isArray(data)) {
            setParameterInputLogs(data);
          } else if (type === 'REQUESTS_SYNC' && Array.isArray(data)) {
            setEquipmentRequests(data);
          } else if (type === 'RECORDS_SYNC' && Array.isArray(data)) {
            setMaintenanceRecords(data);
          } else if (type === 'ALERTS_SYNC' && Array.isArray(data)) {
            setAlerts(data);
          }
        };
      } catch (err) {
        console.warn('Broadcast listener skipped', err);
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.EQUIPMENT) {
          setEquipmentList(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.PARAM_LOGS) {
          setParameterInputLogs(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.EQUIPMENT_REQUESTS) {
          setEquipmentRequests(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.RECORDS) {
          setMaintenanceRecords(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.ALERTS) {
          setAlerts(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.warn('Cross-session storage sync error:', err);
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      channel?.close();
    };
  }, []);

  const selectedEquipment = useMemo(() => {
    return equipmentList.find((eq) => eq.id === selectedEquipmentId) || equipmentList[0];
  }, [equipmentList, selectedEquipmentId]);

  // Compute Reliability KPIs
  const stats = useMemo<ReliabilityStats>(() => {
    const total = equipmentList.length;
    const healthyCount = equipmentList.filter((e) => e.status === 'healthy').length;
    const warningCount = equipmentList.filter((e) => e.status === 'warning').length;
    const criticalCount = equipmentList.filter((e) => e.status === 'critical').length;
    const maintenanceCount = equipmentList.filter((e) => e.status === 'maintenance').length;

    const rawAvailability = total > 0 
      ? ((healthyCount * 100 + warningCount * 88 + criticalCount * 45 + maintenanceCount * 50) / total) 
      : 96.5;
    const operationalAvailability = Number(rawAvailability.toFixed(1));

    const totalMTBF = equipmentList.reduce((acc, eq) => acc + eq.mtbfHours, 0);
    const plantMTBF = Math.round(totalMTBF / (total || 1));

    const totalMTTR = equipmentList.reduce((acc, eq) => acc + eq.mttrHours, 0);
    const plantMTTR = Number((totalMTTR / (total || 1)).toFixed(1));

    const totalDowntimeThisMonth = maintenanceRecords.reduce((acc, rec) => acc + (rec.downtimeHours || 0), 0);
    const totalMaintenanceCostYTD = maintenanceRecords.reduce((acc, rec) => acc + (rec.cost?.totalCost || 0), 0);

    const activeAlertsCount = alerts.filter((a) => !a.acknowledged).length;

    return {
      operationalAvailability,
      totalEquipment: total,
      healthyCount,
      warningCount,
      criticalCount,
      maintenanceCount,
      plantMTBF,
      plantMTTR,
      totalDowntimeThisMonth: Number(totalDowntimeThisMonth.toFixed(1)),
      totalMaintenanceCostYTD,
      activeAlertsCount,
    };
  }, [equipmentList, maintenanceRecords, alerts]);

  // Alert management
  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  const clearAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Fault Injection simulation
  const injectFault = (equipmentId: string, faultType: 'bearing_vibration' | 'thermal_runaway' | 'pressure_drop' | 'motor_overload') => {
    const timestamp = 'Just now';

    setEquipmentList((prev) =>
      prev.map((eq) => {
        if (eq.id !== equipmentId) return eq;

        const updatedTelemetry: EquipmentTelemetry = { ...eq.telemetry };
        let newAlertMsg = '';
        let errorCode = '';

        if (faultType === 'bearing_vibration' && updatedTelemetry.vibration) {
          const spiked = Number((updatedTelemetry.vibration.criticalThreshold * 1.15).toFixed(2));
          updatedTelemetry.vibration = {
            ...updatedTelemetry.vibration,
            value: spiked,
            history: [...updatedTelemetry.vibration.history.slice(1), { timestamp: 'Now', val: spiked }],
          };
          newAlertMsg = `Severe bearing vibration spike (${spiked} mm/s) on ${eq.name}! Immediate inspection required.`;
          errorCode = 'ERR-VIB-01';
        } else if (faultType === 'thermal_runaway' && updatedTelemetry.temperature) {
          const spiked = Number((updatedTelemetry.temperature.criticalThreshold * 1.1).toFixed(1));
          updatedTelemetry.temperature = {
            ...updatedTelemetry.temperature,
            value: spiked,
            history: [...updatedTelemetry.temperature.history.slice(1), { timestamp: 'Now', val: spiked }],
          };
          newAlertMsg = `Thermal runaway alert! Core temperature surged to ${spiked}°C on ${eq.name}.`;
          errorCode = 'ERR-TMP-03';
        } else if (faultType === 'pressure_drop' && updatedTelemetry.pressure) {
          const dropped = Number((updatedTelemetry.pressure.criticalThreshold * 0.75).toFixed(2));
          updatedTelemetry.pressure = {
            ...updatedTelemetry.pressure,
            value: dropped,
            history: [...updatedTelemetry.pressure.history.slice(1), { timestamp: 'Now', val: dropped }],
          };
          newAlertMsg = `System pressure collapse (${dropped} bar) on ${eq.name}! Burst line hazard.`;
          errorCode = 'ERR-PRS-04';
        } else if (faultType === 'motor_overload' && updatedTelemetry.motorLoad) {
          const spiked = Number((updatedTelemetry.motorLoad.criticalThreshold * 1.08).toFixed(1));
          updatedTelemetry.motorLoad = {
            ...updatedTelemetry.motorLoad,
            value: spiked,
            history: [...updatedTelemetry.motorLoad.history.slice(1), { timestamp: 'Now', val: spiked }],
          };
          newAlertMsg = `Motor current draw overload (${spiked} ${updatedTelemetry.motorLoad.unit}) on ${eq.name}!`;
          errorCode = 'ERR-MTR-01';
        }

        if (newAlertMsg) {
          const newAlert: AlertItem = {
            id: `ALT-${Date.now().toString().slice(-4)}`,
            equipmentId: eq.id,
            equipmentName: eq.name,
            severity: 'critical',
            code: errorCode,
            message: newAlertMsg,
            timestamp,
            acknowledged: false,
          };
          setAlerts((curr) => [newAlert, ...curr]);
        }

        return {
          ...eq,
          status: 'critical',
          healthScore: Math.floor(Math.random() * 20) + 25,
          telemetry: updatedTelemetry,
        };
      })
    );
  };

  const resetEquipmentToNominal = (equipmentId: string) => {
    const original = INITIAL_EQUIPMENT.find((e) => e.id === equipmentId);
    if (!original) return;

    setEquipmentList((prev) =>
      prev.map((eq) => (eq.id === equipmentId ? JSON.parse(JSON.stringify(original)) : eq))
    );
  };

  // Direct Add Equipment (Managers & Admin)
  const addEquipmentDirect = (data: Partial<Equipment>) => {
    const newId = `EQ-${(data.category || 'MCH').toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newTag = data.tag || `MCH-${Math.floor(100 + Math.random() * 900)}`;
    const fullEquipment: Equipment = {
      id: newId,
      name: data.name || 'New Industrial Machine',
      tag: newTag,
      category: data.category || 'Pump',
      location: data.location || 'Plant Floor — Zone 1',
      manufacturer: data.manufacturer || 'Industrial Equipment OEM',
      model: data.model || 'Model X-100',
      serialNumber: data.serialNumber || `SN-${Date.now().toString().slice(-6)}`,
      installationDate: data.installationDate || new Date().toISOString().slice(0, 10),
      healthScore: 100,
      status: 'healthy',
      operatingHours: data.operatingHours || 0,
      lastMaintenanceDate: new Date().toISOString().slice(0, 10),
      nextScheduledService: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      criticality: data.criticality || 'Medium',
      mtbfHours: data.mtbfHours || 950,
      mttrHours: data.mttrHours || 3.5,
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      workUpdates: [
        {
          id: `WU-${Date.now().toString().slice(-4)}`,
          equipmentId: newId,
          equipmentName: data.name || 'New Industrial Machine',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          technicianName: 'Plant Commissioning Team',
          technicianRole: 'Management Authorization',
          title: 'Asset Commissioned & Baseline Enrolled',
          description: 'Machinery installed and integrated into real-time health telemetry monitoring.',
          progressPercent: 100,
          status: 'Returned to Service',
        },
      ],
      telemetry: {
        vibration: {
          name: 'Main Axis Vibration',
          value: 1.4,
          unit: 'mm/s RMS',
          min: 0,
          max: 10,
          warningThreshold: 4.0,
          criticalThreshold: 6.5,
          history: [
            { timestamp: '10:00', val: 1.4 },
            { timestamp: '10:05', val: 1.4 },
          ],
        },
        temperature: {
          name: 'Core Housing Temp',
          value: 48.0,
          unit: '°C',
          min: 20,
          max: 110,
          warningThreshold: 75.0,
          criticalThreshold: 90.0,
          history: [
            { timestamp: '10:00', val: 47.5 },
            { timestamp: '10:05', val: 48.0 },
          ],
        },
      },
    };

    setEquipmentList((prev) => [fullEquipment, ...prev]);
    setSelectedEquipmentId(newId);
  };

  // Direct Delete Equipment (Managers & Admin)
  const deleteEquipmentDirect = (id: string) => {
    setEquipmentList((prev) => prev.filter((eq) => eq.id !== id));
    if (selectedEquipmentId === id) {
      const remaining = equipmentList.filter((eq) => eq.id !== id);
      if (remaining.length > 0) setSelectedEquipmentId(remaining[0].id);
    }
  };

  // Submit Request (Lower-level management)
  const submitEquipmentRequest = (req: Omit<EquipmentRequest, 'id' | 'requestDate' | 'status'>) => {
    const newReq: EquipmentRequest = {
      ...req,
      id: `REQ-EQ-${Math.floor(100 + Math.random() * 900)}`,
      requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Pending',
    };
    setEquipmentRequests((prev) => [newReq, ...prev]);

    const newAlert: AlertItem = {
      id: `ALT-REQ-${Date.now().toString().slice(-4)}`,
      equipmentId: req.equipmentId || 'SYSTEM',
      equipmentName: req.equipmentName,
      severity: 'warning',
      code: 'REQ-APPROVAL',
      message: `Equipment ${req.type.toUpperCase()} request submitted by ${req.requestedBy} (${req.requestedByRole}) — Pending Manager or Assistant Manager Approval.`,
      timestamp: 'Just now',
      acknowledged: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  // Approve Request (Managers & Admin)
  const approveEquipmentRequest = (requestId: string, reviewedBy: string, reviewNotes?: string) => {
    const target = equipmentRequests.find((r) => r.id === requestId);
    if (!target) return;

    if (target.type === 'add' && target.equipmentData) {
      addEquipmentDirect(target.equipmentData);
    } else if (target.type === 'delete' && target.equipmentId) {
      deleteEquipmentDirect(target.equipmentId);
    }

    setEquipmentRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Approved',
              reviewedBy,
              reviewDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
              reviewNotes: reviewNotes || 'Authorized and executed by Manager.',
            }
          : r
      )
    );
  };

  // Reject Request (Managers & Admin)
  const rejectEquipmentRequest = (requestId: string, reviewedBy: string, reviewNotes?: string) => {
    setEquipmentRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Rejected',
              reviewedBy,
              reviewDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
              reviewNotes: reviewNotes || 'Request rejected by Manager.',
            }
          : r
      )
    );
  };

  // Upload Equipment Picture
  const uploadEquipmentPicture = (equipmentId: string, imageUrl: string) => {
    setEquipmentList((prev) =>
      prev.map((eq) => (eq.id === equipmentId ? { ...eq, imageUrl } : eq))
    );
  };

  // Add Work Progress Update
  const addWorkProgressUpdate = (equipmentId: string, update: Omit<WorkProgressUpdate, 'id' | 'timestamp'>) => {
    const newUpdate: WorkProgressUpdate = {
      ...update,
      id: `WU-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setEquipmentList((prev) =>
      prev.map((eq) => {
        if (eq.id !== equipmentId) return eq;
        const currentUpdates = eq.workUpdates || [];
        return {
          ...eq,
          workUpdates: [newUpdate, ...currentUpdates],
        };
      })
    );
  };

  // Work order management
  const openCreateWorkOrder = (initialData?: Partial<MaintenanceRecord>) => {
    if (initialData) {
      setEditingWorkOrder(initialData as MaintenanceRecord);
    } else {
      setEditingWorkOrder(null);
    }
    setActiveWorkOrderModal(true);
  };

  const openEditWorkOrder = (record: MaintenanceRecord) => {
    setEditingWorkOrder(record);
    setActiveWorkOrderModal(true);
  };

  const closeWorkOrderModal = () => {
    setActiveWorkOrderModal(false);
    setEditingWorkOrder(null);
  };

  const saveWorkOrder = (data: Partial<MaintenanceRecord>) => {
    if (editingWorkOrder && editingWorkOrder.id) {
      setMaintenanceRecords((prev) =>
        prev.map((rec) =>
          rec.id === editingWorkOrder.id
            ? ({
                ...rec,
                ...data,
                cost: {
                  partsCost: data.cost?.partsCost ?? rec.cost.partsCost,
                  laborCost: data.cost?.laborCost ?? rec.cost.laborCost,
                  totalCost:
                    (data.cost?.partsCost ?? rec.cost.partsCost) +
                    (data.cost?.laborCost ?? rec.cost.laborCost),
                },
              } as MaintenanceRecord)
            : rec
        )
      );
    } else {
      const targetEq = equipmentList.find((e) => e.id === data.equipmentId) || equipmentList[0];
      const newId = `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      const partsCost = data.partsReplaced?.reduce((s, p) => s + p.quantity * p.unitCost, 0) || 0;
      const laborCost = data.cost?.laborCost || 250;

      const newRecord: MaintenanceRecord = {
        id: newId,
        equipmentId: targetEq.id,
        equipmentName: targetEq.name,
        title: data.title || 'Corrective Equipment Maintenance',
        type: data.type || 'Corrective',
        status: data.status || 'Scheduled',
        priority: data.priority || 'Medium',
        technician: data.technician || 'Marcus Vance (Lead Mechanical)',
        reportedDate: nowStr,
        scheduledDate: data.scheduledDate || nowStr,
        completedDate: data.status === 'Completed' ? nowStr : undefined,
        downtimeHours: data.downtimeHours || 2.0,
        cost: {
          partsCost,
          laborCost,
          totalCost: partsCost + laborCost,
        },
        partsReplaced: data.partsReplaced || [],
        rootCause: data.rootCause || 'Identified via telemetry diagnostics',
        troubleshootProcedure: data.troubleshootProcedure || '',
        actionTaken: data.actionTaken || '',
        notes: data.notes || '',
        signOffBy: data.signOffBy || 'Assigned Technician',
      };

      setMaintenanceRecords((prev) => [newRecord, ...prev]);
    }
    closeWorkOrderModal();
  };

  const deleteMaintenanceRecord = (id: string) => {
    setMaintenanceRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const updateMaintenanceStatus = (id: string, status: MaintenanceStatus) => {
    setMaintenanceRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        return {
          ...rec,
          status,
          completedDate: status === 'Completed' && !rec.completedDate ? nowStr : rec.completedDate,
        };
      })
    );
  };

  const startTroubleshootForEquipment = (equipmentId: string, faultCode?: string) => {
    setSelectedEquipmentId(equipmentId);
    if (faultCode) {
      setActiveDiagnosticFaultCode(faultCode);
    }
    setActiveTab('troubleshoot');
  };

  const openAddEquipmentModal = () => setAddEquipmentModalOpen(true);
  const closeAddEquipmentModal = () => setAddEquipmentModalOpen(false);

  const openWorkUpdateModal = (equipment: Equipment) => {
    setEquipmentForWorkUpdate(equipment);
    setWorkUpdateModalOpen(true);
  };
  const closeWorkUpdateModal = () => {
    setEquipmentForWorkUpdate(null);
    setWorkUpdateModalOpen(false);
  };

  const openEquipmentRequestModal = () => setEquipmentRequestModalOpen(true);
  const closeEquipmentRequestModal = () => setEquipmentRequestModalOpen(false);

  // Parameter Manual Input & Audit Modals
  const openManualInputModal = (equipment: Equipment, parameter?: HealthParameterItem) => {
    setTargetParamForInput({ equipment, parameter });
    setManualInputModalOpen(true);
  };
  const closeManualInputModal = () => {
    setTargetParamForInput(null);
    setManualInputModalOpen(false);
  };

  const openEditPhysicalStandardModal = (equipment: Equipment) => {
    setTargetEquipmentForPhysicalEdit(equipment);
    setEditPhysicalStandardModalOpen(true);
  };
  const closeEditPhysicalStandardModal = () => {
    setTargetEquipmentForPhysicalEdit(null);
    setEditPhysicalStandardModalOpen(false);
  };

  const openAuditModal = (equipmentId?: string, parameterId?: string) => {
    setAuditEquipmentId(equipmentId || null);
    setAuditParameterId(parameterId || null);
    setAuditModalOpen(true);
  };
  const closeAuditModal = () => {
    setAuditEquipmentId(null);
    setAuditParameterId(null);
    setAuditModalOpen(false);
  };

  // Record Manual Parameter Value (Available to ALL employees!)
  const recordParameterValue = (params: {
    equipmentId: string;
    parameterId: string;
    value: string;
    status: 'healthy' | 'warning' | 'critical';
    notes?: string;
    shift?: 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)' | 'General Shift';
  }): { success: boolean; error?: string } => {
    const targetEq = equipmentList.find((e) => e.id === params.equipmentId);
    if (!targetEq) return { success: false, error: 'Equipment not found.' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const employeeInfo = currentUser
      ? {
          id: currentUser.id,
          employeeId: currentUser.employeeId,
          name: currentUser.name,
          role: currentUser.role,
          designation: currentUser.designation,
          avatarUrl: currentUser.avatarUrl,
        }
      : {
          id: 'EMP-GEN',
          employeeId: 'GEN-001',
          name: 'Shift Technician',
          role: 'non_management' as const,
          designation: 'Field Inspection Technician',
        };

    const paramObj = targetEq.parameters?.find((p) => p.id === params.parameterId);
    const paramName = paramObj?.name || 'Health Parameter';

    const newLog: ParameterInputLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      parameterId: params.parameterId,
      parameterName: paramName,
      equipmentId: targetEq.id,
      equipmentName: targetEq.name,
      timestamp: nowStr,
      value: params.value,
      status: params.status,
      notes: params.notes,
      shift: params.shift || 'General Shift',
      inputBy: employeeInfo,
    };

    setParameterInputLogs((prev) => [newLog, ...prev]);

    // Automatically trigger alert if parameter reading is Warning or Critical
    if (params.status === 'critical' || params.status === 'warning') {
      const newAlert: AlertItem = {
        id: `ALT-PARAM-${Date.now().toString().slice(-4)}`,
        equipmentId: targetEq.id,
        equipmentName: targetEq.name,
        severity: params.status,
        code: params.status === 'critical' ? 'PARAM-CRIT' : 'PARAM-WARN',
        message: `Manual Reading Alert: ${paramName} logged as ${params.status.toUpperCase()} (${params.value}) by ${employeeInfo.name} [${params.shift || 'General Shift'}]${params.notes ? ` — ${params.notes}` : ''}`,
        timestamp: 'Just now',
        acknowledged: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }

    setEquipmentList((prev) =>
      prev.map((eq) => {
        if (eq.id !== params.equipmentId) return eq;
        const currentParams = eq.parameters || [];
        const updatedParams = currentParams.map((p) => {
          if (p.id !== params.parameterId) return p;
          return {
            ...p,
            currentValue: params.value,
            status: params.status,
            notes: params.notes,
            lastUpdated: nowStr,
            lastUpdatedBy: employeeInfo,
            inputLogs: [newLog, ...(p.inputLogs || [])],
          };
        });

        // Synchronize telemetry channels (voltage, current, temperature, vibration, pressure)
        const updatedTelemetry = synchronizeTelemetryFromParameters(eq.telemetry, updatedParams);

        // Derive overall health score & status directly from manual parameter observations
        const assessment = calculateEquipmentHealth(updatedParams);
        const newStatus = eq.status === 'maintenance' || eq.status === 'offline' ? eq.status : assessment.status;

        return {
          ...eq,
          healthScore: assessment.healthScore,
          status: newStatus,
          telemetry: updatedTelemetry,
          parameters: updatedParams,
        };
      })
    );

    return { success: true };
  };

  // Batch Record Parameters (Shift walk-down checklist for ALL employees)
  const batchRecordParameters = (
    equipmentId: string,
    updates: {
      parameterId: string;
      value: string;
      status: 'healthy' | 'warning' | 'critical';
      notes?: string;
    }[],
    shift?: 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)' | 'General Shift'
  ): { success: boolean; error?: string } => {
    const targetEq = equipmentList.find((e) => e.id === equipmentId);
    if (!targetEq) return { success: false, error: 'Equipment not found.' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const employeeInfo = currentUser
      ? {
          id: currentUser.id,
          employeeId: currentUser.employeeId,
          name: currentUser.name,
          role: currentUser.role,
          designation: currentUser.designation,
          avatarUrl: currentUser.avatarUrl,
        }
      : {
          id: 'EMP-GEN',
          employeeId: 'GEN-001',
          name: 'Shift Technician',
          role: 'non_management' as const,
          designation: 'Field Inspection Technician',
        };

    const newLogs: ParameterInputLog[] = updates.map((u, idx) => ({
      id: `LOG-${Date.now().toString().slice(-6)}-${idx}`,
      parameterId: u.parameterId,
      parameterName: targetEq.parameters?.find((p) => p.id === u.parameterId)?.name || 'Health Parameter',
      equipmentId: targetEq.id,
      equipmentName: targetEq.name,
      timestamp: nowStr,
      value: u.value,
      status: u.status,
      notes: u.notes,
      shift: shift || 'General Shift',
      inputBy: employeeInfo,
    }));

    setParameterInputLogs((prev) => [...newLogs, ...prev]);

    // Automatically trigger alerts for any parameters logged as Warning or Critical in the batch walk-down
    const batchAlerts: AlertItem[] = updates
      .filter((u) => u.status === 'critical' || u.status === 'warning')
      .map((u, i) => {
        const pObj = targetEq.parameters?.find((p) => p.id === u.parameterId);
        return {
          id: `ALT-BATCH-${Date.now().toString().slice(-4)}-${i}`,
          equipmentId: targetEq.id,
          equipmentName: targetEq.name,
          severity: u.status,
          code: u.status === 'critical' ? 'BATCH-CRIT' : 'BATCH-WARN',
          message: `Shift Checklist Alert: ${pObj?.name || 'Parameter'} logged as ${u.status.toUpperCase()} (${u.value}) by ${employeeInfo.name} [${shift || 'General Shift'}]${u.notes ? ` — ${u.notes}` : ''}`,
          timestamp: 'Just now',
          acknowledged: false,
        };
      });

    if (batchAlerts.length > 0) {
      setAlerts((prev) => [...batchAlerts, ...prev]);
    }

    const updateMap = new Map(updates.map((u, idx) => [u.parameterId, { ...u, log: newLogs[idx] }]));

    setEquipmentList((prev) =>
      prev.map((eq) => {
        if (eq.id !== equipmentId) return eq;
        const currentParams = eq.parameters || [];
        const updatedParams = currentParams.map((p) => {
          const u = updateMap.get(p.id);
          if (!u) return p;
          return {
            ...p,
            currentValue: u.value,
            status: u.status,
            notes: u.notes,
            lastUpdated: nowStr,
            lastUpdatedBy: employeeInfo,
            inputLogs: [u.log, ...(p.inputLogs || [])],
          };
        });

        // Synchronize telemetry channels (voltage, current, temperature, vibration, pressure)
        const updatedTelemetry = synchronizeTelemetryFromParameters(eq.telemetry, updatedParams);

        // Derive overall health score & status directly from manual parameter observations
        const assessment = calculateEquipmentHealth(updatedParams);
        const newStatus = eq.status === 'maintenance' || eq.status === 'offline' ? eq.status : assessment.status;

        return {
          ...eq,
          healthScore: assessment.healthScore,
          status: newStatus,
          telemetry: updatedTelemetry,
          parameters: updatedParams,
        };
      })
    );

    return { success: true };
  };

  // Update Physical & Standard Data (Strictly Restricted to Management Employees!)
  const updatePhysicalAndStandardData = (
    equipmentId: string,
    physicalUpdates: Partial<Equipment>,
    parameterUpdates?: HealthParameterItem[]
  ): { success: boolean; error?: string } => {
    if (!isManagementEmployee) {
      return {
        success: false,
        error: 'Unauthorized: Only Management Employees (Directors, Managers, and Supervisors) can edit physical equipment data and calibrate standard benchmark specifications.',
      };
    }

    const targetEq = equipmentList.find((e) => e.id === equipmentId);
    if (targetEq) {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const employeeInfo = currentUser
        ? {
            id: currentUser.id,
            employeeId: currentUser.employeeId,
            name: currentUser.name,
            role: currentUser.role,
            designation: currentUser.designation,
            avatarUrl: currentUser.avatarUrl,
          }
        : {
            id: 'EMP-MGT',
            employeeId: 'MGT-001',
            name: 'Plant Manager',
            role: 'manager' as const,
            designation: 'Reliability Manager',
          };

      const mgmtLog: ParameterInputLog = {
        id: `LOG-MGMT-${Date.now().toString().slice(-6)}`,
        parameterId: 'PHYSICAL-STANDARD-CALIBRATION',
        parameterName: 'Physical Specs & Standards',
        equipmentId: targetEq.id,
        equipmentName: targetEq.name,
        timestamp: nowStr,
        value: `${parameterUpdates?.length || targetEq.parameters?.length || 0} Targets Recalibrated`,
        status: 'healthy',
        notes: `Management calibration of physical data & standard benchmarks by ${employeeInfo.name} (${employeeInfo.designation}).`,
        shift: 'General Shift',
        inputBy: employeeInfo,
      };

      setParameterInputLogs((prev) => [mgmtLog, ...prev]);
    }

    setEquipmentList((prev) =>
      prev.map((eq) => {
        if (eq.id !== equipmentId) return eq;
        const updatedParams = parameterUpdates || eq.parameters || [];
        const updatedTelemetry = synchronizeTelemetryFromParameters(eq.telemetry, updatedParams);
        const assessment = calculateEquipmentHealth(updatedParams);
        const newStatus = eq.status === 'maintenance' || eq.status === 'offline' ? eq.status : assessment.status;

        return {
          ...eq,
          ...physicalUpdates,
          healthScore: assessment.healthScore,
          status: newStatus,
          telemetry: updatedTelemetry,
          parameters: updatedParams,
        };
      })
    );

    return { success: true };
  };

  const resetAllDataToDefaults = () => {
    setEquipmentList(INITIAL_EQUIPMENT);
    setEquipmentRequests(INITIAL_EQUIPMENT_REQUESTS as EquipmentRequest[]);
    setMaintenanceRecords(INITIAL_MAINTENANCE_RECORDS);
    setAlerts(INITIAL_ALERTS);
    setParameterInputLogs(INITIAL_PARAMETER_INPUT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.EQUIPMENT);
    localStorage.removeItem(STORAGE_KEYS.EQUIPMENT_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.PARAM_LOGS);
  };

  const exportRecordsToCSV = () => {
    const headers = [
      'Work Order ID',
      'Equipment ID',
      'Equipment Name',
      'Title',
      'Type',
      'Status',
      'Priority',
      'Technician',
      'Reported Date',
      'Scheduled Date',
      'Completed Date',
      'Downtime (Hours)',
      'Parts Cost ($)',
      'Labor Cost ($)',
      'Total Cost ($)',
      'Root Cause',
    ];

    const rows = maintenanceRecords.map((r) => [
      `"${r.id}"`,
      `"${r.equipmentId}"`,
      `"${r.equipmentName}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.type}"`,
      `"${r.status}"`,
      `"${r.priority}"`,
      `"${r.technician}"`,
      `"${r.reportedDate}"`,
      `"${r.scheduledDate}"`,
      `"${r.completedDate || ''}"`,
      r.downtimeHours,
      r.cost.partsCost,
      r.cost.laborCost,
      r.cost.totalCost,
      `"${(r.rootCause || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maintenance_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRecordsToJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(maintenanceRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Maintenance_Register_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <DashboardContext.Provider
      value={{
        equipmentList,
        equipmentRequests,
        maintenanceRecords,
        troubleshootingGuides,
        alerts,
        selectedEquipmentId,
        selectedEquipment,
        activeTab,
        searchQuery,
        activeDiagnosticFaultCode,
        activeWorkOrderModal,
        editingWorkOrder,
        addEquipmentModalOpen,
        workUpdateModalOpen,
        equipmentForWorkUpdate,
        equipmentRequestModalOpen,
        stats,
        setActiveTab,
        setSelectedEquipmentId,
        setSearchQuery,
        acknowledgeAlert,
        clearAlert,
        injectFault,
        resetEquipmentToNominal,
        openCreateWorkOrder,
        openEditWorkOrder,
        closeWorkOrderModal,
        saveWorkOrder,
        deleteMaintenanceRecord,
        updateMaintenanceStatus,
        startTroubleshootForEquipment,

        addEquipmentDirect,
        deleteEquipmentDirect,
        submitEquipmentRequest,
        approveEquipmentRequest,
        rejectEquipmentRequest,
        uploadEquipmentPicture,
        addWorkProgressUpdate,
        openAddEquipmentModal,
        closeAddEquipmentModal,
        openWorkUpdateModal,
        closeWorkUpdateModal,
        openEquipmentRequestModal,
        closeEquipmentRequestModal,

        // Parameter Manual Input & Management Data Editing
        parameterInputLogs,
        manualInputModalOpen,
        targetParamForInput,
        openManualInputModal,
        closeManualInputModal,
        recordParameterValue,
        batchRecordParameters,
        editPhysicalStandardModalOpen,
        targetEquipmentForPhysicalEdit,
        openEditPhysicalStandardModal,
        closeEditPhysicalStandardModal,
        updatePhysicalAndStandardData,
        auditModalOpen,
        auditEquipmentId,
        auditParameterId,
        openAuditModal,
        closeAuditModal,

        resetAllDataToDefaults,
        exportRecordsToCSV,
        exportRecordsToJSON,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
