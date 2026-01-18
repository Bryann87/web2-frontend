'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  auditService,
  AuditLog,
  AuditLogFilter,
  AuditResumen,
} from '@/services/auditService';
import { formatDateTimeFull, toInputDateFormat } from '@/utils/dateUtils';
import { DashboardLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { Modal } from '@/components/ui/Modal';

const TABLAS_NOMBRES: Record<string, string> = {
  persona: 'Personas',
  clase: 'Clases',
  inscripcion: 'Inscripciones',
  cobro: 'Cobros',
  asistencia: 'Asistencias',
  estilo_danza: 'Estilos de Danza',
  estado: 'Estados',
};

const OPERACION_COLORES: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [resumen, setResumen] = useState<AuditResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState<AuditLogFilter>({
    pagina: 1,
    tamañoPagina: 20,
  });

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [logsResponse, resumenData] = await Promise.all([
        auditService.obtenerLogs({ ...filtros, pagina }),
        auditService.obtenerResumen(filtros.fechaDesde, filtros.fechaHasta),
      ]);

      setLogs(logsResponse.logs);
      setTotalPaginas(logsResponse.totalPaginas);
      setResumen(resumenData);
    } catch (err) {
      setError('Error al cargar los datos de auditoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleFiltroChange = (campo: keyof AuditLogFilter, valor: string) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor || undefined,
    }));
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setFiltros({ pagina: 1, tamañoPagina: 20 });
    setPagina(1);
  };

  const renderCambios = (log: AuditLog) => {
    if (log.tipoOperacion === 'INSERT' && log.datosNuevos) {
      return (
        <div className="text-sm">
          <p className="font-medium text-green-700 mb-1">Datos creados:</p>
          <pre className="bg-green-50 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(log.datosNuevos, null, 2)}
          </pre>
        </div>
      );
    }

    if (log.tipoOperacion === 'UPDATE') {
      return (
        <div className="text-sm space-y-2">
          {log.camposModificados && (
            <p className="text-gray-600">
              Campos modificados: {log.camposModificados.join(', ')}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {log.datosAnteriores && (
              <div>
                <p className="font-medium text-red-700 mb-1">Antes:</p>
                <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(log.datosAnteriores, null, 2)}
                </pre>
              </div>
            )}
            {log.datosNuevos && (
              <div>
                <p className="font-medium text-green-700 mb-1">Después:</p>
                <pre className="bg-green-50 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(log.datosNuevos, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (log.tipoOperacion === 'DELETE' && log.datosAnteriores) {
      return (
        <div className="text-sm">
          <p className="font-medium text-red-700 mb-1">Datos eliminados:</p>
          <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(log.datosAnteriores, null, 2)}
          </pre>
        </div>
      );
    }

    return null;
  };

  return (
    <ProtectedRoute requiredRole="administrador">
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Auditoría del Sistema
          </h1>

          {/* Resumen */}
          {resumen && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Total Operaciones</p>
                <p className="text-2xl font-bold text-gray-800">
                  {resumen.totalOperaciones}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Inserciones</p>
                <p className="text-2xl font-bold text-green-600">
                  {resumen.totalInserts}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Actualizaciones</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {resumen.totalUpdates}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Eliminaciones</p>
                <p className="text-2xl font-bold text-red-600">
                  {resumen.totalDeletes}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Fallidas</p>
                <p className="text-2xl font-bold text-gray-700">
                  {resumen.operacionesFallidas}
                </p>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tabla
                </label>
                <select
                  className="w-full border rounded-md p-2"
                  value={filtros.tablaAfectada || ''}
                  onChange={(e) =>
                    handleFiltroChange('tablaAfectada', e.target.value)
                  }
                >
                  <option value="">Todas</option>
                  {Object.entries(TABLAS_NOMBRES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operación
                </label>
                <select
                  className="w-full border rounded-md p-2"
                  value={filtros.tipoOperacion || ''}
                  onChange={(e) =>
                    handleFiltroChange('tipoOperacion', e.target.value)
                  }
                >
                  <option value="">Todas</option>
                  <option value="INSERT">Inserción</option>
                  <option value="UPDATE">Actualización</option>
                  <option value="DELETE">Eliminación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  className="w-full border rounded-md p-2"
                  value={filtros.fechaDesde || ''}
                  max={toInputDateFormat()}
                  onChange={(e) =>
                    handleFiltroChange('fechaDesde', e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  className="w-full border rounded-md p-2"
                  value={filtros.fechaHasta || ''}
                  max={toInputDateFormat()}
                  onChange={(e) =>
                    handleFiltroChange('fechaHasta', e.target.value)
                  }
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={limpiarFiltros}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Tabla de logs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Cargando...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay registros de auditoría
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tabla
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Operación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID Registro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.idAudit} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDateTimeFull(log.fechaOperacion)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {TABLAS_NOMBRES[log.tablaAfectada] || log.tablaAfectada}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            OPERACION_COLORES[log.tipoOperacion] ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.tipoOperacion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.nombreUsuario || 'Sistema'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.idRegistro || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {log.exitoso ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span
                            className="text-red-600"
                            title={log.mensajeError || ''}
                          >
                            ✗
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal de detalles */}
          <Modal
            isOpen={!!selectedLog}
            onClose={() => setSelectedLog(null)}
            title="Detalles de la Operación"
            size="lg"
          >
            {selectedLog && (
              <div className="space-y-4">
                {/* Info general */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">
                      Fecha
                    </span>
                    <p className="font-medium text-sm">
                      {formatDateTimeFull(selectedLog.fechaOperacion)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">
                      Tabla
                    </span>
                    <p className="font-medium text-sm">
                      {TABLAS_NOMBRES[selectedLog.tablaAfectada] ||
                        selectedLog.tablaAfectada}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">
                      Operación
                    </span>
                    <p className="mt-1">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          OPERACION_COLORES[selectedLog.tipoOperacion] ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedLog.tipoOperacion}
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">
                      Usuario
                    </span>
                    <p className="font-medium text-sm">
                      {selectedLog.nombreUsuario || 'Sistema'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">
                      ID Registro
                    </span>
                    <p className="font-medium text-sm">
                      {selectedLog.idRegistro || '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">
                      Estado
                    </span>
                    <p className="font-medium text-sm">
                      {selectedLog.exitoso ? (
                        <span className="text-green-600">✓ Exitoso</span>
                      ) : (
                        <span className="text-red-600">✗ Fallido</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Info técnica */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">
                      Endpoint
                    </span>
                    <p
                      className="font-medium text-sm truncate"
                      title={selectedLog.endpoint || '-'}
                    >
                      {selectedLog.endpoint || '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">
                      Método
                    </span>
                    <p className="font-medium text-sm">
                      {selectedLog.metodoHttp || '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">IP</span>
                    <p className="font-medium text-sm">
                      {selectedLog.ipAddress || '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-xs text-gray-500 uppercase">
                      Duración
                    </span>
                    <p className="font-medium text-sm">
                      {selectedLog.duracionMs
                        ? `${selectedLog.duracionMs}ms`
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Mensaje de error si existe */}
                {!selectedLog.exitoso && selectedLog.mensajeError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <span className="text-xs text-red-600 uppercase font-medium">
                      Mensaje de Error
                    </span>
                    <p className="text-sm text-red-700 mt-1">
                      {selectedLog.mensajeError}
                    </p>
                  </div>
                )}

                {/* Cambios */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">
                    Cambios Realizados
                  </h4>
                  {renderCambios(selectedLog)}
                </div>
              </div>
            )}
          </Modal>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
