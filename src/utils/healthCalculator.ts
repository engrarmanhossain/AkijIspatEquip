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
 * Context-aware numeric parser that prioritizes numbers associated with specific engineering units
 * e.g. "0.8% Phase Imbalance (U: 582A, V: 580A)" for Current -> 582 (not 0.8)
 * e.g. "100% clear optics; Air purge pressure 1.85 bar stable" for Pressure -> 1.85 (not 100)
 * e.g. "DE: 64°C, 2.3 mm/s RMS" for Temp -> 64; for Vibration -> 2.3
 */
export function extractNumericValue(
  text: string,
  unitHint?: 'voltage' | 'current' | 'temperature' | 'vibration' | 'pressure'
): number | null {
  if (!text) return null;

  if (unitHint === 'voltage') {
    const m = text.match(/(\d+(?:\.\d+)?)\s*(?:v\s*dc|v\s*ac|kv|v)\b/i);
    if (m) {
      const n = parseFloat(m[1]);
      if (!isNaN(n)) return n;
    }
  } else if (unitHint === 'current') {
    const m = text.match(/(\d+(?:\.\d+)?)\s*(?:amps?|ma|a)\b/i);
    if (m) {
      const n = parseFloat(m[1]);
      if (!isNaN(n)) return n;
    }
  } else if (unitHint === 'temperature') {
    const m = text.match(/(\d+(?:\.\d+)?)\s*(?:°c|deg\s*c|c)\b/i);
    if (m) {
      const n = parseFloat(m[1]);
      if (!isNaN(n)) return n;
    }
  } else if (unitHint === 'vibration') {
    const m = text.match(/(\d+(?:\.\d+)?)\s*(?:mm\/s|g-pk|mils)\b/i);
    if (m) {
      const n = parseFloat(m[1]);
      if (!isNaN(n)) return n;
    }
  } else if (unitHint === 'pressure') {
    const m = text.match(/(\d+(?:\.\d+)?)\s*(?:bar|mbar|psi|kpa)\b/i);
    if (m) {
      const n = parseFloat(m[1]);
      if (!isNaN(n)) return n;
    }
  }

  // If unitHint is provided, only accept standalone numeric match if the entire input is purely numeric
  const trimmed = text.trim();
  const rawNumMatch = trimmed.match(/^[-+]?\d+(?:\.\d+)?$/);
  if (rawNumMatch) {
    const num = parseFloat(rawNumMatch[0]);
    return isNaN(num) ? null : num;
  }

  // If no unitHint was provided, fallback to first standalone number
  if (!unitHint) {
    const match = text.match(/[-+]?\d*\.?\d+/);
    if (match) {
      const num = parseFloat(match[0]);
      return isNaN(num) ? null : num;
    }
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
    const lowerName = (param.name || '').toLowerCase();

    // 1. Voltage channel sync (target electrical voltage parameters)
    const isVoltageParam =
      param.id === 'vfd-p1' ||
      param.id === 'plc-p3' ||
      (/\b(voltage|supply voltage|bus voltage|line voltage)\b/i.test(lowerName) &&
        !lowerName.includes('vibration') &&
        !lowerName.includes('unbalance') &&
        !lowerName.includes('fan') &&
        !lowerName.includes('heater'));

    if (isVoltageParam && updated.voltage) {
      const val = extractNumericValue(param.currentValue, 'voltage');
      if (val !== null) {
        const history = [...(updated.voltage.history || []).slice(1), { timestamp: nowTime, val }];
        updated.voltage = { ...updated.voltage, value: val, history };
      }
    }

    // 2. Current channel sync (target main drive/motor load current parameters)
    const isCurrentParam =
      param.id === 'vfd-p3' ||
      param.id === 'dcdrv-p1' ||
      (/\b(current|phase current|load current|operating current|armature current|rack load current)\b/i.test(lowerName) &&
        !lowerName.includes('voltage') &&
        !lowerName.includes('fan') &&
        !lowerName.includes('heater') &&
        !lowerName.includes('unbalance'));

    if (isCurrentParam) {
      const val = extractNumericValue(param.currentValue, 'current');
      if (val !== null) {
        if (updated.current) {
          const history = [...(updated.current.history || []).slice(1), { timestamp: nowTime, val }];
          updated.current = { ...updated.current, value: val, history };
        }
        if (updated.motorLoad) {
          const history = [...(updated.motorLoad.history || []).slice(1), { timestamp: nowTime, val }];
          updated.motorLoad = { ...updated.motorLoad, value: val, history };
        }
      }
    }

    // 3. Temperature channel sync (target main bearing/winding/heatsink/oil temperatures)
    const isTempParam =
      param.id === 'vfd-p2' ||
      param.id === 'xfr-p1' ||
      param.id === 'pump-p2' ||
      param.id === 'comp-p1' ||
      param.id === 'cnc-p2' ||
      param.id === 'acmtr-p1' ||
      (/\b(temp|temperature|heatsink|oti|wti)\b/i.test(lowerName) &&
        !lowerName.includes('braking') &&
        !lowerName.includes('harmonic') &&
        !lowerName.includes('cooler') &&
        !lowerName.includes('resistor'));

    if (isTempParam && updated.temperature) {
      const val = extractNumericValue(param.currentValue, 'temperature');
      if (val !== null) {
        const history = [...(updated.temperature.history || []).slice(1), { timestamp: nowTime, val }];
        updated.temperature = { ...updated.temperature, value: val, history };
      }
    }

    // 4. Vibration channel sync (target mechanical vibration parameters)
    const isVibrationParam =
      param.id === 'pump-p1' ||
      param.id === 'cnc-p1' ||
      param.id === 'cvr-p1' ||
      param.id === 'mtr-p1' ||
      param.id === 'acmtr-p1' ||
      (/\b(vibration|rms vibration|bearing vibration)\b/i.test(lowerName) &&
        !lowerName.includes('voltage'));

    if (isVibrationParam && updated.vibration) {
      const val = extractNumericValue(param.currentValue, 'vibration');
      if (val !== null) {
        const history = [...(updated.vibration.history || []).slice(1), { timestamp: nowTime, val }];
        updated.vibration = { ...updated.vibration, value: val, history };
      }
    }

    // 5. Pressure channel sync (target hydraulic/discharge/network air pressure)
    const isPressureParam =
      param.id === 'pump-p3' ||
      param.id === 'hyd-p1' ||
      param.id === 'sns-p1' ||
      (/\b(pressure|ram clamping|fluid pressure|discharge pressure)\b/i.test(lowerName) &&
        !lowerName.includes('diff'));

    if (isPressureParam && updated.pressure) {
      const val = extractNumericValue(param.currentValue, 'pressure');
      if (val !== null) {
        const history = [...(updated.pressure.history || []).slice(1), { timestamp: nowTime, val }];
        updated.pressure = { ...updated.pressure, value: val, history };
      }
    }
  });

  return updated;
}
