import React, { useRef, useState, useEffect } from 'react';
import {
  PendingUploadBatch,
  PendingUploadFilePayload,
  StoredRepoFile,
  UploadHistoryRecord
} from '../types/console';
import { ALL_AGENCY_NAMES, downloadTemplateExcel, processUploadedFiles } from '../utils/excelParser';
import { CATEGORY_LABELS } from '../data/consoleData';
import { formatNumber } from '../utils/dataUtils';
import { initAuth, googleSignIn, googleSignOut, getCachedAccessToken } from '../firebase/googleAuth';
import { listDriveSpreadsheets, fetchAndParseGoogleSpreadsheet, DriveSpreadsheetFile } from '../services/googleSheetsService';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  FileCheck2,
  RotateCcw,
  Sparkles,
  History,
  Cloud,
  RefreshCw,
  LogOut,
  FolderArchive,
  FileText,
  Layers
} from 'lucide-react';

interface ExcelUploaderBlockProps {
  onApplyBatch: (
    batch: PendingUploadBatch,
    fileNames: string[],
    storedFiles?: StoredRepoFile[],
    rawFilePayloads?: PendingUploadFilePayload[]
  ) => void;
  uploadHistory?: UploadHistoryRecord[];
  repoFiles?: StoredRepoFile[];
  auditReportsCount?: number;
  onResetBaseData?: () => void;
  compact?: boolean;
  onSuccessClose?: () => void;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildClientStoredName(originalName: string): string {
  const clean = originalName.split(/[\\/]/).pop() || 'archivo_cco.xlsx';
  const dotIdx = clean.lastIndexOf('.');
  const ext = dotIdx >= 0 ? clean.slice(dotIdx).toLowerCase() : '.xlsx';
  const stem = dotIdx >= 0 ? clean.slice(0, dotIdx) : clean;
  const safeBase =
    stem
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^[_.-]+|[_.-]+$/g, '')
      .slice(0, 90) || 'archivo_cco';
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('');
  const rand = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `${stamp}_${rand}__${safeBase}${ext}`;
}

