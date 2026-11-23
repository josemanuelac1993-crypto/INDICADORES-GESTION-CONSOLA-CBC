import React, { useState, useEffect, useMemo } from 'react';
import {
  AgencyData,
  AuditReport,
  BlockedPersonnel,
  CameraOverview,
  FeedState,
  IncidentRecord,
  MonthlyTrendsData,
  PendingUploadBatch,
  RegionName,
  StoredRepoFile,
  UploadHistoryRecord,
  ValidationSummary,
  WeatherData
} from './types/console';
import {
  RAW_REGIONS_DATA,
  CAMERAS_INITIAL,
  BLOCKED_PERSONNEL,
  VALIDATIONS,
  MONTHLY_TRENDS,
  SECURITY_COMPANIES,
  FACILITY_TYPES,
  CATEGORY_LABELS,
  STATUS_LABELS,
  NOV_CUT,
  INITIAL_FEED,
  INITIAL_EXTRA_INCIDENTS
} from './data/consoleData';
import { fetchLiveWeatherData, formatNumber, formatPercentage } from './utils/dataUtils';
import { exportToExcel, exportToJson } from './utils/exportUtils';
import { generateIncidentHash } from './utils/excelParser';
import { testFirestoreConnection } from './firebase/config';
import {
  saveIncidentToFirestore,
  deleteIncidentFromFirestore,
  saveBatchIncidentsToFirestore,
  saveFeedToFirestore,
  subscribeToIncidents,
  subscribeToFeed,
  saveUploadHistoryToFirestore,
  subscribeToUploadHistory
} from './firebase/firestoreService';
import { Header } from './components/Header';
import { KPICards, KPIData } from './components/KPICards';
import { InteractiveMap } from './components/InteractiveMap';
import { RegionalHub } from './components/RegionalHub';
import { AgencyCard } from './components/AgencyCard';
import { AgencyModal } from './components/AgencyModal';
import { OperationalControls } from './components/OperationalControls';
import { AuditReportsView } from './components/AuditReportsView';
import { IncidentFormModal } from './components/IncidentFormModal';
import { MethodologyDrawer } from './components/MethodologyDrawer';
import { ExcelUploaderBlock } from './components/ExcelUploaderBlock';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Sliders,
  FileSearch,
  ClipboardList,
  Filter,
  Trash2,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';

const STORAGE_FEED_KEY = 'cco_tesalia_feed_v3';
const STORAGE_INCIDENTS_KEY = 'cco_tesalia_incidents_v3';
const STORAGE_UPLOADS_KEY = 'cco_tesalia_uploads_v3';

const MON_ORDER = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function mergeFeedByTimestamp(prev: FeedState, incoming: FeedState): FeedState {
  const merged: FeedState = { ...prev };
  const isNewer = (nextAt?: string, prevAt?: string) =>
    Boolean(nextAt && (!prevAt || nextAt > prevAt));

  if (incoming.nov) {
    const nextNov = { ...(prev.nov || {}) };
    Object.entries(incoming.nov).forEach(([k, val]) => {
      if (isNewer(val?.at, nextNov[k]?.at)) {
        nextNov[k] = val;
      }
    });
    merged.nov = nextNov;
  }

  if (incoming.rev) {
    const nextRev = { ...(prev.rev || {}) };
    Object.entries(incoming.rev).forEach(([id, val]) => {
      if (isNewer(val?.at, nextRev[id]?.at)) {
        nextRev[id] = val;
      }
    });
    merged.rev = nextRev;
  }

  if (incoming.bl && isNewer(incoming.bl.at, prev.bl?.at)) merged.bl = incoming.bl;
  if (incoming.sp && isNewer(incoming.sp.at, prev.sp?.at)) merged.sp = incoming.sp;
  if (incoming.dc && isNewer(incoming.dc.at, prev.dc?.at)) merged.dc = incoming.dc;
  if (incoming.bq && isNewer(incoming.bq.at, prev.bq?.at)) merged.bq = incoming.bq;
  if (incoming.cam && isNewer(incoming.cam.at, prev.cam?.at)) merged.cam = incoming.cam;
  if (incoming.camm && isNewer(incoming.camm.at, prev.camm?.at)) merged.camm = incoming.camm;
  if (incoming.vl && isNewer(incoming.vl.at, prev.vl?.at)) merged.vl = incoming.vl;

  return merged;
}

