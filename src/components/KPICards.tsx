import React from 'react';
import { AlertCircle, Camera, ShieldCheck, Truck, Package, UserX, UserCheck, FileSearch, ArrowUpRight } from 'lucide-react';
import { formatNumber } from '../utils/dataUtils';

export interface KPIData {
  totalNovedades: number;
  camOperativas: number;
  camTotal: number;
  camPercent: string;
  camFallas: number;
  spPercent: string;
  spTurnosRealizados: number;
  spTurnosTotales: number;
  blPercent: string;
  blDiasRealizados: number;
  blDiasTotales: number;
  decomisosTotal: number;
  bloqueadosTotal: number;
  desbloqueadosTotal: number;
  validacionesTotal: number;
  validaciones2025: number;
  validacionesAlertas: number;
  auditoriasTotal: number;
}

interface KPICardsProps {
  data: KPIData;
  activeControl: string | null;
  onSelectControl: (controlKey: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ data, activeControl, onSelectControl }) => {
  const spNumeric = parseFloat(data.spPercent.replace('%', '').replace(',', '.')) || 0;
  const blNumeric = parseFloat(data.blPercent.replace('%', '').replace(',', '.')) || 0;

  const cards = [
    {
      id: 'nov',
      title: 'Novedades Nacionales',
      value: formatNumber(data.totalNovedades),
      subtitle: 'Acumulado 2026 · 21 sedes operativas',
      meta: 'Bitácora + Turnos',
      metaColor: 'text-blue-800',
      icon: AlertCircle,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
      barColor: 'bg-blue-700',
      progress: 100,
      targetTab: 'sedes'
    },
    {
      id: 'cm',
      title: 'Cámaras CCTV',
      value: data.camPercent,
      subtitle: `${formatNumber(data.camOperativas)} de ${formatNumber(data.camTotal)} activas · ${data.camFallas} sin operar`,
      meta: data.camFallas === 0 ? '100% Operativo' : `${data.camFallas} en revisión`,
      metaColor: 'text-emerald-800',
      icon: Camera,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-600',
      progress: data.camTotal > 0 ? (data.camOperativas / data.camTotal) * 100 : 0,
      targetTab: 'cm'
    },
    {
      id: 'sp',
      title: 'Supervisión de Turnos',
      value: data.spPercent,
      subtitle: `${formatNumber(data.spTurnosRealizados)} de ${formatNumber(data.spTurnosTotales)} turnos (14 sem/sede)`,
      meta: `${((spNumeric * 14) / 100).toFixed(1)} / 14 turnos`,
      metaColor: 'text-sky-800',
      icon: ShieldCheck,
      iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
      barColor: 'bg-sky-600',
      progress: spNumeric,
      targetTab: 'sp'
    },
    {
      id: 'bl',
      title: 'Ingreso de Blindados',
      value: data.blPercent,
      subtitle: `${formatNumber(data.blDiasRealizados)} de ${formatNumber(data.blDiasTotales)} días (6 días/sem)`,
      meta: `${((blNumeric * 6) / 100).toFixed(1)} / 6 días`,
      metaColor: 'text-indigo-800',
      icon: Truck,
      iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      barColor: 'bg-indigo-600',
      progress: blNumeric,
      targetTab: 'bl'
    },
    {
      id: 'dc',
      title: 'Decomisos Incautados',
      value: formatNumber(data.decomisosTotal),
      subtitle: 'Unidades de producto retenidas en garita',
      meta: 'Control Pérdidas',
      metaColor: 'text-amber-800',
      icon: Package,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      barColor: 'bg-amber-500',
      progress: 75,
      targetTab: 'dc'
    },
    {
      id: 'bq',
      title: 'Personal Bloqueado',
      value: formatNumber(data.bloqueadosTotal),
      subtitle: `${formatNumber(data.desbloqueadosTotal)} desbloqueados formalmente`,
      meta: 'Restricción Activa',
      metaColor: 'text-rose-800',
      icon: UserX,
      iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
      barColor: 'bg-rose-600',
      progress: 62,
      targetTab: 'bq'
    },
    {
      id: 'vl',
      title: 'Validaciones Seguridad',
      value: formatNumber(data.validacionesTotal),
      subtitle: `Base 2025: ${formatNumber(data.validaciones2025)} · ${data.validacionesAlertas} alertas`,
      meta: 'Antecedentes',
      metaColor: 'text-violet-800',
      icon: UserCheck,
      iconBg: 'bg-violet-50 text-violet-700 border-violet-200',
      barColor: 'bg-violet-600',
      progress: 88,
      targetTab: 'vl'
    },
    {
      id: 'rev',
      title: 'Auditorías de Video',
      value: `${formatNumber(data.auditoriasTotal)}`,
      subtitle: 'Informes periciales de cámaras documentados',
      meta: '100% Trazable',
      metaColor: 'text-teal-800',
      icon: FileSearch,
      iconBg: 'bg-teal-50 text-teal-700 border-teal-200',
      barColor: 'bg-teal-600',
      progress: 82,
      targetTab: 'rev'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map(card => {
        const Icon = card.icon;
        const isSelected = activeControl === card.targetTab;

        return (
          <button
            key={card.id}
            onClick={() => onSelectControl(card.targetTab)}
            className={`group text-left relative overflow-hidden rounded-xl p-4 transition-all duration-200 border ${
              isSelected
                ? 'bg-blue-50/50 border-blue-600 ring-1 ring-blue-600/30 shadow-md'
                : 'bg-white hover:bg-slate-50/80 border-slate-300 hover:border-blue-500 shadow-xs hover:shadow-md'
            }`}
          >
            {/* Top subtle indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${card.barColor}`} />

            <div className="flex items-start justify-between gap-2 mb-1.5 pt-0.5">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-condensed block">
                  {card.title}
                </span>
                <span className={`text-[11px] font-semibold ${card.metaColor}`}>
                  {card.meta}
                </span>
              </div>
              <div className={`p-1.5 rounded-lg border ${card.iconBg} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-1.5 mb-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-condensed tracking-tight font-mono-tabular">
                {card.value}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-700">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium truncate mt-1">
              {card.subtitle}
            </p>

            {/* Progress indicator */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${card.barColor}`}
                style={{ width: `${Math.min(100, Math.max(8, card.progress))}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};