export const ExcelUploaderBlock: React.FC<ExcelUploaderBlockProps> = ({
  onApplyBatch,
  uploadHistory = [],
  repoFiles = [],
  auditReportsCount = 0,
  onResetBaseData,
  compact = false,
  onSuccessClose
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeSourceTab, setActiveSourceTab] = useState<'excel' | 'sheets'>('excel');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingRepo, setIsSavingRepo] = useState(false);
  const [pendingBatch, setPendingBatch] = useState<PendingUploadBatch | null>(null);
  const [pendingFileNames, setPendingFileNames] = useState<string[]>([]);
  const [pendingRawFiles, setPendingRawFiles] = useState<File[]>([]);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);
  const [repoWarning, setRepoWarning] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [localRepoFiles, setLocalRepoFiles] = useState<StoredRepoFile[]>(repoFiles);

  // Google Workspace & Sheets state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [manualSheetId, setManualSheetId] = useState('');

  useEffect(() => {
    setLocalRepoFiles(repoFiles);
  }, [repoFiles]);

  useEffect(() => {
    const fetchRepoList = async () => {
      try {
        const res = await fetch('/api/repo/files', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.files)) {
            setLocalRepoFiles(data.files);
            return;
          }
        }
      } catch {
        // Ignore and try GitHub endpoint fallback
      }
      try {
        const ghRes = await fetch('/api/github-sync', { cache: 'no-store' });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (Array.isArray(ghData.repoFiles)) {
            setLocalRepoFiles(ghData.repoFiles);
          }
        }
      } catch {
        // Ignore if running completely offline
      }
    };
    fetchRepoList();

    const unsub = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setSheetsError(null);
    setIsProcessing(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        await loadDriveFiles(res.accessToken);
      }
    } catch (err: any) {
      setSheetsError(err?.message || 'Error al autenticar con Google');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleSignOut();
    setCurrentUser(null);
    setAccessToken(null);
    setDriveFiles([]);
  };

  const loadDriveFiles = async (token?: string) => {
    const tok = token || accessToken || getCachedAccessToken();
    if (!tok) return;
    setIsLoadingDriveFiles(true);
    setSheetsError(null);
    try {
      const files = await listDriveSpreadsheets(tok);
      setDriveFiles(files);
    } catch (err: any) {
      setSheetsError(err?.message || 'No se pudieron cargar los archivos de Google Drive');
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const handleSelectDriveSpreadsheet = async (file: DriveSpreadsheetFile) => {
    const tok = accessToken || getCachedAccessToken();
    if (!tok) {
      setSheetsError('Token no disponible. Por favor, vuelve a iniciar sesión con Google.');
      return;
    }
    setSheetsError(null);
    setIsProcessing(true);
    try {
      const batch = await fetchAndParseGoogleSpreadsheet(file.id, file.name, tok);
      setPendingBatch(batch);
      setPendingFileNames([`${file.name} (Google Sheets)`]);
      setPendingRawFiles([]);
    } catch (err: any) {
      setSheetsError(err?.message || 'Error al procesar la hoja de Google Sheets');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadManualSheet = async () => {
    if (!manualSheetId.trim()) return;
    const tok = accessToken || getCachedAccessToken();
    if (!tok) {
      setSheetsError('Debes iniciar sesión con Google para leer Google Sheets.');
      return;
    }
    let cleanId = manualSheetId.trim();
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) cleanId = match[1];

    setSheetsError(null);
    setIsProcessing(true);
    try {
      const batch = await fetchAndParseGoogleSpreadsheet(cleanId, 'Google Sheet Vinculada', tok);
      setPendingBatch(batch);
      setPendingFileNames([`Google Sheet (${cleanId.slice(0, 8)}...)`]);
      setPendingRawFiles([]);
    } catch (err: any) {
      setSheetsError(err?.message || 'Error al cargar el Google Sheet por ID o URL');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setAppliedBanner(null);
    setRepoWarning(null);
    setIsProcessing(true);
    try {
      const batch = await processUploadedFiles(files);
      setPendingBatch(batch);
      setPendingFileNames(files.map(f => f.name));
      setPendingRawFiles(files);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const updateRevSite = (idx: number, newSite: string) => {
    if (!pendingBatch) return;
    const nextRev = [...pendingBatch.rev];
    nextRev[idx] = { ...nextRev[idx], site: newSite || null };
    setPendingBatch({ ...pendingBatch, rev: nextRev });
  };

  const hasValidData = (b: PendingUploadBatch | null): boolean => {
    if (!b) return false;
    return (
      Object.keys(b.novShifts).length > 0 ||
      b.extractedIncidents.length > 0 ||
      Boolean(b.cam) ||
      Object.keys(b.camMonths).length > 0 ||
      Boolean(b.sp) ||
      Boolean(b.bl) ||
      Boolean(b.dc) ||
      Boolean(b.bq) ||
      Boolean(b.vl) ||
      b.rev.some(r => Boolean(r.site))
    );
  };

  const getDetectedIndicatorsSummary = (b: PendingUploadBatch): { label: string; detail: string }[] => {
    const items: { label: string; detail: string }[] = [];
    const shiftCount = Object.keys(b.novShifts).length;
    if (shiftCount > 0) {
      const totalRows = Object.values(b.novShifts).reduce(
        (acc, sh) => acc + Object.values(sh.ag).reduce((s, arr) => s + arr[0], 0),
        0
      );
      items.push({
        label: 'Novedades por Turno',
        detail: `${shiftCount} turnos · ${formatNumber(totalRows)} registros clasificados`
      });
    }
    if (b.extractedIncidents.length > 0) {
      items.push({
        label: 'Novedades en Bitácora',
        detail: `${formatNumber(b.extractedIncidents.length)} incidencias extraídas por sede y categoría`
      });
    }
    if (b.cam) {
      items.push({
        label: 'Cámaras CCTV',
        detail: `${formatNumber(b.cam.op)} operativas · ${formatNumber(b.cam.no)} sin operar (${Object.keys(b.cam.sites).length} sedes)`
      });
    }
    if (b.sp) {
      const si = Object.values(b.sp.ag).reduce((s, v) => s + v[0], 0);
      const tot = Object.values(b.sp.ag).reduce((s, v) => s + v[0] + v[1], 0);
      const pct = tot ? Math.round((1000 * si) / tot) / 10 : 0;
      items.push({
        label: 'Supervisión de Turnos',
        detail: `${Object.keys(b.sp.ag).length} sedes actualizadas · ${pct}% cumplimiento`
      });
    }
    if (b.bl) {
      const si = Object.values(b.bl.ag).reduce((s, v) => s + v[0], 0);
      const tot = Object.values(b.bl.ag).reduce((s, v) => s + v[0] + v[1], 0);
      const pct = tot ? Math.round((1000 * si) / tot) / 10 : 0;
      items.push({
        label: 'Ingreso de Blindados',
        detail: `${Object.keys(b.bl.ag).length} agencias actualizadas · ${pct}% frecuencia`
      });
    }
    if (b.dc) {
      const sum = Object.values(b.dc.ag).reduce((s, v) => s + v, 0);
      items.push({
        label: 'Decomisos Incautados',
        detail: `${formatNumber(sum)} unidades consolidadas en ${Object.keys(b.dc.ag).length} sedes`
      });
    }
    if (b.bq) {
      items.push({
        label: 'Personal Bloqueado',
        detail: `${formatNumber(b.bq.bloq)} bloqueados activos · ${formatNumber(b.bq.desb)} desbloqueados`
      });
    }
    if (b.vl) {
      const curY = b.vl.cur;
      items.push({
        label: `Validaciones de Seguridad (${curY})`,
        detail: `${formatNumber(b.vl.y[curY]?.tot || 0)} validaciones · ${b.vl.y[curY]?.al || 0} alertas`
      });
    }
    const validRevs = b.rev.filter(r => r.site);
    if (validRevs.length > 0) {
      items.push({
        label: 'Auditorías de Video (.docx)',
        detail: `${validRevs.length} informe(s) vinculados a sedes`
      });
    }
    return items;
  };

  const handleConfirmApply = async () => {
    if (!pendingBatch || !hasValidData(pendingBatch)) return;
    const summaryItems = getDetectedIndicatorsSummary(pendingBatch);

    setIsSavingRepo(true);
    setRepoWarning(null);
    let storedFiles: StoredRepoFile[] = [];
    const rawFilePayloads: PendingUploadFilePayload[] = [];
    const MAX_GITHUB_ATTACH_BYTES = 2_800_000;

    if (pendingRawFiles.length > 0) {
      try {
        const uploadable = pendingRawFiles.filter(f => /\.(xlsx|xlsm|xls|csv|docx)$/i.test(f.name));
        if (uploadable.length > 0) {
          const encodedList = await Promise.all(
            uploadable.map(async f => ({
              file: f,
              name: f.name,
              size: f.size,
              dataBase64: await fileToBase64(f)
            }))
          );

          // 1. Try Express local REPO PLATAFORMA endpoint (available in AI Studio / Node server)
          let localRepoOk = false;
          try {
            const res = await fetch('/api/repo/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                files: encodedList.map(item => ({ name: item.name, dataBase64: item.dataBase64 }))
              })
            });
            if (res.ok) {
              const json = await res.json();
              if (Array.isArray(json.files)) {
                storedFiles = json.files;
                localRepoOk = true;
              }
            }
          } catch {
            localRepoOk = false;
          }

          // 2. Prepare GitHub REPO PLATAFORMA payloads (works from published Vercel as well as AI Studio)
          let accumulatedB64Bytes = 0;
          encodedList.forEach((item, idx) => {
            const matchedStored = storedFiles[idx];
            const storedName = matchedStored?.storedName || buildClientStoredName(item.name);
            if (!localRepoOk) {
              storedFiles.push({
                originalName: item.name,
                storedName,
                size: item.size,
                uploadedAt: new Date().toISOString(),
                url: `/api/github-sync?download=${encodeURIComponent(storedName)}`
              });
            }
            if (item.size <= MAX_GITHUB_ATTACH_BYTES && accumulatedB64Bytes + item.dataBase64.length <= 3_600_000) {
              accumulatedB64Bytes += item.dataBase64.length;
              rawFilePayloads.push({
                originalName: item.name,
                storedName,
                size: item.size,
                dataBase64: item.dataBase64
              });
            }
          });

          if (storedFiles.length > 0) {
            setLocalRepoFiles(prev => [...storedFiles, ...prev]);
          }
          if (rawFilePayloads.length < encodedList.length) {
            setRepoWarning(
              'Los indicadores se integraron en línea; alguno de los archivos supera 2.8 MB y no se adjunta binario al commit automático de GitHub.'
            );
          }
        }
      } catch {
        setRepoWarning('Los indicadores se integraron en línea; no se pudo preparar la copia binaria del archivo.');
      }
    }

    onApplyBatch(pendingBatch, pendingFileNames, storedFiles, rawFilePayloads);
    setPendingBatch(null);
    setPendingFileNames([]);
    setPendingRawFiles([]);
    setIsSavingRepo(false);

    const archivedNotice =
      storedFiles.length > 0
        ? ` Sincronizado en la nube y vinculado en REPO PLATAFORMA (${storedFiles.length} archivo${storedFiles.length === 1 ? '' : 's'}).`
        : ' Sincronizado en la nube para todos los usuarios.';

    setAppliedBanner(
      `Datos integrados correctamente en: ${summaryItems.map(i => i.label).join(', ')}.${archivedNotice}`
    );

    if (onSuccessClose && storedFiles.length === 0) {
      setTimeout(() => {
        onSuccessClose();
      }, 1100);
    }
  };

  // Resolve stored files for a history row (either directly recorded on the history row or matched from REPO PLATAFORMA)
  const resolveHistoryFiles = (rec: UploadHistoryRecord): StoredRepoFile[] => {
    if (rec.storedFiles && rec.storedFiles.length > 0) return rec.storedFiles;
    if (!rec.fileNames || rec.fileNames.length === 0 || localRepoFiles.length === 0) return [];
    const matched: StoredRepoFile[] = [];
    for (const fn of rec.fileNames) {
      const hit = localRepoFiles.find(rf => rf.originalName.toLowerCase() === fn.toLowerCase());
      if (hit) matched.push(hit);
    }
    return matched;
  };

  return (
    <div className="space-y-5">
      {/* SECTION 07: ALIMENTAR DATOS - ARRASTRA TUS EXCEL */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md border border-blue-600/40 bg-blue-50 text-blue-800 font-mono-tabular text-xs font-extrabold tracking-wider">
              07
            </span>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-condensed uppercase tracking-wider">
              ALIMENTAR DATOS - ARRASTRA TUS EXCEL
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => downloadTemplateExcel('novedades')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
              title="Descargar formato Excel de ejemplo para Novedades"
            >
              <Download className="w-3 h-3 text-blue-700" />
              <span>Plantilla Novedades</span>
            </button>
            <button
              type="button"
              onClick={() => downloadTemplateExcel('indicadores_sede')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
              title="Descargar formato Excel de ejemplo para Indicadores por Sede"
            >
              <Download className="w-3 h-3 text-emerald-700" />
              <span>Plantilla Indicadores</span>
            </button>
          </div>
        </div>

        {/* Source Selector Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSourceTab('excel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSourceTab === 'excel'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Excel / Word</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSourceTab('sheets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSourceTab === 'sheets'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Sincronizar Google Sheets</span>
          </button>

          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full font-semibold">
            <FolderArchive className="w-3 h-3 text-blue-700" />
            <span>REPO PLATAFORMA</span>
          </div>
        </div>

        {activeSourceTab === 'excel' ? (
          <div className="space-y-2.5">
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed transition-all text-center ${
                compact ? 'p-5' : 'p-6 sm:p-7'
              } ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/80'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-blue-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xlsm,.xls,.csv,.docx"
                onChange={e => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />

              <div className="w-10 h-10 rounded-xl bg-white border border-slate-300 shadow-xs mx-auto flex items-center justify-center mb-2 text-blue-700">
                <Upload className="w-5 h-5" />
              </div>

              <p className="text-xs sm:text-sm font-bold text-slate-900 max-w-lg mx-auto leading-snug">
                {isProcessing
                  ? 'Analizando hojas y extrayendo todos los incidentes y KPIs...'
                  : 'Arrastra aquí los Excel: novedades, cámaras, supervisión, blindados, decomisos, bloqueo, validaciones y los informes de Word (revisiones de cámaras)'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1.5 max-w-xl mx-auto">
                o haz clic para elegirlos · lectura completa multi-hoja (.xlsx, .xlsm, .xls, .csv, .docx) y respaldo en <span className="font-mono-tabular font-semibold text-slate-800">REPO PLATAFORMA</span>
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-700 px-1">
              <span>
                Revisiones de cámaras registradas:{' '}
                <strong className="font-mono-tabular text-slate-950">{formatNumber(auditReportsCount)}</strong>
              </span>
              {localRepoFiles.length > 0 && (
                <span className="text-[11px] text-slate-600 font-mono-tabular">
                  {localRepoFiles.length} archivo{localRepoFiles.length === 1 ? '' : 's'} en REPO PLATAFORMA
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Google Sheets Integration Panel */
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 space-y-3">
            {!currentUser ? (
              <div className="text-center py-5 px-4 bg-white rounded-xl border border-slate-200">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center mb-2.5">
                  <Cloud className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-slate-900 text-sm font-condensed uppercase tracking-wide">
                  Conectar con Google Drive y Google Sheets
                </h5>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 mb-3 leading-relaxed">
                  Inicia sesión con tu cuenta corporativa para leer hojas de cálculo directamente desde Google Drive.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-3 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-xs transition-all hover:border-slate-400 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isProcessing ? 'Conectando...' : 'Iniciar sesión con Google'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                      {currentUser.email?.charAt(0).toUpperCase() || 'G'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{currentUser.displayName || 'Usuario Google'}</div>
                      <div className="text-[11px] text-slate-500 font-mono-tabular">{currentUser.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadDriveFiles()}
                      disabled={isLoadingDriveFiles}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingDriveFiles ? 'animate-spin' : ''}`} />
                      <span>Actualizar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Salir</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Cargar por Enlace o ID de Google Sheet:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={manualSheetId}
                      onChange={e => setManualSheetId(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/... o ID de la hoja"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleLoadManualSheet}
                      disabled={isProcessing || !manualSheetId.trim()}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? 'Leyendo...' : 'Cargar Hoja'}
                    </button>
                  </div>
                </div>

                {driveFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {driveFiles.map(file => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => handleSelectDriveSpreadsheet(file)}
                        disabled={isProcessing}
                        className="text-left p-2 rounded-lg bg-white border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all flex items-start gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono-tabular">
                            {new Date(file.modifiedTime).toLocaleDateString('es-EC')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sheetsError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{sheetsError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banners */}
      {appliedBanner && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start gap-2 text-xs text-emerald-950 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="font-medium leading-relaxed">{appliedBanner}</div>
        </div>
      )}

      {repoWarning && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2 text-xs text-amber-950 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="font-medium leading-relaxed">{repoWarning}</div>
        </div>
      )}

      {/* Extraction Preview Box */}
      {pendingBatch && (
        <div className="rounded-xl bg-slate-50 border border-slate-300 p-4 space-y-3.5 shadow-sm animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-700" />
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Análisis Completo ({pendingFileNames.length} archivo{pendingFileNames.length === 1 ? '' : 's'})
              </h5>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(pendingBatch.totalRowsScanned || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-900 text-[11px] font-bold font-mono-tabular">
                  {pendingBatch.parsedRowsCount || 0}/{pendingBatch.totalRowsScanned} filas extraídas
                </span>
              )}
              {(pendingBatch.duplicateCount || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 border border-blue-300 text-blue-900 text-[11px] font-bold">
                  {pendingBatch.duplicateCount} duplicado(s)
                </span>
              )}
              {(pendingBatch.unreadRowsCount || 0) > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-[11px] font-bold">
                  {pendingBatch.unreadRowsCount} observación(es) de fila
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  100% filas procesadas
                </span>
              )}
            </div>
          </div>

          {/* File Logs */}
          <div className="space-y-1.5">
            {pendingBatch.logs.map((log, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                  log.status === 'ok'
                    ? 'bg-white border-slate-300 text-slate-800'
                    : log.status === 'warn'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                {log.status === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : log.status === 'warn' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900">
                    {log.fileName} <span className="text-slate-500 font-normal">·</span>{' '}
                    <span className="text-blue-800">{log.category}</span>
                  </div>
                  <p className="text-slate-700 mt-0.5">{log.summary}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sheet-by-sheet Audit Diagnostics */}
          {pendingBatch.sheetReports && pendingBatch.sheetReports.length > 0 && (
            <div className="bg-white border border-slate-300 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                <span>Desglose por Hoja Analizada ({pendingBatch.sheetReports.length})</span>
              </div>
              <div className="max-h-28 overflow-y-auto divide-y divide-slate-200 text-[11px]">
                {pendingBatch.sheetReports.map((rep, idx) => (
                  <div key={idx} className="py-1 flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-slate-800">
                      {rep.sheetName} <span className="text-slate-500 font-normal">({rep.parser})</span>
                    </span>
                    <span className="font-mono-tabular shrink-0 text-slate-700">
                      <b className="text-emerald-800">{rep.extracted}</b>/{rep.rowsScanned} reg.
                      {rep.skipped > 0 && <span className="text-amber-800 ml-1">({rep.skipped} omit.)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unread / Inferred Rows Diagnostics */}
          {pendingBatch.unreadSamples && pendingBatch.unreadSamples.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-950">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Detalle de Filas con Sede Inferida o Incompletas ({pendingBatch.unreadRowsCount})</span>
              </div>
              <div className="max-h-28 overflow-y-auto divide-y divide-amber-200 text-[11px] text-amber-950">
                {pendingBatch.unreadSamples.slice(0, 12).map((u, idx) => (
                  <div key={idx} className="py-1">
                    <span className="font-bold font-mono-tabular">Hoja {u.sheet} · Fila {u.row}:</span>{' '}
                    <span>{u.reason}</span>
                    {u.sample && <div className="text-[10px] text-amber-800 truncate">{u.sample}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted KPI Impact Cards */}
          {getDetectedIndicatorsSummary(pendingBatch).length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Indicadores que se actualizarán al confirmar:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getDetectedIndicatorsSummary(pendingBatch).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-300 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">{item.label}</div>
                      <div className="text-slate-700 font-mono-tabular text-[11px] mt-0.5">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample of tabular extracted incidents if present */}
          {pendingBatch.extractedIncidents.length > 0 && (
            <div className="bg-white border border-slate-300 rounded-lg p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-2">
                Vista previa de Novedades extraídas ({pendingBatch.extractedIncidents.length}):
              </span>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 text-xs">
                {pendingBatch.extractedIncidents.slice(0, 10).map(inc => (
                  <div key={inc.id} className="py-1.5 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="font-bold text-slate-900">{inc.a}</span>
                      <span className="text-slate-500 mx-1.5">·</span>
                      <span className="text-blue-800 font-medium">{CATEGORY_LABELS[inc.t] || 'Otros'}</span>
                      {inc.x && <span className="text-slate-600 ml-1.5">— {inc.x}</span>}
                    </div>
                    <span className="font-mono-tabular text-[11px] text-slate-600 shrink-0">{inc.d}</span>
                  </div>
                ))}
                {pendingBatch.extractedIncidents.length > 10 && (
                  <div className="pt-1.5 text-[11px] text-slate-600 font-medium">
                    + {pendingBatch.extractedIncidents.length - 10} registros adicionales listos para integrar
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Word (.docx) site confirmation if needed */}
          {pendingBatch.rev.length > 0 && (
            <div className="bg-white border border-slate-300 rounded-lg p-3 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                Asignación de sede para informes Word (.docx):
              </span>
              {pendingBatch.rev.map((r, idx) => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-900 truncate">{r.name}</span>
                  <select
                    value={r.site || ''}
                    onChange={e => updateRevSite(idx, e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium"
                  >
                    <option value="">— Seleccionar sede —</option>
                    {ALL_AGENCY_NAMES.map(ag => (
                      <option key={ag} value={ag}>
                        {ag}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setPendingBatch(null);
                setPendingFileNames([]);
                setPendingRawFiles([]);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Descartar Lectura
            </button>
            <button
              type="button"
              disabled={!hasValidData(pendingBatch) || isSavingRepo}
              onClick={handleConfirmApply}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 rounded-lg transition-colors shadow-xs"
            >
              {isSavingRepo ? 'Guardando en REPO PLATAFORMA...' : 'Integrar Datos a los Indicadores'}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 08: HISTORIAL DE CAMBIOS (linked directly to REPO PLATAFORMA local storage) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md border border-blue-600/40 bg-blue-50 text-blue-800 font-mono-tabular text-xs font-extrabold tracking-wider">
              08
            </span>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-condensed uppercase tracking-wider">
              HISTORIAL DE CAMBIOS
            </h4>
          </div>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-blue-700" />
            <span>Clic en cada carga para abrir o descargar desde REPO PLATAFORMA</span>
          </span>
        </div>

        <div className="rounded-xl border border-slate-300 bg-slate-50 divide-y divide-slate-200 max-h-56 overflow-y-auto">
          {uploadHistory.length > 0 ? (
            uploadHistory.map(rec => {
              const linkedFiles = resolveHistoryFiles(rec);
              const singleFile = linkedFiles.length === 1 ? linkedFiles[0] : null;

              return (
                <div
                  key={rec.id}
                  className="px-3.5 py-2.5 text-xs hover:bg-white transition-colors flex flex-col gap-1.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-mono-tabular text-[11px] text-slate-600 shrink-0">
                        {rec.timestamp} · —
                      </span>
                      <span className="font-bold text-slate-950">Carga de archivos</span>
                      <span className="text-slate-400">·</span>
                      {singleFile ? (
                        <a
                          href={singleFile.url}
                          download={singleFile.originalName}
                          className="text-blue-700 hover:text-blue-900 hover:underline font-medium truncate inline-flex items-center gap-1"
                          title={`Descargar ${singleFile.originalName} desde REPO PLATAFORMA`}
                        >
                          <span>{rec.summary}</span>
                          <Download className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-700 truncate">{rec.summary}</span>
                      )}
                    </div>

                    {singleFile && (
                      <a
                        href={singleFile.url}
                        download={singleFile.originalName}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[11px] font-semibold shrink-0 self-start sm:self-auto"
                        title={`Descargar ${singleFile.originalName} (${formatBytes(singleFile.size)})`}
                      >
                        <FileText className="w-3 h-3" />
                        <span>Descargar</span>
                      </a>
                    )}
                  </div>

                  {linkedFiles.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {linkedFiles.map(sf => (
                        <a
                          key={sf.storedName}
                          href={sf.url}
                          download={sf.originalName}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-[11px] font-medium text-blue-800 transition-colors"
                          title={`Descargar desde REPO PLATAFORMA (${formatBytes(sf.size)})`}
                        >
                          <Download className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{sf.originalName}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : localRepoFiles.length > 0 ? (
            localRepoFiles.map(sf => (
              <a
                key={sf.storedName}
                href={sf.url}
                download={sf.originalName}
                className="px-3.5 py-2.5 text-xs hover:bg-white transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono-tabular text-[11px] text-slate-600 shrink-0">
                    {sf.uploadedAt.slice(0, 16).replace('T', ' ')} · —
                  </span>
                  <span className="font-bold text-slate-950 shrink-0">Archivo en REPO PLATAFORMA</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-blue-700 font-medium truncate">{sf.originalName}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 shrink-0">
                  <Download className="w-3 h-3" />
                  <span>{formatBytes(sf.size)}</span>
                </span>
              </a>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-600">
              Aún no hay cargas registradas en esta sesión. Los archivos que subas se guardarán automáticamente en{' '}
              <span className="font-mono-tabular font-semibold text-slate-800">REPO PLATAFORMA</span> y aparecerán aquí para descarga directa.
            </div>
          )}
        </div>
      </div>

      {/* Reset Option (only in full dashboard view) */}
      {!compact && onResetBaseData && (
        <div className="pt-1 flex items-center justify-end text-xs">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-rose-800 font-semibold">¿Restaurar línea base oficial?</span>
              <button
                type="button"
                onClick={() => {
                  onResetBaseData();
                  setConfirmReset(false);
                  setAppliedBanner(null);
                }}
                className="px-2.5 py-1 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-md"
              >
                Sí, restaurar
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1 text-slate-600 hover:text-rose-700 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar datos base</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
