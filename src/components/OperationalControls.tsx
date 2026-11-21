import React, { useEffect, useMemo, useState } from 'react';
import {
  CameraOverview,
  AgencyData,
  BlockedPersonnel,
  ValidationSummary,
  MonthlyTrendsData
} from '../types/console';
import { VALIDATION_TYPES } from '../data/consoleData';
import { formatNumber, formatPercentage } from '../utils/dataUtils';
import {
  Camera,
  Shield,
  Truck,
  Package,
  UserX,
  UserCheck,
  CheckCircle2,
  BarChart2
} from 'lucide-react';

interface OperationalControlsProps {
  cameras: CameraOverview;
  allAgencies: AgencyData[];
  blockedPersonnel: BlockedPersonnel;
  validations: ValidationSummary;
  monthlyTrends: MonthlyTrendsData;
  initialTab?: string | null;
  onTabChange?: (tab: string) => void;
}

export const OperationalControls: React.FC<OperationalControlsProps> = ({
  cameras,
  allAgencies,
  blockedPersonnel,
  validations,
  monthlyTrends,
  initialTab = 'cm',
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    initialTab && ['cm', 'sp', 'bl', 'dc', 'bq', 'vl'].includes(initialTab) ? initialTab : 'cm'
  );

  useEffect(() => {
    if (initialTab && ['cm', 'sp', 'bl', 'dc', 'bq', 'vl'].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (onTabChange) onTabChange(id);
  };

  // Dynamic Supervision aggregates
  const spStats = useMemo(() => {
    let si = 0;
    let tot = 0;
    const ranked = allAgencies
      .filter(a => a.sp)
      .map(a => {
        const s = a.sp?.[0] || 0;
        const t = s + (a.sp?.[1] || 0);
        si += s;
        tot += t;
        const pct = t ? Math.round((1000 * s) / t) / 10 : 0;
        return { ...a, pct, tot: t };
      })
      .sort((a, b) => b.pct - a.pct);

    const pctStr = formatPercentage(si, tot);
    const pctNum = tot ? Math.round((1000 * si) / tot) / 10 : 0;
    return { si, tot, pctStr, pctNum, ranked };
  }, [allAgencies]);

  // Dynamic Blindados aggregates
  const blStats = useMemo(() => {
    let si = 0;
    let tot = 0;
    const ranked = allAgencies
      .filter(a => a.bl)
      .map(a => {
        const s = a.bl?.[0] || 0;
        const t = s + (a.bl?.[1] || 0);
        si += s;
        tot += t;
        const pct = t ? Math.round((1000 * s) / t) / 10 : 0;
        return { ...a, pct, tot: t };
      })
      .sort((a, b) => b.pct - a.pct);

    const pctStr = formatPercentage(si, tot);
    const pctNum = tot ? Math.round((1000 * si) / tot) / 10 : 0;
    return { si, tot, pctStr, pctNum, ranked };
  }, [allAgencies]);

  // Dynamic Decomisos aggregates
  const dcStats = useMemo(() => {
    const ranked = allAgencies
      .filter(a => (a.dc ?? 0) > 0)
      .sort((a, b) => (b.dc ?? 0) - (a.dc ?? 0));
    const total = allAgencies.reduce((s, a) => s + (a.dc ?? 0), 0);
    const sortedMonths = [...monthlyTrends.dc].sort((a, b) => b.t - a.t);
    const peakMonth = sortedMonths[0];
    const secondMonth = sortedMonths[1];
    const maxMonthVal = Math.max(100, peakMonth?.t || 100);
    return { total, ranked, peakMonth, secondMonth, maxMonthVal };
  }, [allAgencies, monthlyTrends.dc]);

  // Dynamic Cameras fault note
  const faultySites = useMemo(() => {
    return Object.entries(cameras.sites)
      .filter(([, [, no]]) => no > 0)
      .map(([site, [, no]]) => `${site} (${no})`);
  }, [cameras.sites]);

  const curValYear = validations.cur || '2026';
  const prevValYear = validations.prev || '2025';
  const curValObj = validations.y[curValYear] || validations.y['2026'];
  const prevValObj = validations.y[prevValYear] || validations.y['2025'];

  const controlTabs = [
    { id: 'cm', label: 'CCTV & Cámaras', icon: Camera },
    { id: 'sp', label: 'Supervisión de Turnos', icon: Shield },
    { id: 'bl', label: 'Blindados & Valores', icon: Truck },
    { id: 'dc', label: 'Decomisos en Garitas', icon: Package },
    { id: 'bq', label: 'Personal Bloqueado', icon: UserX },
    { id: 'vl', label: 'Validación de Antecedentes', icon: UserCheck }
  ];

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm space-y-6">
      {/* Module Title */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-950 font-condensed tracking-wide uppercase flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-700" />
            <span>Controles Operativos y Cumplimiento Nacional</span>
          </h3>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Métricas de fiscalización, vigilancia electrónica y prevención de pérdidas sincronizadas con Excel
          </p>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-300 overflow-x-auto max-w-full">
          {controlTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CÁMARAS CCTV */}
      {activeTab === 'cm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Parque de Cámaras Instalado
              </span>
              <div className="text-3xl font-extrabold text-slate-950 font-mono-tabular mt-1 font-condensed">
                {formatNumber(cameras.op + cameras.no)}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {Object.keys(cameras.sites).length} instalaciones monitoreadas 24/7
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Cámaras Operativas
              </span>
              <div className="text-3xl font-extrabold text-emerald-700 font-mono-tabular mt-1 font-condensed">
                {formatNumber(cameras.op)}{' '}
                <span className="text-sm font-sans font-bold text-emerald-800">
                  ({formatPercentage(cameras.op, cameras.op + cameras.no)})
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Corte: {cameras.d}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Cámaras Fuera de Servicio
              </span>
              <div className="text-3xl font-extrabold text-rose-700 font-mono-tabular mt-1 font-condensed">
                {formatNumber(cameras.no)}
              </div>
              <p className="text-xs text-slate-700 font-medium mt-0.5 truncate">
                {faultySites.length > 0 ? faultySites.join(', ') : 'Sin cámaras inoperativas'}
              </p>
            </div>
          </div>

          {/* Monthly reliability bars */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Promedio de Cámaras Fuera de Servicio por Turno (Histórico 2026)
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2">
              {monthlyTrends.cam.map(m => (
                <div key={m.m} className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-center">
                  <span className="text-[11px] font-extrabold text-slate-700 block">{m.m}</span>
                  <span className="text-sm font-extrabold text-slate-950 font-mono-tabular block mt-1">
                    {m.no.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold font-mono-tabular">
                    {m.pct}% op.
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed cameras table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Inventario de Cámaras por Localidad
            </h4>
            <div className="overflow-x-auto max-h-80 rounded-xl border border-slate-300 bg-white">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] sticky top-0 border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Sede</th>
                    <th className="py-2.5 px-4 font-bold text-center">Operativas</th>
                    <th className="py-2.5 px-4 font-bold text-center">Fallas</th>
                    <th className="py-2.5 px-4 font-bold text-center">Total</th>
                    <th className="py-2.5 px-4 font-bold text-right">Disponibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono-tabular">
                  {Object.entries(cameras.sites)
                    .sort((a, b) => b[1][0] + b[1][1] - (a[1][0] + a[1][1]))
                    .map(([site, [op, no]]) => {
                      const tot = op + no;
                      const pct = formatPercentage(op, tot);
                      return (
                        <tr key={site} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-950">{site}</td>
                          <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">{op}</td>
                          <td className="py-2.5 px-4 text-center">
                            {no > 0 ? (
                              <span className="text-rose-700 font-extrabold">{no}</span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-900 font-bold">{tot}</td>
                          <td className="py-2.5 px-4 text-right font-bold">
                            <span className={no > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                              {pct}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUPERVISIÓN */}
      {activeTab === 'sp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Cumplimiento Nacional 2026
              </span>
              <div className="text-3xl font-extrabold text-blue-700 font-mono-tabular mt-1 font-condensed">
                {spStats.pctStr}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Promedio semanal: ~{((spStats.pctNum * 14) / 100).toFixed(1)} de 14 turnos (día y noche)
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Mayor Cumplimiento
              </span>
              <div className="text-lg font-extrabold text-emerald-800 mt-1 truncate">
                {spStats.ranked[0] ? `${spStats.ranked[0].a} (${spStats.ranked[0].pct}%)` : 's/d'}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                {spStats.ranked[1]
                  ? `Seguido por ${spStats.ranked[1].a} (${spStats.ranked[1].pct}%)`
                  : 'Evaluación por turnos'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Rondas Registradas
              </span>
              <div className="text-3xl font-extrabold text-slate-950 font-mono-tabular mt-1 font-condensed">
                {formatNumber(spStats.si)}{' '}
                <span className="text-xs font-sans font-semibold text-slate-600">turnos SI</span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                De {formatNumber(spStats.tot)} turnos totales evaluados
              </p>
            </div>
          </div>

          {/* Monthly trend */}
          {monthlyTrends.sp.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Porcentaje de Supervisión Mensual
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2">
                {monthlyTrends.sp.map(m => (
                  <div key={m.m} className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-center">
                    <span className="text-[11px] font-extrabold text-slate-700 block">{m.m}</span>
                    <span className="text-sm font-extrabold text-blue-700 font-mono-tabular block mt-1">
                      {m.pct}%
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono-tabular">
                      {(m.pct * 0.14).toFixed(1)}/14t
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ranking by Agency */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Cumplimiento por Sede (Ranking de Turnos Supervisados)
            </h4>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {spStats.ranked.map(a => (
                <div
                  key={a.a}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-950">{a.a}</span>
                    <span className="text-slate-600 font-medium">({a.loc})</span>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className="text-slate-700 font-medium font-mono-tabular">
                      {formatNumber(a.sp?.[0] || 0)} de {formatNumber(a.tot)} turnos
                    </span>
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          a.pct >= 70 ? 'bg-emerald-600' : a.pct >= 35 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, a.pct)}%` }}
                      />
                    </div>
                    <span className="font-extrabold text-slate-950 font-mono-tabular w-12 text-right">
                      {a.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BLINDADOS */}
      {activeTab === 'bl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Cumplimiento Nacional de Blindados
              </span>
              <div className="text-3xl font-extrabold text-indigo-700 font-mono-tabular mt-1 font-condensed">
                {blStats.pctStr}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Promedio semanal: ~{((blStats.pctNum * 6) / 100).toFixed(1)} de 6 días (Lunes a Sábado)
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Mayor Frecuencia
              </span>
              <div className="text-lg font-extrabold text-indigo-800 mt-1 truncate">
                {blStats.ranked[0] ? `${blStats.ranked[0].a} (${blStats.ranked[0].pct}%)` : 's/d'}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                {blStats.ranked[1]
                  ? `Seguido por ${blStats.ranked[1].a} (${blStats.ranked[1].pct}%)`
                  : 'Agencias comerciales'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Días con Ingreso Registrado
              </span>
              <div className="text-3xl font-extrabold text-slate-950 font-mono-tabular mt-1 font-condensed">
                {formatNumber(blStats.si)}{' '}
                <span className="text-xs font-sans font-semibold text-slate-600">días</span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                De {formatNumber(blStats.tot)} días auditados en {blStats.ranked.length} sedes
              </p>
            </div>
          </div>

          {/* Monthly trend */}
          {monthlyTrends.bl.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Frecuencia de Ingreso Mensual
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2">
                {monthlyTrends.bl.map(m => (
                  <div key={m.m} className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-center">
                    <span className="text-[11px] font-extrabold text-slate-700 block">{m.m}</span>
                    <span className="text-sm font-extrabold text-indigo-700 font-mono-tabular block mt-1">
                      {m.pct}%
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono-tabular">
                      {(m.pct * 0.06).toFixed(1)}/6d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Agency Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto">
            {blStats.ranked.map(a => (
              <div
                key={a.a}
                className="p-3 rounded-lg bg-slate-50 border border-slate-300 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-950 block">{a.a}</span>
                  <span className="text-slate-700 font-medium text-[11px]">
                    {formatNumber(a.bl?.[0] || 0)} días con ingreso de {formatNumber(a.tot)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-indigo-700 font-mono-tabular text-sm">{a.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DECOMISOS */}
      {activeTab === 'dc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Total de Unidades Decomisadas
              </span>
              <div className="text-3xl font-extrabold text-amber-700 font-mono-tabular mt-1 font-condensed">
                {formatNumber(dcStats.total)}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Control de pérdidas en garita y transporte
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Mayor Concentración
              </span>
              <div className="text-lg font-extrabold text-amber-800 mt-1 truncate">
                {dcStats.ranked[0]
                  ? `${dcStats.ranked[0].a} (${formatNumber(dcStats.ranked[0].dc ?? 0)} u.)`
                  : 'Sin registros'}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                {dcStats.ranked[1]
                  ? `Seguido por ${dcStats.ranked[1].a} (${formatNumber(dcStats.ranked[1].dc ?? 0)} u.)`
                  : 'Consolidado por instalación'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Mes con Mayor Incautación
              </span>
              <div className="text-2xl font-extrabold text-slate-950 font-mono-tabular mt-1 font-condensed">
                {dcStats.peakMonth ? `${dcStats.peakMonth.m} (${formatNumber(dcStats.peakMonth.t)} u.)` : 's/d'}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {dcStats.secondMonth
                  ? `Seguido por ${dcStats.secondMonth.m} (${formatNumber(dcStats.secondMonth.t)} u.)`
                  : 'Serie histórica mensual'}
              </p>
            </div>
          </div>

          {/* Monthly trend bars */}
          {monthlyTrends.dc.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Evolución Mensual de Decomisos (Unidades)
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2">
                {monthlyTrends.dc.map(m => {
                  const heightPct = Math.max(10, (m.t / dcStats.maxMonthVal) * 100);
                  return (
                    <div
                      key={m.m}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-center flex flex-col justify-end h-32"
                    >
                      <span className="text-xs font-extrabold text-amber-800 font-mono-tabular mb-1">
                        {m.t}
                      </span>
                      <div className="w-full h-16 bg-slate-200 rounded-t overflow-hidden flex items-end justify-center">
                        <div
                          className="w-full bg-amber-500 rounded-t"
                          style={{ height: `${Math.min(100, heightPct)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 mt-1.5 block">{m.m}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agency Ranking */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Decomisos por Sede (Total Acumulado)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {dcStats.ranked.map(a => (
                <div
                  key={a.a}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-300 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-950 block">{a.a}</span>
                    <span className="text-slate-600 font-medium text-[11px]">{a.loc}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-amber-800 font-mono-tabular font-condensed">
                      {formatNumber(a.dc ?? 0)}
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium block">unidades</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PERSONAL BLOQUEADO */}
      {activeTab === 'bq' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Personal Bloqueado Activo
              </span>
              <div className="text-3xl font-extrabold text-rose-700 font-mono-tabular mt-1 font-condensed">
                {formatNumber(blockedPersonnel.bloq)}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Restricción de ingreso a todas las instalaciones
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Desbloqueados / Regularizados
              </span>
              <div className="text-3xl font-extrabold text-emerald-700 font-mono-tabular mt-1 font-condensed">
                {formatNumber(blockedPersonnel.desb)}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Casos solventados con visto bueno de Seguridad
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Distribución por Año
              </span>
              <div className="text-base font-bold text-slate-950 mt-1.5 space-x-2.5 font-mono-tabular">
                {blockedPersonnel.yr.map(y => (
                  <span key={y[0]}>
                    {y[0]}: <b className="text-blue-800">{y[1]}</b>
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Registro histórico anonimizado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Motivos */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Principales Motivos de Bloqueo
              </h4>
              <div className="space-y-3">
                {blockedPersonnel.mot.map(([mot, count]) => (
                  <div key={mot} className="text-xs">
                    <div className="flex justify-between text-slate-800 mb-1 gap-2">
                      <span className="font-semibold truncate">{mot}</span>
                      <span className="font-extrabold text-slate-950 font-mono-tabular shrink-0">
                        {count} ({formatPercentage(count, blockedPersonnel.bloq)})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 rounded-full"
                        style={{
                          width: `${blockedPersonnel.bloq ? (count / blockedPersonnel.bloq) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empresas */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Empresas Transportistas con Mayor Frecuencia
              </h4>
              <div className="space-y-3">
                {blockedPersonnel.emp.map(([emp, count]) => (
                  <div key={emp} className="text-xs">
                    <div className="flex justify-between text-slate-800 mb-1 gap-2">
                      <span className="font-semibold truncate">{emp}</span>
                      <span className="font-extrabold text-slate-950 font-mono-tabular shrink-0">
                        {count} ({formatPercentage(count, blockedPersonnel.bloq)})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{
                          width: `${blockedPersonnel.bloq ? (count / blockedPersonnel.bloq) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: VALIDACIONES */}
      {activeTab === 'vl' && curValObj && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Validaciones en {curValYear}
              </span>
              <div className="text-3xl font-extrabold text-violet-700 font-mono-tabular mt-1 font-condensed">
                {formatNumber(curValObj.tot)}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Corte: {validations.asof || `${curValYear}-11-16`}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Corte Similar {prevValYear}
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono-tabular mt-1 font-condensed">
                {formatNumber(validations.p25)}
              </div>
              <p className="text-xs text-emerald-700 mt-0.5 font-bold">
                {validations.p25 > 0
                  ? `${curValObj.tot >= validations.p25 ? '+' : ''}${(
                      ((curValObj.tot - validations.p25) / validations.p25) *
                      100
                    ).toFixed(1)}% variación interanual`
                  : 'Referencia comparativa'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Alertas de Antecedentes
              </span>
              <div className="text-3xl font-extrabold text-rose-700 font-mono-tabular mt-1 font-condensed">
                {curValObj.al}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Procesados o antecedentes penales
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">
                Total Anual {prevValYear}
              </span>
              <div className="text-3xl font-extrabold text-slate-800 font-mono-tabular mt-1 font-condensed">
                {formatNumber(prevValObj?.tot || 0)}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">12 meses consolidados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Por tipo */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Distribución por Categoría de Persona ({curValYear})
              </h4>
              <div className="space-y-2.5">
                {VALIDATION_TYPES.map((tipo, idx) => {
                  const val = curValObj.tipo[idx] || 0;
                  const total = curValObj.tot || 1;
                  return (
                    <div key={tipo} className="text-xs">
                      <div className="flex justify-between text-slate-800 mb-1">
                        <span className="font-semibold">{tipo}</span>
                        <span className="font-extrabold text-slate-950 font-mono-tabular">
                          {formatNumber(val)} ({formatPercentage(val, total)})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full"
                          style={{ width: `${Math.min(100, (val / total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Sedes */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Sedes con Mayor Flujo de Validaciones
              </h4>
              <div className="space-y-2">
                {Object.entries(curValObj.ag)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([ag, count]) => (
                    <div
                      key={ag}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-300 text-xs"
                    >
                      <span className="font-bold text-slate-900">{ag}</span>
                      <span className="font-extrabold text-violet-800 font-mono-tabular">
                        {formatNumber(count)}
                      </span>
                    </div>
                  ))}
                <div className="pt-2 text-xs text-slate-600 font-medium">
                  Adicionalmente se registraron{' '}
                  <b>{curValObj.multi['GYE-SALINAS-MILAGRO'] || 0}</b> validaciones móviles regionales y{' '}
                  <b>{curValObj.none}</b> sin sede fija.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
