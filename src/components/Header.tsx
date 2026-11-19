import React, { useEffect, useState } from 'react';
import { Shield, Clock, Download, PlusCircle, HelpCircle, Search, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewIncident: (mode?: 'manual' | 'excel') => void;
  onExportExcel: () => void;
  onOpenMethodology: () => void;
  weatherLive: boolean;
  onRefreshWeather: () => void;
  isRefreshingWeather: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNewIncident,
  onExportExcel,
  onOpenMethodology,
  weatherLive,
  onRefreshWeather,
  isRefreshingWeather
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tz = 'America/Guayaquil';
      const timeStr = now.toLocaleTimeString('es-EC', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const dateStr = now.toLocaleDateString('es-EC', {
        timeZone: tz,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-300 shadow-xs px-4 sm:px-6 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-700 shadow-xs flex items-center justify-center text-white">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-extrabold text-lg tracking-tight text-slate-950 font-condensed">
                TESALIA CBC · CCO
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                · Seguridad Física
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium hidden sm:block">
              Centro de Control y Operaciones · Novedades e Indicadores Nacionales
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md flex items-center gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Buscar sedes, coordinadores, contratistas..."
              className="w-full pl-9 pr-7 py-1.5 text-xs sm:text-sm bg-slate-50 text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Clock & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 flex-wrap">
          {/* Ecuador Clock */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <div className="text-right font-mono-tabular leading-tight">
              <span className="font-bold text-slate-950 text-xs">{currentTime}</span>
              <span className="text-[11px] text-slate-600 ml-1.5 capitalize font-medium">{currentDate}</span>
            </div>
          </div>

          {/* Weather Refresh Button */}
          <button
            onClick={onRefreshWeather}
            title={weatherLive ? 'Clima sincronizado en vivo (Open-Meteo). Clic para actualizar' : 'Refrescar datos meteorológicos'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshingWeather ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Clima</span>
          </button>

          {/* Action: Methodology / Formulas */}
          <button
            onClick={onOpenMethodology}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            title="Ver cómo se calcula cada indicador"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
            <span className="hidden sm:inline">Fórmulas</span>
          </button>

          {/* Action: Export to Excel */}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            title="Descargar consolidado actual en Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-700" />
            <span>Exportar</span>
          </button>

          {/* Action: Upload Excel */}
          <button
            onClick={() => onOpenNewIncident('excel')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-400 transition-colors shadow-2xs"
            title="Subir archivos Excel para extraer y actualizar indicadores"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Subir Excel</span>
          </button>

          {/* Action: New Incident / Registro */}
          <button
            onClick={() => onOpenNewIncident('manual')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Registrar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
