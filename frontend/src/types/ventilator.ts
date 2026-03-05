export type VentilatorMode = 'VCV' | 'PCV';

export interface VentilatorParams {
  mode: VentilatorMode;
  vt_ml: number;       // Volume Corrente em mL
  fr: number;          // Frequência Respiratória em irpm
  flow_l_min: number;  // Fluxo Inspiratório em L/min (VCV)
  peep: number;        // PEEP em cmH2O
  p_insp: number;      // Pressão Inspiratória acima da PEEP em cmH2O (PCV)
  t_insp: number;      // Tempo Inspiratório em segundos
  fio2: number;        // FiO2 em % (21–100)
}

export interface PatientMechanics {
  c_stat: number;  // Complacência Estática em mL/cmH2O
  r_aw: number;    // Resistência de Vias Aéreas em cmH2O/L/s
  p_mus: number;   // Esforço Muscular do Paciente em cmH2O (0 = sedado)
}

export interface SimPoint {
  t_ms: number;    // Tempo em milissegundos
  pressure: number; // cmH2O
  volume: number;   // mL
  flow: number;     // L/s
}

export type AlertLevel = 'green' | 'yellow' | 'red';

export interface AlertItem {
  level: AlertLevel;
  message: string;
  parameter: string;
  value: number;
  threshold: number;
}

export interface DerivedMetrics {
  p_pico: number;
  p_plat: number;
  driving_pressure: number;
  tau: number;
  ie_ratio: string;
  vol_minuto: number;
  vt_achieved?: number; // Para PCV
}

export interface ClinicalScenario {
  id: string;
  name: string;
  description: string;
  condition: 'normal' | 'sdra' | 'dpoc';
  mechanics: PatientMechanics;
  defaultParams: Partial<VentilatorParams>;
  expectedBehavior: string;
}
