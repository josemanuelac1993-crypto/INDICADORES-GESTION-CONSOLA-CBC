import React, { useState, useMemo } from 'react';
import { AuditReport } from '../types/console';
import { FileSearch, Search, CheckCircle2 } from 'lucide-react';

interface AuditReportsViewProps {
  reports: AuditReport[];
  onSelectAgencyName?: (agencyName: string) => void;
}

export const AuditReportsView: React.FC<AuditReportsViewProps> = ({
  reports,
  onSelectAgencyName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<string>('Todas');

  const agencyList = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => set.add(r.a));
    return ['Todas', ...Array.from(set).sort()];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(item => {
      const matchSearch =
        item.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.d && item.d.includes(searchTerm));
      const matchAgency = selectedAgency === 'Todas' || item.a === selectedAgency;
      return matchSearch && matchAgency;
    });
  }, [reports, searchTerm, selectedAgency]);

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-950 font-condensed tracking-wide uppercase flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-teal-700" />
            <span>Archivo de Auditorías & Revisiones de Video CCTV ({reports.length})</span>
          </h3>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Registro consolidado de peritajes técnicos e inspecciones de seguridad física documentados
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por código o fecha..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <select
            value={selectedAgency}
            onChange={e => setSelectedAgency(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
          >
            {agencyList.map(a => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table Grid */}
      <div className="overflow-x-auto max-h-[500px] rounded-xl border border-slate-300 bg-white">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] sticky top-0 border-b border-slate-300">
            <tr>
              <th className="py-2.5 px-4 font-bold">Código ID</th>
              <th className="py-2.5 px-4 font-bold">Instalación / Sede</th>
              <th className="py-2.5 px-4 font-bold">Fecha del Evento</th>
              <th className="py-2.5 px-4 font-bold">Fecha de Auditoría</th>
              <th className="py-2.5 px-4 font-bold text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono-tabular">
            {filteredReports.map(report => (
              <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-4 font-bold text-blue-800">
                  {report.id}
                </td>
                <td className="py-2.5 px-4 font-sans font-bold text-slate-950">
                  <button
                    onClick={() => onSelectAgencyName && onSelectAgencyName(report.a)}
                    className="hover:text-blue-700 hover:underline text-left"
                  >
                    {report.a}
                  </button>
                </td>
                <td className="py-2.5 px-4 text-slate-800 font-medium">
                  {report.d || <span className="text-slate-500 italic">No especificada</span>}
                </td>
                <td className="py-2.5 px-4 text-slate-700">
                  {report.at ? report.at.slice(0, 10) : '2026-11-16'}
                </td>
                <td className="py-2.5 px-4 text-right font-sans">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Documentado
                  </span>
                </td>
              </tr>
            ))}
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-600 font-sans font-medium">
                  No se encontraron informes que coincidan con los criterios de búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
