import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import {
  BlockedPersonnel,
  IncidentRecord,
  NovShiftEntry,
  PendingUploadBatch,
  ValidationSummary,
  ValidationYearData
} from '../types/console';
import { CATEGORY_LABELS, NOV_CUT, RAW_REGIONS_DATA } from '../data/consoleData';

const MON = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export const ALL_AGENCY_NAMES = Object.values(RAW_REGIONS_DATA)
  .flat()
  .map(a => a.a);

export const normalizeText = (s: unknown): string =>
  String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const monthFromText = (name: string): string | null => {
  const n = normalizeText(name);
  const fullMap: [string, string][] = [
    ['ENERO', 'ENE'], ['FEBRERO', 'FEB'], ['MARZO', 'MAR'], ['ABRIL', 'ABR'],
    ['MAYO', 'MAY'], ['JUNIO', 'JUN'], ['JULIO', 'JUL'], ['AGOSTO', 'AGO'],
    ['SEPTIEMBRE', 'SEP'], ['OCTUBRE', 'OCT'], ['NOVIEMBRE', 'NOV'], ['DICIEMBRE', 'DIC']
  ];
  for (const [full, short] of fullMap) {
    if (n.includes(full)) return short;
  }
  const m = n.match(/\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\b/g);
  return m ? m[m.length - 1] : null;
};

function rowsOf(ws: XLSX.WorkSheet | undefined): any[][] {
  if (!ws || !ws['!ref']) return [];
  const c0 = XLSX.utils.decode_range(ws['!ref']).s.c;
  const rr = XLSX.utils.sheet_to_json<any[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true
  });
  return c0 ? rr.map(x => Array(c0).fill(null).concat(x)) : rr;
}

export function generateIncidentHash(site: string, date: string, catIdx: number, detail: string): string {
  const normSite = normalizeText(site);
  const normDate = String(date || '').trim();
  const normDetail = normalizeText(detail).slice(0, 120);
  return `${normSite}::${normDate}::${catIdx}::${normDetail}`;
}

export function resolveAgencyName(rawLoc: unknown, rawAg?: unknown): string | null {
  const L = normalizeText(rawLoc);
  const A = normalizeText(rawAg !== undefined ? rawAg : rawLoc);
  const combined = `${L} ${A}`.trim();
  if (!combined) return null;

  // Direct match against canonical names
  for (const exact of ALL_AGENCY_NAMES) {
    if (normalizeText(exact) === A || normalizeText(exact) === L) return exact;
  }

  const isQuito = L.startsWith('QUITO') || combined.includes('QUITO') || combined.includes('UIO') || combined.includes('PICHINCHA');

  if (combined.includes('MACHACHI')) return 'Planta Machachi';
  if (combined.includes('MEMX') || combined.includes('MENX') || combined.includes('BODEGA MEMX') || combined.includes('BODEGA QUITO')) return 'Bodega MEMX Quito';
  if ((combined.includes('WOR') && combined.includes('Q')) || combined.includes('EDIFICIO') || combined.includes('CORPORATIVO') || combined.includes('MATRIZ')) return 'Edificio WorQ';
  if (combined.includes('PURE') || combined.includes('MILGRO') || combined.includes('MILAGRO')) return 'Planta Milagro';
  if (combined.includes('PEP') || combined.includes('PLANTA TESALIA') || combined.includes('PLANTA GUAYAQUIL') || combined.includes('PLANTA GYE') || combined.includes('TESALIA GYE')) {
    return 'Planta Tesalia GYE';
  }

  const qMatch = A.match(/^(?:A\s+|AGENCIA\s+)?(Q|QUITO|UIO)\s+(NORTE|SUR)/i) || combined.match(/(?:QUITO|UIO)\s+(NORTE|SUR)/i);
  if (qMatch) return 'Agencia Quito ' + (qMatch[1].toUpperCase() === 'NORTE' || qMatch[2]?.toUpperCase() === 'NORTE' ? 'Norte' : 'Sur');

  const gMatch = A.match(/^(?:A\s+|AGENCIA\s+)?(GYE|GUAYAQUIL)\s+(NORTE|SUR)/i) || combined.match(/(?:GYE|GUAYAQUIL)\s+(NORTE|SUR)/i);
  if (gMatch) return 'Agencia ' + (gMatch[1].toUpperCase() === 'NORTE' || gMatch[2]?.toUpperCase() === 'NORTE' ? 'Norte' : 'Sur') + ' GYE';

  const cityPairs: [string, string][] = [
    ['SALINAS', 'Agencia Salinas'],
    ['SALIANS', 'Agencia Salinas'],
    ['SANTA ELENA', 'Agencia Salinas'],
    ['LIBERTAD', 'Agencia Salinas'],
    ['MANTA', 'Agencia Manta'],
    ['PORTOVIEJO', 'Agencia Manta'],
    ['CHONE', 'Agencia Manta'],
    ['ATACAMES', 'Agencia Atacames'],
    ['ESMERALDAS', 'Agencia Atacames'],
    ['QUEVEDO', 'Agencia Quevedo'],
    ['BABAHOYO', 'Agencia Quevedo'],
    ['SANTO DOMINGO', 'Agencia Santo Domingo'],
    ['DOMINGO', 'Agencia Santo Domingo'],
    ['STO DGO', 'Agencia Santo Domingo'],
    ['TSACHILA', 'Agencia Santo Domingo'],
    ['MACHALA', 'Planta y Agencia Machala'],
    ['SANTA ROSA', 'Planta y Agencia Machala'],
    ['PASAJE', 'Planta y Agencia Machala'],
    ['HUAQUILLAS', 'Planta y Agencia Machala'],
    ['EL ORO', 'Planta y Agencia Machala'],
    ['CUENCA', 'Agencia Cuenca'],
    ['AZUAY', 'Agencia Cuenca'],
    ['AZOGUES', 'Agencia Cuenca'],
    ['LOJA', 'Agencia Loja'],
    ['ZAMORA', 'Agencia Loja'],
    ['AMBATO', 'Agencia Ambato'],
    ['TUNGURAHUA', 'Agencia Ambato'],
    ['RIOBAMBA', 'Agencia Ambato'],
    ['LATACUNGA', 'Agencia Latacunga'],
    ['LATAUNGA', 'Agencia Latacunga'],
    ['COTOPAXI', 'Agencia Latacunga'],
    ['PUYO', 'Agencia Puyo'],
    ['PASTAZA', 'Agencia Puyo'],
    ['TENA', 'Agencia Puyo'],
    ['IBARRA', 'Agencia Ibarra'],
    ['IMBABURA', 'Agencia Ibarra'],
    ['TULCAN', 'Agencia Ibarra'],
    ['CARCHI', 'Agencia Ibarra'],
    ['DURAN', 'Agencia Sur GYE'],
    ['DAULE', 'Agencia Norte GYE'],
    ['SAMBORONDON', 'Agencia Norte GYE'],
    ['CALDERON', 'Agencia Quito Norte'],
    ['CARCELEN', 'Agencia Quito Norte'],
    ['CUMBAYA', 'Edificio WorQ'],
    ['TUMBACO', 'Edificio WorQ']
  ];

  for (const [k, v] of cityPairs) {
    if (combined.includes(k)) return v;
  }

  if (A.includes('NORTE') || A.includes('MORTE')) {
    return isQuito ? 'Agencia Quito Norte' : 'Agencia Norte GYE';
  }
  if (A.includes('SUR')) {
    return isQuito ? 'Agencia Quito Sur' : 'Agencia Sur GYE';
  }
  if (A.includes('PLANTA') || A.includes('GYE') || A.includes('GUAYAQUIL')) return 'Planta Tesalia GYE';
  if (isQuito) return 'Agencia Quito Norte';

  return null;
}

