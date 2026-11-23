import React, { useEffect, useState } from 'react';
import {
  IncidentRecord,
  PendingUploadBatch,
  RegionName,
  StoredRepoFile,
  UploadHistoryRecord
} from '../types/console';
import { CATEGORY_LABELS, STATUS_LABELS } from '../data/consoleData';
import { ExcelUploaderBlock } from './ExcelUploaderBlock';
import { X, PlusCircle, CheckCircle, FileSpreadsheet, PenLine } from 'lucide-react';

interface IncidentFormModalProps {
  isOpen: boolean;
  initialMode?: 'manual' | 'excel';
  onClose: () => void;
  onSaveIncident: (incident: IncidentRecord) => void;
  onApplyUploadBatch: (
    batch: PendingUploadBatch,
    fileNames: string[],
    storedFiles?: StoredRepoFile[]
  ) => void;
  agenciesByRegion: Record<RegionName, { a: string }[]>;
  uploadHistory?: UploadHistoryRecord[];
  repoFiles?: StoredRepoFile[];
  auditReportsCount?: number;
}

export const IncidentFormModal: React.FC<IncidentFormModalProps> = ({
  isOpen,
  initialMode = 'manual',
  onClose,
  onSaveIncident,
  onApplyUploadBatch,
  agenciesByRegion,
  uploadHistory = [],
  repoFiles = [],
  auditReportsCount = 0
}) => {
  const [mode, setMode] = useState<'manual' | 'excel'>(initialMode);
  const [selectedAgency, setSelectedAgency] = useState('Agencia Norte GYE');
  const [category, setCategory] = useState<number>(0);
  const [status, setStatus] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [detail, setDetail] = useState('');
  const [author, setAuthor] = useState('Operador CCO');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSubmitted(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: IncidentRecord = {
      id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      a: selectedAgency,
      t: category,
      e: status,
      d: date,
      x: detail.trim(),
      author: author.trim() || 'Operador CCO',
      source: 'manual'
    };

    onSaveIncident(newRecord);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDetail('');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-blue-700 shrink-0" />
            <div>
              <h3 className="font-bold text-slate-950 text-lg font-condensed tracking-wide">
                Bloque de Registro Operativo y Carga de Indicadores
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Registra una incidencia puntual o sube archivos Excel para actualizar los indicadores y archivar en REPO PLATAFORMA
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

        {/* Mode Selector Tabs */}
        <div className="px-5 pt-4 bg-white">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 border border-slate-300 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'manual'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Registro Manual de Novedad</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('excel')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'excel'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Subir en Excel / Extraer Datos</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          {mode === 'excel' ? (
            <ExcelUploaderBlock
              compact
              onApplyBatch={onApplyUploadBatch}
              uploadHistory={uploadHistory}
              repoFiles={repoFiles}
              auditReportsCount={auditReportsCount}
              onSuccessClose={onClose}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {submitted ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-slate-950">Novedad Registrada con Éxito</h4>
                  <p className="text-xs text-slate-600 font-medium">
                    El tablero y los indicadores de la sede han sido actualizados en tiempo real.
                  </p>
                </div>
              ) : (
                <>
                  {/* Agency Selection */}
                  <div>
                    <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 text-[11px]">
                      Instalación / Sede Involucrada
                    </label>
                    <select
                      value={selectedAgency}
                      onChange={e => setSelectedAgency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                      required
                    >
                      {(Object.keys(agenciesByRegion) as RegionName[]).map(r => (
                        <optgroup key={r} label={`Región ${r}`}>
                          {agenciesByRegion[r].map(ag => (
                            <option key={ag.a} value={ag.a}>
                              {ag.a}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Category & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 text-[11px]">
                        Categoría de Novedad
                      </label>
                      <select
                        value={category}
                        onChange={e => setCategory(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                      >
                        {CATEGORY_LABELS.map((label, idx) => (
                          <option key={idx} value={idx}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 text-[11px]">
                        Estado Operativo
                      </label>
                      <select
                        value={status}
                        onChange={e => setStatus(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                      >
                        {STATUS_LABELS.map((st, idx) => (
                          <option key={idx} value={idx}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date & Author */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 text-[11px]">
                        Fecha del Evento
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white font-mono-tabular"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 text-[11px]">
                        Registrado por
                      </label>
                      <input
                        type="text"
                        value={author}
                        onChange={e => setAuthor(e.target.value)}
                        placeholder="Operador / Coordinador"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Detail textarea */}
                  <div>
                    <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 text-[11px]">
                      Detalle de la Novedad o Acciones Tomadas
                    </label>
                    <textarea
                      rows={3}
                      value={detail}
                      onChange={e => setDetail(e.target.value)}
                      placeholder="Describe la incidencia, involucrados, unidad de transporte, reporte de garita..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs"
                    >
                      Guardar Novedad
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
