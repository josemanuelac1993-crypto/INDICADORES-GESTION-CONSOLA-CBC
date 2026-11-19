import React, { useRef, useState, useEffect } from 'react';
import { PendingUploadBatch, UploadHistoryRecord } from '../types/console';
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
  ExternalLink,
  RefreshCw,
  LogOut,
  FolderOpen
} from 'lucide-react';

interface ExcelUploaderBlockProps {
  onApplyBatch: (batch: PendingUploadBatch, fileNames: string[]) => void;
  uploadHistory?: UploadHistoryRecord[];
  onResetBaseData?: () => void;
  compact?: boolean;
  onSuccessClose?: () => void;
}

export const ExcelUploaderBlock: React.FC<ExcelUploaderBlockProps> = ({
  onApplyBatch,
  uploadHistory = [],
  onResetBaseData,
  compact = false,
  onSuccessClose
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeSourceTab, setActiveSourceTab] = useState<'excel' | 'sheets'>('excel');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBatch, setPendingBatch] = useState<PendingUploadBatch | null>(null);
  const [pendingFileNames, setPendingFileNames] = useState<string[]>([]);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Google Workspace & Sheets state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [manualSheetId, setManualSheetId] = useState('');

  useEffect(() => {
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
    // Extract ID if full URL was pasted
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) cleanId = match[1];

    setSheetsError(null);
    setIsProcessing(true);
    try {
      const batch = await fetchAndParseGoogleSpreadsheet(cleanId, 'Google Sheet Vinculada', tok);
      setPendingBatch(batch);
      setPendingFileNames([`Google Sheet (${cleanId.slice(0, 8)}...)`]);
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
    setIsProcessing(true);
    try {
      const batch = await processUploadedFiles(files);
      setPendingBatch(batch);
      setPendingFileNames(files.map(f => f.name));
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

  const handleConfirmApply = () => {
    if (!pendingBatch || !hasValidData(pendingBatch)) return;
    const summaryItems = getDetectedIndicatorsSummary(pendingBatch);
    onApplyBatch(pendingBatch, pendingFileNames);
    setPendingBatch(null);
    setPendingFileNames([]);
    setAppliedBanner(
      `Datos integrados correctamente en: ${summaryItems.map(i => i.label).join(', ')}. Todos los indicadores del tablero han sido actualizados.`
    );
    if (onSuccessClose) {
      setTimeout(() => {
        onSuccessClose();
      }, 1100);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Template Downloads */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h4 className="font-bold text-slate-900 text-sm sm:text-base font-condensed uppercase tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>Carga y Extracción Automática desde Excel (.xlsx / .csv / .docx)</span>
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Sube reportes oficiales del CCO o tablas Excel para actualizar Novedades, Cámaras, Supervisión, Blindados, Decomisos, Bloqueados y Validaciones.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => downloadTemplateExcel('novedades')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            title="Descargar formato Excel de ejemplo para Novedades"
          >
            <Download className="w-3.5 h-3.5 text-blue-700" />
            <span>Plantilla Novedades</span>
          </button>
          <button
            type="button"
            onClick={() => downloadTemplateExcel('indicadores_sede')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            title="Descargar formato Excel de ejemplo para Indicadores por Sede"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Plantilla Indicadores</span>
          </button>
        </div>
      </div>

      {/* Source Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSourceTab('excel')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSourceTab === 'excel'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Subir Archivos Excel / Word</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSourceTab('sheets')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSourceTab === 'sheets'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Sincronizar Google Sheets</span>
        </button>

        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Firebase Firestore Activo</span>
        </div>
      </div>

      {activeSourceTab === 'excel' ? (
        /* Excel Local Dropzone */
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

          <div className="w-11 h-11 rounded-xl bg-white border border-slate-300 shadow-xs mx-auto flex items-center justify-center mb-2.5 text-blue-700">
            <Upload className="w-5 h-5" />
          </div>

          <p className="text-sm font-bold text-slate-900">
            {isProcessing
              ? 'Leyendo hojas y extrayendo indicadores...'
              : 'Haz clic para seleccionar o arrastra tus archivos Excel aquí'}
          </p>
          <p className="text-xs text-slate-600 mt-1 max-w-xl mx-auto">
            Compatible con matrices oficiales del CCO (<b>NOVEDADES, CAMARAS, SUPERVISION, BLINDADOS, DECOMISOS, BLOQUEO, VALIDACIONES</b>), plantillas tabulares <span className="font-mono-tabular">.xlsx / .csv</span> e informes <span className="font-mono-tabular">.docx</span>.
          </p>
        </div>
      ) : (
        /* Google Sheets Integration Panel */
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 space-y-4">
          {!currentUser ? (
            <div className="text-center py-6 px-4 bg-white rounded-xl border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center mb-3">
                <Cloud className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-slate-900 text-base font-condensed uppercase tracking-wide">
                Conectar con Google Drive y Google Sheets
              </h5>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                Inicia sesión con tu cuenta corporativa para explorar tus hojas de cálculo directamente desde Google Drive y extraer los indicadores al CCO sin descargas intermedias.
              </p>

              {/* Official Google Sign-In Button Style */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isProcessing}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-xs transition-all hover:border-slate-400 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isProcessing ? 'Conectando...' : 'Iniciar sesión con Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected User Bar */}
              <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDriveFiles ? 'animate-spin' : ''}`} />
                    <span>Actualizar lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleLogout}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Cerrar sesión de Google"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Salir</span>
                  </button>
                </div>
              </div>

              {/* Direct Link or ID Input */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
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
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Leyendo...' : 'Cargar Hoja'}
                  </button>
                </div>
              </div>

              {/* Available Drive Spreadsheets List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Hojas recientes en tu Google Drive:
                  </span>
                  {driveFiles.length > 0 && (
                    <span className="text-slate-500 font-mono-tabular text-[11px]">
                      {driveFiles.length} hojas encontradas
                    </span>
                  )}
                </div>

                {isLoadingDriveFiles ? (
                  <div className="py-6 text-center text-xs text-slate-600 bg-white rounded-xl border border-slate-200">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-700 mx-auto mb-1.5" />
                    Buscando hojas de cálculo en tu Google Drive...
                  </div>
                ) : driveFiles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {driveFiles.map(file => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => handleSelectDriveSpreadsheet(file)}
                        disabled={isProcessing}
                        className="text-left p-2.5 rounded-lg bg-white border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all group flex items-start gap-2.5"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-950">
                            {file.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono-tabular mt-0.5">
                            Modificado: {new Date(file.modifiedTime).toLocaleDateString('es-EC')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                    No se encontraron archivos de tipo Google Spreadsheet o presiona "Actualizar lista".
                  </div>
                )}
              </div>
            </div>
          )}

          {sheetsError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>{sheetsError}</span>
            </div>
          )}
        </div>
      )}

      {/* Success Banner */}
      {appliedBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start gap-2.5 text-xs text-emerald-950 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="font-medium leading-relaxed">{appliedBanner}</div>
        </div>
      )}

      {/* Extraction Preview Box */}
      {pendingBatch && (
        <div className="rounded-xl bg-slate-50 border border-slate-300 p-4 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-700" />
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Resultado de Lectura y Extracción ({pendingFileNames.length} archivo{pendingFileNames.length === 1 ? '' : 's'})
              </h5>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(pendingBatch.duplicateCount || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 border border-blue-300 text-blue-900 text-[11px] font-bold">
                  {pendingBatch.duplicateCount} duplicado(s) filtrados
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                100% datos válidos leídos
              </span>
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

          {/* Extracted KPI Impact Cards */}
          {getDetectedIndicatorsSummary(pendingBatch).length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-2">
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
                {pendingBatch.extractedIncidents.slice(0, 8).map(inc => (
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
                {pendingBatch.extractedIncidents.length > 8 && (
                  <div className="pt-1.5 text-[11px] text-slate-600 font-medium">
                    + {pendingBatch.extractedIncidents.length - 8} registros adicionales listos para integrar
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
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Descartar Lectura
            </button>
            <button
              type="button"
              disabled={!hasValidData(pendingBatch)}
              onClick={handleConfirmApply}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 rounded-lg transition-colors shadow-xs"
            >
              Integrar Datos a los Indicadores
            </button>
          </div>
        </div>
      )}

      {/* Upload History & Reset Option (only in full dashboard view) */}
      {!compact && (uploadHistory.length > 0 || onResetBaseData) && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {uploadHistory.length > 0 ? (
            <div className="flex items-center gap-2 text-slate-700 flex-wrap">
              <History className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span className="font-semibold">Última carga Excel:</span>
              <span className="font-mono-tabular text-slate-900">{uploadHistory[0].timestamp}</span>
              <span>·</span>
              <span className="text-slate-700">{uploadHistory[0].summary}</span>
            </div>
          ) : (
            <span className="text-slate-600">
              Los archivos procesados se almacenan localmente y actualizan todas las vistas del tablero.
            </span>
          )}

          {onResetBaseData && (
            <div className="flex items-center gap-2 shrink-0">
              {confirmReset ? (
                <>
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
                </>
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
      )}
    </div>
  );
};