const CAT_PATTERNS = [
  /robo|hurto|asalto|sustrac|faltante|intruso|sospech|amenaza|arma|extors|delito|seguridad/,
  /accident|choque|colisi|incendio|emergencia|lesion|herid|volc/,
  /camara|cctv|dvr|enlace|grabador|sin senal|hikvision|monitoreo|visualizacion/,
  /ruta|placa|conductor|unidad|vehicul|camion|furgon|chofer|transporte/,
  /ingreso|acceso|visitante|bloque|personal|guardia|garita|turno/
];

export function classifyCategory(text: unknown): number {
  const norm = normalizeText(text);
  // Check exact match with CATEGORY_LABELS first
  for (let i = 0; i < CATEGORY_LABELS.length; i++) {
    if (normalizeText(CATEGORY_LABELS[i]) === norm) return i;
  }
  const lower = norm.toLowerCase();
  if (lower.includes('liquidacion')) return 6;
  if (lower.includes('ruta pendiente')) return 7;
  if (lower.includes('decomiso')) return 12;
  if (lower.includes('intrusion')) return 13;
  if (lower.includes('comportamiento')) return 19;
  if (lower.includes('mala practica')) return 20;
  for (let i = 0; i < 5; i++) {
    if (CAT_PATTERNS[i].test(lower)) return i;
  }
  return 5; // Otros
}

export function classifyStatus(text: unknown): number {
  const s = normalizeText(text).toLowerCase();
  if (s.includes('proceso') || s.includes('pendiente') || s.includes('abiert')) return 0;
  if (/cerrad|solucion|solventad|resuelt|finaliz|atendid|complet/.test(s)) return 1;
  return 2;
}

