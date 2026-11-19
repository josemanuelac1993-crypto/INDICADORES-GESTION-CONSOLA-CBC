import * as XLSX from 'xlsx';
import { AgencyData, AuditReport } from '../types/console';
import { FACILITY_TYPES, SECURITY_COMPANIES, COORDINATORS, METHODOLOGY_DEFINITIONS, AUDIT_REPORTS_DATA } from '../data/consoleData';

export function exportToExcel(allAgencies: AgencyData[], auditReports: AuditReport[] = AUDIT_REPORTS_DATA) {
  const wb = XLSX.utils.book_new();

  // 1. Resumen por Sedes
  const rows = [
    [
      'Región',
      'Sede / Instalación',
      'Tipo de Instalación',
      'Ciudad / Provincia',
      'Coordinador Regional',
      'Empresa de Seguridad',
      'Novedades Registradas',
      'Cámaras Operativas',
      'Cámaras Fuera de Servicio',
      'Total Cámaras',
      'Supervisión Realizada (Turnos)',
      'Supervisión Pendiente (Turnos)',
      'Cumplimiento Supervisión (%)',
      'Blindados con Ingreso (Días)',
      'Blindados sin Ingreso (Días)',
      'Frecuencia Blindados (%)',
      'Decomisos (Unidades)',
      'Validaciones de Seguridad 2026',
      'Revisiones de Auditoría'
    ]
  ];

  allAgencies.forEach(a => {
    const spTot = (a.sp?.[0] || 0) + (a.sp?.[1] || 0);
    const spPct = spTot ? Math.round((1000 * (a.sp?.[0] || 0)) / spTot) / 10 : 0;

    const blTot = (a.bl?.[0] || 0) + (a.bl?.[1] || 0);
    const blPct = blTot ? Math.round((1000 * (a.bl?.[0] || 0)) / blTot) / 10 : 0;

    const camOp = a.cm?.[0] || 0;
    const camNo = a.cm?.[1] || 0;

    rows.push([
      a.region || '',
      a.a,
      FACILITY_TYPES[a.a] || 'AGENCIA',
      a.loc,
      a.region ? COORDINATORS[a.region] : '',
      SECURITY_COMPANIES[a.a] || 'LIDERMAN',
      String(a.n),
      String(camOp),
      String(camNo),
      String(camOp + camNo),
      String(a.sp?.[0] || 0),
      String(a.sp?.[1] || 0),
      `${spPct}%`,
      String(a.bl?.[0] || 0),
      String(a.bl?.[1] || 0),
      blTot ? `${blPct}%` : 's/d',
      String(a.dc ?? 0),
      String(a.vl?.[0] || 0),
      String(a.rv || 0)
    ]);
  });

  const wsAgencies = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, wsAgencies, 'Sedes_Operativas');

  // 2. Auditorías de Video
  const auditRows = [
    ['Código de Informe', 'Sede', 'Fecha del Informe', 'Fecha de Registro']
  ];
  auditReports.forEach(r => {
    auditRows.push([
      r.id,
      r.a,
      r.d || 'Sin fecha',
      r.at ? r.at.slice(0, 10) : ''
    ]);
  });
  const wsAudits = XLSX.utils.aoa_to_sheet(auditRows);
  XLSX.utils.book_append_sheet(wb, wsAudits, 'Auditorias_CCTV');

  // 3. Metodología y Fórmulas
  const metaRows = [
    ['Indicador Clave', 'Fórmula de Cálculo', 'Criterio Operativo y Fuente', 'Período de Corte']
  ];
  METHODOLOGY_DEFINITIONS.forEach(m => {
    metaRows.push([m.indicator, m.formula, m.criteria, m.period]);
  });
  const wsMeta = XLSX.utils.aoa_to_sheet(metaRows);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Metodologia_CCO');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Consola_CCO_Tesalia_CBC_${today}.xlsx`);
}

export function exportToJson(data: any, filename: string = 'consola-cco-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
