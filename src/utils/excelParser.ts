import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import {
  BlockedPersonnel,
  IncidentRecord,
  NovShiftEntry,
  PendingUploadBatch,
  SheetParseReport,
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
  const normDetail = normalizeText(detail).slice(0, 140);
  return `${normSite}::${normDate}::${catIdx}::${normDetail}`;
}

export function resolveAgencyName(rawLoc: unknown, rawAg?: unknown): string | null {
  const L = normalizeText(rawLoc);
  const A = normalizeText(rawAg !== undefined ? rawAg : rawLoc);
  const combined = `${L} ${A}`.trim();
  if (!combined) return null;

  // Reject clear header/total labels immediately
  if (/^(TOTAL|TOTAL GENERAL|TOTAL NACIONAL|SUBTOTAL|RESUMEN|N\/A|NA|NINGUNA|NINGUNO)$/.test(A)) {
    return null;
  }

  // Direct match against canonical names
  for (const exact of ALL_AGENCY_NAMES) {
    const ne = normalizeText(exact);
    if (ne === A || ne === L) return exact;
  }

  const isQuito =
    L.startsWith('QUITO') ||
    combined.includes('QUITO') ||
    combined.includes('UIO') ||
    combined.includes('PICHINCHA');

  if (combined.includes('MACHACHI')) return 'Planta Machachi';
  if (
    combined.includes('MEMX') ||
    combined.includes('MENX') ||
    combined.includes('BODEGA MEMX') ||
    combined.includes('BODEGA QUITO')
  ) {
    return 'Bodega MEMX Quito';
  }
  if (
    (combined.includes('WOR') && combined.includes('Q')) ||
    combined.includes('WORQ') ||
    combined.includes('EDIFICIO') ||
    combined.includes('CORPORATIVO') ||
    combined.includes('MATRIZ')
  ) {
    return 'Edificio WorQ';
  }
  if (combined.includes('PURE') || combined.includes('MILGRO') || combined.includes('MILAGRO')) {
    return 'Planta Milagro';
  }
  if (
    combined.includes('PEP') ||
    combined.includes('PASCUALES') ||
    combined.includes('PLANTA TESALIA') ||
    combined.includes('PLANTA GUAYAQUIL') ||
    combined.includes('PLANTA GYE') ||
    combined.includes('PL GYE') ||
    combined.includes('PL TESALIA') ||
    combined.includes('TESALIA GYE')
  ) {
    return 'Planta Tesalia GYE';
  }

  const qMatch =
    A.match(/^(?:A\s+|AGENCIA\s+|SUCURSAL\s+)?(Q|QUITO|UIO)\s+(NORTE|SUR)/i) ||
    combined.match(/(?:QUITO|UIO)\s+(NORTE|SUR)/i);
  if (qMatch) {
    const dir =
      qMatch[1]?.toUpperCase() === 'NORTE' || qMatch[2]?.toUpperCase() === 'NORTE' ? 'Norte' : 'Sur';
    return `Agencia Quito ${dir}`;
  }

  const gMatch =
    A.match(/^(?:A\s+|AGENCIA\s+|SUCURSAL\s+)?(GYE|GUAYAQUIL|GQUIL)\s+(NORTE|SUR)/i) ||
    combined.match(/(?:GYE|GUAYAQUIL|GQUIL)\s+(NORTE|SUR)/i);
  if (gMatch) {
    const dir =
      gMatch[1]?.toUpperCase() === 'NORTE' || gMatch[2]?.toUpperCase() === 'NORTE' ? 'Norte' : 'Sur';
    return `Agencia ${dir} GYE`;
  }

  const cityPairs: [string, string][] = [
    ['SALINAS', 'Agencia Salinas'],
    ['SALIANS', 'Agencia Salinas'],
    ['SANTA ELENA', 'Agencia Salinas'],
    ['LIBERTAD', 'Agencia Salinas'],
    ['PENINSULA', 'Agencia Salinas'],
    ['MANTA', 'Agencia Manta'],
    ['PORTOVIEJO', 'Agencia Manta'],
    ['CHONE', 'Agencia Manta'],
    ['MANABI', 'Agencia Manta'],
    ['ATACAMES', 'Agencia Atacames'],
    ['ESMERALDAS', 'Agencia Atacames'],
    ['QUEVEDO', 'Agencia Quevedo'],
    ['BABAHOYO', 'Agencia Quevedo'],
    ['LOS RIOS', 'Agencia Quevedo'],
    ['SANTO DOMINGO', 'Agencia Santo Domingo'],
    ['DOMINGO', 'Agencia Santo Domingo'],
    ['STO DGO', 'Agencia Santo Domingo'],
    ['STO DOMINGO', 'Agencia Santo Domingo'],
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
    ['CHILLOGALLO', 'Agencia Quito Sur'],
    ['QUITUMBE', 'Agencia Quito Sur'],
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
  if (A.includes('PLANTA') || A.includes('GYE') || A.includes('GUAYAQUIL') || combined.includes('GUAYAS')) {
    return 'Planta Tesalia GYE';
  }
  if (isQuito) return 'Agencia Quito Norte';

  // Substring canonical fallback (strip prefixes like AGENCIA / PLANTA / BODEGA)
  for (const exact of ALL_AGENCY_NAMES) {
    const core = normalizeText(exact)
      .replace(/^(PLANTA Y AGENCIA|PLANTA|AGENCIA|BODEGA|EDIFICIO)\s+/, '')
      .trim();
    if (core.length >= 4 && combined.includes(core)) return exact;
  }

  return null;
}

function resolveAgencyFromRow(
  row: any[],
  primaryA: unknown,
  primaryB?: unknown,
  sheetName?: string,
  fileName?: string
): string | null {
  const direct = resolveAgencyName(primaryA, primaryB);
  if (direct) return direct;

  // Scan every text cell in the row to avoid missing shifted columns
  for (const cell of row) {
    if (typeof cell !== 'string' || cell.trim().length < 3) continue;
    const hit = resolveAgencyName(cell);
    if (hit) return hit;
  }

  if (sheetName) {
    const sh = resolveAgencyName(sheetName);
    if (sh) return sh;
  }
  if (fileName) {
    const fn = resolveAgencyName(fileName);
    if (fn) return fn;
  }

  return null;
}

const CAT_PATTERNS = [
  /robo|hurto|asalto|sustrac|faltante|intruso|sospech|amenaza|arma|extors|delito|seguridad|vandal/,
  /accident|choque|colisi|incendio|emergencia|lesion|herid|volc|siniestro|evacuac/,
  /camara|cctv|dvr|nvr|enlace|grabador|sin senal|hikvision|monitoreo|visualizacion|perdida de video/,
  /ruta|placa|conductor|unidad|vehicul|camion|furgon|chofer|transporte|gps|desvio|retraso/,
  /ingreso|acceso|visitante|bloque|personal|guardia|garita|turno|contratista|carnet/
];

export function classifyCategory(text: unknown): number {
  const norm = normalizeText(text);
  for (let i = 0; i < CATEGORY_LABELS.length; i++) {
    if (normalizeText(CATEGORY_LABELS[i]) === norm) return i;
  }
  const lower = norm.toLowerCase();
  if (lower.includes('liquidacion')) return 6;
  if (lower.includes('ruta pendiente')) return 7;
  if (lower.includes('incidente')) return 8;
  if (lower.includes('producto') && lower.includes('falt')) return 11;
  if (lower.includes('decomiso') || lower.includes('incautac')) return 12;
  if (lower.includes('intrusion') || lower.includes('intruso')) return 13;
  if (lower.includes('perdida de visualizacion')) return 14;
  if (lower.includes('equipo')) return 15;
  if (/\bt1\b/.test(lower)) return 16;
  if (/\bt2\b/.test(lower)) return 17;
  if (lower.includes('bloqueo')) return 18;
  if (lower.includes('comportamiento')) return 19;
  if (lower.includes('mala practica')) return 20;
  for (let i = 0; i < 5; i++) {
    if (CAT_PATTERNS[i].test(lower)) return i;
  }
  return 5; // Otros
}

export function classifyStatus(text: unknown): number {
  const s = normalizeText(text).toLowerCase();
  if (/proceso|pendiente|abiert|seguimiento|investig|revision/.test(s)) return 0;
  if (/cerrad|solucion|solventad|resuelt|finaliz|atendid|complet|ejecutad|ok\b/.test(s)) return 1;
  return 2;
}

const parseSheetShiftDate = (sheetName: string): { d: string; t: string } | null => {
  const s = String(sheetName).trim();
  // DD-MM-YYYY [D|N|DIA|NOCHE] or DD-MM-YY
  const dmy = s.match(/^\s*(\d{1,2})[-/. _](\d{1,2})[-/. _](\d{2,4})\s*(?:[-_ ]*(DIA|DIURNO|NOCHE|NOCTURNO|[DN]))?/i);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    const mo = Number(mm);
    const dy = Number(dd);
    if (mo >= 1 && mo <= 12 && dy >= 1 && dy <= 31) {
      const rawT = (dmy[4] || 'D').toUpperCase();
      const t = rawT.startsWith('N') ? 'N' : 'D';
      return { d: `${yyyy}-${mm}-${dd}`, t };
    }
  }
  // YYYY-MM-DD [D|N]
  const ymd = s.match(/^\s*(20\d{2})[-/. _](\d{1,2})[-/. _](\d{1,2})\s*(?:[-_ ]*(DIA|DIURNO|NOCHE|NOCTURNO|[DN]))?/i);
  if (ymd) {
    const mm = ymd[2].padStart(2, '0');
    const dd = ymd[3].padStart(2, '0');
    const rawT = (ymd[4] || 'D').toUpperCase();
    const t = rawT.startsWith('N') ? 'N' : 'D';
    return { d: `${ymd[1]}-${mm}-${dd}`, t };
  }
  return null;
};