export default function App() {
  // Navigation active tab
  const [activeCategory, setActiveCategory] = useState<string>('general');
  // Active operational control sub-tab
  const [selectedControlTab, setSelectedControlTab] = useState<string>('cm');
  // Selected region filter
  const [selectedRegion, setSelectedRegion] = useState<RegionName | 'Todas'>('Todas');
  // Selected agency for modal
  const [selectedAgencyName, setSelectedAgencyName] = useState<string | null>(null);
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Filter by security contractor
  const [securityFilter, setSecurityFilter] = useState<string>('Todos');
  // Filter by facility type
  const [typeFilter, setTypeFilter] = useState<string>('Todos');

  // Modals state
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState<boolean>(false);
  const [incidentModalMode, setIncidentModalMode] = useState<'manual' | 'excel'>('manual');
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  // Weather state
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [weatherLive, setWeatherLive] = useState<boolean>(false);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState<boolean>(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);

  // Dynamic Feed State (persisted in localStorage, seeded with INITIAL_FEED)
  const [feedState, setFeedState] = useState<FeedState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_FEED_KEY);
      return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(INITIAL_FEED));
    } catch {
      return JSON.parse(JSON.stringify(INITIAL_FEED));
    }
  });

  // Custom & Excel-extracted incidents (persisted in localStorage, seeded with INITIAL_EXTRA_INCIDENTS)
  const [customIncidents, setCustomIncidents] = useState<IncidentRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_INCIDENTS_KEY);
      return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(INITIAL_EXTRA_INCIDENTS));
    } catch {
      return JSON.parse(JSON.stringify(INITIAL_EXTRA_INCIDENTS));
    }
  });

  // Upload History Log
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_UPLOADS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Locally archived files inside REPO PLATAFORMA/
  const [repoFiles, setRepoFiles] = useState<StoredRepoFile[]>([]);

  // Load weather on mount
  const loadWeather = async () => {
    setIsRefreshingWeather(true);
    const data = await fetchLiveWeatherData();
    setWeatherData(data);
    setWeatherLive(true);
    setIsRefreshingWeather(false);
  };

  useEffect(() => {
    loadWeather();
    const interval = setInterval(loadWeather, 900000);

    // Test Firestore connection on boot per Firebase skill guidelines
    testFirestoreConnection();

    // Real-time synchronization of incidents from Firestore
    const unsubIncidents = subscribeToIncidents(firestoreIncidents => {
      if (firestoreIncidents.length > 0) {
        setCustomIncidents(prev => {
          const existingHashes = new Set(
            prev.map(i => generateIncidentHash(i.a, i.d, i.t, i.x || ''))
          );
          const incoming = firestoreIncidents.filter(
            i => !existingHashes.has(generateIncidentHash(i.a, i.d, i.t, i.x || ''))
          );
          if (incoming.length === 0) return prev;
          const merged = [...incoming, ...prev];
          try {
            localStorage.setItem(STORAGE_INCIDENTS_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });

    // Real-time synchronization of feed from Firestore (timestamp-aware so older snapshots do not overwrite newer baseline)
    const unsubFeed = subscribeToFeed(firestoreFeed => {
      setFeedState(prev => {
        const merged = mergeFeedByTimestamp(prev, firestoreFeed);
        try {
          localStorage.setItem(STORAGE_FEED_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      });
    });

    // Real-time synchronization of upload history from Firestore
    const unsubHistory = subscribeToUploadHistory(firestoreHistory => {
      setUploadHistory(prev => {
        const map = new Map<string, UploadHistoryRecord>();
        prev.forEach(item => map.set(item.id, item));
        firestoreHistory.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });
        const merged = Array.from(map.values())
          .sort((a, b) => (b.isoDate || b.id).localeCompare(a.isoDate || a.id))
          .slice(0, 40);
        try {
          localStorage.setItem(STORAGE_UPLOADS_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      });
    });

    // Load archived files from REPO PLATAFORMA
    fetch('/api/repo/files')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && Array.isArray(data.files)) {
          setRepoFiles(data.files);
        }
      })
      .catch(() => {});

    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);

    return () => {
      clearInterval(interval);
      unsubIncidents();
      unsubFeed();
      unsubHistory();
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Open Incident / Upload Modal with chosen mode
  const handleOpenIncidentModal = (mode: 'manual' | 'excel' = 'manual') => {
    setIncidentModalMode(mode);
    setIsIncidentModalOpen(true);
  };

  // Dynamic Cameras Overview
  const camerasData: CameraOverview = useMemo(() => {
    const mergedSites: Record<string, [number, number]> = {
      ...CAMERAS_INITIAL.sites,
      ...(feedState.cam?.sites || {})
    };
    const siteSumOp = Object.values(mergedSites).reduce((s, [op]) => s + op, 0);
    const siteSumNo = Object.values(mergedSites).reduce((s, [, no]) => s + no, 0);

    const op = feedState.cam ? siteSumOp || feedState.cam.op : CAMERAS_INITIAL.op;
    const no = feedState.cam ? (siteSumOp ? siteSumNo : feedState.cam.no) : CAMERAS_INITIAL.no;
    const dLabel = feedState.cam
      ? `${feedState.cam.date} (${feedState.cam.t === 'N' ? 'Turno Noche' : 'Turno Día'})`
      : CAMERAS_INITIAL.d;

    return {
      op,
      no,
      d: dLabel,
      date: feedState.cam?.date,
      t: feedState.cam?.t,
      sites: mergedSites
    };
  }, [feedState.cam]);

  // Dynamic Blocked Personnel
  const blockedData: BlockedPersonnel = useMemo(() => {
    return feedState.bq || BLOCKED_PERSONNEL;
  }, [feedState.bq]);

  // Dynamic Validations
  const validationsData: ValidationSummary = useMemo(() => {
    return feedState.vl || VALIDATIONS;
  }, [feedState.vl]);

  // Dynamic Audit Reports
  const auditReportsList: AuditReport[] = useMemo(() => {
    return Object.entries(feedState.rev || {})
      .map(([id, item]) => ({
        id,
        a: item.a,
        d: item.d,
        at: item.at,
        g: item.g
      }))
      .sort((x, y) => (y.d || '').localeCompare(x.d || '') || x.id.localeCompare(y.id));
  }, [feedState.rev]);

  // Dynamic Monthly Trends (merges base 2026 series with any updated months from feedState)
  const monthlyTrendsData: MonthlyTrendsData = useMemo(() => {
    const mergePctSeries = (
      base: { m: string; pct: number }[],
      incoming?: { m: string; pct: number }[]
    ) => {
      const map = new Map<string, number>();
      base.forEach(item => map.set(item.m, item.pct));
      (incoming || []).forEach(item => map.set(item.m, item.pct));
      return MON_ORDER.filter(m => map.has(m)).map(m => ({ m, pct: map.get(m)! }));
    };

    const mergeTotSeries = (
      base: { m: string; t: number }[],
      incoming?: { m: string; t: number }[]
    ) => {
      const map = new Map<string, number>();
      base.forEach(item => map.set(item.m, item.t));
      (incoming || []).forEach(item => map.set(item.m, item.t));
      return MON_ORDER.filter(m => map.has(m)).map(m => ({ m, t: map.get(m)! }));
    };

    const camMap = new Map<string, { m: string; no: number; pct: number; n: number; cams: number }>();
    MONTHLY_TRENDS.cam.forEach(item => camMap.set(item.m, { ...item }));
    if (feedState.camm?.months) {
      Object.entries(feedState.camm.months).forEach(([m, val]) => {
        camMap.set(m, { m, ...val });
      });
    }

    return {
      sp: mergePctSeries(MONTHLY_TRENDS.sp, feedState.sp?.nat),
      bl: mergePctSeries(MONTHLY_TRENDS.bl, feedState.bl?.nat),
      dc: mergeTotSeries(MONTHLY_TRENDS.dc, feedState.dc?.nat),
      cam: MON_ORDER.filter(m => camMap.has(m)).map(m => camMap.get(m)!)
    };
  }, [feedState.sp, feedState.bl, feedState.dc, feedState.camm]);

  // Compute aggregated agencies with feedState & customIncidents factored in
  const computedRegionsData = useMemo(() => {
    const data: Record<RegionName, AgencyData[]> = JSON.parse(JSON.stringify(RAW_REGIONS_DATA));
    const curValYear = validationsData.cur || '2026';
    const prevValYear = validationsData.prev || '2025';

    // 1. Initialize per-site metrics from feedState
    (Object.keys(data) as RegionName[]).forEach(r => {
      data[r].forEach(a => {
        a.region = r;
        while (a.c.length < CATEGORY_LABELS.length) a.c.push(0);

        if (feedState.sp?.ag?.[a.a]) {
          a.sp = [...feedState.sp.ag[a.a]] as [number, number];
        }
        if (feedState.bl?.ag?.[a.a]) {
          a.bl = [...feedState.bl.ag[a.a]] as [number, number];
        }
        if (feedState.dc?.ag?.[a.a] !== undefined) {
          a.dc = feedState.dc.ag[a.a];
        }

        a.cm = camerasData.sites[a.a] || [15, 0];
        a.vl = [
          validationsData.y[curValYear]?.ag?.[a.a] || 0,
          validationsData.y[prevValYear]?.ag?.[a.a] || 0
        ];
        a.rv = auditReportsList.filter(audit => audit.a === a.a).length;
      });
    });

    // 2. Add shift-based novedades after NOV_CUT
    Object.values(feedState.nov || {}).forEach(shift => {
      if (shift.d > NOV_CUT) {
        Object.entries(shift.ag || {}).forEach(([agName, arr]) => {
          for (const r in data) {
            const agency = data[r as RegionName].find(a => a.a === agName);
            if (agency) {
              agency.n += arr[0] || 0;
              for (let k = 0; k < 6; k++) {
                agency.c[k] = (agency.c[k] || 0) + (arr[1 + k] || 0);
              }
              for (let k = 0; k < 3; k++) {
                agency.s[k] = (agency.s[k] || 0) + (arr[7 + k] || 0);
              }
            }
          }
        });
      }
    });

    // 3. Add manual & tabular Excel incidents
    customIncidents.forEach(inc => {
      for (const r in data) {
        const agency = data[r as RegionName].find(a => a.a === inc.a);
        if (agency) {
          agency.n += 1;
          if (inc.t >= 0 && inc.t < agency.c.length) agency.c[inc.t] += 1;
          if (inc.e >= 0 && inc.e < agency.s.length) agency.s[inc.e] += 1;
        }
      }
    });

    return data;
  }, [feedState, customIncidents, camerasData, validationsData, auditReportsList]);

  const allAgencies = useMemo(() => {
    return Object.values(computedRegionsData).flat();
  }, [computedRegionsData]);

  const selectedAgency = useMemo(() => {
    if (!selectedAgencyName) return null;
    return allAgencies.find(a => a.a === selectedAgencyName) || null;
  }, [selectedAgencyName, allAgencies]);

  // Save new manual incident
  const handleSaveIncident = (incident: IncidentRecord) => {
    const updated = [incident, ...customIncidents];
    setCustomIncidents(updated);
    saveIncidentToFirestore(incident);
    try {
      localStorage.setItem(STORAGE_INCIDENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Delete incident from bitacora
  const handleDeleteCustomIncident = (id: string) => {
    const updated = customIncidents.filter(inc => inc.id !== id);
    setCustomIncidents(updated);
    deleteIncidentFromFirestore(id);
    try {
      localStorage.setItem(STORAGE_INCIDENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Apply uploaded Excel / Word batch into feedState and customIncidents
  const handleApplyUploadBatch = (
    batch: PendingUploadBatch,
    fileNames: string[],
    storedFiles: StoredRepoFile[] = []
  ) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const formattedTs = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const indicatorsUpdated: string[] = [];

    const nextFeed: FeedState = JSON.parse(JSON.stringify(feedState));

    if (Object.keys(batch.novShifts).length > 0) {
      nextFeed.nov = { ...(nextFeed.nov || {}), ...batch.novShifts };
      indicatorsUpdated.push(`novedades ${Object.keys(batch.novShifts).length} fechas/turnos`);
    }

    if (batch.cam) {
      const mergedSites: Record<string, [number, number]> = {
        ...(nextFeed.cam?.sites || CAMERAS_INITIAL.sites),
        ...batch.cam.sites
      };
      const sumOp = Object.values(mergedSites).reduce((s, [op]) => s + op, 0);
      const sumNo = Object.values(mergedSites).reduce((s, [, no]) => s + no, 0);
      nextFeed.cam = {
        at: nowIso,
        date: batch.cam.date,
        t: batch.cam.t,
        op: Object.keys(batch.cam.sites).length > 0 ? sumOp : batch.cam.op,
        no: Object.keys(batch.cam.sites).length > 0 ? sumNo : batch.cam.no,
        sites: mergedSites
      };
      indicatorsUpdated.push('cámaras');
    }

    if (Object.keys(batch.camMonths).length > 0) {
      nextFeed.camm = {
        at: nowIso,
        months: {
          ...(nextFeed.camm?.months || {}),
          ...batch.camMonths
        }
      };
      if (!indicatorsUpdated.includes('cámaras')) indicatorsUpdated.push('cámaras');
    }

    if (batch.sp) {
      nextFeed.sp = {
        at: nowIso,
        ag: {
          ...(nextFeed.sp?.ag || {}),
          ...batch.sp.ag
        },
        nat: batch.sp.nat.length > 0 ? batch.sp.nat : nextFeed.sp?.nat || []
      };
      indicatorsUpdated.push('supervisión');
    }

    if (batch.bl) {
      nextFeed.bl = {
        at: nowIso,
        ag: {
          ...(nextFeed.bl?.ag || {}),
          ...batch.bl.ag
        },
        nat: batch.bl.nat.length > 0 ? batch.bl.nat : nextFeed.bl?.nat || []
      };
      indicatorsUpdated.push('blindados');
    }

    if (batch.dc) {
      nextFeed.dc = {
        at: nowIso,
        ag: {
          ...(nextFeed.dc?.ag || {}),
          ...batch.dc.ag
        },
        nat: batch.dc.nat.length > 0 ? batch.dc.nat : nextFeed.dc?.nat || []
      };
      indicatorsUpdated.push('decomisos');
    }

    if (batch.bq) {
      nextFeed.bq = {
        ...batch.bq,
        at: nowIso
      };
      indicatorsUpdated.push('bloqueo');
    }

    if (batch.vl) {
      nextFeed.vl = {
        ...batch.vl,
        at: nowIso
      };
      indicatorsUpdated.push('validaciones');
    }

    const validRevs = batch.rev.filter(r => r.site);
    if (validRevs.length > 0) {
      nextFeed.rev = { ...(nextFeed.rev || {}) };
      validRevs.forEach(r => {
        if (r.site) {
          nextFeed.rev[r.id] = {
            a: r.site,
            d: r.date,
            at: nowIso
          };
        }
      });
      indicatorsUpdated.push(`revisiones de cámaras ${validRevs.length}`);
    }

    let nextIncidents = customIncidents;
    let uniqueNewIncidents: IncidentRecord[] = [];
    if (batch.extractedIncidents.length > 0) {
      const existingHashes = new Set(
        customIncidents.map(inc => generateIncidentHash(inc.a, inc.d, inc.t, inc.x || ''))
      );
      const existingIds = new Set(customIncidents.map(inc => inc.id));
      let crossDuplicatesCount = 0;

      for (const inc of batch.extractedIncidents) {
        const h = generateIncidentHash(inc.a, inc.d, inc.t, inc.x || '');
        if (existingHashes.has(h) || existingIds.has(inc.id)) {
          crossDuplicatesCount++;
        } else {
          existingHashes.add(h);
          existingIds.add(inc.id);
          uniqueNewIncidents.push(inc);
        }
      }

      if (uniqueNewIncidents.length > 0) {
        nextIncidents = [...uniqueNewIncidents, ...customIncidents];
        setCustomIncidents(nextIncidents);
        const dupInfo = crossDuplicatesCount > 0 ? ` (${crossDuplicatesCount} duplicados omitidos)` : '';
        indicatorsUpdated.push(`novedades bitácora ${uniqueNewIncidents.length}${dupInfo}`);
      } else if (crossDuplicatesCount > 0) {
        indicatorsUpdated.push(`novedades bitácora (${crossDuplicatesCount} ya registradas)`);
      }
    }

    const newRecord: UploadHistoryRecord = {
      id: `up_${Date.now()}`,
      timestamp: formattedTs,
      isoDate: nowIso,
      filesCount: fileNames.length,
      fileNames,
      indicatorsUpdated,
      summary: `${indicatorsUpdated.join(' · ') || 'archivos procesados'} (${fileNames.join(', ')})`,
      storedFiles
    };

    const nextHistory = [newRecord, ...uploadHistory].slice(0, 40);
    setFeedState(nextFeed);
    setUploadHistory(nextHistory);
    if (storedFiles.length > 0) {
      setRepoFiles(prev => [...storedFiles, ...prev]);
    }

    // Persist to Firestore
    saveFeedToFirestore(nextFeed);
    if (uniqueNewIncidents.length > 0) {
      saveBatchIncidentsToFirestore(uniqueNewIncidents);
    }
    saveUploadHistoryToFirestore(newRecord);

    try {
      localStorage.setItem(STORAGE_FEED_KEY, JSON.stringify(nextFeed));
      localStorage.setItem(STORAGE_INCIDENTS_KEY, JSON.stringify(nextIncidents));
      localStorage.setItem(STORAGE_UPLOADS_KEY, JSON.stringify(nextHistory));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Restore initial base snapshot
  const handleResetBaseData = () => {
    const freshFeed = JSON.parse(JSON.stringify(INITIAL_FEED));
    const freshIncidents = JSON.parse(JSON.stringify(INITIAL_EXTRA_INCIDENTS));
    setFeedState(freshFeed);
    setCustomIncidents(freshIncidents);
    setUploadHistory([]);
    try {
      localStorage.removeItem(STORAGE_FEED_KEY);
      localStorage.removeItem(STORAGE_INCIDENTS_KEY);
      localStorage.removeItem(STORAGE_UPLOADS_KEY);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // KPI Calculations
  const kpiData: KPIData = useMemo(() => {
    const totalNovedades = allAgencies.reduce((acc, a) => acc + a.n, 0);

    let spRealizados = 0;
    let spTotales = 0;
    allAgencies.forEach(a => {
      if (a.sp) {
        spRealizados += a.sp[0];
        spTotales += a.sp[0] + a.sp[1];
      }
    });

    let blRealizados = 0;
    let blTotales = 0;
    allAgencies.forEach(a => {
      if (a.bl) {
        blRealizados += a.bl[0];
        blTotales += a.bl[0] + a.bl[1];
      }
    });

    const decomisosTotal = allAgencies.reduce((acc, a) => acc + (a.dc ?? 0), 0);
    const curValYear = validationsData.cur || '2026';
    const curValObj = validationsData.y[curValYear] || validationsData.y['2026'];

    return {
      totalNovedades,
      camOperativas: camerasData.op,
      camTotal: camerasData.op + camerasData.no,
      camPercent: formatPercentage(camerasData.op, camerasData.op + camerasData.no),
      camFallas: camerasData.no,
      spPercent: formatPercentage(spRealizados, spTotales),
      spTurnosRealizados: spRealizados,
      spTurnosTotales: spTotales,
      blPercent: formatPercentage(blRealizados, blTotales),
      blDiasRealizados: blRealizados,
      blDiasTotales: blTotales,
      decomisosTotal,
      bloqueadosTotal: blockedData.bloq,
      desbloqueadosTotal: blockedData.desb,
      validacionesTotal: curValObj?.tot || 0,
      validaciones2025: validationsData.p25,
      validacionesAlertas: curValObj?.al || 0,
      auditoriasTotal: auditReportsList.length
    };
  }, [allAgencies, camerasData, blockedData, validationsData, auditReportsList]);

  // Reconciliation data
  const reconciliationData = useMemo(() => {
    const totalCams = Object.values(camerasData.sites).reduce((s, [op, no]) => s + op + no, 0);
    const curValYear = validationsData.cur || '2026';
    const curValObj = validationsData.y[curValYear];
    const curValTot = curValObj?.tot || 0;
    const sumValMonths = curValObj?.m?.reduce((s, v) => s + v, 0) || 0;
    const sumDcMonths = monthlyTrendsData.dc.reduce((s, m) => s + m.t, 0);
    const sumIncidentStatuses = allAgencies.reduce(
      (s, a) => s + (a.s[0] || 0) + (a.s[1] || 0) + (a.s[2] || 0),
      0
    );
    return {
      camerasMatch: totalCams === camerasData.op + camerasData.no,
      decomisosMatch: kpiData.decomisosTotal === sumDcMonths,
      validationsMatch: curValTot === sumValMonths,
      incidentsMatch: kpiData.totalNovedades === sumIncidentStatuses,
      totalCameras: totalCams,
      totalDecomisos: kpiData.decomisosTotal,
      totalValidations: curValTot,
      totalIncidents: kpiData.totalNovedades
    };
  }, [camerasData, validationsData, monthlyTrendsData, allAgencies, kpiData]);

  // Filtered agencies based on search and filters
  const filteredAgencies = useMemo(() => {
    return allAgencies.filter(agency => {
      if (selectedRegion !== 'Todas' && agency.region !== selectedRegion) return false;

      const secCo = SECURITY_COMPANIES[agency.a] || 'LIDERMAN';
      if (securityFilter !== 'Todos' && secCo !== securityFilter) return false;

      const fType = FACILITY_TYPES[agency.a] || 'AGENCIA';
      if (typeFilter !== 'Todos' && fType !== typeFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = agency.a.toLowerCase().includes(query);
        const matchesLoc = agency.loc.toLowerCase().includes(query);
        const matchesRegion = agency.region?.toLowerCase().includes(query);
        const matchesSec = secCo.toLowerCase().includes(query);
        return matchesName || matchesLoc || matchesRegion || matchesSec;
      }

      return true;
    });
  }, [allAgencies, selectedRegion, securityFilter, typeFilter, searchQuery]);

  // Direct KPI Card clicks to corresponding tab
  const handleSelectKPICard = (targetTab: string) => {
    if (['cm', 'sp', 'bl', 'dc', 'bq', 'vl'].includes(targetTab)) {
      setSelectedControlTab(targetTab);
      setActiveCategory('controles');
    } else if (targetTab === 'rev') {
      setActiveCategory('auditorias');
    } else if (targetTab === 'sedes') {
      setActiveCategory('sedes');
    }
  };

  const navCategories = [
    { id: 'general', label: 'Vista General & Ecosistema', icon: LayoutDashboard },
    { id: 'mapa', label: 'Mapa Georreferenciado', icon: MapPin },
    { id: 'sedes', label: `Instalaciones (${allAgencies.length})`, icon: Building2 },
    { id: 'controles', label: 'Controles Operativos', icon: Sliders },
    { id: 'auditorias', label: `Auditorías CCTV (${auditReportsList.length})`, icon: FileSearch },
    { id: 'bitacora', label: 'Registro & Carga Excel', icon: ClipboardList }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={q => {
          setSearchQuery(q);
          if (q.trim() && activeCategory !== 'sedes') {
            setActiveCategory('sedes');
          }
        }}
        onOpenNewIncident={handleOpenIncidentModal}
        onExportExcel={() => exportToExcel(allAgencies, auditReportsList)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        weatherLive={weatherLive}
        onRefreshWeather={loadWeather}
        isRefreshingWeather={isRefreshingWeather}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dynamic KPI Metric Cards */}
        <KPICards
          data={kpiData}
          activeControl={
            activeCategory === 'controles'
              ? selectedControlTab
              : activeCategory === 'auditorias'
              ? 'rev'
              : activeCategory === 'sedes'
              ? 'sedes'
              : null
          }
          onSelectControl={handleSelectKPICard}
        />

        {/* Interactive Category Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-300 rounded-xl overflow-x-auto shadow-2xs">
          {navCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* VIEW 1: VISTA GENERAL & ECOSISTEMA */}
        {activeCategory === 'general' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Regional Ecosystem Hub */}
            <RegionalHub
              regionsData={computedRegionsData}
              weatherData={weatherData}
              selectedRegion={selectedRegion}
              onSelectRegion={r => {
                setSelectedRegion(r);
                if (r !== 'Todas') setActiveCategory('sedes');
              }}
            />

            {/* Quick Top Facilities & Categories Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top facilities with highest incidents */}
              <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <h4 className="font-bold text-slate-950 text-sm uppercase tracking-wider font-condensed">
                    Sedes con Mayor Concentración Operativa
                  </h4>
                  <span className="text-xs text-slate-600 font-semibold">Ranking Nacional</span>
                </div>
                <div className="space-y-2.5">
                  {allAgencies
                    .slice()
                    .sort((a, b) => b.n - a.n)
                    .slice(0, 5)
                    .map(a => (
                      <div
                        key={a.a}
                        onClick={() => setSelectedAgencyName(a.a)}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-300 hover:border-blue-500 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-950 text-sm">{a.a}</div>
                          <span className="text-[11px] text-slate-700 font-medium">
                            {a.loc} · Región {a.region} · {SECURITY_COMPANIES[a.a] || 'LIDERMAN'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-blue-800 font-mono-tabular font-condensed">
                            {formatNumber(a.n)}
                          </span>
                          <span className="text-[11px] text-slate-600 font-semibold block font-mono-tabular">
                            {formatPercentage(a.n, kpiData.totalNovedades)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Incidents by Primary Category */}
              <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <h4 className="font-bold text-slate-950 text-sm uppercase tracking-wider font-condensed">
                    Tipología de Novedades Nacionales
                  </h4>
                  <span className="text-xs text-slate-600 font-semibold">Acumulado 2026</span>
                </div>
                <div className="space-y-3">
                  {CATEGORY_LABELS.slice(0, 6).map((label, idx) => {
                    const totalCat = allAgencies.reduce((acc, a) => acc + (a.c[idx] || 0), 0);
                    return (
                      <div key={label} className="text-xs">
                        <div className="flex justify-between text-slate-800 mb-1">
                          <span className="font-bold">{label}</span>
                          <span className="font-extrabold text-slate-950 font-mono-tabular">
                            {formatNumber(totalCat)} ({formatPercentage(totalCat, kpiData.totalNovedades)})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${
                                kpiData.totalNovedades > 0
                                  ? Math.min(100, (totalCat / kpiData.totalNovedades) * 100)
                                  : 0
                              }%`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MAPA GEORREFERENCIADO */}
        {activeCategory === 'mapa' && (
          <div className="space-y-6 animate-fadeIn">
            <InteractiveMap
              agencies={allAgencies}
              weatherData={weatherData}
              selectedRegion={selectedRegion}
              onSelectAgency={ag => setSelectedAgencyName(ag.a)}
              onFilterRegion={setSelectedRegion}
            />
          </div>
        )}

        {/* VIEW 3: INSTALACIONES & SEDES */}
        {activeCategory === 'sedes' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter Toolbar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="text-slate-800 font-bold">Filtros:</span>

                {/* Region Selector */}
                <select
                  value={selectedRegion}
                  onChange={e => setSelectedRegion(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="Todas">Todas las Regiones</option>
                  <option value="GYE-SALINAS-MILAGRO">GYE-Salinas-Milagro</option>
                  <option value="COSTA">Costa</option>
                  <option value="UIO-IBARRA">UIO-Ibarra</option>
                  <option value="SIERRA-PUYO">Sierra-Puyo</option>
                </select>

                {/* Facility Type Selector */}
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="Todos">Todos los Tipos</option>
                  <option value="PLANTA">Plantas</option>
                  <option value="PLANTA + AGENCIA">Planta + Agencia</option>
                  <option value="AGENCIA">Agencias</option>
                  <option value="BODEGA">Bodegas</option>
                  <option value="EDIFICIO CORPORATIVO">Corporativo</option>
                </select>

                {/* Security Company Selector */}
                <select
                  value={securityFilter}
                  onChange={e => setSecurityFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="Todos">Todas las Empresas</option>
                  <option value="LIDERMAN">Liderman</option>
                  <option value="CAJAMARCA">Cajamarca</option>
                  <option value="CONTROLRISK">CONTROLRISK</option>
                  <option value="HUDSON SECURITY">Hudson Security</option>
                </select>
              </div>

              <div className="text-slate-700 font-medium font-mono-tabular shrink-0">
                Mostrando <b className="text-slate-950">{filteredAgencies.length}</b> de{' '}
                <b className="text-slate-950">{allAgencies.length}</b> sedes
              </div>
            </div>

            {/* Agencies Dynamic Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgencies.map(agency => (
                <AgencyCard
                  key={agency.a}
                  agency={agency}
                  regionTotal={
                    agency.region
                      ? computedRegionsData[agency.region]?.reduce((s, x) => s + x.n, 0) || 1
                      : 1
                  }
                  weather={weatherData[agency.a]}
                  onOpenDetails={ag => setSelectedAgencyName(ag.a)}
                />
              ))}
              {filteredAgencies.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-600 font-medium bg-slate-50 rounded-xl border border-slate-300">
                  No se encontraron sedes con los filtros aplicados.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: CONTROLES OPERATIVOS */}
        {activeCategory === 'controles' && (
          <div className="space-y-6 animate-fadeIn">
            <OperationalControls
              cameras={camerasData}
              allAgencies={allAgencies}
              blockedPersonnel={blockedData}
              validations={validationsData}
              monthlyTrends={monthlyTrendsData}
              initialTab={selectedControlTab}
              onTabChange={setSelectedControlTab}
            />
          </div>
        )}

        {/* VIEW 5: AUDITORÍAS CCTV */}
        {activeCategory === 'auditorias' && (
          <div className="space-y-6 animate-fadeIn">
            <AuditReportsView
              reports={auditReportsList}
              onSelectAgencyName={name => {
                const found = allAgencies.find(a => a.a === name);
                if (found) setSelectedAgencyName(found.a);
              }}
            />
          </div>
        )}

        {/* VIEW 6: BLOQUE DE REGISTRO, BITÁCORA Y CARGA EXCEL */}
        {activeCategory === 'bitacora' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. Excel Upload & Extraction Block */}
            <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm">
              <ExcelUploaderBlock
                onApplyBatch={handleApplyUploadBatch}
                uploadHistory={uploadHistory}
                repoFiles={repoFiles}
                auditReportsCount={auditReportsList.length}
                onResetBaseData={handleResetBaseData}
              />
            </div>

            {/* 2. Bitácora de Novedades & Manual Registration */}
            <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-950 text-base font-condensed tracking-wide uppercase flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-700" />
                    <span>
                      Bitácora de Novedades Incorporadas ({formatNumber(customIncidents.length)} registros)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Incidencias registradas manualmente o extraídas desde archivos Excel tabulares con impacto directo en sedes e indicadores
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenIncidentModal('excel')}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-400 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Subir Excel</span>
                  </button>
                  <button
                    onClick={() => handleOpenIncidentModal('manual')}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nueva Novedad Manual</span>
                  </button>
                </div>
              </div>

              {/* List of registered / Excel-extracted incidents */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {customIncidents.map(inc => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-950 text-sm font-condensed">{inc.a}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-bold text-blue-800">
                          {CATEGORY_LABELS[inc.t] || 'General'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span
                          className={`font-bold ${
                            inc.e === 1
                              ? 'text-emerald-800'
                              : inc.e === 0
                              ? 'text-amber-800'
                              : 'text-slate-700'
                          }`}
                        >
                          {STATUS_LABELS[inc.e] || 'Informativo'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-700 font-semibold font-mono-tabular">{inc.d}</span>
                      </div>
                      {inc.x && <p className="text-slate-800 font-medium mt-1 leading-relaxed">{inc.x}</p>}
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                      <span className="text-[11px] text-slate-600 font-medium">
                        {inc.source === 'excel' ? 'Origen: Excel' : `Por: ${inc.author || 'CCO'}`}
                      </span>
                      <button
                        onClick={() => handleDeleteCustomIncident(inc.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors rounded-md"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {customIncidents.length === 0 && (
                  <div className="py-8 text-center text-slate-600 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No hay novedades adicionales registradas. Usa el bloque superior para subir un archivo Excel o haz clic en "Nueva Novedad Manual".
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-300 bg-slate-50 px-4 sm:px-6 py-4 text-xs text-slate-700 font-medium">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-extrabold text-slate-950">TESALIA CBC</span>
            <span className="text-slate-400">·</span>
            <span>Centro de Control y Operaciones (CCO)</span>
            <span className="text-slate-400">·</span>
            <span>Seguridad Física Ecuador</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                exportToJson({ allAgencies, feedState, customIncidents, uploadHistory }, 'consola-cco-backup.json')
              }
              className="font-semibold text-slate-800 hover:text-blue-700 transition-colors"
            >
              Respaldo JSON
            </button>
            <span className="text-slate-400">·</span>
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="font-semibold text-slate-800 hover:text-blue-700 transition-colors"
            >
              Gobernanza de Datos
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Agency Deep-Dive Modal */}
      {selectedAgency && (
        <AgencyModal
          agency={selectedAgency}
          weather={weatherData[selectedAgency.a]}
          onClose={() => setSelectedAgencyName(null)}
        />
      )}

      {/* 2. Registration & Excel Upload Modal */}
      <IncidentFormModal
        isOpen={isIncidentModalOpen}
        initialMode={incidentModalMode}
        onClose={() => setIsIncidentModalOpen(false)}
        onSaveIncident={handleSaveIncident}
        onApplyUploadBatch={handleApplyUploadBatch}
        agenciesByRegion={computedRegionsData}
        uploadHistory={uploadHistory}
        repoFiles={repoFiles}
        auditReportsCount={auditReportsList.length}
      />

      {/* 3. Methodology & Governance Drawer */}
      <MethodologyDrawer
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        reconciliationData={reconciliationData}
      />
    </div>
  );
}
