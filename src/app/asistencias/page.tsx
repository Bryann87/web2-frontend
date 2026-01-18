'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  LoadingSpinner,
  ActionButton,
  Pagination,
} from '@/components/ui';
import { useAuth, usePagination } from '@/hooks';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/components/ui/Toast';
import {
  asistenciasService,
  clasesService,
  inscripcionesService,
} from '@/services';
import { reportUtils } from '@/utils/reportUtils';
import {
  AsistenciaFilters,
  ValidacionAsistencia,
} from '@/services/asistenciasService';
import { Clase, Persona, Asistencia, Inscripcion } from '@/types';
import { toInputDateFormat, toISOWithCurrentTime } from '@/utils/dateUtils';

interface AsistenciaEstudiante {
  estudiante: Persona;
  presente: boolean;
  observaciones?: string;
  asistenciaExistente?: Asistencia;
}

// Componente de alerta para validación de asistencia
const ValidacionAlert = ({
  validacion,
  onClose,
}: {
  validacion: ValidacionAsistencia | null;
  onClose: () => void;
}) => {
  if (!validacion || validacion.puedeRegistrar) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('es-EC', {
      timeZone: 'America/Guayaquil',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            {validacion.yaRegistradaEstaSemana
              ? 'Asistencia ya registrada esta semana'
              : 'No es dia de clase'}
          </h3>
          <p className="mt-1 text-sm text-amber-700">{validacion.mensaje}</p>
          {validacion.proximaFechaDisponible && (
            <p className="mt-2 text-sm text-amber-600">
              <span className="font-medium">Próxima fecha disponible:</span>{' '}
              {formatDate(validacion.proximaFechaDisponible)}
            </p>
          )}
          {validacion.fechaUltimaAsistencia && (
            <p className="mt-1 text-sm text-amber-600">
              <span className="font-medium">Última asistencia:</span>{' '}
              {formatDate(validacion.fechaUltimaAsistencia)}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-amber-400 hover:text-amber-600 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Loading overlay para filas individuales
const RowLoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs text-indigo-600 font-medium">
        Actualizando...
      </span>
    </div>
  </div>
);

function AsistenciasContent() {
  const { user, isAdmin, isProfesor } = useAuth();
  const searchParams = useSearchParams();
  const claseIdParam = searchParams.get('clase');
  const { page, pageSize, goToPage } = usePagination();
  const { showToast } = useToast();

  const [clases, setClases] = useState<Clase[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState<number>(0);
  const [fechaSeleccionada, setFechaSeleccionada] =
    useState<string>(toInputDateFormat());
  const [estudiantesClase, setEstudiantesClase] = useState<
    AsistenciaEstudiante[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingClases, setLoadingClases] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros avanzados
  const [showFilters, setShowFilters] = useState(false);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>('');
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>('');
  const [filtroInscripcion, setFiltroInscripcion] = useState<number>(0);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [asistenciasFiltradas, setAsistenciasFiltradas] = useState<
    Asistencia[]
  >([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [viewMode, setViewMode] = useState<'registro' | 'historial'>(
    'registro',
  );
  const [downloading, setDownloading] = useState(false);
  const [updatingEstudiante, setUpdatingEstudiante] = useState<number | null>(
    null,
  );
  const [validacionAsistencia, setValidacionAsistencia] =
    useState<ValidacionAsistencia | null>(null);
  const [validandoClase, setValidandoClase] = useState(false);
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);

  // WebSocket para recargar datos en tiempo real
  const { subscribe, isConnected } = useWebSocket();

  const loadEstudiantesClase = async () => {
    if (!claseSeleccionada) return;
    try {
      setLoading(true);
      const estudiantesClaseData =
        await clasesService.getEstudiantes(claseSeleccionada);
      const asistenciasExistentes = await asistenciasService.getByClase(
        claseSeleccionada,
        fechaSeleccionada,
      );

      // Deduplicate students by idPersona
      const estudiantesUnicos = estudiantesClaseData.filter(
        (estudiante: Persona, index: number, self: Persona[]) =>
          index === self.findIndex((e) => e.idPersona === estudiante.idPersona),
      );

      const estudiantesConAsistencia: AsistenciaEstudiante[] =
        estudiantesUnicos.map((estudiante: Persona) => {
          const asistenciaExistente = asistenciasExistentes.find(
            (a) => a.estudiante?.idPersona === estudiante.idPersona,
          );
          return {
            estudiante,
            presente: asistenciaExistente?.estadoAsis === 'Presente' || false,
            observaciones: asistenciaExistente?.estadoAsis || '',
            asistenciaExistente,
          };
        });

      setEstudiantesClase(estudiantesConAsistencia);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar estudiantes',
      );
    } finally {
      setLoading(false);
    }
  };

  const validarAsistenciaClase = async (claseId: number) => {
    try {
      setValidandoClase(true);
      const validacion = await asistenciasService.validarAsistencia(claseId);
      setValidacionAsistencia(validacion);

      // Mostrar toast si no se puede registrar
      if (!validacion.puedeRegistrar) {
        showToast(
          `No se puede registrar asistencia. Hoy es ${validacion.diaActual} y la clase es los dias ${validacion.diaSemanaClase}`,
          'warning',
          6000,
        );
      }

      return validacion;
    } catch (err) {
      console.error('Error al validar asistencia:', err);
      // Si hay error en la validación, permitir continuar
      setValidacionAsistencia(null);
      return null;
    } finally {
      setValidandoClase(false);
    }
  };

  const loadAsistenciasHistorial = async () => {
    try {
      setLoading(true);
      const filters: AsistenciaFilters = {};

      if (filtroFechaInicio) filters.fechaInicio = filtroFechaInicio;
      if (filtroFechaFin) filters.fechaFin = filtroFechaFin;
      if (filtroInscripcion > 0) filters.idInscripcion = filtroInscripcion;
      if (filtroEstado) filters.estadoAsis = filtroEstado;
      if (claseSeleccionada > 0) filters.idClase = claseSeleccionada;

      const response = await asistenciasService.getAll(
        { page, pageSize },
        filters,
      );
      setAsistenciasFiltradas(response.data);
      setTotalRecords(response.totalRecords);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar historial',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribe('nueva_asistencia', () => {
      // Recargar ambas vistas cuando llega una notificación
      loadAsistenciasHistorial();
      if (claseSeleccionada > 0) {
        loadEstudiantesClase();
      }
    });
    return unsubscribe;
  }, [
    subscribe,
    viewMode,
    claseSeleccionada,
    fechaSeleccionada,
    page,
    pageSize,
    filtroFechaInicio,
    filtroFechaFin,
    filtroInscripcion,
    filtroEstado,
  ]);

  useEffect(() => {
    if (user) {
      loadClases();
      loadInscripciones();
    }
  }, [user]);

  useEffect(() => {
    if (claseIdParam) {
      setClaseSeleccionada(parseInt(claseIdParam));
    }
  }, [claseIdParam]);

  useEffect(() => {
    if (claseSeleccionada > 0 && viewMode === 'registro') {
      // Validar primero y luego cargar estudiantes
      validarAsistenciaClase(claseSeleccionada).then(() => {
        loadEstudiantesClase();
      });
      // Ocultar panel de descarga al cambiar de clase
      setShowDownloadPanel(false);
    } else {
      setValidacionAsistencia(null);
    }
  }, [claseSeleccionada, fechaSeleccionada, viewMode]);

  useEffect(() => {
    if (viewMode === 'historial') {
      loadAsistenciasHistorial();
    }
  }, [
    viewMode,
    page,
    filtroFechaInicio,
    filtroFechaFin,
    filtroInscripcion,
    filtroEstado,
    claseSeleccionada,
  ]);

  const loadClases = async () => {
    try {
      setLoadingClases(true);
      setError(null);
      let clasesData: Clase[] = [];

      if (isAdmin()) {
        const response = await clasesService.getAll({ page: 1, pageSize: 100 });
        // Filtrar solo clases activas
        clasesData = (response.data || []).filter((c: Clase) => c.activa);
      } else if (isProfesor()) {
        if (user?.idPersona) {
          // getByProfesor ya filtra por activa = true
          clasesData = await clasesService.getByProfesor(user.idPersona);
        } else {
          setError('No se pudo obtener el ID del profesor.');
          return;
        }
      } else {
        setError('No tiene permisos para ver clases');
        return;
      }

      setClases(clasesData);
      if (clasesData.length === 0) {
        setError(
          isAdmin()
            ? 'No hay clases activas registradas'
            : 'No tiene clases activas asignadas',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clases');
    } finally {
      setLoadingClases(false);
    }
  };

  const loadInscripciones = async () => {
    try {
      const response = await inscripcionesService.getAll({
        page: 1,
        pageSize: 500,
      });
      setInscripciones(response.data || []);
    } catch (err) {
      console.error('Error al cargar inscripciones:', err);
    }
  };

  const toggleAsistencia = async (estudianteId: number) => {
    setUpdatingEstudiante(estudianteId);

    // Simular un pequeño delay para mostrar el loading (la actualización real es local)
    await new Promise((resolve) => setTimeout(resolve, 300));

    setEstudiantesClase((prev) =>
      prev.map((item) =>
        item.estudiante.idPersona === estudianteId
          ? { ...item, presente: !item.presente }
          : item,
      ),
    );

    setUpdatingEstudiante(null);
  };

  const actualizarObservaciones = (
    estudianteId: number,
    observaciones: string,
  ) => {
    setEstudiantesClase((prev) =>
      prev.map((item) =>
        item.estudiante.idPersona === estudianteId
          ? { ...item, observaciones }
          : item,
      ),
    );
  };

  const guardarAsistencias = async () => {
    if (!claseSeleccionada) return;

    // Verificar validación antes de guardar
    if (validacionAsistencia && !validacionAsistencia.puedeRegistrar) {
      showToast(
        `No se puede registrar asistencia. Hoy es ${validacionAsistencia.diaActual} y la clase es los dias ${validacionAsistencia.diaSemanaClase}`,
        'error',
        6000,
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const asistenciasAGuardar = estudiantesClase.map((item) => ({
        idEstudiante: item.estudiante.idPersona,
        idClase: claseSeleccionada,
        fechaAsis: toISOWithCurrentTime(fechaSeleccionada),
        estadoAsis: item.presente ? 'Presente' : 'Ausente',
      }));

      for (const item of estudiantesClase) {
        if (item.asistenciaExistente) {
          await asistenciasService.delete(item.asistenciaExistente.idAsist);
        }
      }

      for (const asistencia of asistenciasAGuardar) {
        await asistenciasService.create(asistencia);
      }

      setSuccess('Asistencias guardadas correctamente');
      showToast('Asistencias guardadas correctamente', 'success');
      await loadEstudiantesClase();
      // Revalidar después de guardar para actualizar el estado
      await validarAsistenciaClase(claseSeleccionada);
      // Mostrar panel de descarga
      setShowDownloadPanel(true);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al guardar asistencias',
      );
    } finally {
      setSaving(false);
    }
  };

  const descargarReporte = async (formato: 'csv' | 'pdf') => {
    try {
      setDownloading(true);
      const filters = {
        fechaInicio: filtroFechaInicio || undefined,
        fechaFin: filtroFechaFin || undefined,
        idInscripcion: filtroInscripcion > 0 ? filtroInscripcion : undefined,
        idClase: claseSeleccionada > 0 ? claseSeleccionada : undefined,
        estadoAsis: filtroEstado || undefined,
      };

      if (formato === 'csv') {
        await reportUtils.descargarAsistenciasCsv(filters);
      } else {
        await reportUtils.descargarAsistenciasPdf(filters);
      }
      setSuccess(`Reporte ${formato.toUpperCase()} descargado`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al descargar reporte',
      );
    } finally {
      setDownloading(false);
    }
  };

  const descargarAsistenciaDelDia = async (formato: 'csv' | 'pdf') => {
    try {
      setDownloading(true);
      const filters = {
        fechaInicio: fechaSeleccionada,
        fechaFin: fechaSeleccionada,
        idClase: claseSeleccionada,
      };

      if (formato === 'csv') {
        await reportUtils.descargarAsistenciasCsv(filters);
      } else {
        await reportUtils.descargarAsistenciasPdf(filters);
      }
      showToast(
        `Asistencia del día descargada (${formato.toUpperCase()})`,
        'success',
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al descargar asistencia',
      );
    } finally {
      setDownloading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
    setFiltroInscripcion(0);
    setFiltroEstado('');
    setClaseSeleccionada(0);
    goToPage(1);
  };

  const clasesOptions = clases.map((clase) => ({
    value: clase.idClase,
    label: `${clase.nombreClase || 'Clase'} - ${clase.diaSemana} ${clase.hora}`,
  }));

  const inscripcionesOptions = inscripciones.map((insc) => ({
    value: insc.idInsc,
    label: `#${insc.idInsc} - ${insc.estudiante?.nombre || 'Estudiante'} ${
      insc.estudiante?.apellido || ''
    } - ${insc.clase?.nombreClase || 'Clase'}`,
  }));

  const estadoOptions = [
    { value: 'Presente', label: 'Presente' },
    { value: 'Ausente', label: 'Ausente' },
    { value: 'Tardanza', label: 'Tardanza' },
    { value: 'Justificado', label: 'Justificado' },
  ];

  const presentesCount = estudiantesClase.filter((e) => e.presente).length;
  const ausentesCount = estudiantesClase.length - presentesCount;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Control de Asistencias
            </h1>
            <p className="text-slate-600">
              Registra y consulta la asistencia de los estudiantes
            </p>
            {isConnected && (
              <span className="inline-flex items-center text-xs text-green-600 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Conectado en tiempo real
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'registro' ? 'primary' : 'outline'}
              onClick={() => setViewMode('registro')}
            >
              Registrar
            </Button>
            <Button
              variant={viewMode === 'historial' ? 'primary' : 'outline'}
              onClick={() => setViewMode('historial')}
            >
              Historial
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Panel de descarga de asistencia del día */}
        {showDownloadPanel &&
          viewMode === 'registro' &&
          claseSeleccionada > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-indigo-900">
                      Asistencias guardadas
                    </h3>
                    <p className="text-sm text-indigo-700">
                      ¿Deseas descargar el reporte de asistencia del día{' '}
                      {new Date(
                        fechaSeleccionada + 'T12:00:00',
                      ).toLocaleDateString('es-EC')}
                      ?
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => descargarAsistenciaDelDia('csv')}
                    loading={downloading}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                  >
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      CSV
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => descargarAsistenciaDelDia('pdf')}
                    loading={downloading}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                  >
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      PDF
                    </span>
                  </Button>
                  <button
                    onClick={() => setShowDownloadPanel(false)}
                    className="ml-2 text-indigo-400 hover:text-indigo-600 transition-colors"
                    title="Cerrar"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Alerta de validación de asistencia */}
        {viewMode === 'registro' && claseSeleccionada > 0 && (
          <ValidacionAlert
            validacion={validacionAsistencia}
            onClose={() => setValidacionAsistencia(null)}
          />
        )}

        {viewMode === 'registro' ? (
          <>
            {/* Filtros de Registro */}
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Clase y Fecha</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingClases ? (
                  <div className="flex justify-center items-center h-32">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      label="Clase"
                      options={clasesOptions}
                      placeholder="Selecciona una clase"
                      value={claseSeleccionada}
                      onChange={(e) =>
                        setClaseSeleccionada(parseInt(e.target.value))
                      }
                      disabled={clases.length === 0}
                    />
                    <Input
                      label="Fecha"
                      type="date"
                      value={fechaSeleccionada}
                      onChange={(e) => setFechaSeleccionada(e.target.value)}
                    />
                    <div className="flex items-end">
                      <Button
                        onClick={loadEstudiantesClase}
                        disabled={!claseSeleccionada}
                        className="w-full"
                      >
                        Cargar Estudiantes
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            {estudiantesClase.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-2xl font-bold">
                    {estudiantesClase.length}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-sm text-slate-600">Presentes</p>
                  <p className="text-2xl font-bold text-green-600">
                    {presentesCount}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-sm text-slate-600">Ausentes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {ausentesCount}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-sm text-slate-600">% Asistencia</p>
                  <p className="text-2xl font-bold">
                    {estudiantesClase.length > 0
                      ? Math.round(
                          (presentesCount / estudiantesClase.length) * 100,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            )}

            {/* Lista de Asistencia */}
            {claseSeleccionada > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Lista de Asistencia</CardTitle>
                    {estudiantesClase.length > 0 && (
                      <Button
                        onClick={guardarAsistencias}
                        loading={saving}
                        disabled={
                          validacionAsistencia !== null &&
                          !validacionAsistencia.puedeRegistrar
                        }
                      >
                        Guardar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading || validandoClase ? (
                    <div className="flex justify-center items-center h-64">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : estudiantesClase.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No hay estudiantes inscritos
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estudiante</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Observaciones</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estudiantesClase.map((item, index) => (
                          <TableRow
                            key={`${item.estudiante.idPersona}-${index}`}
                            className="relative"
                          >
                            {updatingEstudiante ===
                              item.estudiante.idPersona && (
                              <td colSpan={4} className="absolute inset-0 p-0">
                                <RowLoadingOverlay />
                              </td>
                            )}
                            <TableCell>
                              {item.estudiante.nombreCompleto}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                  item.presente
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {item.presente ? 'Presente' : 'Ausente'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <input
                                type="text"
                                placeholder="Agregar observación..."
                                value={item.observaciones || ''}
                                onChange={(e) =>
                                  actualizarObservaciones(
                                    item.estudiante.idPersona,
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={
                                  validacionAsistencia !== null &&
                                  !validacionAsistencia.puedeRegistrar
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <ActionButton
                                variant={item.presente ? 'delete' : 'toggle'}
                                onClick={() =>
                                  toggleAsistencia(item.estudiante.idPersona)
                                }
                                title={
                                  item.presente
                                    ? 'Marcar Ausente'
                                    : 'Marcar Presente'
                                }
                                disabled={
                                  updatingEstudiante !== null ||
                                  (validacionAsistencia !== null &&
                                    !validacionAsistencia.puedeRegistrar)
                                }
                              >
                                <span className="material-icons text-xs">
                                  {item.presente ? 'cancel' : 'check_circle'}
                                </span>
                              </ActionButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Filtros de Historial */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Filtros y Reportes</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => descargarReporte('csv')}
                      loading={downloading}
                    >
                      [CSV]
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => descargarReporte('pdf')}
                      loading={downloading}
                    >
                      [PDF]
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {showFilters && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Input
                      label="Fecha Inicio"
                      type="date"
                      value={filtroFechaInicio}
                      onChange={(e) => setFiltroFechaInicio(e.target.value)}
                    />
                    <Input
                      label="Fecha Fin"
                      type="date"
                      value={filtroFechaFin}
                      onChange={(e) => setFiltroFechaFin(e.target.value)}
                    />
                    <Select
                      label="Matrícula"
                      options={inscripcionesOptions}
                      placeholder="Filtrar por matrícula"
                      value={filtroInscripcion}
                      onChange={(e) =>
                        setFiltroInscripcion(parseInt(e.target.value) || 0)
                      }
                    />
                    <Select
                      label="Clase"
                      options={clasesOptions}
                      placeholder="Filtrar por clase"
                      value={claseSeleccionada}
                      onChange={(e) =>
                        setClaseSeleccionada(parseInt(e.target.value) || 0)
                      }
                    />
                    <Select
                      label="Estado"
                      options={estadoOptions}
                      placeholder="Filtrar por estado"
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={limpiarFiltros}>
                      Limpiar Filtros
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Tabla de Historial */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Historial de Asistencias ({totalRecords} registros)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : asistenciasFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No hay registros de asistencia
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Estudiante</TableHead>
                          <TableHead>Clase</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {asistenciasFiltradas.map((asistencia) => (
                          <TableRow key={asistencia.idAsist}>
                            <TableCell>{asistencia.idAsist}</TableCell>
                            <TableCell>
                              {new Date(asistencia.fechaAsis).toLocaleString(
                                'es-EC',
                                {
                                  timeZone: 'America/Guayaquil',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </TableCell>
                            <TableCell>
                              {asistencia.estudiante?.nombre}{' '}
                              {asistencia.estudiante?.apellido}
                            </TableCell>
                            <TableCell>
                              {asistencia.clase?.nombreClase || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  asistencia.estadoAsis === 'Presente'
                                    ? 'bg-green-100 text-green-800'
                                    : asistencia.estadoAsis === 'Ausente'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {asistencia.estadoAsis}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Pagination
                      currentPage={page}
                      totalPages={Math.ceil(totalRecords / pageSize)}
                      onPageChange={goToPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// Componente de fallback para Suspense
function AsistenciasLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AsistenciasPage() {
  return (
    <Suspense fallback={<AsistenciasLoading />}>
      <AsistenciasContent />
    </Suspense>
  );
}
