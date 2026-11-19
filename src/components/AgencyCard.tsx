import React from 'react';
import { AgencyData, WeatherData } from '../types/console';
import { FACILITY_TYPES, SECURITY_COMPANIES, CATEGORY_LABELS } from '../data/consoleData';
import { formatNumber, formatPercentage } from '../utils/dataUtils';
import { Camera, Shield, Truck, Package, MapPin } from 'lucide-react';

interface AgencyCardProps {
  agency: AgencyData;
  regionTotal: number;
  weather?: WeatherData;
  onOpenDetails: (agency: AgencyData) => void;
}

export const AgencyCard: React.FC<AgencyCardProps> = ({
  agency,
  regionTotal,
  weather,
  onOpenDetails
}) => {
  const facilityType = FACILITY_TYPES[agency.a] || 'AGENCIA';
  const securityCo = SECURITY_COMPANIES[agency.a] || 'LIDERMAN';

  const typeTextColor: Record<string, string> = {
    'PLANTA': 'text-amber-800',
    'PLANTA + AGENCIA': 'text-orange-800',
    'EDIFICIO CORPORATIVO': 'text-violet-800',
    'BODEGA': 'text-blue-800',
    'AGENCIA': 'text-sky-800'
  };

  const topCategories = agency.c
    .map((val, idx) => ({ label: CATEGORY_LABELS[idx] || `Cat ${idx}`, count: val }))
    .filter(cat => cat.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const spTot = (agency.sp?.[0] || 0) + (agency.sp?.[1] || 0);
  const spPct = spTot ? Math.round((1000 * (agency.sp?.[0] || 0)) / spTot) / 10 : 0;

  const blTot = (agency.bl?.[0] || 0) + (agency.bl?.[1] || 0);
  const blPct = blTot ? Math.round((1000 * (agency.bl?.[0] || 0)) / blTot) / 10 : null;

  return (
    <div
      onClick={() => onOpenDetails(agency)}
      className="group relative bg-white hover:bg-slate-50/70 border border-slate-300 hover:border-blue-600 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
    >
      <div>
        {/* Top Unboxed Inline Metadata */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider truncate">
            <span className={typeTextColor[facilityType] || 'text-blue-800'}>{facilityType}</span>
            <span className="text-slate-400 mx-1.5">·</span>
            <span className="text-slate-700">{securityCo}</span>
          </div>

          {weather && (
            <span className="text-xs text-slate-900 flex items-center gap-1 font-mono-tabular shrink-0" title={weather.desc}>
              <span>{weather.icon}</span>
              <span className="font-bold">{weather.temp}°C</span>
            </span>
          )}
        </div>

        {/* Agency Name & Location */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-950 text-base font-condensed tracking-wide group-hover:text-blue-700 transition-colors">
              {agency.a}
            </h4>
            <p className="text-xs text-slate-700 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{agency.loc}</span>
              <span className="text-slate-400">·</span>
              <span className="font-mono-tabular text-slate-800 font-semibold">
                {formatPercentage(agency.n, regionTotal)} regional
              </span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-black text-slate-950 font-condensed font-mono-tabular leading-none">
              {formatNumber(agency.n)}
            </span>
            <span className="text-[11px] text-slate-600 font-medium block mt-0.5">novedades</span>
          </div>
        </div>

        {/* Top Categories Summary Line */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs text-slate-700 leading-relaxed">
          {topCategories.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {topCategories.map((cat, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300">·</span>}
                  <span>
                    {cat.label}: <b className="text-slate-950 font-mono-tabular">{cat.count}</b>
                  </span>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">Sin incidentes mayores registrados</span>
          )}
        </div>
      </div>

      {/* Bottom Mini Metrics Strip */}
      <div className="mt-3.5 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* CCTV */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-600">
            <Camera className="w-3 h-3 text-emerald-700" />
            <span>Cámaras</span>
          </div>
          <div className="font-bold text-slate-950 font-mono-tabular mt-0.5">
            {agency.cm ? agency.cm[0] + agency.cm[1] : '—'}
            {agency.cm && agency.cm[1] > 0 && (
              <span className="text-rose-700 text-[10px] ml-1">({agency.cm[1]})</span>
            )}
          </div>
        </div>

        {/* Supervisión */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-600">
            <Shield className="w-3 h-3 text-blue-700" />
            <span>Superv.</span>
          </div>
          <div className="font-bold text-slate-950 font-mono-tabular mt-0.5">
            {spTot ? `${spPct}%` : 's/d'}
          </div>
        </div>

        {/* Blindados */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-600">
            <Truck className="w-3 h-3 text-indigo-700" />
            <span>Blindados</span>
          </div>
          <div className="font-bold text-slate-950 font-mono-tabular mt-0.5">
            {blPct !== null ? `${blPct}%` : 's/d'}
          </div>
        </div>

        {/* Decomisos */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-600">
            <Package className="w-3 h-3 text-amber-700" />
            <span>Decomisos</span>
          </div>
          <div className="font-bold text-slate-950 font-mono-tabular mt-0.5">
            {agency.dc !== undefined ? formatNumber(agency.dc) : '0'}
          </div>
        </div>
      </div>
    </div>
  );
};