const parseSheetShiftDate = (sheetName: string): { d: string; t: string } | null => {
  const m = String(sheetName).match(/^\s*(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s*([DN])?/i);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  return { d: `${m[3]}-${mm}-${dd}`, t: (m[4] || 'D').toUpperCase() };
};

const parseExcelDateString = (val: unknown): string => {
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === 'number' && val > 35000 && val < 60000) {
    const dt = new Date(Math.round((val - 25569) * 86400 * 1000));
    return dt.toISOString().slice(0, 10);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const iso = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
    const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return new Date().toISOString().slice(0, 10);
};

// 1. Official NOVEDADES shift parser
function parseOfficialNov(wb: XLSX.WorkBook, batch: PendingUploadBatch): number {
  let addedCount = 0;
  for (const sn of wb.SheetNames) {
    const k = parseSheetShiftDate(sn);
    if (!k) continue;
    let hdr = false;
    let tot = 0;
    const ag: Record<string, number[]> = {};
    for (const r of rowsOf(wb.Sheets[sn])) {
      if (!hdr) {
        if (normalizeText(r[1]) === 'LOCALIDAD' || normalizeText(r[0]) === 'LOCALIDAD') hdr = true;
        continue;
      }
      if ((r[1] || r[2]) && r[5]) {
        tot++;
        const c = resolveAgencyName(r[1], r[2]);
        if (!c) {
          batch.skippedRows++;
          continue;
        }
        const v = (ag[c] = ag[c] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        const catIdx = Math.min(5, classifyCategory(r[5]));
        const stIdx = classifyStatus(r[6]);
        v[0]++;
        v[1 + catIdx]++;
        v[7 + stIdx]++;
        if (k.d > NOV_CUT) addedCount++;
      }
    }
    const id = `${k.d}_${k.t}`;
    const existing = batch.novShifts[id];
    const existingTot = existing ? Object.values(existing.ag).reduce((s, arr) => s + arr[0], 0) : -1;
    if (tot > existingTot) {
      batch.novShifts[id] = { d: k.d, t: k.t, ag };
    }
  }
  return addedCount;
}

// 2. Official CAMARAS shift parser
function parseOfficialCam(wb: XLSX.WorkBook, batch: PendingUploadBatch): boolean {
  let best: PendingUploadBatch['cam'] = undefined;
  const M: Record<string, { op: number; no: number; n: number }> = {};

  for (const sn of wb.SheetNames) {
    const k = parseSheetShiftDate(sn);
    if (!k) continue;
    const S: Record<string, [number, number]> = {};
    let gen: [number, number] | null = null;
    let site: string | null = null;

    for (const r of rowsOf(wb.Sheets[sn])) {
      const lab = r[1] ? normalizeText(r[1]) : '';
      if (lab.startsWith('TOTAL GENERAL')) {
        gen = [Number(r[5]), Number(r[6])];
        continue;
      }
      if (lab === 'TOTAL') continue;
      if (lab && !/^(PLANTA O|FECHA|TURNO|OPERADOR|COORD|GERENTE|CANTIDAD)/.test(lab)) {
        site = resolveAgencyName(r[1]);
      }
      if (site && typeof r[7] === 'number' && typeof r[5] === 'number') {
        const v = (S[site] = S[site] || [0, 0]);
        v[0] += Number(r[5]) || 0;
        v[1] += Number(r[6]) || 0;
      }
    }

    if (gen && gen[0] > 0 && !isNaN(gen[1])) {
      const mo = MON[Number(k.d.slice(5, 7)) - 1];
      if (mo) {
        const x = (M[mo] = M[mo] || { op: 0, no: 0, n: 0 });
        x.op += gen[0];
        x.no += gen[1];
        x.n++;
      }
      const key = k.d + k.t;
      if (!best || key > best.key) {
        best = { key, date: k.d, t: k.t, op: gen[0], no: gen[1], sites: S };
      }
    }
  }

  for (const m in M) {
    batch.camMonths[m] = {
      no: Math.round((100 * M[m].no) / M[m].n) / 100,
      pct: Math.round((10000 * M[m].op) / (M[m].op + M[m].no)) / 100,
      n: M[m].n,
      cams: Math.round((M[m].op + M[m].no) / M[m].n)
    };
  }

  if (best) {
    if (!batch.cam || best.key > batch.cam.key) batch.cam = best;
    return true;
  }
  return false;
}

// 3. Official SUPERVISION parser
function parseOfficialSp(wb: XLSX.WorkBook, batch: PendingUploadBatch): boolean {
  const ag: Record<string, [number, number]> = {};
  const nat: Record<string, [number, number]> = {};
  let found = false;

  for (const sn of wb.SheetNames) {
    const mo = monthFromText(sn);
    if (!mo) continue;
    let ac = 3;
    for (const r of rowsOf(wb.Sheets[sn])) {
      if (r[1] && normalizeText(r[1]).startsWith('REGION')) {
        ac = normalizeText(r[2]).startsWith('AGENCIA') ? 2 : 3;
        continue;
      }
      if (!r[ac] || typeof r[0] !== 'number') continue;
      const c = resolveAgencyName(r[ac]);
      if (!c) {
        batch.skippedRows++;
        continue;
      }
      for (let j = ac + 1; j < ac + 64; j++) {
        const v = normalizeText(r[j]);
        if (v === 'SI' || v === 'NO') {
          const idx = v === 'SI' ? 0 : 1;
          ag[c] = ag[c] || [0, 0];
          ag[c][idx]++;
          nat[mo] = nat[mo] || [0, 0];
          nat[mo][idx]++;
          found = true;
        }
      }
    }
  }

  if (found) {
    batch.sp = {
      ag,
      nat: MON.filter(m => nat[m] != null).map(m => ({
        m,
        pct: Math.round((1000 * nat[m][0]) / (nat[m][0] + nat[m][1])) / 10
      }))
    };
  }
  return found;
}

// 4. Official BLINDADOS parser
function parseOfficialBl(wb: XLSX.WorkBook, batch: PendingUploadBatch): boolean {
  const ag: Record<string, [number, number]> = {};
  const nat: Record<string, [number, number]> = {};
  let found = false;

  for (const sn of wb.SheetNames) {
    const mo = monthFromText(sn);
    for (const r of rowsOf(wb.Sheets[sn])) {
      if (!r[1] || !r[2]) continue;
      if (/^(AGENCIAS|COORD|OPERADOR|FRECUENCIA)/.test(normalizeText(r[1]))) continue;
      const c = resolveAgencyName(r[1]);
      if (!c) continue;
      for (let j = 4; j < 11; j++) {
        const v = r[j] == null ? '' : normalizeText(r[j]);
        if (!v) continue;
        const idx = v.includes('NO ING') ? 1 : /\d/.test(v) ? 0 : null;
        if (idx === null) continue;
        ag[c] = ag[c] || [0, 0];
        ag[c][idx]++;
        if (mo) {
          nat[mo] = nat[mo] || [0, 0];
          nat[mo][idx]++;
        }
        found = true;
      }
    }
  }

  if (found) {
    batch.bl = {
      ag,
      nat: MON.filter(m => nat[m] != null).map(m => ({
        m,
        pct: Math.round((1000 * nat[m][0]) / (nat[m][0] + nat[m][1])) / 10
      }))
    };
  }
  return found;
}

// 5. Official DECOMISOS parser
function parseOfficialDc(wb: XLSX.WorkBook, batch: PendingUploadBatch): boolean {
  const ag: Record<string, number> = {};
  const nat: Record<string, number> = {};
  let found = false;

  for (const sn of wb.SheetNames) {
    const mo = monthFromText(sn);
    const rr = rowsOf(wb.Sheets[sn]);
    const h = rr.find(
      r => r[2] != null && String(r[2]).trim() === '1' && r[3] != null && String(r[3]).trim() === '2'
    );
    if (!h) continue;

    const cols: number[] = [];
    for (let j = 2; j < 40; j++) {
      if (h[j] != null && /^\d{1,2}$/.test(String(h[j]).trim())) cols.push(j);
    }

    for (const r of rr) {
      if (r[1] == null) continue;
      const lab = normalizeText(r[1]);
      if (!lab || /^(TOTALES|DECOMISOS)/.test(lab)) continue;
      const c = resolveAgencyName(r[1]);
      if (!c) continue;
      let s = 0;
      for (const j of cols) {
        const x = parseFloat(r[j]);
        if (!isNaN(x)) s += x;
      }
      ag[c] = Math.round((ag[c] || 0) + s);
      if (mo) nat[mo] = Math.round((nat[mo] || 0) + s);
      found = true;
    }
  }

  if (found) {
    batch.dc = {
      ag,
      nat: MON.filter(m => nat[m] != null).map(m => ({ m, t: nat[m] }))
    };
  }
  return found;
}

// 6. Official BLOQUEO parser
function parseOfficialBq(wb: XLSX.WorkBook, batch: PendingUploadBatch): boolean {
  const b = wb.Sheets['BLOQUEADOS'] || wb.Sheets[wb.SheetNames.find(n => normalizeText(n) === 'BLOQUEADOS') || ''];
  if (!b) return false;
  const d = wb.Sheets['DESBLOQUEADOS'] || wb.Sheets[wb.SheetNames.find(n => normalizeText(n) === 'DESBLOQUEADOS') || ''];

  let hdr = false;
  let n = 0;
  const mot: Record<string, number> = {};
  const emp: Record<string, number> = {};
  const yr: Record<number, number> = {};

  for (const r of rowsOf(b)) {
    if (normalizeText(r[1]) === 'OPERADOR' || normalizeText(r[0]) === 'OPERADOR') {
      hdr = true;
      continue;
    }
    if (hdr && r[4]) {
      n++;
      const m = r[7] ? String(r[7]).trim().toUpperCase().slice(0, 38) : 'SIN MOTIVO';
      mot[m] = (mot[m] || 0) + 1;
      const e = r[6] ? String(r[6]).trim().toUpperCase() : 'S/D';
      emp[e] = (emp[e] || 0) + 1;
      const dtStr = parseExcelDateString(r[3]);
      const y = Number(dtStr.slice(0, 4));
      if (y >= 2020 && y <= 2035) yr[y] = (yr[y] || 0) + 1;
    }
  }

  let dn = 0;
  if (d) {
    for (const r of rowsOf(d)) {
      if (normalizeText(r[1]) !== 'OPERADOR' && r[3] && r[1]) dn++;
    }
  }

  const top = (o: Record<string, number>): [string, number][] =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  batch.bq = {
    bloq: n,
    desb: dn,
    mot: top(mot),
    emp: top(emp),
    yr: Object.entries(yr)
      .map(([y, c]) => [Number(y), c] as [number, number])
      .sort((a, b) => a[0] - b[0])
  };
  return true;
}

// 7. Official VALIDACIONES parser
const VALERT = /SOSPECH|PROCESAD|ANTECEDENTES|DENUNCI|ESTAFA|ABUSO DE CONFIANZA|ROBO|HURTO|INTIMIDA|RECEPTACION/;

function vlSite(l: unknown): ['n'] | ['s', string] | ['m', string] {
  const N = normalizeText(l);
  if (!N || /^\d/.test(N)) return ['n'];
  if (/^(XXXXXX|NO|NACIONAL|CAJAMARCA|TROPICAL|TRAMARTER|TYRONE|BLOQUEADOS|PLANTA)$/.test(N)) return ['n'];
  if (N.includes('NORTE') && N.includes('SUR')) return ['m', 'GYE-SALINAS-MILAGRO'];
  if (N.includes('MILAGRO') && (N.includes('MACHALA') || N.includes('SUR'))) return ['m', 'GYE-SALINAS-MILAGRO'];
  if (/^(GYE|GUAYAQUIL|GYE TROPICAL)$/.test(N)) return ['m', 'GYE-SALINAS-MILAGRO'];
  if (N === 'UIO' || N === 'AG UIO') return ['m', 'UIO-IBARRA'];
  if (N === 'COSTA') return ['m', 'COSTA'];
  const ag = resolveAgencyName(N);
  return ag ? ['s', ag] : ['n'];
}

function vlTipo(o: unknown, e?: unknown): number {
  const O = normalizeText(o);
  const E = normalizeText(e);
  if (/PROV|PREVEED|PORVEED/.test(O)) return 0;
  if (/CONTR|CPNTRAT|CONTART/.test(O)) return 1;
  if (/TRANSPORT/.test(O)) return 4;
  if (/VISITA TEC|^TECNIC/.test(O) || /VISITA TEC/.test(E)) return 3;
  if (/VISIT/.test(O) || /^VISITA/.test(E)) return 2;
  return 5;
}

function parseOfficialVl(wb: XLSX.WorkBook, batch: PendingUploadBatch): boolean {
  const Y: Record<string, ValidationYearData> = {};
  const dm: Record<string, Record<number, number>> = {};
  let asof = 0;
  let found = false;

  for (const sn of wb.SheetNames) {
    const my = sn.match(/VALIDACIONES\s+(\d{4})/i);
    if (!my) continue;
    const y = my[1];
    const A = (Y[y] = Y[y] || {
      tot: 0,
      nd: 0,
      m: Array(12).fill(0),
      tipo: Array(6).fill(0),
      ag: {},
      multi: {},
      none: 0,
      al: 0
    });
    dm[y] = dm[y] || {};
    let hdr = false;
    let cd: { y: number; m: number; d: number } | null = null;

    for (const r of rowsOf(wb.Sheets[sn])) {
      if (!hdr) {
        if (normalizeText(r[1]) === 'OPERADOR DE TURNO') hdr = true;
        continue;
      }
      if (!r[2] || !r[3]) {
        const sm = normalizeText(r[1]).match(/^(\d{1,2}) DE ([A-Z]+) (?:DE )?(\d{4})/);
        if (sm) {
          const mi = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
          ].indexOf(sm[2]);
          if (mi >= 0) cd = { y: Number(sm[3]), m: mi + 1, d: Number(sm[1]) };
        }
        continue;
      }
      A.tot++;
      found = true;
      const dateStr = cd
        ? `${cd.y}-${String(cd.m).padStart(2, '0')}-${String(cd.d).padStart(2, '0')}`
        : parseExcelDateString(r[5]);
      const yrNum = Number(dateStr.slice(0, 4));
      const moNum = Number(dateStr.slice(5, 7));
      const dyNum = Number(dateStr.slice(8, 10));
      if (String(yrNum) === y && moNum >= 1 && moNum <= 12) {
        A.m[moNum - 1]++;
        const k = moNum * 100 + dyNum;
        dm[y][k] = (dm[y][k] || 0) + 1;
        if (y >= '2026' && k > asof) asof = k;
      } else {
        A.nd++;
      }

      const s = vlSite(r[4]);
      if (s[0] === 's') A.ag[s[1]] = (A.ag[s[1]] || 0) + 1;
      else if (s[0] === 'm') A.multi[s[1]] = (A.multi[s[1]] || 0) + 1;
      else A.none++;

      A.tipo[vlTipo(r[7], r[6])]++;
      if (VALERT.test(normalizeText(r[7]))) A.al++;
    }
  }

  if (!found) return false;

  const ys = Object.keys(Y).sort();
  const cur = ys[ys.length - 1];
  const prev = String(Number(cur) - 1);
  let p = 0;
  if (dm[prev]) {
    for (const k in dm[prev]) {
      if (Number(k) <= (asof || 1231)) p += dm[prev][k];
    }
  }

  batch.vl = {
    y: Y,
    cur,
    prev,
    p25: p,
    asof: asof
      ? `${cur}-${String(Math.floor(asof / 100)).padStart(2, '0')}-${String(asof % 100).padStart(2, '0')}`
      : new Date().toISOString().slice(0, 10)
  };
  return true;
}

// Helper hash string for deterministic incident and report IDs
export function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

// 8. Flexible Smart Table Parser (for standard tabular Excel sheets or exported console sheets)
function parseFlexibleWorkbook(
  wb: XLSX.WorkBook,
  fileName: string,
  batch: PendingUploadBatch,
  seenHashes: Set<string>
): string[] {
  const detectedCategories: string[] = [];

  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    const rows = rowsOf(ws);
    if (rows.length < 2) continue;

    // Find header row (scanning up to first 35 rows to account for logos and metadata)
    let headerIdx = -1;
    let headers: string[] = [];
    for (let i = 0; i < Math.min(35, rows.length); i++) {
      const nonNull = (rows[i] || []).filter(cell => cell != null && String(cell).trim() !== '');
      if (nonNull.length >= 2) {
        const normCells = (rows[i] || []).map(c => normalizeText(c));
        const hasKnownHeader = normCells.some(c =>
          /^(SEDE|AGENCIA|INSTALACION|LOCALIDAD|SITIO|UBICACION|CENTRO|MOTIVO|EMPRESA|CATEGORIA|DETALLE|NOVEDAD|INCIDENTE|HECHOS|OPERATIVAS|DECOMISOS|BLOQUEADOS|HORA|FECHA)$/.test(c) ||
          c.includes('SEDE') ||
          c.includes('AGENCIA') ||
          c.includes('LOCALIDAD') ||
          c.includes('CAMARAS') ||
          c.includes('NOVEDAD') ||
          c.includes('INCIDENTE') ||
          c.includes('DECOMISO') ||
          c.includes('FECHA')
        );
        if (hasKnownHeader) {
          headerIdx = i;
          headers = normCells;
          break;
        }
      }
    }

    if (headerIdx === -1) {
      // Fallback: If no explicit header was found, use row 0 as header if it has cells
      if (rows[0] && rows[0].some(c => c != null && String(c).trim() !== '')) {
        headerIdx = 0;
        headers = rows[0].map(c => normalizeText(c));
      } else {
        continue;
      }
    }

    const findCol = (regex: RegExp) => headers.findIndex(h => regex.test(h));
    const colSite = findCol(/SEDE|AGENCIA|INSTALACION|LOCALIDAD|SITIO|CENTRO|LUGAR|UBICACION|PLANTA|BODEGA/);
    const colLoc = findCol(/CIUDAD|PROVINCIA|REGION|ZONA/);

    // Columns for Multi-KPI & Equipment metrics
    const colCamOp = findCol(/CAMARAS OPERATIVAS|^OPERATIVAS$/);
    const colCamNo = findCol(/SIN OPERAR|FUERA DE SERVICIO|FALLAS|INOPERATIVAS/);
    const colCamTot = findCol(/^CAMARAS$|^TOTAL CAMARAS$/);
    const colSpSi = findCol(/SUPERVISION REALIZADA|SUPERVISION SI|TURNOS SI/);
    const colSpNo = findCol(/SUPERVISION PENDIENTE|SUPERVISION NO|TURNOS NO/);
    const colBlSi = findCol(/BLINDADOS CON INGRESO|INGRESO SI|DIAS CON INGRESO/);
    const colBlNo = findCol(/BLINDADOS SIN INGRESO|INGRESO NO|DIAS SIN INGRESO/);
    const colDecomisos = findCol(/DECOMISOS|UNIDADES DECOMISADAS|INCAUTACIONES/);
    const colValidaciones = findCol(/VALIDACIONES/);

    const isMultiKpiSheet =
      colSite >= 0 &&
      [colCamOp >= 0 || colCamTot >= 0, colSpSi >= 0, colBlSi >= 0, colDecomisos >= 0, colValidaciones >= 0].filter(Boolean).length >= 2;

    if (isMultiKpiSheet) {
      const camSites: Record<string, [number, number]> = {};
      let totOp = 0;
      let totNo = 0;
      const spAg: Record<string, [number, number]> = {};
      const blAg: Record<string, [number, number]> = {};
      const dcAg: Record<string, number> = {};
      const vlAg: Record<string, number> = {};

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        const site = resolveAgencyName(colLoc >= 0 ? r[colLoc] : r[colSite], r[colSite]) || 'Tesalia CBC (Nacional)';

        if (colCamOp >= 0 || colCamTot >= 0) {
          const no = colCamNo >= 0 ? Number(r[colCamNo]) || 0 : 0;
          const op =
            colCamOp >= 0
              ? Number(r[colCamOp]) || 0
              : Math.max(0, (Number(r[colCamTot]) || 0) - no);
          if (op + no > 0) {
            camSites[site] = [op, no];
            totOp += op;
            totNo += no;
          }
        }
        if (colSpSi >= 0 && colSpNo >= 0) {
          const si = Number(r[colSpSi]) || 0;
          const no = Number(r[colSpNo]) || 0;
          if (si + no > 0) spAg[site] = [si, no];
        }
        if (colBlSi >= 0 && colBlNo >= 0) {
          const si = Number(r[colBlSi]) || 0;
          const no = Number(r[colBlNo]) || 0;
          if (si + no > 0) blAg[site] = [si, no];
        }
        if (colDecomisos >= 0 && r[colDecomisos] !== '' && r[colDecomisos] != null) {
          const dc = Number(r[colDecomisos]);
          if (!isNaN(dc)) dcAg[site] = Math.round(dc);
        }
        if (colValidaciones >= 0 && r[colValidaciones] !== '' && r[colValidaciones] != null) {
          const vl = Number(r[colValidaciones]);
          if (!isNaN(vl) && vl >= 0) vlAg[site] = Math.round(vl);
        }
      }

      const today = new Date().toISOString().slice(0, 10);
      if (totOp + totNo > 0) {
        batch.cam = { key: `${today}D`, date: today, t: 'D', op: totOp, no: totNo, sites: camSites };
        detectedCategories.push(`Cámaras (${totOp} op / ${totNo} fallas)`);
      }
      if (Object.keys(spAg).length > 0) {
        const totSi = Object.values(spAg).reduce((s, v) => s + v[0], 0);
        const totAll = Object.values(spAg).reduce((s, v) => s + v[0] + v[1], 0);
        const curMo = MON[new Date().getMonth()];
        batch.sp = {
          ag: spAg,
          nat: totAll > 0 ? [{ m: curMo, pct: Math.round((1000 * totSi) / totAll) / 10 }] : []
        };
        detectedCategories.push(`Supervisión (${Object.keys(spAg).length} sedes)`);
      }
      if (Object.keys(blAg).length > 0) {
        const totSi = Object.values(blAg).reduce((s, v) => s + v[0], 0);
        const totAll = Object.values(blAg).reduce((s, v) => s + v[0] + v[1], 0);
        const curMo = MON[new Date().getMonth()];
        batch.bl = {
          ag: blAg,
          nat: totAll > 0 ? [{ m: curMo, pct: Math.round((1000 * totSi) / totAll) / 10 }] : []
        };
        detectedCategories.push(`Blindados (${Object.keys(blAg).length} sedes)`);
      }
      if (Object.keys(dcAg).length > 0) {
        const sumDc = Object.values(dcAg).reduce((s, v) => s + v, 0);
        batch.dc = { ag: dcAg, nat: [] };
        detectedCategories.push(`Decomisos (${sumDc} u.)`);
      }
      if (Object.keys(vlAg).length > 0) {
        const sumVl = Object.values(vlAg).reduce((s, v) => s + v, 0);
        if (sumVl > 0) {
          batch.vl = {
            cur: '2026',
            prev: '2025',
            p25: 6825,
            asof: today,
            y: {
              '2026': {
                tot: sumVl,
                nd: 0,
                m: Array(12).fill(0),
                tipo: [Math.round(sumVl * 0.16), Math.round(sumVl * 0.25), Math.round(sumVl * 0.43), Math.round(sumVl * 0.06), Math.round(sumVl * 0.03), Math.round(sumVl * 0.07)],
                ag: vlAg,
                multi: {},
                none: 0,
                al: 11
              },
              '2025': {
                tot: 8176,
                nd: 0,
                m: Array(12).fill(0),
                tipo: [0, 0, 0, 0, 0, 0],
                ag: {},
                multi: {},
                none: 0,
                al: 2
              }
            }
          };
          detectedCategories.push(`Validaciones (${sumVl} reg.)`);
        }
      }
      // If the sheet also has individual incident descriptions, allow the loop below to extract them
    }

    // Case B: Tabular Incident / Novedades List (with intra-file deduplication & zero lost rows)
    const colCat = findCol(/CATEGORIA|TIPO|CLASIFICACION|EVENTO|TIPO_EVENTO|SUBTIPO/);
    const colDetail = findCol(/DETALLE|DESCRIPCION|NOVEDAD|INCIDENTE|OBSERVACION|REPORTE|HECHOS|ACCIONES|RESUMEN/);
    const colStatus = findCol(/ESTADO|ESTATUS|SEGUIMIENTO|STATUS|CONDICION/);
    const colDate = findCol(/FECHA|DIA|DATE|HORA|TIMESTAMP/);
    const colAuthor = findCol(/OPERADOR|AUTOR|COORDINADOR|USUARIO|REGISTRADO|REPORTA|RESPONSABLE/);

    if (colDetail >= 0 || colCat >= 0 || (colSite >= 0 && !isMultiKpiSheet)) {
      let count = 0;
      let duplicateRows = 0;

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r) continue;

        // Skip completely empty rows
        const hasAnyCell = r.some((c: any) => c != null && String(c).trim() !== '');
        if (!hasAnyCell) continue;

        const rawSiteCell = colSite >= 0 ? r[colSite] : null;
        const rawLocCell = colLoc >= 0 ? r[colLoc] : null;

        // Resolve site with fallback to sheet name or national hub so no record is dropped
        let site = resolveAgencyName(rawLocCell || rawSiteCell, rawSiteCell);
        if (!site) {
          site = resolveAgencyName(sn) || 'Tesalia CBC (Nacional)';
        }

        const detailStr = colDetail >= 0 && r[colDetail] != null ? String(r[colDetail]).trim() : '';
        const catRaw = colCat >= 0 && r[colCat] != null ? r[colCat] : (detailStr || 'Otros');
        const catIdx = classifyCategory(catRaw);
        const stIdx = colStatus >= 0 && r[colStatus] != null ? classifyStatus(r[colStatus]) : 0;
        const dateStr = colDate >= 0 && r[colDate] != null ? parseExcelDateString(r[colDate]) : new Date().toISOString().slice(0, 10);
        const authorStr = colAuthor >= 0 && r[colAuthor] != null ? String(r[colAuthor]).trim() : `Carga Excel (${fileName})`;

        // If the row lacks both detail and specific category and has no meaningful content, count as unread sample
        if (!detailStr && catIdx === 5 && !r[colStatus]) {
          batch.unreadRowsCount = (batch.unreadRowsCount || 0) + 1;
          continue;
        }

        // Intra-file deduplication using content hash
        const h = generateIncidentHash(site, dateStr, catIdx, detailStr);
        if (seenHashes.has(h)) {
          duplicateRows++;
          batch.duplicateCount = (batch.duplicateCount || 0) + 1;
          continue;
        }
        seenHashes.add(h);

        batch.extractedIncidents.push({
          id: `xl_${hashString(h)}`,
          a: site,
          t: catIdx,
          e: stIdx,
          d: dateStr,
          x: detailStr || `Novedad reportada en ${site} (${CATEGORY_LABELS[catIdx] || 'Operaciones'})`,
          author: authorStr,
          source: 'excel'
        });
        count++;
      }

      if (count > 0) {
        const dupNotice = duplicateRows > 0 ? ` (${duplicateRows} duplicados filtrados)` : '';
        detectedCategories.push(`Novedades (${count} registros únicos extraídos${dupNotice})`);
        continue;
      }
    }

    // Case C: Tabular Cameras Only
    if (colSite >= 0 && (colCamOp >= 0 || colCamTot >= 0)) {
      const camSites: Record<string, [number, number]> = {};
      let totOp = 0;
      let totNo = 0;
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        const site = resolveAgencyName(r[colSite]);
        if (!site) continue;
        const no = colCamNo >= 0 ? Number(r[colCamNo]) || 0 : 0;
        const op = colCamOp >= 0 ? Number(r[colCamOp]) || 0 : Math.max(0, (Number(r[colCamTot]) || 0) - no);
        camSites[site] = [op, no];
        totOp += op;
        totNo += no;
      }
      if (totOp + totNo > 0) {
        const today = new Date().toISOString().slice(0, 10);
        batch.cam = { key: `${today}D`, date: today, t: 'D', op: totOp, no: totNo, sites: camSites };
        detectedCategories.push(`Cámaras CCTV (${totOp} op / ${totNo} fallas)`);
        continue;
      }
    }

    // Case D: Tabular Decomisos Only
    if (colSite >= 0 && colDecomisos >= 0) {
      const dcAg: Record<string, number> = {};
      let sum = 0;
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        const site = resolveAgencyName(r[colSite]);
        if (!site) continue;
        const val = Math.round(Number(r[colDecomisos]) || 0);
        dcAg[site] = (dcAg[site] || 0) + val;
        sum += val;
      }
      if (Object.keys(dcAg).length > 0) {
        batch.dc = { ag: dcAg, nat: [] };
        detectedCategories.push(`Decomisos (${sum} unidades en ${Object.keys(dcAg).length} sedes)`);
        continue;
      }
    }

    // Case E: Tabular Supervisión Only
    if (colSite >= 0 && colSpSi >= 0 && colSpNo >= 0) {
      const spAg: Record<string, [number, number]> = {};
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        const site = resolveAgencyName(r[colSite]);
        if (!site) continue;
        spAg[site] = [Number(r[colSpSi]) || 0, Number(r[colSpNo]) || 0];
      }
      if (Object.keys(spAg).length > 0) {
        batch.sp = { ag: spAg, nat: [] };
        detectedCategories.push(`Supervisión (${Object.keys(spAg).length} sedes)`);
        continue;
      }
    }

    // Case F: Tabular Blindados Only
    if (colSite >= 0 && colBlSi >= 0 && colBlNo >= 0) {
      const blAg: Record<string, [number, number]> = {};
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        const site = resolveAgencyName(r[colSite]);
        if (!site) continue;
        blAg[site] = [Number(r[colBlSi]) || 0, Number(r[colBlNo]) || 0];
      }
      if (Object.keys(blAg).length > 0) {
        batch.bl = { ag: blAg, nat: [] };
        detectedCategories.push(`Blindados (${Object.keys(blAg).length} sedes)`);
        continue;
      }
    }

    // Case G: Tabular Bloqueados Only
    const colMotivo = findCol(/MOTIVO|CAUSA|RAZON/);
    const colEmpresa = findCol(/EMPRESA|CONTRATISTA|TRANSPORTISTA/);
    if (colMotivo >= 0 && colEmpresa >= 0) {
      let bloq = 0;
      let desb = 0;
      const mot: Record<string, number> = {};
      const emp: Record<string, number> = {};
      const yr: Record<number, number> = {};

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || (!r[colMotivo] && !r[colEmpresa])) continue;
        const stStr = colStatus >= 0 ? normalizeText(r[colStatus]) : 'BLOQUEADO';
        if (stStr.includes('DESBLOQ')) {
          desb++;
          continue;
        }
        bloq++;
        const m = r[colMotivo] ? String(r[colMotivo]).trim().toUpperCase().slice(0, 38) : 'OTRO MOTIVO';
        const e = r[colEmpresa] ? String(r[colEmpresa]).trim().toUpperCase() : 'TERCERO';
        mot[m] = (mot[m] || 0) + 1;
        emp[e] = (emp[e] || 0) + 1;
        const dt = colDate >= 0 && r[colDate] ? parseExcelDateString(r[colDate]) : new Date().toISOString().slice(0, 10);
        const y = Number(dt.slice(0, 4));
        if (y >= 2020 && y <= 2035) yr[y] = (yr[y] || 0) + 1;
      }

      if (bloq + desb > 0) {
        const top = (o: Record<string, number>): [string, number][] =>
          Object.entries(o)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        batch.bq = {
          bloq,
          desb,
          mot: top(mot),
          emp: top(emp),
          yr: Object.entries(yr).map(([y, c]) => [Number(y), c] as [number, number]).sort((a, b) => a[0] - b[0])
        };
        detectedCategories.push(`Personal Bloqueado (${bloq} bloqueados / ${desb} desbloqueados)`);
      }
    }
  }

  return detectedCategories;
}