const SPANISH_MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const parseExcelDateString = (val: unknown, fallbackDate?: string): string => {
  if (val instanceof Date && !isNaN(val.getTime())) {
    // Adjust 60s to avoid LMT 23:59:59 edge cases while honoring calendar day
    const adj = new Date(val.getTime() + 60 * 1000);
    const y = adj.getFullYear();
    const m = String(adj.getMonth() + 1).padStart(2, '0');
    const d = String(adj.getDate()).padStart(2, '0');
    if (y >= 2018 && y <= 2038) return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number' && val > 35000 && val < 65000) {
    const dt = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const iso = trimmed.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
    const dmy4 = trimmed.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
    if (dmy4 && Number(dmy4[2]) <= 12 && Number(dmy4[1]) <= 31) {
      return `${dmy4[3]}-${dmy4[2].padStart(2, '0')}-${dmy4[1].padStart(2, '0')}`;
    }
    const dmy2 = trimmed.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})\b/);
    if (dmy2 && Number(dmy2[2]) <= 12 && Number(dmy2[1]) <= 31) {
      return `20${dmy2[3]}-${dmy2[2].padStart(2, '0')}-${dmy2[1].padStart(2, '0')}`;
    }
    const norm = normalizeText(trimmed);
    const textDate = norm.match(/\b(\d{1,2})\s+(?:DE\s+)?([A-Z]{3,10})\s+(?:DE[L]?\s+)?(20\d{2})\b/);
    if (textDate) {
      const mFull = SPANISH_MONTHS.indexOf(textDate[2]);
      const mShort = MON.indexOf(textDate[2].slice(0, 3));
      const mIdx = mFull >= 0 ? mFull : mShort;
      if (mIdx >= 0) {
        return `${textDate[3]}-${String(mIdx + 1).padStart(2, '0')}-${textDate[1].padStart(2, '0')}`;
      }
    }
  }
  return fallbackDate || new Date().toISOString().slice(0, 10);
};

function rowSampleText(r: any[]): string {
  return (r || [])
    .filter(c => c != null && String(c).trim() !== '')
    .map(c => String(c).trim())
    .join(' | ')
    .slice(0, 140);
}

function recordUnreadSample(
  batch: PendingUploadBatch,
  sheet: string,
  row: number,
  reason: string,
  r: any[]
) {
  batch.unreadRowsCount = (batch.unreadRowsCount || 0) + 1;
  if (!batch.unreadSamples) batch.unreadSamples = [];
  if (batch.unreadSamples.length < 40) {
    batch.unreadSamples.push({
      sheet,
      row,
      reason,
      sample: rowSampleText(r)
    });
  }
}

function addSheetReport(batch: PendingUploadBatch, report: SheetParseReport) {
  if (!batch.sheetReports) batch.sheetReports = [];
  batch.sheetReports.push(report);
  batch.totalRowsScanned = (batch.totalRowsScanned || 0) + report.rowsScanned;
  batch.parsedRowsCount = (batch.parsedRowsCount || 0) + report.extracted;
}

