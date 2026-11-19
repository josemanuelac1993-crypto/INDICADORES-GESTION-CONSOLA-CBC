import React from 'react';
import { RegionName, AgencyData, WeatherData } from '../types/console';
import { COORDINATORS } from '../data/consoleData';
import { formatNumber, formatPercentage } from '../utils/dataUtils';
import { Network, UserCheck, ChevronRight } from 'lucide-react';

interface RegionalHubProps {
  regionsData: Record<RegionName, AgencyData[]>;
  weatherData: Record<string, WeatherData>;
  selectedRegion: RegionName | 'Todas';
  onSelectRegion: (region: RegionName | 'Todas') => void;
}

export const RegionalHub: React.FC<RegionalHubProps> = ({
  regionsData,
  weatherData,
  selectedRegion,
  onSelectRegion
}) => {
  const regionsList: RegionName[] = ['GYE-SALINAS-MILAGRO', 'COSTA', 'UIO-IBARRA', 'SIERRA-PUYO'];

  const allAgencies = Object.values(regionsData).flat();
  const nationalTotal = allAgencies.reduce((acc, a) => acc + a.n, 0);

  const regionConfigs: Record<
    RegionName,
    { color: string; border: string; bg: string; text: string; x: number; y: number }
  > = {
    'GYE-SALINAS-MILAGRO': {
      color: '#0284c7',
      border: 'border-sky-300 hover:border-sky-600',
      bg: 'bg-sky-50/70',
      text: 'text-sky-900',
      x: 150,
      y: 110
    },
    'COSTA': {
      color: '#7c3aed',
      border: 'border-violet-300 hover:border-violet-600',
      bg: 'bg-violet-50/70',
      text: 'text-violet-900',
      x: 450,
      y: 110
    },
    'UIO-IBARRA': {
      color: '#1d4ed8',
      border: 'border-blue-300 hover:border-blue-600',
      bg: 'bg-blue-50/70',
      text: 'text-blue-900',
      x: 150,
      y: 350
    },
    'SIERRA-PUYO': {
      color: '#059669',
      border: 'border-emerald-300 hover:border-emerald-600',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-900',
      x: 450,
      y: 350
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-blue-700" />
          <h3 className="font-bold text-slate-950 text-base font-condensed tracking-wide uppercase">
            Ecosistema de Mando Regional
          </h3>
        </div>
        <span className="text-xs text-slate-600 font-medium">
          Coordinación Operativa Descentralizada
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Visual Hub SVG Network */}
        <div className="lg:col-span-5 relative aspect-square max-h-[370px] w-full mx-auto flex items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-200">
          <svg viewBox="0 0 600 480" className="w-full h-full" aria-hidden="true">
            {/* Outer Orbit Rings */}
            <circle cx="300" cy="230" r="180" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="4 6" />
            <circle cx="300" cy="230" r="120" fill="none" stroke="#cbd5e1" strokeWidth="1" />

            {/* Connecting Lines */}
            {regionsList.map(r => {
              const cfg = regionConfigs[r];
              const isSelected = selectedRegion === r || selectedRegion === 'Todas';
              return (
                <line
                  key={r}
                  x1="300"
                  y1="230"
                  x2={cfg.x}
                  y2={cfg.y}
                  stroke={cfg.color}
                  strokeWidth={isSelected ? 2.2 : 1.2}
                  strokeOpacity={isSelected ? 0.85 : 0.3}
                  strokeDasharray="5 4"
                />
              );
            })}

            {/* Center Node (CCO National) */}
            <g className="cursor-pointer" onClick={() => onSelectRegion('Todas')}>
              <circle cx="300" cy="230" r="64" fill="#ffffff" stroke="#1d4ed8" strokeWidth="3" />
              <circle cx="300" cy="230" r="54" fill="#eff6ff" />
              <text
                x="300"
                y="222"
                textAnchor="middle"
                fill="#0f172a"
                fontSize="25"
                fontWeight="800"
                fontFamily="Barlow Condensed, sans-serif"
              >
                {formatNumber(nationalTotal)}
              </text>
              <text x="300" y="243" textAnchor="middle" fill="#334155" fontSize="11" fontWeight="700" letterSpacing="0.8">
                NOVEDADES
              </text>
              <text x="300" y="259" textAnchor="middle" fill="#1d4ed8" fontSize="9.5" fontWeight="800">
                NACIONAL
              </text>
            </g>

            {/* Regional Satellite Nodes */}
            {regionsList.map(r => {
              const cfg = regionConfigs[r];
              const list = regionsData[r] || [];
              const regTotal = list.reduce((acc, a) => acc + a.n, 0);
              const isSelected = selectedRegion === r;

              return (
                <g
                  key={r}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => onSelectRegion(selectedRegion === r ? 'Todas' : r)}
                >
                  <circle
                    cx={cfg.x}
                    cy={cfg.y}
                    r={isSelected ? 52 : 47}
                    fill="#ffffff"
                    stroke={cfg.color}
                    strokeWidth={isSelected ? 3.5 : 2.2}
                  />
                  <circle cx={cfg.x} cy={cfg.y} r="39" fill={cfg.color} fillOpacity="0.1" />

                  <text
                    x={cfg.x}
                    y={cfg.y - 3}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="19"
                    fontWeight="800"
                    fontFamily="Barlow Condensed, sans-serif"
                  >
                    {formatNumber(regTotal)}
                  </text>
                  <text x={cfg.x} y={cfg.y + 15} textAnchor="middle" fill="#475569" fontSize="10.5" fontWeight="700">
                    {formatPercentage(regTotal, nationalTotal)}
                  </text>
                  <text
                    x={cfg.x}
                    y={cfg.y > 230 ? cfg.y + 66 : cfg.y - 56}
                    textAnchor="middle"
                    fill={cfg.color}
                    fontSize="11.5"
                    fontWeight="800"
                  >
                    {r}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 4 Regional Summary Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {regionsList.map(r => {
            const list = regionsData[r] || [];
            const regTotal = list.reduce((acc, a) => acc + a.n, 0);
            const cfg = regionConfigs[r];
            const isSelected = selectedRegion === r;

            const primarySite = list[0]?.a;
            const weather = primarySite ? weatherData[primarySite] : null;

            return (
              <div
                key={r}
                onClick={() => onSelectRegion(selectedRegion === r ? 'Todas' : r)}
                className={`cursor-pointer rounded-xl p-4 transition-all border ${cfg.bg} ${
                  isSelected
                    ? 'border-slate-900 ring-1 ring-slate-900/20 shadow-md'
                    : `${cfg.border} shadow-2xs hover:shadow-sm`
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className={`font-extrabold text-sm tracking-wide font-condensed ${cfg.text}`}>
                      {r}
                    </h4>
                    <p className="text-xs text-slate-700 flex items-center gap-1 mt-0.5 font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                      <span>
                        Coord: <b className="text-slate-950">{COORDINATORS[r]}</b>
                      </span>
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-slate-500'}`} />
                </div>

                <div className="flex items-baseline justify-between mt-3 pt-2.5 border-t border-slate-300/70">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-950 font-condensed font-mono-tabular">
                      {formatNumber(regTotal)}
                    </span>
                    <span className="text-xs text-slate-700 font-medium ml-1">novedades</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono-tabular">
                    {formatPercentage(regTotal, nationalTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-700 font-medium mt-2">
                  <span>{list.length} instalaciones activas</span>
                  {weather && (
                    <span className="flex items-center gap-1 font-bold text-slate-900 font-mono-tabular">
                      <span>{weather.icon}</span>
                      <span>{weather.temp}°C</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
