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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  LoadingSpinner,
  Pagination,
  ActionButton,
} from '@/components/ui';
import { usePagination, useAuth } from '@/hooks';
import { personasService } from '@/services';
import { Persona, PersonaCreate } from '@/types';

// Schema de validación para persona
const personaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres'),
  apellido: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(100, 'Máximo 100 caracteres'),
  correo: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  rol: z.string().min(1, 'El rol es requerido'),
  contrasena: z.string().optional().or(z.literal('')),
  idEstudianteRepresentado: z.number().optional(),
  parentesco: z.string().optional(),
});

type PersonaFormData = z.infer<typeof personaSchema>;

const rolOptions = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'profesor', label: 'Profesor' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'representante', label: 'Representante' },
];

const STATE_COLORS: Record<string, string> = {
  administrador: 'bg-purple-100 text-purple-800',
  profesor: 'bg-blue-100 text-blue-800',
  estudiante: 'bg-green-100 text-green-800',
  representante: 'bg-orange-100 text-orange-800',
};

export default function PersonasPage() {
  const { isAdmin } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [estudiantes, setEstudiantes] = useState<Persona[]>([]);
  const [selectedRol, setSelectedRol] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<string>('');

  // Modal de representantes
  const [representantesModal, setRepresentantesModal] = useState<{
    estudiante: Persona;
    representantes: Persona[];
  } | null>(null);

  const { page, pageSize, getPaginationParams, goToPage } = usePagination();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
  });

  const rolSeleccionado = watch('rol');

  useEffect(() => {
    loadPersonas();
    loadEstudiantes();
  }, [page, pageSize, selectedRol]);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const rol = selectedRol !== 'todos' ? selectedRol : undefined;
      const response = await personasService.getAll(getPaginationParams(), rol);
      setPersonas(response.data);
      setTotalRecords(response.totalRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar personas');
    } finally {
      setLoading(false);
    }
  };

  const loadEstudiantes = async () => {
    try {
      const response = await personasService.getEstudiantes({
        page: 1,
        pageSize: 1000,
      });
      setEstudiantes(response.data);
    } catch (err) {
      console.error('Error loading estudiantes:', err);
    }
  };

  const verRepresentantes = async (estudiante: Persona) => {
    try {
      const representantes =
        await personasService.getRepresentantesDeEstudiante(
          estudiante.idPersona,
        );
      setRepresentantesModal({ estudiante, representantes });
    } catch (err) {
      setError('Error al cargar representantes');
    }
  };

  // Filtrar personas localmente
  const personasFiltradas = personas.filter((persona) => {
    const matchesBusqueda =
      !busqueda ||
      persona.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      persona.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      persona.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      persona.cedula?.toLowerCase().includes(busqueda.toLowerCase());

    const matchesActivo =
      !filtroActivo ||
      (filtroActivo === 'activo' && persona.activo) ||
      (filtroActivo === 'inactivo' && !persona.activo);

    return matchesBusqueda && matchesActivo;
  });

  const onSubmit = async (data: PersonaFormData) => {
    try {
      setSubmitting(true);

      // Solo incluir contraseña para administrador y profesor
      const puedeContrasena =
        data.rol === 'administrador' || data.rol === 'profesor';

      // Validación manual: en creación, admin/profesor DEBEN tener contraseña
      if (
        !editingPersona &&
        puedeContrasena &&
        (!data.contrasena || data.contrasena.length < 6)
      ) {
        setError(
          'La contraseña es obligatoria (mínimo 6 caracteres) para administradores y profesores',
        );
        setSubmitting(false);
        return;
      }

      const personaData: PersonaCreate = {
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo || undefined,
        telefono: data.telefono || undefined,
        rol: data.rol as any,
        contrasena: puedeContrasena ? data.contrasena || undefined : undefined,
        idEstudianteRepresentado:
          data.rol === 'representante'
            ? data.idEstudianteRepresentado
            : undefined,
        parentesco: data.rol === 'representante' ? data.parentesco : undefined,
      };

      if (editingPersona) {
        const { contrasena, ...updateData } = personaData;
        await personasService.update(editingPersona.idPersona, updateData);
      } else {
        await personasService.create(personaData);
      }

      await loadPersonas();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar persona');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
    reset({
      nombre: persona.nombre,
      apellido: persona.apellido,
      correo: persona.correo || '',
      telefono: persona.telefono || '',
      rol: persona.rol || '',
      contrasena: '',
      idEstudianteRepresentado: persona.idEstudianteRepresentado || undefined,
      parentesco: persona.parentesco || '',
    });
    setIsModalOpen(true);
  };

  const handleToggleActivo = async (persona: Persona) => {
    try {
      await personasService.toggleActivo(persona.idPersona);
      await loadPersonas();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cambiar estado de la persona',
      );
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPersona(null);
    reset();
    setError(null);
  };

  if (!isAdmin()) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-lg font-semibold text-slate-800 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-slate-600">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Personas</h1>
          <p className="text-slate-600">
            Gestiona todas las personas del sistema
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Nueva Persona</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tabs de roles */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => {
                setSelectedRol('todos');
                goToPage(1);
              }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                selectedRol === 'todos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Todos
            </button>
            {rolOptions.map((rol) => (
              <button
                key={rol.value}
                onClick={() => {
                  setSelectedRol(rol.value);
                  goToPage(1);
                }}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors capitalize ${
                  selectedRol === rol.value
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {rol.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar por nombre, apellido, correo o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Select
            options={[
              { value: 'activo', label: 'Activos' },
              { value: 'inactivo', label: 'Inactivos' },
            ]}
            placeholder="Estado"
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => {
              setBusqueda('');
              setFiltroActivo('');
            }}
          >
            Limpiar Filtros
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Info Adicional</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-slate-500"
                    >
                      No hay personas{' '}
                      {selectedRol !== 'todos'
                        ? `con rol "${selectedRol}"`
                        : ''}{' '}
                      registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  personasFiltradas.map((persona) => (
                    <TableRow key={persona.idPersona}>
                      <TableCell>{persona.idPersona}</TableCell>
                      <TableCell>{persona.nombreCompleto}</TableCell>
                      <TableCell>{persona.correo || 'N/A'}</TableCell>
                      <TableCell>{persona.telefono || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATE_COLORS[persona.rol] ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {persona.rol}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            persona.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {persona.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {persona.rol === 'estudiante' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verRepresentantes(persona)}
                          >
                            Ver Representantes
                          </Button>
                        )}
                        {persona.rol === 'representante' &&
                          persona.nombreEstudianteRepresentado && (
                            <span className="text-sm text-gray-600">
                              Representa a:{' '}
                              {persona.nombreEstudianteRepresentado}
                              {persona.parentesco && ` (${persona.parentesco})`}
                            </span>
                          )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <ActionButton
                            variant="edit"
                            onClick={() => handleEdit(persona)}
                            title="Editar"
                          >
                            <span className="material-icons text-xs">edit</span>
                          </ActionButton>
                          {persona.rol !== 'administrador' && (
                            <ActionButton
                              variant={persona.activo ? 'warning' : 'success'}
                              onClick={() => handleToggleActivo(persona)}
                              title={persona.activo ? 'Desactivar' : 'Activar'}
                            >
                              <span className="material-icons text-xs">
                                {persona.activo ? 'block' : 'check_circle'}
                              </span>
                            </ActionButton>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(totalRecords / pageSize)}
              onPageChange={goToPage}
            />
          </>
        )}
      </div>

      {/* Modal Crear/Editar Persona */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPersona ? 'Editar Persona' : 'Nueva Persona'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              {...register('nombre')}
              error={errors.nombre?.message}
            />
            <Input
              label="Apellido"
              {...register('apellido')}
              error={errors.apellido?.message}
            />
            <Input
              label="Correo"
              type="email"
              {...register('correo')}
              error={errors.correo?.message}
            />
            <Input
              label="Teléfono"
              {...register('telefono')}
              error={errors.telefono?.message}
            />
            <Controller
              name="rol"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Rol"
                  placeholder="Buscar rol..."
                  options={rolOptions}
                  value={field.value || ''}
                  onChange={(val) => field.onChange(val)}
                  error={errors.rol?.message}
                />
              )}
            />
            {/* Solo mostrar campo de contraseña para administrador y profesor */}
            {(rolSeleccionado === 'administrador' ||
              rolSeleccionado === 'profesor') && (
              <Input
                label={
                  editingPersona
                    ? 'Nueva Contraseña (opcional)'
                    : 'Contraseña *'
                }
                type="password"
                placeholder={
                  editingPersona
                    ? 'Dejar vacío para mantener actual'
                    : 'Mínimo 6 caracteres'
                }
                {...register('contrasena')}
                error={!editingPersona ? errors.contrasena?.message : undefined}
              />
            )}
          </div>

          {/* Campos adicionales para representante */}
          {rolSeleccionado === 'representante' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <Controller
                name="idEstudianteRepresentado"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    label="Estudiante que Representa"
                    placeholder="Buscar estudiante..."
                    options={estudiantes.map((est) => ({
                      value: est.idPersona,
                      label:
                        est.nombreCompleto || `${est.nombre} ${est.apellido}`,
                    }))}
                    value={field.value || 0}
                    onChange={(val) => field.onChange(Number(val))}
                  />
                )}
              />
              <Input
                label="Parentesco"
                placeholder="Ej: Madre, Padre, Tutor"
                {...register('parentesco')}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {editingPersona ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Representantes */}
      <Modal
        isOpen={!!representantesModal}
        onClose={() => setRepresentantesModal(null)}
        title={`Representantes de ${representantesModal?.estudiante.nombreCompleto}`}
        size="lg"
      >
        {representantesModal && (
          <div className="space-y-4">
            {representantesModal.representantes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Este estudiante no tiene representantes registrados
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Parentesco</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {representantesModal.representantes.map((rep) => (
                    <TableRow key={rep.idPersona}>
                      <TableCell>{rep.nombreCompleto}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                          {rep.parentesco || 'No especificado'}
                        </span>
                      </TableCell>
                      <TableCell>{rep.telefono || 'N/A'}</TableCell>
                      <TableCell>{rep.correo || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