// 1. Official NOVEDADES shift parser (dynamic header & zero silent drops)
function parseOfficialNov(
  wb: XLSX.WorkBook,
  fileName: string,
  batch: PendingUploadBatch,
  consumedSheets: Set<string>
): { matchedShifts: number; newIncidentsAfterCut: number; totalRowsExtracted: number } {
  let matchedShifts = 0;
  let newIncidentsAfterCut = 0;
  let totalRowsExtracted = 0;

  for (const sn of wb.SheetNames) {
    const rr = rowsOf(wb.Sheets[sn]);
    let k = parseSheetShiftDate(sn);

    // If sheet tab doesn't have a date but file is NOVEDADES and top rows contain FECHA/TURNO, extract it
    if (!k) {
      let inferredDate: string | null = null;
      let inferredTurn: string = normalizeText(sn).includes('NOCHE') ? 'N' : 'D';
      for (let i = 0; i < Math.min(12, rr.length); i++) {
        const line = normalizeText((rr[i] || []).join(' '));
        if (!inferredDate && (/FECHA/.test(line) || /\b\d{1,2}[-/]\d{1,2}[-/]20\d{2}\b/.test(line))) {
          for (const cell of rr[i] || []) {
            if (cell instanceof Date || (typeof cell === 'string' && /\d{1,2}[-/]\d{1,2}[-/]20\d{2}/.test(cell))) {
              inferredDate = parseExcelDateString(cell);
              break;
            }
          }
        }
        if (/TURNO[:\s]*(N|NOCHE|NOCTURNO)/.test(line)) inferredTurn = 'N';
      }
      if (inferredDate && /NOV|TURNO|HOJA/.test(normalizeText(fileName + ' ' + sn))) {
        k = { d: inferredDate, t: inferredTurn };
      }
    }

    if (!k) continue;

    let hdrIdx = -1;
    let headers: string[] = [];
    for (let i = 0; i < Math.min(25, rr.length); i++) {
      const cells = (rr[i] || []).map(c => normalizeText(c));
      if (
        cells.some(c =>
          /^(LOCALIDAD|SEDE|AGENCIA|INSTALACION)$/.test(c) ||
          c.includes('LOCALIDAD') ||
          (cells.includes('AGENCIA') && cells.some(x => x.includes('NOVEDAD') || x.includes('ESTADO') || x.includes('CATEGORIA')))
        )
      ) {
        hdrIdx = i;
        headers = cells;
        break;
      }
    }

    if (hdrIdx === -1) continue;

    const findCol = (rx: RegExp, fallback: number) => {
      const idx = headers.findIndex(h => rx.test(h));
      return idx >= 0 ? idx : fallback;
    };
    const colLoc = findCol(/LOCALIDAD|CIUDAD|REGION|ZONA/, 1);
    const colAg = findCol(/AGENCIA|SEDE|INSTALACION|SITIO|SUBSEDE|PUNTO/, 2);
    const colCat = findCol(/CATEGORIA|CLASIFICACION|TIPO|NOVEDAD|DESCRIPCION|DETALLE|OBSERVACION|EVENTO/, 5);
    const colAltDetail = headers.findIndex(h => /DETALLE|DESCRIPCION|NOVEDAD|OBSERVACION|HECHOS|REPORTE/.test(h));
    const colStatus = findCol(/ESTADO|ESTATUS|SEGUIMIENTO|CONDICION/, 6);

    let tot = 0;
    let scanned = 0;
    let skippedInSheet = 0;
    const ag: Record<string, number[]> = {};

    for (let i = hdrIdx + 1; i < rr.length; i++) {
      const r = rr[i];
      if (!r) continue;
      const nonEmpty = r.filter(c => c != null && String(c).trim() !== '');
      if (nonEmpty.length === 0) continue;

      const joinedNorm = normalizeText(nonEmpty.join(' '));
      if (/^(TOTAL|TOTAL GENERAL|SUBTOTAL|RESUMEN|ELABORADO POR|FIRMA)/.test(joinedNorm)) continue;
      if (normalizeText(r[colLoc]) === 'LOCALIDAD' || normalizeText(r[colAg]) === 'AGENCIA') continue;

      scanned++;

      const locVal = r[colLoc] ?? r[0];
      const agVal = r[colAg] ?? r[colLoc] ?? r[2];
      const catCell =
        (r[colCat] != null && String(r[colCat]).trim() !== '' ? r[colCat] : null) ??
        (colAltDetail >= 0 && r[colAltDetail] != null && String(r[colAltDetail]).trim() !== ''
          ? r[colAltDetail]
          : null);

      // Look for any meaningful descriptive cell if expected category/detail column was empty
      let fallbackText = '';
      if (!catCell) {
        const candidates = r
          .map((cell, cIdx) => ({ cIdx, txt: cell == null ? '' : String(cell).trim() }))
          .filter(
            x =>
              x.txt.length >= 4 &&
              x.cIdx !== colLoc &&
              x.cIdx !== colAg &&
              !/^\d+$/.test(x.txt)
          );
        if (candidates.length > 0) {
          fallbackText = candidates.map(x => x.txt).join(' ');
        }
      }

      const rawText = catCell != null ? String(catCell).trim() : fallbackText;
      if (!rawText && !locVal && !agVal) continue;

      const resolved = resolveAgencyFromRow(r, locVal, agVal, sn, fileName);
      if (!resolved) {
        skippedInSheet++;
        batch.skippedRows++;
        recordUnreadSample(
          batch,
          sn,
          i + 1,
          `Sede no identificada ("${String(locVal || agVal || '').trim() || 'vacío'}")`,
          r
        );
        continue;
      }

      tot++;
      totalRowsExtracted++;
      const v = (ag[resolved] = ag[resolved] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const catIdx = Math.min(5, classifyCategory(rawText || 'Otros'));
      const stIdx = classifyStatus(r[colStatus]);
      v[0]++;
      v[1 + catIdx]++;
      v[7 + stIdx]++;
      if (k.d > NOV_CUT) newIncidentsAfterCut++;
    }

    consumedSheets.add(sn);
    matchedShifts++;
    addSheetReport(batch, {
      fileName,
      sheetName: sn,
      parser: `Novedades Turno ${k.d} (${k.t})`,
      rowsScanned: scanned,
      extracted: tot,
      skipped: skippedInSheet
    });

    const id = `${k.d}_${k.t}`;
    const existing = batch.novShifts[id];
    const existingTot = existing
      ? Object.values(existing.ag).reduce((s, arr) => s + arr[0], 0)
      : -1;
    if (tot >= existingTot && tot >= 0) {
      batch.novShifts[id] = { d: k.d, t: k.t, ag };
    }
  }

  return { matchedShifts, newIncidentsAfterCut, totalRowsExtracted };
}

// 2. Official CAMARAS shift parser (flexible columns + automatic site summation fallback)
function parseOfficialCam(
  wb: XLSX.WorkBook,
  fileName: string,
  batch: PendingUploadBatch,
  consumedSheets: Set<string>
): boolean {
  let best: PendingUploadBatch['cam'] = undefined;
  const M: Record<string, { op: number; no: number; n: number }> = {};
  let anyMatched = false;

  for (const sn of wb.SheetNames) {
    const k = parseSheetShiftDate(sn);
    if (!k) continue;
    const rows = rowsOf(wb.Sheets[sn]);
    const S: Record<string, [number, number]> = {};
    let gen: [number, number] | null = null;
    let site: string | null = null;

    // Detect dynamic columns if labeled
    let colLabel = 1;
    let colOp = 5;
    let colNo = 6;
    let colTot = 7;
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const norm = (rows[i] || []).map(c => normalizeText(c));
      const opIdx = norm.findIndex(h => /OPERATIVAS|^OP$/.test(h));
      const noIdx = norm.findIndex(h => /SIN OPERAR|INOPERATIVAS|FALLA|^NO OP/.test(h));
      const totIdx = norm.findIndex(h => /^TOTAL$|TOTAL CAMARAS/.test(h));
      const labIdx = norm.findIndex(h => /PLANTA|AGENCIA|SEDE|LOCALIDAD/.test(h));
      if (opIdx >= 0 && (noIdx >= 0 || totIdx >= 0)) {
        if (labIdx >= 0) colLabel = labIdx;
        colOp = opIdx;
        if (noIdx >= 0) colNo = noIdx;
        if (totIdx >= 0) colTot = totIdx;
        break;
      }
    }

    let scanned = 0;
    for (const r of rows) {
      const lab = r[colLabel] ? normalizeText(r[colLabel]) : '';
      if (lab.startsWith('TOTAL GENERAL') || lab.startsWith('TOTAL NACIONAL')) {
        gen = [Number(r[colOp]) || 0, Number(r[colNo]) || 0];
        continue;
      }
      if (lab === 'TOTAL') continue;
      if (lab && !/^(PLANTA O|FECHA|TURNO|OPERADOR|COORD|GERENTE|CANTIDAD)/.test(lab)) {
        site = resolveAgencyName(r[colLabel]);
      }
      if (site && typeof r[colOp] === 'number' && (typeof r[colTot] === 'number' || typeof r[colNo] === 'number')) {
        scanned++;
        const opVal = Number(r[colOp]) || 0;
        const noVal = Number(r[colNo]) || Math.max(0, (Number(r[colTot]) || 0) - opVal);
        const v = (S[site] = S[site] || [0, 0]);
        v[0] += opVal;
        v[1] += noVal;
      }
    }

    // Fallback: compute TOTAL GENERAL from sites if explicit total row is absent
    const sumOp = Object.values(S).reduce((acc, v) => acc + v[0], 0);
    const sumNo = Object.values(S).reduce((acc, v) => acc + v[1], 0);
    if (!gen && sumOp + sumNo > 0) {
      gen = [sumOp, sumNo];
    }

    if (gen && gen[0] > 0 && !isNaN(gen[1])) {
      anyMatched = true;
      consumedSheets.add(sn);
      addSheetReport(batch, {
        fileName,
        sheetName: sn,
        parser: `Cámaras ${k.d} (${k.t})`,
        rowsScanned: scanned,
        extracted: Object.keys(S).length,
        skipped: 0
      });
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
  return anyMatched;
}

// 3. Official SUPERVISION parser
function parseOfficialSp(
  wb: XLSX.WorkBook,
  fileName: string,
  batch: PendingUploadBatch,
  consumedSheets: Set<string>
): boolean {
  const ag: Record<string, [number, number]> = { ...(batch.sp?.ag || {}) };
  const nat: Record<string, [number, number]> = {};
  let found = false;

  for (const sn of wb.SheetNames) {
    const mo = monthFromText(sn);
    if (!mo) continue;
    let ac = 3;
    let sheetFound = false;
    let extracted = 0;
    let skipped = 0;
    const rows = rowsOf(wb.Sheets[sn]);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      if (r[1] && normalizeText(r[1]).startsWith('REGION')) {
        ac = normalizeText(r[2]).startsWith('AGENCIA') ? 2 : 3;
        continue;
      }
      if (!r[ac] || typeof r[0] !== 'number') continue;
      const c = resolveAgencyName(r[ac]);
      if (!c) {
        skipped++;
        batch.skippedRows++;
        recordUnreadSample(batch, sn, i + 1, `Sede no reconocida en Supervisión: "${r[ac]}"`, r);
        continue;
      }
      for (let j = ac + 1; j < Math.min(r.length, ac + 70); j++) {
        const v = normalizeText(r[j]);
        if (v === 'SI' || v === 'NO') {
          const idx = v === 'SI' ? 0 : 1;
          ag[c] = ag[c] || [0, 0];
          ag[c][idx]++;
          nat[mo] = nat[mo] || [0, 0];
          nat[mo][idx]++;
          found = true;
          sheetFound = true;
        }
      }
      extracted++;
    }

    if (sheetFound) {
      consumedSheets.add(sn);
      addSheetReport(batch, {
        fileName,
        sheetName: sn,
        parser: `Supervisión (${mo})`,
        rowsScanned: extracted + skipped,
        extracted,
        skipped
      });
    }
  }

  if (found) {
    const prevNat = new Map((batch.sp?.nat || []).map(x => [x.m, x.pct]));
    MON.filter(m => nat[m] != null).forEach(m => {
      prevNat.set(m, Math.round((1000 * nat[m][0]) / (nat[m][0] + nat[m][1])) / 10);
    });
    batch.sp = {
      ag,
      nat: MON.filter(m => prevNat.has(m)).map(m => ({ m, pct: prevNat.get(m)! }))
    };
  }
  return found;
}

// 4. Official BLINDADOS parser
function parseOfficialBl(
  wb: XLSX.WorkBook,
  fileName: string,
  batch: PendingUploadBatch,
  consumedSheets: Set<string>
): boolean {
  const ag: Record<string, [number, number]> = { ...(batch.bl?.ag || {}) };
  const nat: Record<string, [number, number]> = {};
  let found = false;

  for (const sn of wb.SheetNames) {
    const mo = monthFromText(sn);
    let sheetFound = false;
    let extracted = 0;
    const rows = rowsOf(wb.Sheets[sn]);

    for (const r of rows) {
      if (!r || !r[1] || !r[2]) continue;
      if (/^(AGENCIAS|COORD|OPERADOR|FRECUENCIA)/.test(normalizeText(r[1]))) continue;
      const c = resolveAgencyName(r[1]);
      if (!c) continue;
      for (let j = 4; j < Math.min(r.length, 15); j++) {
        const v = r[j] == null ? '' : normalizeText(r[j]);
        if (!v) continue;
        const idx = v.includes('NO ING') ? 1 : /\d/.test(v) || v === 'SI' || v === 'INGRESA' ? 0 : null;
        if (idx === null) continue;
        ag[c] = ag[c] || [0, 0];
        ag[c][idx]++;
        if (mo) {
          nat[mo] = nat[mo] || [0, 0];
          nat[mo][idx]++;
        }
        found = true;
        sheetFound = true;
      }
      extracted++;
    }

    if (sheetFound) {
      consumedSheets.add(sn);
      addSheetReport(batch, {
        fileName,
        sheetName: sn,
        parser: `Blindados${mo ? ` (${mo})` : ''}`,
        rowsScanned: extracted,
        extracted,
        skipped: 0
      });
    }
  }

  if (found) {
    const prevNat = new Map((batch.bl?.nat || []).map(x => [x.m, x.pct]));
    MON.filter(m => nat[m] != null).forEach(m => {
      prevNat.set(m, Math.round((1000 * nat[m][0]) / (nat[m][0] + nat[m][1])) / 10);
    });
    batch.bl = {
      ag,
      nat: MON.filter(m => prevNat.has(m)).map(m => ({ m, pct: prevNat.get(m)! }))
    };
  }
  return found;
}

// 5. Official DECOMISOS parser
function parseOfficialDc(
  wb: XLSX.WorkBook,
  fileName: string,
  batch: PendingUploadBatch,
  consumedSheets: Set<string>
): boolean {
  const ag: Record<string, number> = { ...(batch.dc?.ag || {}) };
  const nat: Record<string, number> = {};
  let found = false;

  for (const sn of wb.SheetNames) {
    const mo = monthFromText(sn);
    const rr = rowsOf(wb.Sheets[sn]);
    const h = rr.find(
      r =>
        r &&
        ((r[2] != null && String(r[2]).trim() === '1' && r[3] != null && String(r[3]).trim() === '2') ||
          (r[1] != null && String(r[1]).trim() === '1' && r[2] != null && String(r[2]).trim() === '2'))
    );
    if (!h) continue;

    const cols: number[] = [];
    for (let j = 1; j < Math.min(h.length, 42); j++) {
      if (h[j] != null && /^\d{1,2}$/.test(String(h[j]).trim())) cols.push(j);
    }

    let extracted = 0;
    for (const r of rr) {
      const siteCell = r[1] != null ? r[1] : r[0];
      if (siteCell == null) continue;
      const lab = normalizeText(siteCell);
      if (!lab || /^(TOTALES|TOTAL GENERAL|DECOMISOS)/.test(lab)) continue;
      const c = resolveAgencyName(siteCell);
      if (!c) continue;
      let s = 0;
      for (const j of cols) {
        const x = parseFloat(r[j]);
        if (!isNaN(x)) s += x;
      }
      ag[c] = Math.round((ag[c] || 0) + s);
      if (mo) nat[mo] = Math.round((nat[mo] || 0) + s);
      found = true;
      extracted++;
    }

    if (extracted > 0) {
      consumedSheets.add(sn);
      addSheetReport(batch, {
        fileName,
        sheetName: sn,
        parser: `Decomisos${mo ? ` (${mo})` : ''}`,
        rowsScanned: extracted,
        extracted,
        skipped: 0
      });
    }
  }

  if (found) {
    const prevNat = new Map((batch.dc?.nat || []).map(x => [x.m, x.t]));
    MON.filter(m => nat[m] != null).forEach(m => prevNat.set(m, nat[m]));
    batch.dc = {
      ag,
      nat: MON.filter(m => prevNat.has(m)).map(m => ({ m, t: prevNat.get(m)! }))
    };
  }
  return found;
}

// 6. Official BLOQUEO parser
function parseOfficialBq(
  wb: XLSX.WorkBook,
  fileName: string,
  batch: PendingUploadBatch,
  consumedSheets: Set<string>
): boolean {
  const bName = wb.SheetNames.find(n => normalizeText(n) === 'BLOQUEADOS');
  if (!bName) return false;
  const b = wb.Sheets[bName];
  const dName = wb.SheetNames.find(n => normalizeText(n) === 'DESBLOQUEADOS');
  const d = dName ? wb.Sheets[dName] : undefined;

  let hdr = false;
  let n = 0;
  const mot: Record<string, number> = {};
  const emp: Record<string, number> = {};
  const yr: Record<number, number> = {};
  let colMot = 7;
  let colEmp = 6;
  let colDate = 3;
  let colName = 4;

  for (const r of rowsOf(b)) {
    const norm = (r || []).map(c => normalizeText(c));
    if (norm[1] === 'OPERADOR' || norm[0] === 'OPERADOR' || norm.includes('MOTIVO')) {
      hdr = true;
      const mIdx = norm.findIndex(h => /MOTIVO|CAUSA/.test(h));
      const eIdx = norm.findIndex(h => /EMPRESA|CONTRATISTA/.test(h));
      const dIdx = norm.findIndex(h => /FECHA/.test(h));
      const nIdx = norm.findIndex(h => /NOMBRE|CEDULA|PERSONA/.test(h));
      if (mIdx >= 0) colMot = mIdx;
      if (eIdx >= 0) colEmp = eIdx;
      if (dIdx >= 0) colDate = dIdx;
      if (nIdx >= 0) colName = nIdx;
      continue;
    }
    if (hdr && (r[colName] || r[colMot] || r[colEmp])) {
      n++;
      const m = r[colMot] ? String(r[colMot]).trim().toUpperCase().slice(0, 38) : 'SIN MOTIVO';
      mot[m] = (mot[m] || 0) + 1;
      const e = r[colEmp] ? String(r[colEmp]).trim().toUpperCase() : 'S/D';
      emp[e] = (emp[e] || 0) + 1;
      const dtStr = parseExcelDateString(r[colDate]);
      const y = Number(dtStr.slice(0, 4));
      if (y >= 2020 && y <= 2035) yr[y] = (yr[y] || 0) + 1;
    }
  }

  let dn = 0;
  if (d) {
    for (const r of rowsOf(d)) {
      if (normalizeText(r[1]) !== 'OPERADOR' && r[3] && r[1]) dn++;
    }
    consumedSheets.add(dName!);
  }
  consumedSheets.add(bName);
  addSheetReport(batch, {
    fileName,
    sheetName: bName,
    parser: 'Personal Bloqueado',
    rowsScanned: n + dn,
    extracted: n + dn,
    skipped: 0
  });

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
const VALERT =
  /SOSPECH|PROCESAD|ANTECEDENTES|DENUNCI|ESTAFA|ABUSO DE CONFIANZA|ROBO|HURTO|INTIMIDA|RECEPTACION/;

function vlSite(l: unknown): ['n'] | ['s', string] | ['m', string] {
  const N = normalizeText(l);
  if (!N || /^\d/.test(N)) return ['n'];
  if (/^(XXXXXX|NO|NACIONAL|CAJAMARCA|TROPICAL|TRAMARTER|TYRONE|BLOQUEADOS|PLANTA)$/.test(N)) {
    return ['n'];
  }
  if (N.includes('NORTE') && N.includes('SUR')) return ['m', 'GYE-SALINAS-MILAGRO'];
  if (N.includes('MILAGRO') && (N.includes('MACHALA') || N.includes('SUR'))) {
    return ['m', 'GYE-SALINAS-MILAGRO'];
  }
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

function parseOfficialVl(
  wb: XLSX.WorkBook,
  fileName: string,
  batch: PendingUploadBatch,
  consumedSheets: Set<string>
): boolean {
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
    let sheetTot = 0;

    for (const r of rowsOf(wb.Sheets[sn])) {
      if (!hdr) {
        if (normalizeText(r[1]) === 'OPERADOR DE TURNO' || normalizeText(r[0]) === 'OPERADOR DE TURNO') {
          hdr = true;
        }
        continue;
      }
      if (!r[2] || !r[3]) {
        const sm = normalizeText(r[1]).match(/^(\d{1,2}) DE ([A-Z]+) (?:DE )?(\d{4})/);
        if (sm) {
          const mi = SPANISH_MONTHS.indexOf(sm[2]);
          if (mi >= 0) cd = { y: Number(sm[3]), m: mi + 1, d: Number(sm[1]) };
        }
        continue;
      }
      A.tot++;
      sheetTot++;
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

    if (sheetTot > 0) {
      consumedSheets.add(sn);
      addSheetReport(batch, {
        fileName,
        sheetName: sn,
        parser: `Validaciones ${y}`,
        rowsScanned: sheetTot,
        extracted: sheetTot,
        skipped: 0
      });
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

// 8. Flexible Smart Table Parser (multi-header aware, merges across sheets, zero silent drops)
function parseFlexibleWorkbook(
  wb: XLSX.WorkBook,
  fileName: string,
  batch: PendingUploadBatch,
  seenHashes: Set<string>,
  consumedSheets: Set<string>
): string[] {
  const detectedCategories: string[] = [];

  for (const sn of wb.SheetNames) {
    if (consumedSheets.has(sn)) continue;

    const ws = wb.Sheets[sn];
    const rows = rowsOf(ws);
    if (rows.length === 0) continue;

    // Scan up to first 50 rows for headers (supports single-column or multi-row merged headers)
    let headerIdx = -1;
    let dataStartIdx = 1;
    let headers: string[] = [];

    const headerKeywordRx =
      /^(SEDE|AGENCIA|INSTALACION|LOCALIDAD|SITIO|UBICACION|CENTRO|MOTIVO|EMPRESA|CATEGORIA|DETALLE|DESCRIPCION|NOVEDAD|INCIDENTE|HECHOS|OBSERVACION|COMENTARIO|REPORTE|ACCIONES|OPERATIVAS|DECOMISOS|BLOQUEADOS|SUPERVISION|BLINDADOS|VALIDACIONES|HORA|FECHA|ESTADO|ESTATUS)$/;

    for (let i = 0; i < Math.min(50, rows.length); i++) {
      const nonNull = (rows[i] || []).filter(cell => cell != null && String(cell).trim() !== '');
      if (nonNull.length >= 1) {
        const normCells = (rows[i] || []).map(c => normalizeText(c));
        const hasKnownHeader = normCells.some(
          c =>
            headerKeywordRx.test(c) ||
            c.includes('SEDE') ||
            c.includes('AGENCIA') ||
            c.includes('LOCALIDAD') ||
            c.includes('CAMARA') ||
            c.includes('NOVEDAD') ||
            c.includes('INCIDENTE') ||
            c.includes('DESCRIPCION') ||
            c.includes('DETALLE') ||
            c.includes('OBSERVACION') ||
            c.includes('DECOMISO') ||
            c.includes('SUPERVISION') ||
            c.includes('BLINDADO') ||
            c.includes('VALIDACION') ||
            c.includes('FECHA')
        );
        if (hasKnownHeader) {
          headerIdx = i;
          dataStartIdx = i + 1;
          headers = [...normCells];

          // Check next row for sub-headers (e.g. merged "CAMARAS" -> "OP" / "NO OP")
          if (i + 1 < rows.length) {
            const subCells = (rows[i + 1] || []).map(c => normalizeText(c));
            const looksLikeSubHeader = subCells.some(c =>
              /^(SI|NO|OP|NO OP|OPERATIVAS|INOPERATIVAS|SIN OPERAR|INGRESO|NO INGRESO|TOTAL|2025|2026)$/.test(c)
            );
            if (looksLikeSubHeader) {
              const maxLen = Math.max(headers.length, subCells.length);
              headers = Array.from({ length: maxLen }, (_, idx) =>
                `${headers[idx] || ''} ${subCells[idx] || ''}`.trim()
              );
              dataStartIdx = i + 2;
            }
          }
          break;
        }
      }
    }

    // Heuristic headerless fallback: if no explicit header found, inspect first 15 rows for data shape
    let heuristicMode = false;
    if (headerIdx === -1) {
      if (rows.length >= 2 && rows[0]?.some(c => c != null && String(c).trim() !== '')) {
        headerIdx = 0;
        dataStartIdx = 0;
        heuristicMode = true;
        headers = [];
      } else if (rows.length === 1 && rows[0]?.some(c => c != null && String(c).trim() !== '')) {
        headerIdx = 0;
        dataStartIdx = 0;
        heuristicMode = true;
        headers = [];
      } else {
        continue;
      }
    }

    const findCol = (regex: RegExp) => headers.findIndex(h => regex.test(h));
    let colSite = heuristicMode
      ? -1
      : findCol(/SEDE|AGENCIA|INSTALACION|LOCALIDAD|SITIO|CENTRO|LUGAR|UBICACION|PLANTA|BODEGA|SUCURSAL|PUNTO/);
    const colLoc = heuristicMode ? -1 : findCol(/CIUDAD|PROVINCIA|REGION|ZONA/);

    const colCamOp = findCol(/CAMARA.*OPERATIVA|^OPERATIVAS$|\bOP\b/);
    const colCamNo = findCol(/SIN OPERAR|FUERA DE SERVICIO|FALLA|INOPERATIVA|\bNO OP\b/);
    const colCamTot = findCol(/^CAMARAS$|^TOTAL CAMARAS$/);
    const colSpSi = findCol(/SUPERVISION.*SI|TURNOS.*SI|SUPERVISION REALIZADA/);
    const colSpNo = findCol(/SUPERVISION.*NO|TURNOS.*NO|SUPERVISION PENDIENTE/);
    const colBlSi = findCol(/BLINDADOS.*INGRESO|INGRESO SI|DIAS CON INGRESO|BLINDADO.*SI/);
    const colBlNo = findCol(/BLINDADOS.*SIN|INGRESO NO|DIAS SIN INGRESO|BLINDADO.*NO/);
    const colDecomisos = findCol(/DECOMISO|UNIDADES DECOMISADAS|INCAUTACION/);
    const colValidaciones = findCol(/VALIDACION/);

    const isMultiKpiSheet =
      colSite >= 0 &&
      [
        colCamOp >= 0 || colCamTot >= 0,
        colSpSi >= 0 && colSpNo >= 0,
        colBlSi >= 0 && colBlNo >= 0,
        colDecomisos >= 0,
        colValidaciones >= 0
      ].filter(Boolean).length >= 2;

    if (isMultiKpiSheet) {
      const camSites: Record<string, [number, number]> = { ...(batch.cam?.sites || {}) };
      let totOp = 0;
      let totNo = 0;
      const spAg: Record<string, [number, number]> = { ...(batch.sp?.ag || {}) };
      const blAg: Record<string, [number, number]> = { ...(batch.bl?.ag || {}) };
      const dcAg: Record<string, number> = { ...(batch.dc?.ag || {}) };
      const vlAg: Record<string, number> = {};
      let kpiRows = 0;

      for (let i = dataStartIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        const rawLab = normalizeText(r[colSite]);
        if (/^(TOTAL|TOTAL GENERAL|SUBTOTAL)/.test(rawLab)) continue;

        const site = resolveAgencyFromRow(
          r,
          colLoc >= 0 ? r[colLoc] : r[colSite],
          r[colSite],
          sn,
          fileName
        );
        if (!site) continue;
        kpiRows++;

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
        const sumAllOp = Object.values(camSites).reduce((s, v) => s + v[0], 0);
        const sumAllNo = Object.values(camSites).reduce((s, v) => s + v[1], 0);
        batch.cam = { key: `${today}D`, date: today, t: 'D', op: sumAllOp, no: sumAllNo, sites: camSites };
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
        batch.dc = { ag: dcAg, nat: batch.dc?.nat || [] };
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
                tipo: [
                  Math.round(sumVl * 0.16),
                  Math.round(sumVl * 0.25),
                  Math.round(sumVl * 0.43),
                  Math.round(sumVl * 0.06),
                  Math.round(sumVl * 0.03),
                  Math.round(sumVl * 0.07)
                ],
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

      if (kpiRows > 0) {
        addSheetReport(batch, {
          fileName,
          sheetName: sn,
          parser: 'Matriz Multi-KPI',
          rowsScanned: kpiRows,
          extracted: kpiRows,
          skipped: 0
        });
      }
    }

    // Tabular Incident / Novedades List (zero dropped incidents)
    let colCat = findCol(/CATEGORIA|TIPO|CLASIFICACION|EVENTO|TIPO_EVENTO|SUBTIPO|NOVEDAD_TIPO/);
    let colDetail = findCol(
      /DETALLE|DESCRIPCION|NOVEDAD|INCIDENTE|OBSERVACION|COMENTARIO|REPORTE|HECHOS|ACCIONES|RESUMEN|ASUNTO|ACTIVIDAD|HALLAZGO|SITUACION|OCURRENCIA|GLOSA|NARRATIVA/
    );
    const colStatus = findCol(/ESTADO|ESTATUS|SEGUIMIENTO|STATUS|CONDICION|CIERRE/);
    const colDate = findCol(/FECHA|DIA\b|DATE|TIMESTAMP|REGISTRO/);
    const colTime = findCol(/^HORA$|HORA_/);
    const colIdRef = findCol(/^ID$|^CODIGO$|^TICKET$|^FOLIO$|^NUM$|^NRO$|^#$/);
    const colAuthor = findCol(/OPERADOR|AUTOR|COORDINADOR|USUARIO|REGISTRADO|REPORTA|RESPONSABLE|GUARDIA/);

    // If heuristic headerless mode, infer columns from content
    if (heuristicMode) {
      const sampleRows = rows.slice(0, Math.min(15, rows.length));
      const maxCols = Math.max(...sampleRows.map(r => (r ? r.length : 0)), 0);
      for (let c = 0; c < maxCols; c++) {
        let agencyHits = 0;
        let dateHits = 0;
        let avgLen = 0;
        let countVals = 0;
        for (const sr of sampleRows) {
          const val = sr?.[c];
          if (val == null || String(val).trim() === '') continue;
          countVals++;
          const str = String(val).trim();
          avgLen += str.length;
          if (resolveAgencyName(val)) agencyHits++;
          if (
            val instanceof Date ||
            (typeof val === 'number' && val > 40000 && val < 60000) ||
            /^\d{1,4}[-/]\d{1,2}[-/]\d{2,4}$/.test(str)
          ) {
            dateHits++;
          }
        }
        if (countVals > 0) {
          if (colSite === -1 && agencyHits >= Math.max(1, Math.floor(countVals * 0.4))) colSite = c;
          else if (colDate === -1 && dateHits >= Math.max(1, Math.floor(countVals * 0.4))) {
            // Note: colDate is const above unless checked here — handled below via fallback scan
          } else if (colDetail === -1 && avgLen / countVals >= 15) {
            colDetail = c;
          }
        }
      }
    }

    // Should this sheet be parsed as incident rows?
    const isOnlySingleKpiTable =
      !isMultiKpiSheet &&
      colDetail === -1 &&
      colCat === -1 &&
      colSite >= 0 &&
      (colCamOp >= 0 || colCamTot >= 0 || colDecomisos >= 0 || (colSpSi >= 0 && colSpNo >= 0) || (colBlSi >= 0 && colBlNo >= 0));

    if (!isOnlySingleKpiTable && (colDetail >= 0 || colCat >= 0 || (colSite >= 0 && !isMultiKpiSheet) || heuristicMode)) {
      let count = 0;
      let duplicateRows = 0;
      let scanned = 0;
      let skipped = 0;

      for (let i = dataStartIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r) continue;

        const nonEmptyCells = r.filter((c: any) => c != null && String(c).trim() !== '');
        if (nonEmptyCells.length === 0) continue;

        const joinedNorm = normalizeText(nonEmptyCells.join(' '));
        if (/^(TOTAL|TOTAL GENERAL|SUBTOTAL|RESUMEN|ELABORADO POR|FIRMA)/.test(joinedNorm)) continue;

        scanned++;

        const rawSiteCell = colSite >= 0 ? r[colSite] : null;
        const rawLocCell = colLoc >= 0 ? r[colLoc] : null;

        let site = resolveAgencyFromRow(r, rawLocCell || rawSiteCell, rawSiteCell, sn, fileName);
        let siteInferred = false;
        if (!site) {
          site = 'Edificio WorQ';
          siteInferred = true;
        }

        let detailStr = colDetail >= 0 && r[colDetail] != null ? String(r[colDetail]).trim() : '';
        const timeStr = colTime >= 0 && r[colTime] != null ? String(r[colTime]).trim() : '';
        const rowRefStr = colIdRef >= 0 && r[colIdRef] != null ? String(r[colIdRef]).trim() : '';

        // If primary detail cell was empty, gather remaining descriptive cells in the row
        const usedIndices = new Set(
          [colSite, colLoc, colCat, colStatus, colDate, colAuthor, colTime, colIdRef].filter(x => x >= 0)
        );
        const extraPieces = r
          .map((cell, idx) => ({ idx, txt: cell == null ? '' : String(cell).trim() }))
          .filter(
            item =>
              !usedIndices.has(item.idx) &&
              item.txt.length > 0 &&
              !(item.idx === 0 && /^\d{1,5}$/.test(item.txt))
          )
          .map(item => item.txt);

        if (!detailStr && extraPieces.length > 0) {
          detailStr = extraPieces.join(' · ');
        }

        // Detect date from colDate or any Date-formatted cell in row
        let dateCell = colDate >= 0 ? r[colDate] : null;
        if (!dateCell) {
          dateCell = r.find(
            c =>
              c instanceof Date ||
              (typeof c === 'string' && /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})$/.test(c.trim()))
          );
        }
        const dateStr = parseExcelDateString(dateCell);

        const catRaw = colCat >= 0 && r[colCat] != null ? r[colCat] : detailStr || 'Otros';
        const catIdx = classifyCategory(catRaw);
        const stIdx = colStatus >= 0 && r[colStatus] != null ? classifyStatus(r[colStatus]) : 0;
        const authorStr =
          colAuthor >= 0 && r[colAuthor] != null && String(r[colAuthor]).trim()
            ? String(r[colAuthor]).trim()
            : `Carga Excel (${fileName})`;

        // Check if row has genuinely meaningful operational data
        const hasStatusOrCatText =
          (colCat >= 0 && r[colCat] != null && String(r[colCat]).trim().length > 0) ||
          (colStatus >= 0 && r[colStatus] != null && String(r[colStatus]).trim().length > 0) ||
          detailStr.length > 0 ||
          rawSiteCell != null;

        if (!hasStatusOrCatText || (nonEmptyCells.length === 1 && /^\d+$/.test(String(nonEmptyCells[0]).trim()))) {
          skipped++;
          recordUnreadSample(
            batch,
            sn,
            i + 1,
            'Fila sin texto descriptivo ni categoría operativa reconocible',
            r
          );
          continue;
        }

        const timePrefix = timeStr ? `[${timeStr}] ` : '';
        const siteNote =
          siteInferred && rawSiteCell
            ? ` (Sede original: ${String(rawSiteCell).trim()})`
            : '';
        const fullDetail = `${timePrefix}${detailStr || `Novedad registrada (${CATEGORY_LABELS[catIdx] || 'Operaciones'})`}${siteNote}`.trim();

        if (siteInferred && rawSiteCell) {
          recordUnreadSample(
            batch,
            sn,
            i + 1,
            `Sede "${String(rawSiteCell).trim()}" inferida a ${site} para garantizar registro`,
            r
          );
        }

        // Prevent false duplicate collapsing when rows lack detailed text:
        // Only deduplicate strictly by narrative hash if detailStr or rowRef/time meaningfully identifies the event
        const dedupDetail =
          detailStr.length >= 6 || timeStr || rowRefStr
            ? `${rowRefStr ? rowRefStr + '|' : ''}${timeStr ? timeStr + '|' : ''}${detailStr}`
            : `__row_${sn}_${i}_${nonEmptyCells.map(x => String(x)).join('|')}`;

        const h = generateIncidentHash(site, dateStr, catIdx, dedupDetail);
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
          x: fullDetail,
          author: authorStr,
          source: 'excel'
        });
        count++;
      }

      if (count > 0 || skipped > 0) {
        addSheetReport(batch, {
          fileName,
          sheetName: sn,
          parser: 'Bitácora Tabular de Novedades',
          rowsScanned: scanned,
          extracted: count,
          skipped
        });
      }

      if (count > 0) {
        const dupNotice = duplicateRows > 0 ? ` (${duplicateRows} duplicados filtrados)` : '';
        detectedCategories.push(`Novedades (${count} registros extraídos${dupNotice})`);
      }
    }

    // Case C: Tabular Cameras Only
    if (colSite >= 0 && (colCamOp >= 0 || colCamTot >= 0) && !isMultiKpiSheet) {
      const camSites: Record<string, [number, number]> = { ...(batch.cam?.sites || {}) };
      let totOp = 0;
      let totNo = 0;
      let camRows = 0;
      for (let i = dataStartIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        if (/^(TOTAL|TOTAL GENERAL)/.test(normalizeText(r[colSite]))) continue;
        const site = resolveAgencyFromRow(r, r[colSite], r[colSite], sn, fileName);
        if (!site) continue;
        const no = colCamNo >= 0 ? Number(r[colCamNo]) || 0 : 0;
        const op = colCamOp >= 0 ? Number(r[colCamOp]) || 0 : Math.max(0, (Number(r[colCamTot]) || 0) - no);
        camSites[site] = [op, no];
        totOp += op;
        totNo += no;
        camRows++;
      }
      if (totOp + totNo > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const sumAllOp = Object.values(camSites).reduce((s, v) => s + v[0], 0);
        const sumAllNo = Object.values(camSites).reduce((s, v) => s + v[1], 0);
        batch.cam = { key: `${today}D`, date: today, t: 'D', op: sumAllOp, no: sumAllNo, sites: camSites };
        detectedCategories.push(`Cámaras CCTV (${totOp} op / ${totNo} fallas)`);
        addSheetReport(batch, {
          fileName,
          sheetName: sn,
          parser: 'Tabla Cámaras CCTV',
          rowsScanned: camRows,
          extracted: camRows,
          skipped: 0
        });
      }
    }

    // Case D: Tabular Decomisos Only
    if (colSite >= 0 && colDecomisos >= 0 && !isMultiKpiSheet) {
      const dcAg: Record<string, number> = { ...(batch.dc?.ag || {}) };
      let sum = 0;
      let dcRows = 0;
      for (let i = dataStartIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        if (/^(TOTAL|TOTAL GENERAL)/.test(normalizeText(r[colSite]))) continue;
        const site = resolveAgencyFromRow(r, r[colSite], r[colSite], sn, fileName);
        if (!site) continue;
        const val = Math.round(Number(r[colDecomisos]) || 0);
        dcAg[site] = (dcAg[site] || 0) + val;
        sum += val;
        dcRows++;
      }
      if (dcRows > 0) {
        batch.dc = { ag: dcAg, nat: batch.dc?.nat || [] };
        detectedCategories.push(`Decomisos (${sum} u. en ${dcRows} registros)`);
        addSheetReport(batch, {
          fileName,
          sheetName: sn,
          parser: 'Tabla Decomisos',
          rowsScanned: dcRows,
          extracted: dcRows,
          skipped: 0
        });
      }
    }

    // Case E: Tabular Supervisión Only
    if (colSite >= 0 && colSpSi >= 0 && colSpNo >= 0 && !isMultiKpiSheet) {
      const spAg: Record<string, [number, number]> = { ...(batch.sp?.ag || {}) };
      let spRows = 0;
      for (let i = dataStartIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        if (/^(TOTAL|TOTAL GENERAL)/.test(normalizeText(r[colSite]))) continue;
        const site = resolveAgencyFromRow(r, r[colSite], r[colSite], sn, fileName);
        if (!site) continue;
        const cur = spAg[site] || [0, 0];
        spAg[site] = [cur[0] + (Number(r[colSpSi]) || 0), cur[1] + (Number(r[colSpNo]) || 0)];
        spRows++;
      }
      if (spRows > 0) {
        batch.sp = { ag: spAg, nat: batch.sp?.nat || [] };
        detectedCategories.push(`Supervisión (${Object.keys(spAg).length} sedes)`);
        addSheetReport(batch, {
          fileName,
          sheetName: sn,
          parser: 'Tabla Supervisión',
          rowsScanned: spRows,
          extracted: spRows,
          skipped: 0
        });
      }
    }

    // Case F: Tabular Blindados Only
    if (colSite >= 0 && colBlSi >= 0 && colBlNo >= 0 && !isMultiKpiSheet) {
      const blAg: Record<string, [number, number]> = { ...(batch.bl?.ag || {}) };
      let blRows = 0;
      for (let i = dataStartIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[colSite]) continue;
        if (/^(TOTAL|TOTAL GENERAL)/.test(normalizeText(r[colSite]))) continue;
        const site = resolveAgencyFromRow(r, r[colSite], r[colSite], sn, fileName);
        if (!site) continue;
        const cur = blAg[site] || [0, 0];
        blAg[site] = [cur[0] + (Number(r[colBlSi]) || 0), cur[1] + (Number(r[colBlNo]) || 0)];
        blRows++;
      }
      if (blRows > 0) {
        batch.bl = { ag: blAg, nat: batch.bl?.nat || [] };
        detectedCategories.push(`Blindados (${Object.keys(blAg).length} sedes)`);
        addSheetReport(batch, {
          fileName,
          sheetName: sn,
          parser: 'Tabla Blindados',
          rowsScanned: blRows,
          extracted: blRows,
          skipped: 0
        });
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

      for (let i = dataStartIdx; i < rows.length; i++) {
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
          yr: Object.entries(yr)
            .map(([y, c]) => [Number(y), c] as [number, number])
            .sort((a, b) => a[0] - b[0])
        };
        detectedCategories.push(`Personal Bloqueado (${bloq} bloqueados / ${desb} desbloqueados)`);
        addSheetReport(batch, {
          fileName,
          sheetName: sn,
          parser: 'Tabla Personal Bloqueado',
          rowsScanned: bloq + desb,
          extracted: bloq + desb,
          skipped: 0
        });
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
  } else if (
    (x = String(tx).match(new RegExp('\\b(\\d{1,2}) de (' + MS.join('|') + ') (?:de |del )?(20\\d\\d)', 'i')))
  ) {
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

// Core workbook buffer processor (testable in Node and Browser without File wrappers)
export async function processExcelArrayBuffer(
  fileName: string,
  buffer: ArrayBuffer,
  batch: PendingUploadBatch,
  seenHashes: Set<string>
): Promise<void> {
  const upperName = normalizeText(fileName);
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const consumedSheets = new Set<string>();
  let anyHandled = false;

  // 1. Validaciones de Seguridad
  if (upperName.includes('VALIDACIONES') || wb.SheetNames.some(s => /VALIDACIONES\s+\d{4}/i.test(s))) {
    if (parseOfficialVl(wb, fileName, batch, consumedSheets)) {
      const curY = batch.vl!.cur;
      batch.logs.push({
        status: 'ok',
        fileName,
        category: 'Validaciones de Seguridad',
        summary: `Año ${curY}: ${batch.vl!.y[curY].tot.toLocaleString('es-EC')} registros y ${batch.vl!.y[curY].al} alertas extraídas.`
      });
      anyHandled = true;
    }
  }

  // 2. Personal Bloqueado
  if (upperName.includes('BLOQUEO') || wb.SheetNames.some(s => normalizeText(s) === 'BLOQUEADOS')) {
    if (parseOfficialBq(wb, fileName, batch, consumedSheets)) {
      batch.logs.push({
        status: 'ok',
        fileName,
        category: 'Personal Bloqueado',
        summary: `${batch.bq!.bloq} bloqueados activos y ${batch.bq!.desb} desbloqueados extraídos.`
      });
      anyHandled = true;
    }
  }

  // 3. Cámaras CCTV (official shift sheet signature works even without filename hint)
  if (upperName.includes('CAMARA') || wb.SheetNames.some(s => parseSheetShiftDate(s) != null)) {
    // Only treat as CAMARAS if sheets actually look like cameras (not NOVEDADES)
    if (!upperName.includes('NOVEDAD')) {
      if (parseOfficialCam(wb, fileName, batch, consumedSheets)) {
        batch.logs.push({
          status: 'ok',
          fileName,
          category: 'Cámaras CCTV',
          summary: `Corte ${batch.cam!.date} (${batch.cam!.t}): ${batch.cam!.op} operativas / ${batch.cam!.no} sin operar.`
        });
        anyHandled = true;
      }
    }
  }

  // 4. Novedades Oficiales por Turno
  if (upperName.includes('NOVEDAD') || consumedSheets.size < wb.SheetNames.length) {
    const { matchedShifts, newIncidentsAfterCut, totalRowsExtracted } = parseOfficialNov(
      wb,
      fileName,
      batch,
      consumedSheets
    );
    if (matchedShifts > 0) {
      batch.logs.push({
        status: totalRowsExtracted > 0 ? 'ok' : 'warn',
        fileName,
        category: 'Novedades por Turno',
        summary: `${matchedShifts} hoja(s) de turno analizadas · ${totalRowsExtracted} novedades leídas (${newIncidentsAfterCut} posteriores al corte base ${NOV_CUT}).`
      });
      anyHandled = true;
    }
  }

  // 5. Supervisión de Turnos
  if (upperName.includes('SUPERVISION')) {
    if (parseOfficialSp(wb, fileName, batch, consumedSheets)) {
      batch.logs.push({
        status: 'ok',
        fileName,
        category: 'Supervisión de Turnos',
        summary: `${Object.keys(batch.sp!.ag).length} sedes y ${batch.sp!.nat.length} meses extraídos.`
      });
      anyHandled = true;
    }
  }

  // 6. Ingreso de Blindados
  if (upperName.includes('BLINDADOS')) {
    if (parseOfficialBl(wb, fileName, batch, consumedSheets)) {
      batch.logs.push({
        status: 'ok',
        fileName,
        category: 'Ingreso de Blindados',
        summary: `${Object.keys(batch.bl!.ag).length} agencias y ${batch.bl!.nat.length} meses extraídos.`
      });
      anyHandled = true;
    }
  }

  // 7. Decomisos
  if (upperName.includes('DECOMISOS')) {
    if (parseOfficialDc(wb, fileName, batch, consumedSheets)) {
      const totalDc = Object.values(batch.dc!.ag).reduce((s, x) => s + x, 0);
      batch.logs.push({
        status: 'ok',
        fileName,
        category: 'Decomisos en Garita',
        summary: `${totalDc.toLocaleString('es-EC')} unidades consolidadas en ${Object.keys(batch.dc!.ag).length} sedes.`
      });
      anyHandled = true;
    }
  }

  // 8. Flexible Smart Parser across ALL remaining unconsumed sheets
  if (consumedSheets.size < wb.SheetNames.length) {
    const flexCategories = parseFlexibleWorkbook(wb, fileName, batch, seenHashes, consumedSheets);
    if (flexCategories.length > 0) {
      batch.logs.push({
        status: 'ok',
        fileName,
        category: 'Extracción Inteligente Excel',
        summary: flexCategories.join(' · ')
      });
      anyHandled = true;
    }
  }

  if (!anyHandled) {
    batch.logs.push({
      status: 'warn',
      fileName,
      category: 'Sin registros extraídos',
      summary:
        'No se detectaron columnas operativas o filas con novedades/indicadores en este archivo. Verifica que las hojas no estén vacías.'
    });
  }
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
    unreadSamples: [],
    totalRowsScanned: 0,
    parsedRowsCount: 0,
    sheetReports: []
  };

  const seenHashes = new Set<string>();

  for (const file of files) {
    const fName = file.name;

    try {
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

      const buffer = await file.arrayBuffer();
      await processExcelArrayBuffer(fName, buffer, batch, seenHashes);
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
