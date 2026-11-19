export type RegionName = 'GYE-SALINAS-MILAGRO' | 'COSTA' | 'UIO-IBARRA' | 'SIERRA-PUYO';

export type FacilityType = 'PLANTA' | 'PLANTA + AGENCIA' | 'AGENCIA' | 'BODEGA' | 'EDIFICIO CORPORATIVO';

export type SecurityCompany = 'LIDERMAN' | 'CAJAMARCA' | '593 SECURITY' | 'HUDSON SECURITY';

export interface ExactLocation {
  la: number;
  lo: number;
  dms: string;
}

export interface AgencyData {
  a: string;
  loc: string;
  n: number;
  c: number[]; // categories (21)
  s: number[]; // status [en proceso, cerrada, comunicado]
  dc?: number; // decomisos
  bl?: [number, number]; // blindados [ingreso, no ingreso]
  sp?: [number, number]; // supervision [si, no]
  cm?: [number, number]; // camaras [operativas, sin operar]
  vl?: [number, number]; // validaciones [cur, prev]
  rv?: number; // revisiones
  region?: RegionName;
}

export interface WeatherData {
  temp: number;
  icon: string;
  desc: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
}

export interface IncidentRecord {
  id: string;
  a: string; // agency name
  t: number; // category index
  e: number; // status (0: En proceso, 1: Cerrada, 2: Comunicado)
  d: string; // date YYYY-MM-DD
  x?: string; // detail
  region?: string;
  author?: string;
  source?: 'manual' | 'excel' | 'base';
}

export interface AuditReport {
  id: string;
  a: string;
  d: string | null;
  at?: string;
  g?: string;
  name?: string;
}

export interface ValidationYearData {
  tot: number;
  nd: number;
  m: number[];
  tipo: number[];
  ag: Record<string, number>;
  multi: Record<string, number>;
  none: number;
  al: number;
}

export interface ValidationSummary {
  cur: string;
  prev: string;
  p25: number;
  asof: string | null;
  at?: string;
  y: Record<string, ValidationYearData>;
}

export interface BlockedPersonnel {
  at?: string;
  bloq: number;
  desb: number;
  mot: [string, number][];
  emp: [string, number][];
  yr: [number, number][];
}

export interface CameraOverview {
  at?: string;
  date?: string;
  t?: string;
  op: number;
  no: number;
  d: string;
  sites: Record<string, [number, number]>;
}

export interface MonthlyTrendsData {
  dc: { m: string; t: number }[];
  bl: { m: string; pct: number }[];
  sp: { m: string; pct: number }[];
  cam: { m: string; no: number; pct: number; n: number; cams: number }[];
}

export interface NovShiftEntry {
  d: string;
  t: string;
  at?: string;
  ag: Record<string, number[]>; // [total, cat0..cat5, st0..st2]
}

export interface FeedState {
  nov: Record<string, NovShiftEntry>;
  sp?: {
    at: string;
    ag: Record<string, [number, number]>;
    nat: { m: string; pct: number }[];
  };
  bl?: {
    at: string;
    ag: Record<string, [number, number]>;
    nat: { m: string; pct: number }[];
  };
  dc?: {
    at: string;
    ag: Record<string, number>;
    nat: { m: string; t: number }[];
  };
  bq?: BlockedPersonnel;
  cam?: {
    at: string;
    date: string;
    t: string;
    op: number;
    no: number;
    sites: Record<string, [number, number]>;
  };
  camm?: {
    at: string;
    months: Record<string, { no: number; pct: number; n: number; cams: number }>;
  };
  vl?: ValidationSummary;
  rev: Record<string, { a: string; d: string | null; at: string; g?: string }>;
}

export interface UploadLogItem {
  status: 'ok' | 'warn' | 'error';
  fileName: string;
  category: string;
  summary: string;
}

export interface PendingUploadBatch {
  novShifts: Record<string, NovShiftEntry>;
  extractedIncidents: IncidentRecord[];
  cam?: {
    key: string;
    date: string;
    t: string;
    op: number;
    no: number;
    sites: Record<string, [number, number]>;
  };
  camMonths: Record<string, { no: number; pct: number; n: number; cams: number }>;
  sp?: {
    ag: Record<string, [number, number]>;
    nat: { m: string; pct: number }[];
  };
  bl?: {
    ag: Record<string, [number, number]>;
    nat: { m: string; pct: number }[];
  };
  dc?: {
    ag: Record<string, number>;
    nat: { m: string; t: number }[];
  };
  bq?: BlockedPersonnel;
  vl?: ValidationSummary;
  rev: { name: string; id: string; site: string | null; date: string | null }[];
  logs: UploadLogItem[];
  skippedRows: number;
  duplicateCount?: number;
  unreadRowsCount?: number;
  unreadSamples?: { sheet: string; row: number; reason: string; sample: string }[];
}

export interface UploadHistoryRecord {
  id: string;
  timestamp: string;
  filesCount: number;
  fileNames: string[];
  indicatorsUpdated: string[];
  summary: string;
}
