'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Modal } from '@/components/ui/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { usePaginatedApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { inscripcionesService } from '@/services/inscripcionesService';
import { personasService } from '@/services/personasService';
import { clasesService } from '@/services/clasesService';
import { reportesService } from '@/services/reportesService';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatSafeDate, toInputDateFormat } from '@/utils/dateUtils';

const inscripcionSchema = z.object({
  idEstudiante: z.number().min(1, 'Debe seleccionar un estudiante'),
  idClase: z.number().min(1, 'Debe seleccionar una clase'),
  fechaInsc: z.string().min(1, 'La fecha es requerida'),
  estado: z.string().min(1, 'El estado es requerido'),
});

type InscripcionForm = z.infer<typeof inscripcionSchema>;

const estadosInscripcion = ['Activa', 'Suspendida', 'Cancelada', 'Finalizada'];

export default function InscripcionesPage() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Redirigir si no es admin
  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [isAdmin]);

  const {
    data: inscripciones,
    loading,
    error,
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    refetch,
  } = usePaginatedApi(inscripcionesService.getAll);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InscripcionForm>({
    resolver: zodResolver(inscripcionSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [estudiantesData, clasesData] = await Promise.all([
          personasService.getEstudiantes({ page: 1, pageSize: 1000 }),
          clasesService.getAll({ page: 1, pageSize: 1000 }),
        ]);
        setEstudiantes(estudiantesData.data);
        setClases(clasesData.data);
      } catch (error) {
        // Error silencioso
      }
    };
    loadData();
  }, []);

  const filteredInscripciones = (inscripciones || []).filter((inscripcion) => {
    const matchesSearch =
      inscripcion.estudiante?.nombre
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      inscripcion.estudiante?.apellido
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      inscripcion.clase?.nombreClase
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesEstado = !filtroEstado || inscripcion.estado === filtroEstado;

    // Filtro de fechas
    let matchesFecha = true;
    if (fechaInicio || fechaFin) {
      const fechaInsc = inscripcion.fechaInsc
        ? new Date(inscripcion.fechaInsc)
        : null;
      if (fechaInsc) {
        if (fechaInicio) {
          const inicio = new Date(fechaInicio);
          matchesFecha = matchesFecha && fechaInsc >= inicio;
        }
        if (fechaFin) {
          const fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
          matchesFecha = matchesFecha && fechaInsc <= fin;
        }
      } else {
        matchesFecha = false;
      }
    }

    return matchesSearch && matchesEstado && matchesFecha;
  });

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroEstado('');
    setFechaInicio('');
    setFechaFin('');
  };

  const descargarReporte = async (formato: 'pdf' | 'csv') => {
    try {
      setDownloading(true);
      if (formato === 'pdf') {
        await reportesService.descargarReporteInscripcionesPDF(
          filteredInscripciones
        );
      } else {
        reportesService.descargarReporteInscripcionesCSV(filteredInscripciones);
      }
    } catch (error) {
      console.error('Error al descargar reporte:', error);
    } finally {
      setDownloading(false);
    }
  };

  const estadisticas = {
    total: (inscripciones || []).length,
    activas: (inscripciones || []).filter((i) => i.estado === 'Activa').length,
    suspendidas: (inscripciones || []).filter((i) => i.estado === 'Suspendida')
      .length,
    canceladas: (inscripciones || []).filter((i) => i.estado === 'Cancelada')
      .length,
  };

  const handleOpenModal = () => {
    reset({
      idEstudiante: 0,
      idClase: 0,
      fechaInsc: toInputDateFormat(),
      estado: 'Activa',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data: InscripcionForm) => {
    setIsLoading(true);
    try {
      await inscripcionesService.create({
        ...data,
        fechaInsc: data.fechaInsc + 'T00:00:00',
      });

      refetch();
      handleCloseModal();
    } catch (error) {
      alert('Error al crear la inscripción');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarEstado = async (inscripcion: any, nuevoEstado: string) => {
    try {
      await inscripcionesService.update(inscripcion.idInsc, {
        estado: nuevoEstado,
      });
      refetch();
    } catch (error) {
      alert('Error al cambiar el estado');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              Inscripciones
            </h1>
            <p className="text-slate-600">Gestión de inscripciones a clases</p>
          </div>
          <Button onClick={handleOpenModal}>Nueva Inscripción</Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 stat-label">
                  Total
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {estadisticas.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 stat-label">
                  Activas
                </p>
                <p className="text-2xl font-bold text-slate-800 stat-number">
                  {estadisticas.activas}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 stat-label">
                  Suspendidas
                </p>
                <p className="text-2xl font-bold text-slate-800 stat-number">
                  {estadisticas.suspendidas}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 stat-label">
                  Canceladas
                </p>
                <p className="text-2xl font-bold text-slate-800 stat-number">
                  {estadisticas.canceladas}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <CardTitle>Lista de Inscripciones</CardTitle>
                <div className="relative w-64">
                  <Input
                    placeholder="Buscar inscripciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    {estadosInscripcion.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
                {(fechaInicio || fechaFin || filtroEstado) && (
                  <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                Error: {error}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Clase</TableHead>
                      <TableHead>Fecha Inscripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInscripciones.map((inscripcion) => (
                      <TableRow key={inscripcion.idInsc}>
                        <TableCell>
                          {inscripcion.estudiante?.nombre}{' '}
                          {inscripcion.estudiante?.apellido}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {inscripcion.clase?.nombreClase}
                            </p>
                            <p className="text-sm text-gray-600">
                              {inscripcion.clase?.diaSemana}{' '}
                              {inscripcion.clase?.hora}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatSafeDate(inscripcion.fechaInsc)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`badge ${
                              inscripcion.estado === 'Activa'
                                ? 'badge-success'
                                : inscripcion.estado === 'Suspendida'
                                ? 'badge-warning'
                                : inscripcion.estado === 'Cancelada'
                                ? 'badge-danger'
                                : 'badge-primary'
                            }`}
                          >
                            {inscripcion.estado}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {inscripcion.estado === 'Activa' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCambiarEstado(inscripcion, 'Suspendida')
                                }
                              >
                                Suspender
                              </Button>
                            )}
                            {inscripcion.estado === 'Suspendida' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCambiarEstado(inscripcion, 'Activa')
                                }
                              >
                                Activar
                              </Button>
                            )}
                            {(inscripcion.estado === 'Activa' ||
                              inscripcion.estado === 'Suspendida') && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  handleCambiarEstado(inscripcion, 'Cancelada')
                                }
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    hasNextPage={hasNextPage}
                    hasPreviousPage={hasPreviousPage}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Nueva Inscripción"
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="idEstudiante"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Estudiante"
                  placeholder="Buscar estudiante..."
                  options={estudiantes.map((e) => ({
                    value: e.idPersona,
                    label: e.nombreCompleto || `${e.nombre} ${e.apellido}`,
                  }))}
                  value={field.value}
                  onChange={(val) => field.onChange(Number(val))}
                  error={errors.idEstudiante?.message}
                />
              )}
            />

            <Controller
              name="idClase"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Clase"
                  placeholder="Buscar clase..."
                  options={clases.map((c) => ({
                    value: c.idClase,
                    label: `${c.nombreClase} - ${c.diaSemana} ${c.hora} ($${c.precioMensuClas})`,
                  }))}
                  value={field.value}
                  onChange={(val) => field.onChange(Number(val))}
                  error={errors.idClase?.message}
                />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de Inscripción"
                type="date"
                {...register('fechaInsc')}
                error={errors.fechaInsc?.message}
              />

              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    label="Estado"
                    placeholder="Seleccionar estado..."
                    options={estadosInscripcion.map((e) => ({
                      value: e,
                      label: e,
                    }))}
                    value={field.value || ''}
                    onChange={(val) => field.onChange(val)}
                    error={errors.estado?.message}
                  />
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isLoading}>
                Crear Inscripción
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
