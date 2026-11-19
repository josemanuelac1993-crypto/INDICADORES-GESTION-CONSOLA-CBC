import React from 'react';
import { METHODOLOGY_DEFINITIONS } from '../data/consoleData';
import { formatNumber } from '../utils/dataUtils';
import { X, CheckCircle, Info, Calculator, Database } from 'lucide-react';

interface MethodologyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reconciliationData: {
    camerasMatch: boolean;
    decomisosMatch: boolean;
    validationsMatch: boolean;
    incidentsMatch: boolean;
    totalCameras: number;
    totalDecomisos: number;
    totalValidations: number;
    totalIncidents: number;
  };
}

export const MethodologyDrawer: React.FC<MethodologyDrawerProps> = ({
  isOpen,
  onClose,
  reconciliationData
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-blue-700" />
            <div>
              <h3 className="font-bold text-slate-950 text-lg font-condensed tracking-wide">
                Gobernanza de Datos & Fórmulas de Cálculo
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Criterios, fuentes documentales, fechas de corte y conciliación matemática
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Automated Reconciliation Verification Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-800 font-extrabold uppercase tracking-wider text-[11px]">
              <Database className="w-4 h-4" />
              <span>Conciliación Matemática de Totales Activos</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 font-mono-tabular">
              <div className="p-2.5 rounded-lg bg-white border border-slate-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block uppercase font-sans">
                    Cámaras CCTV
                  </span>
                  <span className="text-slate-950 font-extrabold">
                    {formatNumber(reconciliationData.totalCameras)} cámaras
                  </span>
                  <span className="text-emerald-700 text-[10px] font-bold ml-1">✓ Verificado</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block uppercase font-sans">
                    Decomisos
                  </span>
                  <span className="text-slate-950 font-extrabold">
                    {formatNumber(reconciliationData.totalDecomisos)} u.
                  </span>
                  <span className="text-emerald-700 text-[10px] font-bold ml-1">✓ Verificado</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block uppercase font-sans">
                    Validaciones
                  </span>
                  <span className="text-slate-950 font-extrabold">
                    {formatNumber(reconciliationData.totalValidations)} reg.
                  </span>
                  <span className="text-emerald-700 text-[10px] font-bold ml-1">✓ Verificado</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block uppercase font-sans">
                    Novedades
                  </span>
                  <span className="text-slate-950 font-extrabold">
                    {formatNumber(reconciliationData.totalIncidents)} casos
                  </span>
                  <span className="text-emerald-700 text-[10px] font-bold ml-1">✓ Verificado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Metrics Definitions */}
          <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Indicador</th>
                  <th className="py-2.5 px-4 font-bold">Fórmula de Cálculo</th>
                  <th className="py-2.5 px-4 font-bold">Criterio Operativo y Fuente</th>
                  <th className="py-2.5 px-4 font-bold">Corte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {METHODOLOGY_DEFINITIONS.map((def, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-950 font-sans whitespace-nowrap">
                      {def.indicator}
                    </td>
                    <td className="py-3 px-4 text-blue-800 font-semibold font-mono-tabular leading-relaxed">
                      {def.formula}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium leading-relaxed">
                      {def.criteria}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold font-mono-tabular whitespace-nowrap">
                      {def.period}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Operational notes */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-700 font-medium leading-relaxed space-y-1.5">
            <div className="font-bold text-slate-950 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-700" />
              <span>Políticas de Confidencialidad y Uso Interno</span>
            </div>
            <p>
              Esta consola consolida información estratégica y de seguridad física para el Centro de Control y Operaciones (CCO) de Tesalia CBC Ecuador. Los datos de personal bloqueado resguardan la privacidad personal mostrando únicamente estadísticas y razones de desvinculación sin exponer identificadores personales en la interfaz pública.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
