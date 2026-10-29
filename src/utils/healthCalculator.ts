import type { HealthParameterItem, EquipmentTelemetry, Equipment } from '../types';

export interface CalculatedSubsystems {
  electrical: { score: number; label: string; details: string };
  thermal: { score: number; label: string; details: string };
  mechanical: { score: number; label: string; details: string };
  process: { score: number; label: string; details: string };
}

export interface EquipmentHealthAssessment {
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  subsystems: CalculatedSubsystems;
  criticalIssues: string[];
  warningIssues: string[];
}

/**
 * Parses numeric value from a manual parameter string
 * e.g. "615V DC, Ripple 2.1V" -> 615
 * e.g. "58.2°C" -> 58.2
 * e.g. "Armature 1640A" -> 1640
 * e.g. "2.3 mm/s RMS" -> 2.3
 */
export function extractNumericValue(text: string): number | null {
  if (!text) return null;
  // Look for first integer or floating point number
  const match = text.match(/[-+]?\d*\.?\d+/);
  if (match) {
    const num = parseFloat(match[0]);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Calculates overall Equipment Health Score, Status, and Subsystem breakdown
 * directly from the manual parameter entries!
 */
export function calculateEquipmentHealth(parameters?: HealthParameterItem[]): EquipmentHealthAssessment {
  if (!parameters || parameters.length === 0) {
    return {
      healthScore: 100,
      status: 'healthy',
      subsystems: {
        electrical: { score: 98, label: 'Electrical & Power', details: 'All Nominal' },
        thermal: { score: 98, label: 'Thermal Equilibrium', details: 'Normal Range' },
        mechanical: { score: 96, label: 'Mechanical & Dynamic', details: 'Smooth Running' },
        process: { score: 95, label: 'Process & Controls', details: 'In Spec' },
      },
      criticalIssues: [],
      warningIssues: [],
    };
  }

  let totalPenalty = 0;
  const criticalIssues: string[] = [];
  const warningIssues: string[] = [];

  // Categorize parameters for subsystem analysis
  const electricalParams: HealthParameterItem[] = [];
  const thermalParams: HealthParameterItem[] = [];
  const mechanicalParams: HealthParameterItem[] = [];
  const processParams: HealthParameterItem[] = [];

  parameters.forEach((param) => {
    const lowerName = param.name.toLowerCase();
    const lowerUnit = (param.unit || '').toLowerCase();
    const isHighPriority = param.priority === 'High Priority';

    // Scoring impact
    if (param.status === 'critical') {
      totalPenalty += isHighPriority ? 35 : 16;
      criticalIssues.push(`${param.name} (${param.currentValue})`);
    } else if (param.status === 'warning') {
      totalPenalty += isHighPriority ? 18 : 8;
      warningIssues.push(`${param.name} (${param.currentValue})`);
    }

    // Subsystem classification
    if (
      lowerName.includes('voltage') ||
      lowerName.includes('current') ||
      lowerName.includes('bus') ||
      lowerName.includes('scr') ||
      lowerName.includes('firing') ||
      lowerName.includes('power') ||
      lowerName.includes('supply') ||
      lowerName.includes('insulation') ||
      lowerName.includes('ir') ||
      lowerName.includes('ups') ||
      lowerName.includes('phase') ||
      lowerName.includes('snubber') ||
      lowerUnit.includes('v') ||
      lowerUnit.includes('a') ||
      lowerUnit.includes('mω')
    ) {
      electricalParams.push(param);
    } else if (
      lowerName.includes('temp') ||
      lowerName.includes('thermal') ||
      lowerName.includes('heatsink') ||
      lowerName.includes('oti') ||
      lowerName.includes('wti') ||
      lowerName.includes('overheat') ||
      lowerUnit.includes('°c')
    ) {
      thermalParams.push(param);
    } else if (
      lowerName.includes('vibration') ||
      lowerName.includes('bearing') ||
      lowerName.includes('brush') ||
      lowerName.includes('sparking') ||
      lowerName.includes('commutator') ||
      lowerName.includes('runout') ||
      lowerName.includes('fan') ||
      lowerName.includes('rpm') ||
      lowerName.includes('speed') ||
      lowerName.includes('coupling') ||
      lowerName.includes('alignment') ||
      lowerName.includes('concentricity') ||
      lowerUnit.includes('mm/s') ||
      lowerUnit.includes('rpm')
    ) {
      mechanicalParams.push(param);
    } else {
      processParams.push(param);
    }
  });

  // Calculate overall health score (bounded 10 to 100)
  const healthScore = Math.max(10, Math.min(100, Math.round(100 - totalPenalty)));

  // Status is strictly dictated by manual observations
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (criticalIssues.length > 0 || healthScore < 55) {
    status = 'critical';
  } else if (warningIssues.length > 0 || healthScore < 80) {
    status = 'warning';
  }

  // Calculate Subsystem Health Scores
  const calcSubscore = (params: HealthParameterItem[], defaultScore = 95) => {
    if (params.length === 0) return { score: defaultScore, details: 'Standard Benchmarks' };
    let penalty = 0;
    const badParams: string[] = [];
    params.forEach((p) => {
      if (p.status === 'critical') {
        penalty += 35;
        badParams.push(p.name);
      } else if (p.status === 'warning') {
        penalty += 18;
        badParams.push(p.name);
      }
    });
    const score = Math.max(15, Math.min(100, 100 - penalty));
    const details = badParams.length > 0 ? `${badParams.length} Alert(s)` : 'All Nominal';
    return { score, details };
  };

  const electrical = calcSubscore(electricalParams, 96);
  const thermal = calcSubscore(thermalParams, 95);
  const mechanical = calcSubscore(mechanicalParams, 94);
  const process = calcSubscore(processParams, 92);

  return {
    healthScore,
    status,
    subsystems: {
      electrical: { score: electrical.score, label: 'Electrical & Power', details: electrical.details },
      thermal: { score: thermal.score, label: 'Thermal Equilibrium', details: thermal.details },
      mechanical: { score: mechanical.score, label: 'Mechanical & Dynamics', details: mechanical.details },
      process: { score: process.score, label: 'Process & Hydraulics', details: process.details },
    },
    criticalIssues,
    warningIssues,
  };
}

/**
 * Synchronizes equipment telemetry channels (voltage, current, temperature, vibration, pressure)
 * with the manual parameter readings.
 */
export function synchronizeTelemetryFromParameters(
  telemetry: EquipmentTelemetry,
  parameters: HealthParameterItem[]
): EquipmentTelemetry {
  const updated: EquipmentTelemetry = { ...telemetry };
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  parameters.forEach((param) => {
    const val = extractNumericValue(param.currentValue);
    if (val === null) return;

    const lowerName = param.name.toLowerCase();
    const lowerUnit = (param.unit || '').toLowerCase();

    // Voltage sync
    if (
      (lowerName.includes('voltage') || lowerName.includes('bus') || lowerUnit.includes('v')) &&
      !lowerName.includes('vibration') &&
      !lowerUnit.includes('mm/s') &&
      updated.voltage
    ) {
      const history = [...(updated.voltage.history || []).slice(1), { timestamp: nowTime, val }];
      updated.voltage = { ...updated.voltage, value: val, history };
    }

    // Current sync
    if (
      (lowerName.includes('current') || lowerUnit.includes('a') || lowerUnit.includes('amp')) &&
      !lowerName.includes('voltage')
    ) {
      if (updated.current) {
        const history = [...(updated.current.history || []).slice(1), { timestamp: nowTime, val }];
        updated.current = { ...updated.current, value: val, history };
      }
      if (updated.motorLoad && !updated.current) {
        const history = [...(updated.motorLoad.history || []).slice(1), { timestamp: nowTime, val }];
        updated.motorLoad = { ...updated.motorLoad, value: val, history };
      }
    }

    // Temperature sync
    if (
      (lowerName.includes('temp') || lowerName.includes('oti') || lowerName.includes('wti') || lowerUnit.includes('°c')) &&
      updated.temperature
    ) {
      const history = [...(updated.temperature.history || []).slice(1), { timestamp: nowTime, val }];
      updated.temperature = { ...updated.temperature, value: val, history };
    }

    // Vibration sync
    if (
      (lowerName.includes('vibration') || lowerUnit.includes('mm/s')) &&
      updated.vibration
    ) {
      const history = [...(updated.vibration.history || []).slice(1), { timestamp: nowTime, val }];
      updated.vibration = { ...updated.vibration, value: val, history };
    }

    // Pressure sync
    if (
      (lowerName.includes('pressure') || lowerUnit.includes('bar') || lowerUnit.includes('pa')) &&
      updated.pressure
    ) {
      const history = [...(updated.pressure.history || []).slice(1), { timestamp: nowTime, val }];
      updated.pressure = { ...updated.pressure, value: val, history };
    }
  });

  return updated;
}
