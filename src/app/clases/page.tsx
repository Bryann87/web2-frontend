'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Input,
  Select,
  SearchableSelect,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  ConfirmModal,
  LoadingSpinner,
  Pagination,
} from '@/components/ui';
import { usePagination, useAuth } from '@/hooks';
import {
  clasesService,
  personasService,
  estilosDanzaService,
} from '@/services';
import { reportUtils } from '@/utils/reportUtils';
import { Clase, Persona, EstiloDanza, ClaseCreate, ClaseUpdate } from '@/types';

const claseSchema = z.object({
  nombreClase: z.string().min(1, 'El nombre es requerido'),
  diaSemana: z.string().min(1, 'El día de la semana es requerido'),
  hora: z.string().min(1, 'La hora es requerida'),
  duracionMinutos: z.number().min(1, 'La duración debe ser mayor a 0'),
  capacidadMax: z.number().min(1, 'La capacidad debe ser mayor a 0'),
  precioMensuClas: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  idEstilo: z.number().min(1, 'Debe seleccionar un estilo de danza'),
  idProfesor: z.number().min(1, 'Debe seleccionar un profesor'),
  activa: z.boolean().optional(),
});

type ClaseFormData = z.infer<typeof claseSchema>;

const diasSemanaOptions = [
  { value: 'Lunes', label: 'Lunes' },
  { value: 'Martes', label: 'Martes' },
  { value: 'Miercoles', label: 'Miércoles' },
  { value: 'Jueves', label: 'Jueves' },
  { value: 'Viernes', label: 'Viernes' },
  { value: 'Sabado', label: 'Sábado' },
  { value: 'Domingo', label: 'Domingo' },
];