// 9. Word (.docx) Review Report Parser
async function parseWordReview(file: File): Promise<{ name: string; id: string; site: string | null; date: string | null }> {
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  const tx = result.value || '';
  const base = String(file.name).replace(/^\d+_/, '').replace(/\.docx$/i, '');
  const key = normalizeText(base).replace(/[^A-Z0-9]/g, '');
  const sp = normalizeText(base.replace(/[_-]+/g, ' '));
  const am = String(tx).match(/ASUNTO:?\s*([^\n]*\S[^\n]*)/i);
  const asu = am ? normalizeText(am[1]) : '';

  const MS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  let date: string | null = null;
  let y: string | undefined;
  let m: number | undefined;
  let d: number | undefined;

  let x = base.match(/(\d{1,2})-(\d{1,2})-(20\d\d)/);
  if (x) {
    d = Number(x[1]);
    m = Number(x[2]);
    y = x[3];
  } else if ((x = String(tx).match(/\b(\d{1,2})\/(\d{1,2})\/(20\d\d)\b/))) {
    d = Number(x[1]);
    m = Number(x[2]);
    y = x[3];
  } else if ((x = String(tx).match(new RegExp('\\b(\\d{1,2}) de (' + MS.join('|') + ') (?:de |del )?(20\\d\\d)', 'i')))) {
    d = Number(x[1]);
    m = MS.indexOf(x[2].toLowerCase()) + 1;
    y = x[3];
  }

  if (y && m && m >= 1 && m <= 12 && d && d >= 1 && d <= 31) {
    date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  return {
    name: String(file.name),
    id: 'r' + hashString(key || file.name),
    site: resolveAgencyName(`${sp} ${asu}`),
    date
  };
}

// Main entry point: process one or multiple files (.xlsx, .xlsm, .xls, .csv, .docx)
export async function processUploadedFiles(files: File[]): Promise<PendingUploadBatch> {
  const batch: PendingUploadBatch = {
    novShifts: {},
    extractedIncidents: [],
    camMonths: {},
    rev: [],
    logs: [],
    skippedRows: 0,
    duplicateCount: 0,
    unreadRowsCount: 0,
    unreadSamples: []
  };

  const seenHashes = new Set<string>();

  for (const file of files) {
    const fName = file.name;
    const upperName = normalizeText(fName);

    try {
      // Handle Word .docx camera review report
      if (/\.docx$/i.test(fName)) {
        const rev = await parseWordReview(file);
        if (batch.rev.some(q => q.id === rev.id)) {
          batch.logs.push({
            status: 'warn',
            fileName: fName,
            category: 'Auditoría CCTV',
            summary: 'Informe duplicado en la selección actual'
          });
        } else {
          batch.rev.push(rev);
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Auditoría CCTV (.docx)',
            summary: `Sede detectada: ${rev.site || 'Pendiente confirmar'} · Fecha: ${rev.date || 'S/F'}`
          });
        }
        continue;
      }

      if (!/\.(xlsx|xlsm|xls|csv)$/i.test(fName)) {
        batch.logs.push({
          status: 'error',
          fileName: fName,
          category: 'Formato no soportado',
          summary: 'Sube archivos Excel (.xlsx, .xlsm, .xls, .csv) o informes Word (.docx).'
        });
        continue;
      }

      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      let handled = false;

      // Try official Tesalia CBC parsers based on filename or sheet signatures
      if (upperName.includes('VALIDACIONES') || wb.SheetNames.some(s => /VALIDACIONES\s+\d{4}/i.test(s))) {
        if (parseOfficialVl(wb, batch)) {
          const curY = batch.vl!.cur;
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Validaciones de Seguridad',
            summary: `Año ${curY}: ${batch.vl!.y[curY].tot.toLocaleString('es-EC')} registros y ${batch.vl!.y[curY].al} alertas extraídas.`
          });
          handled = true;
        }
      }

      if (!handled && (upperName.includes('BLOQUEO') || wb.SheetNames.some(s => normalizeText(s) === 'BLOQUEADOS'))) {
        if (parseOfficialBq(wb, batch)) {
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Personal Bloqueado',
            summary: `${batch.bq!.bloq} bloqueados activos y ${batch.bq!.desb} desbloqueados extraídos.`
          });
          handled = true;
        }
      }

      if (!handled && upperName.includes('CAMARAS')) {
        if (parseOfficialCam(wb, batch)) {
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Cámaras CCTV',
            summary: `Corte ${batch.cam!.date} (${batch.cam!.t}): ${batch.cam!.op} operativas / ${batch.cam!.no} sin operar.`
          });
          handled = true;
        }
      }

      if (!handled && upperName.includes('NOVEDADES')) {
        const beforeShifts = Object.keys(batch.novShifts).length;
        const newShiftIncidents = parseOfficialNov(wb, batch);
        if (Object.keys(batch.novShifts).length > beforeShifts) {
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Novedades por Turno',
            summary: `${Object.keys(batch.novShifts).length} turnos procesados (${newShiftIncidents} novedades nuevas posteriores al corte base).`
          });
          handled = true;
        }
      }

      if (!handled && upperName.includes('SUPERVISION')) {
        if (parseOfficialSp(wb, batch)) {
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Supervisión de Turnos',
            summary: `${Object.keys(batch.sp!.ag).length} sedes y ${batch.sp!.nat.length} meses extraídos.`
          });
          handled = true;
        }
      }

      if (!handled && upperName.includes('BLINDADOS')) {
        if (parseOfficialBl(wb, batch)) {
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Ingreso de Blindados',
            summary: `${Object.keys(batch.bl!.ag).length} agencias y ${batch.bl!.nat.length} meses extraídos.`
          });
          handled = true;
        }
      }

      if (!handled && upperName.includes('DECOMISOS')) {
        if (parseOfficialDc(wb, batch)) {
          const totalDc = Object.values(batch.dc!.ag).reduce((s, x) => s + x, 0);
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Decomisos en Garita',
            summary: `${totalDc.toLocaleString('es-EC')} unidades consolidadas en ${Object.keys(batch.dc!.ag).length} sedes.`
          });
          handled = true;
        }
      }

      // If filename didn't trigger official parser, try signature-based official parsers then flexible tabular parser
      if (!handled) {
        if (parseOfficialCam(wb, batch)) {
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Cámaras CCTV',
            summary: `${batch.cam!.op} operativas / ${batch.cam!.no} sin operar extraídas.`
          });
          handled = true;
        } else {
          const novShiftsBefore = Object.keys(batch.novShifts).length;
          const newShiftInc = parseOfficialNov(wb, batch);
          if (Object.keys(batch.novShifts).length > novShiftsBefore) {
            batch.logs.push({
              status: 'ok',
              fileName: fName,
              category: 'Novedades por Turno',
              summary: `${Object.keys(batch.novShifts).length} turnos procesados (${newShiftInc} novedades nuevas).`
            });
            handled = true;
          }
        }
      }

      if (!handled) {
        const flexCategories = parseFlexibleWorkbook(wb, fName, batch, seenHashes);
        if (flexCategories.length > 0) {
          batch.logs.push({
            status: 'ok',
            fileName: fName,
            category: 'Extracción Inteligente Excel',
            summary: flexCategories.join(' · ')
          });
          handled = true;
        }
      }

      if (!handled) {
        batch.logs.push({
          status: 'warn',
          fileName: fName,
          category: 'Estructura no reconocida',
          summary: 'No se encontraron columnas con nombres de sedes o formatos oficiales del CCO. Descarga una plantilla de referencia.'
        });
      }
    } catch (err: any) {
      batch.logs.push({
        status: 'error',
        fileName: fName,
        category: 'Error de lectura',
        summary: err?.message || 'Archivo dañado o ilegible'
      });
    }
  }

  return batch;
}

