import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { AgencyData, WeatherData, RegionName } from '../types/console';
import { MAP_PATHS, EXACT_COORDINATES, FACILITY_TYPES, SECURITY_COMPANIES, COORDINATORS } from '../data/consoleData';
import { formatNumber, formatPercentage } from '../utils/dataUtils';
import { MapPin, ExternalLink, Share2, CloudRain, Shield, Camera, Truck, Globe, Layers } from 'lucide-react';

interface InteractiveMapProps {
  agencies: AgencyData[];
  weatherData: Record<string, WeatherData>;
  selectedRegion: RegionName | 'Todas';
  onSelectAgency: (agency: AgencyData) => void;
  onFilterRegion: (region: RegionName | 'Todas') => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  agencies,
  weatherData,
  selectedRegion,
  onSelectAgency,
  onFilterRegion
}) => {
  const [hoveredAgency, setHoveredAgency] = useState<AgencyData | null>(null);
  const [mapMode, setMapMode] = useState<'google' | 'vector'>('google');

  const regionColors: Record<RegionName, { stroke: string; fill: string; dot: string }> = {
    'GYE-SALINAS-MILAGRO': { stroke: '#0284c7', fill: 'rgba(2, 132, 199, 0.2)', dot: '#0369a1' },
    'COSTA': { stroke: '#7c3aed', fill: 'rgba(124, 58, 237, 0.2)', dot: '#6d28d9' },
    'UIO-IBARRA': { stroke: '#1d4ed8', fill: 'rgba(29, 78, 216, 0.2)', dot: '#1e40af' },
    'SIERRA-PUYO': { stroke: '#059669', fill: 'rgba(5, 150, 105, 0.2)', dot: '#047857' }
  };

  const getCoordinates = (name: string): [number, number] => {
    const coords = EXACT_COORDINATES[name];
    if (!coords) return [300, 300];
    const x = (coords.lo + 81.6) * 100;
    const y = (1.6 - coords.la) * 100;
    return [x, y];
  };

  const totalNovedades = agencies.reduce((acc, a) => acc + a.n, 0);

  return (
    <div className="relative bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm p-4 sm:p-6">
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-700" />
            <h3 className="font-bold text-slate-950 text-base font-condensed tracking-wide uppercase">
              Despliegue Georreferenciado Nacional · 21 Instalaciones
            </h3>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Monitoreo territorial de plantas, agencias y bodegas en las 4 regiones operativas de Ecuador
          </p>
        </div>

        {/* Mode Toggle & Region Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300">
            <button
              onClick={() => setMapMode('google')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                mapMode === 'google'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>
            <button
              onClick={() => setMapMode('vector')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                mapMode === 'vector'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vectorial CCO</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 hidden sm:block" />

          <button
            onClick={() => onFilterRegion('Todas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              selectedRegion === 'Todas'
                ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            Todas ({agencies.length})
          </button>
          {(['GYE-SALINAS-MILAGRO', 'COSTA', 'UIO-IBARRA', 'SIERRA-PUYO'] as RegionName[]).map(r => (
            <button
              key={r}
              onClick={() => onFilterRegion(selectedRegion === r ? 'Todas' : r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                selectedRegion === r
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {mapMode === 'google' ? (
          /* Google Maps Platform Live Satellite/Roadmap View */
          <div className="lg:col-span-8 relative aspect-[660/680] max-h-[580px] min-h-[500px] w-full mx-auto rounded-xl overflow-hidden border border-slate-300 shadow-xs bg-slate-100">
            <APIProvider
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
            >
              <Map
                defaultCenter={{ lat: -1.831239, lng: -78.183406 }}
                defaultZoom={7}
                mapId="DEMO_MAP_ID"
                style={{ width: '100%', height: '100%' }}
                gestureHandling="greedy"
                disableDefaultUI={false}
              >
                {agencies.map(agency => {
                  const coords = EXACT_COORDINATES[agency.a];
                  if (!coords) return null;
                  const region = agency.region || 'COSTA';
                  const colors = regionColors[region];
                  const isSelected = selectedRegion === 'Todas' || selectedRegion === region;
                  const isHovered = hoveredAgency?.a === agency.a;
                  if (!isSelected) return null;

                  return (
                    <AdvancedMarker
                      key={agency.a}
                      position={{ lat: coords.la, lng: coords.lo }}
                      title={agency.a}
                      onClick={() => {
                        setHoveredAgency(agency);
                        onSelectAgency(agency);
                      }}
                    >
                      <div
                        onMouseEnter={() => setHoveredAgency(agency)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md border transition-all cursor-pointer ${
                          isHovered
                            ? 'bg-blue-700 text-white border-blue-900 scale-110 z-50 ring-2 ring-blue-300'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-blue-600 hover:scale-105'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: colors.dot }}
                        />
                        <span className="text-[11px] font-bold font-condensed tracking-tight whitespace-nowrap">
                          {agency.a.replace(/^(Agencia|Planta y Agencia|Planta|Bodega|Edificio)\s+/i, '')}
                        </span>
                        {agency.n > 0 && (
                          <span
                            className={`text-[10px] font-mono-tabular font-bold px-1.5 py-0.2 rounded-full ${
                              isHovered ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {agency.n}
                          </span>
                        )}
                      </div>
                    </AdvancedMarker>
                  );
                })}
              </Map>
            </APIProvider>

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-medium text-slate-800 bg-white/95 backdrop-blur-xs border border-slate-300 rounded-lg px-3 py-1.5 pointer-events-none shadow-xs z-10">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-700" />
                Google Maps Platform · Coordenadas GPS Oficiales CCO
              </span>
              <span className="hidden sm:inline font-mono-tabular">21 Sedes Georreferenciadas</span>
            </div>
          </div>
        ) : (
          /* Vector Map Canvas (Light Cartographic Style) */
          <div className="lg:col-span-8 relative aspect-[660/680] max-h-[580px] w-full mx-auto rounded-xl overflow-hidden border border-slate-300 bg-gradient-to-br from-sky-50 via-slate-50 to-blue-50/70">
            <svg
              viewBox="0 0 660 680"
              className="w-full h-full block"
              aria-label="Mapa de Ecuador con instalaciones de Tesalia CBC"
            >
              <defs>
                <pattern id="gridPatternLight" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.22)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Grid Backdrop */}
              <rect width="660" height="680" fill="url(#gridPatternLight)" />

              {/* Adjacent Country Borders */}
              <path d={MAP_PATHS.co} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" opacity="0.7" />
              <path d={MAP_PATHS.pe} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" opacity="0.7" />

              {/* Ecuador Mainland */}
              <path
                d={MAP_PATHS.ec}
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="2"
                strokeLinejoin="round"
                className="drop-shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
              />

              {/* Country Labels */}
              <g fill="#64748b" fontWeight="800" letterSpacing="4" textAnchor="middle" opacity="0.55">
                <text x="470" y="470" fontSize="22">ECUADOR</text>
                <text x="480" y="70" fontSize="13">COLOMBIA</text>
                <text x="470" y="625" fontSize="13">PERÚ</text>
              </g>

              {/* Agency Pins */}
              {agencies.map(agency => {
                const [cx, cy] = getCoordinates(agency.a);
                const region = agency.region || 'COSTA';
                const colors = regionColors[region];
                const isSelected = selectedRegion === 'Todas' || selectedRegion === region;
                const isHovered = hoveredAgency?.a === agency.a;
                const weather = weatherData[agency.a];

                const radius = Math.max(8.5, Math.min(22, 6.5 + Math.sqrt(agency.n) * 0.9));

                return (
                  <g
                    key={agency.a}
                    onClick={() => onSelectAgency(agency)}
                    onMouseEnter={() => setHoveredAgency(agency)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? 'opacity-100' : 'opacity-25 hover:opacity-100'
                    }`}
                  >
                    {/* Halo */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? radius + 6 : radius + 3.5}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isHovered ? 2.5 : 1.4}
                      className="transition-all"
                    />

                    {/* Core Circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={isHovered ? colors.dot : colors.stroke}
                    />

                    {/* Incident Number Inside Pin */}
                    <text
                      x={cx}
                      y={cy + 3.5}
                      textAnchor="middle"
                      fontSize={radius > 11 ? '11' : '9.5'}
                      fontWeight="800"
                      fill="#ffffff"
                      fontFamily="Barlow Condensed, sans-serif"
                      pointerEvents="none"
                    >
                      {agency.n}
                    </text>

                    {/* Floating High-Contrast Label */}
                    <text
                      x={cx}
                      y={cy - radius - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="3.5"
                      paintOrder="stroke"
                      pointerEvents="none"
                      fontFamily="Barlow, sans-serif"
                    >
                      {agency.a.replace(/^Agencia /, '').replace(/^Planta /, 'Pl. ')}
                      {weather && ` · ${weather.icon} ${weather.temp}°`}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Bottom Map Caption */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-medium text-slate-700 bg-white/90 backdrop-blur-xs border border-slate-300 rounded-lg px-3 py-1.5 pointer-events-none shadow-2xs">
              <span>Pasa el cursor o haz clic sobre una sede para inspeccionar su ficha</span>
              <span className="hidden sm:inline font-mono-tabular">Open-Meteo · UTC-5</span>
            </div>
          </div>
        )}

        {/* Dynamic Detail Card for Hovered or Selected Agency */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-50 border border-slate-300 rounded-xl p-5 shadow-xs min-h-[470px]">
          {hoveredAgency ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800 block">
                    {FACILITY_TYPES[hoveredAgency.a] || 'AGENCIA'}
                  </span>
                  <h4 className="text-xl font-bold text-slate-950 font-condensed mt-0.5">
                    {hoveredAgency.a}
                  </h4>
                  <p className="text-xs text-slate-700 font-medium">
                    {hoveredAgency.loc} · Región {hoveredAgency.region}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-blue-800 font-condensed font-mono-tabular">
                    {formatNumber(hoveredAgency.n)}
                  </span>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {formatPercentage(hoveredAgency.n, totalNovedades)} del total
                  </p>
                </div>
              </div>

              {/* Weather Telemetry Box */}
              {weatherData[hoveredAgency.a] && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-300 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{weatherData[hoveredAgency.a].icon}</span>
                    <div>
                      <div className="font-bold text-slate-950">
                        {weatherData[hoveredAgency.a].temp}°C · {weatherData[hoveredAgency.a].desc}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium flex items-center gap-2">
                        <span>Máx: {weatherData[hoveredAgency.a].tempMax}°</span>
                        <span>Mín: {weatherData[hoveredAgency.a].tempMin}°</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-blue-800 font-semibold flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-700" />
                    <span>{weatherData[hoveredAgency.a].rainProb}% lluvia</span>
                  </div>
                </div>
              )}

              {/* Coordinator & Security */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-300">
                  <span className="text-[10px] text-slate-600 uppercase font-bold block">Coordinador</span>
                  <span className="text-slate-950 font-bold truncate block mt-0.5">
                    {hoveredAgency.region ? COORDINATORS[hoveredAgency.region] : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-300">
                  <span className="text-[10px] text-slate-600 uppercase font-bold block">Seguridad Física</span>
                  <span className="text-slate-950 font-bold truncate block mt-0.5">
                    {SECURITY_COMPANIES[hoveredAgency.a] || 'LIDERMAN'}
                  </span>
                </div>
              </div>

              {/* Operational Status Rows */}
              <div className="space-y-1.5 text-xs">
                {hoveredAgency.cm && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      CCTV Instalado:
                    </span>
                    <span className="font-bold text-slate-950 font-mono-tabular">
                      {hoveredAgency.cm[0] + hoveredAgency.cm[1]} cámaras
                      {hoveredAgency.cm[1] > 0 && (
                        <span className="text-rose-700 ml-1">({hoveredAgency.cm[1]} fallo)</span>
                      )}
                    </span>
                  </div>
                )}
                {hoveredAgency.sp && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Shield className="w-3.5 h-3.5 text-blue-700" />
                      Supervisión Turnos:
                    </span>
                    <span className="font-bold text-slate-950 font-mono-tabular">
                      {formatPercentage(hoveredAgency.sp[0], hoveredAgency.sp[0] + hoveredAgency.sp[1])}
                    </span>
                  </div>
                )}
                {hoveredAgency.bl && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Truck className="w-3.5 h-3.5 text-indigo-700" />
                      Frecuencia Blindados:
                    </span>
                    <span className="font-bold text-slate-950 font-mono-tabular">
                      {formatPercentage(hoveredAgency.bl[0], hoveredAgency.bl[0] + hoveredAgency.bl[1])}
                    </span>
                  </div>
                )}
              </div>

              {/* Exact Coordinates */}
              {EXACT_COORDINATES[hoveredAgency.a] && (
                <div className="text-[11px] text-slate-800 font-mono-tabular bg-white p-2.5 rounded-lg border border-slate-300">
                  <span className="text-slate-600 block text-[10px] uppercase font-sans font-bold mb-0.5">
                    Coordenadas GPS (WGS84)
                  </span>
                  <span className="font-semibold">📍 {EXACT_COORDINATES[hoveredAgency.a].dms}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  onClick={() => onSelectAgency(hoveredAgency)}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Ver Ficha Técnica Completa</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {EXACT_COORDINATES[hoveredAgency.a] && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps?q=${EXACT_COORDINATES[hoveredAgency.a].la},${EXACT_COORDINATES[hoveredAgency.a].lo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 text-[11px] font-bold text-center text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                    >
                      Google Maps
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `📍 Ubicación ${hoveredAgency.a}: https://www.google.com/maps?q=${EXACT_COORDINATES[hoveredAgency.a].la},${EXACT_COORDINATES[hoveredAgency.a].lo}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1"
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="my-auto text-center py-8 px-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-300 text-blue-700 mx-auto flex items-center justify-center mb-3 shadow-2xs">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-950 text-base font-condensed">
                Selecciona o pasa el cursor
              </h4>
              <p className="text-xs text-slate-700 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
                Interactúa con cualquiera de las 21 instalaciones en el mapa para inspeccionar sus coordenadas GPS, clima en vivo, cámaras CCTV y novedades.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-200 text-left text-xs space-y-2 bg-white p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-sky-600" />
                  <span className="text-slate-800 font-semibold">Región GYE-Salinas-Milagro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-violet-600" />
                  <span className="text-slate-800 font-semibold">Región Costa</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-blue-700" />
                  <span className="text-slate-800 font-semibold">Región UIO-Ibarra</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600" />
                  <span className="text-slate-800 font-semibold">Región Sierra-Puyo</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
