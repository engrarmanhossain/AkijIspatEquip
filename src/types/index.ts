export type EquipmentCategory = 
  | 'VFD'
  | 'DC Drive'
  | 'DC Motor'
  | 'Induction Motor'
  | 'Transformer'
  | 'Mill Field Sensor'
  | 'PLC & Automation'
  | 'Pump' 
  | 'CNC' 
  | 'Compressor' 
  | 'Motor' 
  | 'Conveyor' 
  | 'Hydraulic';

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'maintenance' | 'offline';

export type MaintenanceType = 'Preventive' | 'Corrective' | 'Predictive' | 'Emergency Breakdown';

export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Pending Parts' | 'Completed' | 'Cancelled';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Emergency';

export type UserRole = 'admin' | 'manager' | 'management' | 'non_management';

export interface CompanySettings {
  companyName: string;
  plantCode: string;
  logoUrl?: string;
  tagline?: string;
  googleDriveFolderUrl?: string;
  googleSpreadsheetUrl?: string;
  googleAppsScriptUrl?: string;
  syncEnabled?: boolean;
}

export interface EmployeePermissions {
  canCreateWorkOrders: boolean;
  canApproveWorkOrders: boolean;
  canEditEquipmentBaseline: boolean;
  canManageEmployees: boolean;
  canExportReports: boolean;
  canSignOffMaintenance: boolean;
  canAddEquipmentDirectly: boolean;
  canDeleteEquipmentDirectly: boolean;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  designation: string;
  role: UserRole;
  department: string;
  phone: string;
  joinedDate: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  avatarUrl?: string;
  bio?: string;
  emergencyContact?: string;
  permissions: EmployeePermissions;
}

export interface WorkProgressUpdate {
  id: string;
  equipmentId: string;
  equipmentName: string;
  timestamp: string;
  technicianName: string;
  technicianRole: string;
  technicianAvatar?: string;
  title: string;
  description: string;
  progressPercent: number;
  status: 'In Progress' | 'Inspection Completed' | 'Parts Replaced' | 'Calibrated & Tested' | 'Returned to Service';
  photoUrl?: string;
}

export interface EquipmentRequest {
  id: string;
  type: 'add' | 'delete';
  equipmentId?: string;
  equipmentName: string;
  equipmentData?: Partial<Equipment>;
  requestedBy: string;
  requestedByEmail: string;
  requestedByRole: string;
  requestDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  reviewDate?: string;
  reviewNotes?: string;
}

export interface TelemetryPoint {
  timestamp: string;
  val: number;
}

export interface SensorParameter {
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  warningThreshold: number;
  criticalThreshold: number;
  history: TelemetryPoint[];
}

export interface EquipmentTelemetry {
  vibration: SensorParameter;
  temperature: SensorParameter;
  pressure?: SensorParameter;
  motorLoad?: SensorParameter;
  rpm?: SensorParameter;
  flowRate?: SensorParameter;
  oilLevel?: SensorParameter;
  toolWear?: SensorParameter;
}

export interface AlertItem {
  id: string;
  equipmentId: string;
  equipmentName: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  code: string;
  timestamp: string;
  acknowledged: boolean;
}

export type ParameterPriority = 'High Priority' | 'Less Priority';

export interface ParameterInputLog {
  id: string;
  parameterId: string;
  parameterName: string;
  equipmentId: string;
  equipmentName: string;
  timestamp: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
  notes?: string;
  shift?: 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)' | 'General Shift';
  inputBy: {
    id: string;
    employeeId: string;
    name: string;
    role: UserRole;
    designation: string;
    avatarUrl?: string;
  };
}

export interface HealthParameterItem {
  id: string;
  name: string;
  priority: ParameterPriority;
  benchmark: string; // Target / Benchmark standard specification (Standard Data - Editable only by Management)
  currentValue: string; // Current measured or observed value (Manual input by ALL employees)
  unit?: string;
  status: 'healthy' | 'warning' | 'critical';
  notes?: string;
  lastUpdated: string;
  lastUpdatedBy?: {
    id: string;
    employeeId: string;
    name: string;
    role: UserRole;
    designation: string;
    avatarUrl?: string;
  };
  inputLogs?: ParameterInputLog[];
}

export interface EquipmentPhysicalData {
  voltageRating?: string;
  powerRating?: string;
  ratedSpeed?: string;
  coolingType?: string;
  enclosureClass?: string;
  applicationArea?: string; // e.g. "Pinch Rolls, Flying Shears, Finishing Block"
  primaryDuty?: string;
  weightKg?: number;
  dimensions?: string;
  installationBay?: string;
  ratedCurrent?: string;
  controlProtocol?: string;
}

export interface Equipment {
  id: string;
  name: string;
  tag: string;
  category: EquipmentCategory;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  healthScore: number; // 0 - 100
  status: HealthStatus;
  operatingHours: number;
  lastMaintenanceDate: string;
  nextScheduledService: string;
  telemetry: EquipmentTelemetry;
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  mtbfHours: number;
  mttrHours: number;
  imageUrl?: string;
  workUpdates?: WorkProgressUpdate[];
  parameters?: HealthParameterItem[]; // Health parameter breakdown (High Priority & Less Priority)
  physicalData?: EquipmentPhysicalData; // Equipment physical specifications
}

export interface SparePart {
  partName: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  title: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: PriorityLevel;
  technician: string;
  reportedDate: string;
  scheduledDate: string;
  completedDate?: string;
  downtimeHours: number;
  cost: {
    partsCost: number;
    laborCost: number;
    totalCost: number;
  };
  partsReplaced: SparePart[];
  rootCause?: string;
  troubleshootProcedure?: string;
  actionTaken?: string;
  notes?: string;
  signOffBy?: string;
}

export interface DiagnosticStep {
  stepNumber: number;
  instruction: string;
  safetyWarning?: string;
  telemetryCheck?: string;
  checklistQuestion: string;
}

export interface TroubleshootingGuide {
  id: string;
  equipmentCategory: EquipmentCategory;
  faultCode: string;
  title: string;
  symptom: string;
  severity: 'critical' | 'warning' | 'info';
  possibleCauses: { cause: string; probability: number }[];
  diagnosticSteps: DiagnosticStep[];
  recommendedSolutions: {
    action: string;
    estimatedTime: string;
    requiredParts: string[];
    skillLevel: 'Operator' | 'Technician' | 'Specialist';
  }[];
  preventionTips: string[];
}

export interface ReliabilityStats {
  operationalAvailability: number;
  totalEquipment: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  maintenanceCount: number;
  plantMTBF: number;
  plantMTTR: number;
  totalDowntimeThisMonth: number;
  totalMaintenanceCostYTD: number;
  activeAlertsCount: number;
}
