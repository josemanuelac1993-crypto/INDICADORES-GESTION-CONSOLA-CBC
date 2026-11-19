import React, { useState } from 'react';
import { AgencyData, WeatherData } from '../types/console';
import {
  FACILITY_TYPES,
  SECURITY_COMPANIES,
  COORDINATORS,
  EXACT_COORDINATES,
  FACILITY_DESCRIPTIONS,
  CATEGORY_LABELS
} from '../data/consoleData';
import { formatNumber, formatPercentage, copyToClipboard } from '../utils/dataUtils';
import {
  X,
  MapPin,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Camera,
  Shield,
  Truck,
  Package,
  UserCheck,
  CloudRain,
  FileText
} from 'lucide-react';

interface AgencyModalProps {
  agency: AgencyData | null;
  weather?: WeatherData;
  onClose: () => void;
}

export const AgencyModal: React.FC<AgencyModalProps> = ({ agency, weather, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!agency) return null;

  const facilityType = FACILITY_TYPES[agency.a] || 'AGENCIA';
  const securityCo = SECURITY_COMPANIES[agency.a] || 'LIDERMAN';
  const coords = EXACT_COORDINATES[agency.a];
  const desc = FACILITY_DESCRIPTIONS[agency.a];

  const spTot = (agency.sp?.[0] || 0) + (agency.sp?.[1] || 0);
  const spPct = spTot ? Math.round((1000 * (agency.sp?.[0] || 0)) / spTot) / 10 : 0;

  const blTot = (agency.bl?.[0] || 0) + (agency.bl?.[1] || 0);
  const blPct = blTot ? Math.round((1000 * (agency.bl?.[0] || 0)) / blTot) / 10 : null;

  const camTot = (agency.cm?.[0] || 0) + (agency.cm?.[1] || 0);

  const handleCopyCoords = async () => {
    if (!coords) return;
    const text = `Ubicación ${agency.a}: ${coords.dms} (https://www.google.com/maps?q=${coords.la},${coords.lo})`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1 text-xs font-bold">
              <span className="uppercase tracking-wider text-blue-800">{facilityType}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-800">Seguridad: {securityCo}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-700 font-medium">
                Región {agency.region} (Coord. <b className="text-slate-950">{agency.region ? COORDINATORS[agency.region] : 'N/A'}</b>)
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-950 font-condensed tracking-wide">
              {agency.a}
            </h3>
            <p className="text-xs text-slate-700 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-700" />
              <span>{agency.loc}, Ecuador</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 divide-y divide-slate-200 text-sm">
          {/* Top Description if exists */}
          {desc && (
            <div className="text-xs text-slate-800 font-medium bg-blue-50/60 p-3 rounded-lg border border-blue-200">
              {desc}
            </div>
          )}

          {/* Section 1: Weather & Geolocation */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Live Weather Card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Clima Local en Vivo
                </span>
                {weather ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{weather.icon}</span>
                      <span className="text-xl font-extrabold text-slate-950 font-mono-tabular">
                        {weather.temp}°C
                      </span>
                      <span className="text-xs text-slate-700 font-medium">({weather.desc})</span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-medium mt-1 flex items-center gap-3">
                      <span>Rango: {weather.tempMin}° - {weather.tempMax}°</span>
                      <span className="flex items-center gap-1 text-blue-800 font-semibold">
                        <CloudRain className="w-3 h-3" />
                        {weather.rainProb}% lluvia
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-600">Datos meteorológicos no disponibles</span>
                )}
              </div>
            </div>

            {/* GPS & Navigation Links */}
            {coords && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Coordenadas GPS y Geolocalización
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-950">
                    📍 {coords.dms}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                    Lat: {coords.la} | Lon: {coords.lo}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200">
                  <button
                    onClick={handleCopyCoords}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${coords.la},${coords.lo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Maps</span>
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `📍 Ubicación ${agency.a}: https://www.google.com/maps?q=${coords.la},${coords.lo}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Operational Controls Matrix */}
          <div className="pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Matriz de Controles Operativos
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* CCTV */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cámaras CCTV</span>
                </div>
                <div className="text-xl font-extrabold text-slate-950 font-mono-tabular">
                  {camTot}
                </div>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  {agency.cm ? `${agency.cm[0]} operativas` : 'Sin datos'}
                  {agency.cm && agency.cm[1] > 0 && (
                    <span className="text-rose-700 block font-bold">{agency.cm[1]} con falla técnica</span>
                  )}
                </p>
              </div>

              {/* Supervisión */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
                  <Shield className="w-3.5 h-3.5 text-blue-700" />
                  <span>Supervisión Turnos</span>
                </div>
                <div className="text-xl font-extrabold text-slate-950 font-mono-tabular">
                  {spTot ? `${spPct}%` : 's/d'}
                </div>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  {agency.sp ? `${agency.sp[0]} de ${spTot} turnos` : 'No aplica'}
                </p>
              </div>

              {/* Blindados */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
                  <Truck className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Ingreso Blindados</span>
                </div>
                <div className="text-xl font-extrabold text-slate-950 font-mono-tabular">
                  {blPct !== null ? `${blPct}%` : 's/d'}
                </div>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  {agency.bl ? `${agency.bl[0]} de ${blTot} días` : 'Sin registro'}
                </p>
              </div>

              {/* Decomisos */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
                  <Package className="w-3.5 h-3.5 text-amber-700" />
                  <span>Decomisos Garita</span>
                </div>
                <div className="text-xl font-extrabold text-slate-950 font-mono-tabular">
                  {agency.dc !== undefined ? formatNumber(agency.dc) : '0'}
                </div>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  unidades incautadas
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Incident Breakdown */}
          <div className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Distribución de Novedades por Categoría ({formatNumber(agency.n)} total)
              </h4>
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-slate-700">
                  En proceso: <b className="text-amber-800 font-mono-tabular">{agency.s[0]}</b>
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-700">
                  Cerradas: <b className="text-emerald-800 font-mono-tabular">{agency.s[1]}</b>
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-700">
                  Informativo: <b className="text-blue-800 font-mono-tabular">{agency.s[2]}</b>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {agency.c.map((count, idx) => {
                if (count === 0) return null;
                const label = CATEGORY_LABELS[idx] || `Categoría ${idx}`;
                const pct = formatPercentage(count, agency.n);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-300"
                  >
                    <span className="text-slate-800 font-semibold">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-950 font-extrabold font-mono-tabular">{count}</span>
                      <span className="text-slate-600 text-[11px] font-mono-tabular">({pct})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Validaciones & Historical Context */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
                <UserCheck className="w-3.5 h-3.5 text-violet-700" />
                <span>Validaciones de Antecedentes</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-extrabold text-slate-950 font-mono-tabular">
                  {agency.vl ? formatNumber(agency.vl[0]) : '0'}
                </span>
                <span className="text-slate-700 text-xs">
                  en 2026 (vs {agency.vl ? formatNumber(agency.vl[1]) : '0'} en 2025)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
                <FileText className="w-3.5 h-3.5 text-teal-700" />
                <span>Revisiones de Video Documentadas</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-extrabold text-slate-950 font-mono-tabular">
                  {agency.rv || 0}
                </span>
                <span className="text-slate-700 text-xs">
                  informes técnicos archivados
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            Fuente: Centro de Control y Operaciones (CCO) · Tesalia CBC
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