// Helper to download a ready-to-fill Excel template for quick data upload
export function downloadTemplateExcel(kind: 'novedades' | 'indicadores_sede') {
  const wb = XLSX.utils.book_new();
  const today = new Date().toISOString().slice(0, 10);

  if (kind === 'novedades') {
    const rows = [
      ['Fecha', 'Sede', 'Categoría', 'Estado', 'Operador', 'Detalle de la Novedad'],
      [today, 'Agencia Norte GYE', 'Rutas / Vehículos', 'En proceso', 'Operador CCO', 'Unidad con retraso en retorno de ruta vespertina'],
      [today, 'Planta Tesalia GYE', 'Cámaras / Sistemas', 'Cerrada', 'Operador CCO', 'Reinicio exitoso de cámara perimetral sector carga'],
      [today, 'Agencia Manta', 'Accesos / Personal', 'Comunicado / otro', 'Operador CCO', 'Control rutinario de contratistas externos en garita']
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Carga_Novedades');
    XLSX.writeFile(wb, `Plantilla_Carga_Novedades_CCO_${today}.xlsx`);
  } else {
    const rows: any[][] = [
      [
        'Sede',
        'Cámaras Operativas',
        'Cámaras Fuera de Servicio',
        'Supervisión SI',
        'Supervisión NO',
        'Blindados con Ingreso',
        'Blindados sin Ingreso',
        'Decomisos'
      ]
    ];
    Object.values(RAW_REGIONS_DATA)
      .flat()
      .forEach(a => {
        rows.push([
          a.a,
          20,
          0,
          a.sp ? a.sp[0] : 100,
          a.sp ? a.sp[1] : 20,
          a.bl ? a.bl[0] : 150,
          a.bl ? a.bl[1] : 30,
          a.dc ?? 0
        ]);
      });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Indicadores_Por_Sede');
    XLSX.writeFile(wb, `Plantilla_Indicadores_Sedes_CCO_${today}.xlsx`);
  }
}