export default function ClasesPage() {
  const { user, isAdmin, isProfesor, loading: authLoading } = useAuth();
  const [clases, setClases] = useState<Clase[]>([]);
  const [profesores, setProfesores] = useState<Persona[]>([]);
  const [estilosDanza, setEstilosDanza] = useState<EstiloDanza[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClase, setEditingClase] = useState<Clase | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroDia, setFiltroDia] = useState('');
  const [filtroEstilo, setFiltroEstilo] = useState('');
  const [filtroProfesor, setFiltroProfesor] = useState('');
  const [filtroActiva, setFiltroActiva] = useState('activa');
  const [downloading, setDownloading] = useState(false);

  // Modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    clase: Clase | null;
  }>({
    isOpen: false,
    clase: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const { page, pageSize, getPaginationParams, goToPage } = usePagination();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ClaseFormData>({
    resolver: zodResolver(claseSchema),
  });

  useEffect(() => {
    if (!authLoading && user) {
      loadClases();
      if (isAdmin()) {
        loadProfesores();
      }
      loadEstilosDanza();
    }
  }, [page, pageSize, authLoading, user?.idPersona, user?.rol]);

  const loadClases = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (isAdmin()) {
        response = await clasesService.getAll(getPaginationParams());

        if (response && response.data && Array.isArray(response.data)) {
          setClases(response.data);
          setTotalRecords(response.totalRecords || 0);

          // Si estamos en una página que no existe, ir a la primera
          const totalPages = Math.ceil((response.totalRecords || 0) / pageSize);
          if (page > totalPages && totalPages > 0) {
            goToPage(1);
            return;
          }
        } else {
          setClases([]);
          setTotalRecords(0);
        }
      } else if (isProfesor()) {
        // Para profesores, cargar solo sus clases
        const profesorId = user?.idPersona;
        if (profesorId) {
          const clasesProfesor = await clasesService.getByProfesor(profesorId);

          if (Array.isArray(clasesProfesor)) {
            setClases(clasesProfesor);
            setTotalRecords(clasesProfesor.length);
          } else {
            setClases([]);
            setTotalRecords(0);
          }
        } else {
          setError('Profesor no tiene ID asignado');
          setClases([]);
          setTotalRecords(0);
        }
      }
    } catch (err) {
      console.error('Error loading clases:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar clases');
      setClases([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const loadProfesores = async () => {
    try {
      const response = await personasService.getProfesores({
        page: 1,
        pageSize: 100,
      });
      setProfesores(response.data);
    } catch (err) {
      // Error silencioso
    }
  };

  const loadEstilosDanza = async () => {
    try {
      const response = await estilosDanzaService.getAll({
        page: 1,
        pageSize: 100,
      });
      setEstilosDanza(response.data);
    } catch (err) {
      // Error silencioso
    }
  };

  const onSubmit = async (data: ClaseFormData) => {
    try {
      setSubmitting(true);

      if (editingClase) {
        const updateData: ClaseUpdate = {
          nombreClase: data.nombreClase,
          diaSemana: data.diaSemana,
          hora: data.hora,
          duracionMinutos: data.duracionMinutos,
          capacidadMax: data.capacidadMax,
          precioMensuClas: data.precioMensuClas,
          idEstilo: data.idEstilo,
          idProfesor: data.idProfesor,
          activa: data.activa !== undefined ? data.activa : true,
        };
        await clasesService.update(editingClase.idClase, updateData);
      } else {
        const claseData: ClaseCreate = {
          nombreClase: data.nombreClase,
          diaSemana: data.diaSemana,
          hora: data.hora,
          duracionMinutos: data.duracionMinutos,
          capacidadMax: data.capacidadMax,
          precioMensuClas: data.precioMensuClas,
          idEstilo: data.idEstilo,
          idProfesor: data.idProfesor,
        };
        await clasesService.create(claseData);
      }

      await loadClases();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar clase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (clase: Clase) => {
    setEditingClase(clase);

    reset({
      nombreClase: clase.nombreClase || '',
      diaSemana: clase.diaSemana?.trim() || '',
      hora: clase.hora,
      duracionMinutos: clase.duracionMinutos,
      capacidadMax: clase.capacidadMax,
      precioMensuClas: clase.precioMensuClas,
      idEstilo: clase.estiloDanza?.idEstilo || 0,
      idProfesor: clase.profesor?.idPersona || 0,
      activa: clase.activa,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (clase: Clase) => {
    setDeleteModal({ isOpen: true, clase });
  };

  const confirmDelete = async () => {
    if (!deleteModal.clase) return;
    setIsDeleting(true);
    try {
      setError(null);
      await clasesService.delete(deleteModal.clase.idClase);

      // Si después de eliminar no hay más elementos en la página actual, ir a la anterior
      const newTotal = totalRecords - 1;
      const totalPages = Math.ceil(newTotal / pageSize);
      if (page > totalPages && totalPages > 0) {
        goToPage(totalPages);
      } else {
        await loadClases();
      }
      setDeleteModal({ isOpen: false, clase: null });
    } catch (err) {
      console.error('Error deleting clase:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar clase');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClase(null);
    reset();
    setError(null);
  };

  const profesoresOptions = profesores.map((profesor) => ({
    value: profesor.idPersona,
    label: `${profesor.nombre} ${profesor.apellido}`,
  }));

  const estilosOptions = estilosDanza.map((estilo) => ({
    value: estilo.idEstilo,
    label: estilo.nombreEsti,
  }));

  // Filtrar clases localmente
  const clasesFiltradas = clases
    .filter((clase) => {
      const matchesBusqueda =
        !busqueda ||
        clase.nombreClase?.toLowerCase().includes(busqueda.toLowerCase()) ||
        clase.profesor?.nombre
          ?.toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        clase.estiloDanza?.nombreEsti
          ?.toLowerCase()
          .includes(busqueda.toLowerCase());

      const matchesDia = !filtroDia || clase.diaSemana === filtroDia;
      const matchesEstilo =
        !filtroEstilo || clase.estiloDanza?.idEstilo === parseInt(filtroEstilo);
      const matchesProfesor =
        !filtroProfesor ||
        clase.profesor?.idPersona === parseInt(filtroProfesor);
      const matchesActiva =
        !filtroActiva ||
        filtroActiva === 'todas' ||
        (filtroActiva === 'activa' && clase.activa) ||
        (filtroActiva === 'inactiva' && !clase.activa);

      return (
        matchesBusqueda &&
        matchesDia &&
        matchesEstilo &&
        matchesProfesor &&
        matchesActiva
      );
    })
    .sort((a, b) => {
      // Ordenar por prioridad según el filtro activo
      if (filtroActiva === 'activa') {
        // Si el filtro es "activa", las activas van primero
        if (a.activa && !b.activa) return -1;
        if (!a.activa && b.activa) return 1;
      } else if (filtroActiva === 'inactiva') {
        // Si el filtro es "inactiva", las inactivas van primero
        if (!a.activa && b.activa) return -1;
        if (a.activa && !b.activa) return 1;
      }
      // Mantener orden original si ambas tienen el mismo estado
      return 0;
    });

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroDia('');
    setFiltroEstilo('');
    setFiltroProfesor('');
    setFiltroActiva('activa');
  };

  const getReportFilters = () => ({
    diaSemana: filtroDia || undefined,
    idEstilo: filtroEstilo ? parseInt(filtroEstilo) : undefined,
    idProfesor: filtroProfesor ? parseInt(filtroProfesor) : undefined,
    activa: filtroActiva ? filtroActiva === 'activa' : undefined,
  });

  const handleDescargarCsv = async () => {
    try {
      setDownloading(true);
      await reportUtils.descargarClasesCsv(getReportFilters());
    } catch (error) {
      alert('Error al descargar el reporte CSV');
    } finally {
      setDownloading(false);
    }
  };

  const handleDescargarPdf = async () => {
    try {
      setDownloading(true);
      await reportUtils.descargarClasesPdf(getReportFilters());
    } catch (error) {
      alert('Error al generar el reporte PDF');
    } finally {
      setDownloading(false);
    }
  };

  const formatTime = (timeString: string) => {
    // Convertir TimeSpan a formato legible
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isAdmin() ? 'Todas las Clases' : 'Mis Clases'}
            </h1>
            <p className="text-slate-600">
              {isAdmin()
                ? 'Gestiona todas las clases de la academia'
                : 'Gestiona tus clases asignadas'}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin() && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDescargarCsv}
                  loading={downloading}
                >
                  [CSV]
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDescargarPdf}
                  loading={downloading}
                >
                  [PDF]
                </Button>
                <Button onClick={() => setIsModalOpen(true)}>
                  Nueva Clase
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 stat-label">
                  Total Clases
                </p>
                <p className="text-2xl font-bold text-slate-800 stat-number">
                  {clasesFiltradas.length}
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
                  {clasesFiltradas.filter((c) => c.activa).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 stat-label">
                  Capacidad Total
                </p>
                <p className="text-2xl font-bold text-slate-800 stat-number">
                  {clasesFiltradas.reduce((acc, c) => acc + c.capacidadMax, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 stat-label">
                  Duración Promedio
                </p>
                <p className="text-2xl font-bold text-slate-800 stat-number">
                  {clasesFiltradas.length > 0
                    ? Math.round(
                        clasesFiltradas.reduce(
                          (acc, c) => acc + c.duracionMinutos,
                          0,
                        ) / clasesFiltradas.length,
                      )
                    : 0}{' '}
                  min
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Input
                placeholder="Buscar clase..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <Select
                options={diasSemanaOptions}
                placeholder="Día"
                value={filtroDia}
                onChange={(e) => setFiltroDia(e.target.value)}
              />
              <Select
                options={estilosOptions}
                placeholder="Estilo"
                value={filtroEstilo}
                onChange={(e) => setFiltroEstilo(e.target.value)}
              />
              {isAdmin() && (
                <Select
                  options={profesoresOptions}
                  placeholder="Profesor"
                  value={filtroProfesor}
                  onChange={(e) => setFiltroProfesor(e.target.value)}
                />
              )}
              <Select
                options={[
                  { value: 'todas', label: 'Todas' },
                  { value: 'activa', label: 'Activas' },
                  { value: 'inactiva', label: 'Inactivas' },
                ]}
                placeholder="Estado"
                value={filtroActiva}
                onChange={(e) => setFiltroActiva(e.target.value)}
              />
              <Button variant="outline" onClick={limpiarFiltros}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clase</TableHead>
                      <TableHead>Estilo</TableHead>
                      <TableHead>Profesor</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Estudiantes</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clasesFiltradas.length > 0 ? (
                      clasesFiltradas.map((clase) => (
                        <TableRow key={clase.idClase}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {clase.nombreClase}
                              </div>
                              <div className="text-sm text-gray-500">
                                {clase.diaSemana}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {clase.estiloDanza?.nombreEsti || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {clase.profesor
                              ? `${clase.profesor.nombre} ${clase.profesor.apellido}`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{formatTime(clase.hora)}</TableCell>
                          <TableCell>{clase.duracionMinutos} min</TableCell>
                          <TableCell>
                            {clase.capacidadMax} estudiantes
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-blue-600">
                                  {clase.estudiantesInscritos || 0}
                                </span>
                                <span className="text-gray-500 text-sm">
                                  inscritos
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {clase.cuposDisponibles || clase.capacidadMax}{' '}
                                cupos libres
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            ${clase.precioMensuClas.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                clase.activa
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {clase.activa ? 'Activa' : 'Inactiva'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <button
                                onClick={() =>
                                  (window.location.href = `/asistencias?clase=${clase.idClase}`)
                                }
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                title="Asistencias"
                              >
                                <span className="material-icons text-sm">
                                  how_to_reg
                                </span>
                              </button>
                              {isAdmin() && (
                                <>
                                  <button
                                    onClick={() => handleEdit(clase)}
                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Editar"
                                  >
                                    <span className="material-icons text-sm">
                                      edit
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(clase)}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                                    title="Eliminar"
                                  >
                                    <span className="material-icons text-sm">
                                      delete
                                    </span>
                                  </button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="text-gray-500">
                            <p className="text-lg font-medium">
                              No hay clases registradas
                            </p>
                            <p className="text-sm">
                              {isAdmin()
                                ? 'Haz clic en "Nueva Clase" para agregar la primera'
                                : 'No tienes clases asignadas'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination - Solo para admin */}
                {isAdmin() && totalRecords > 0 && (
                  <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(totalRecords / pageSize)}
                    onPageChange={goToPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal - Solo para admin */}
        {isAdmin() && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={editingClase ? 'Editar Clase' : 'Nueva Clase'}
            size="lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre de la Clase"
                  {...register('nombreClase')}
                  error={errors.nombreClase?.message}
                />

                <Controller
                  name="diaSemana"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      label="Día de la Semana"
                      placeholder="Buscar día..."
                      options={diasSemanaOptions}
                      value={field.value || ''}
                      onChange={(val) => field.onChange(val)}
                      error={errors.diaSemana?.message}
                    />
                  )}
                />

                <Input
                  label="Hora"
                  type="time"
                  {...register('hora')}
                  error={errors.hora?.message}
                />

                <Input
                  label="Duración (minutos)"
                  type="number"
                  {...register('duracionMinutos', { valueAsNumber: true })}
                  error={errors.duracionMinutos?.message}
                />

                <Input
                  label="Capacidad Máxima"
                  type="number"
                  {...register('capacidadMax', { valueAsNumber: true })}
                  error={errors.capacidadMax?.message}
                />

                <Input
                  label="Precio Mensual"
                  type="number"
                  step="0.01"
                  {...register('precioMensuClas', { valueAsNumber: true })}
                  error={errors.precioMensuClas?.message}
                />

                <Controller
                  name="idEstilo"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      label="Estilo de Danza"
                      placeholder="Buscar estilo..."
                      options={estilosOptions}
                      value={field.value || 0}
                      onChange={(val) => field.onChange(Number(val))}
                      error={errors.idEstilo?.message}
                    />
                  )}
                />

                <Controller
                  name="idProfesor"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      label="Profesor"
                      placeholder="Buscar profesor..."
                      options={profesoresOptions}
                      value={field.value || 0}
                      onChange={(val) => field.onChange(Number(val))}
                      error={errors.idProfesor?.message}
                    />
                  )}
                />

                {editingClase && (
                  <div className="flex items-center space-x-2 md:col-span-2">
                    <input
                      type="checkbox"
                      id="activa"
                      {...register('activa')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="activa"
                      className="text-sm font-medium text-gray-700"
                    >
                      Clase Activa
                    </label>
                    <span className="text-xs text-gray-500">
                      (Las clases inactivas no aparecen en inscripciones ni
                      asistencias)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingClase ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Modal Confirmar Eliminación */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, clase: null })}
          onConfirm={confirmDelete}
          title="Eliminar Clase"
          message={`¿Estás seguro de eliminar la clase "${deleteModal.clase?.nombreClase}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          loading={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}
