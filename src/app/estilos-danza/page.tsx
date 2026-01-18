'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { usePaginatedApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { estilosDanzaService } from '@/services/estilosDanzaService';
import { EstiloDanza, EstiloDanzaCreate, EstiloDanzaUpdate } from '@/types';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const estiloSchema = z.object({
  nombreEsti: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  nivelDificultad: z.string().min(1, 'Debe seleccionar un nivel de dificultad'),
  edadMinima: z.number().optional(),
  edadMaxima: z.number().optional(),
  precioBase: z.number().optional(),
  activo: z.boolean(),
});

type EstiloForm = z.infer<typeof estiloSchema>;

const nivelesOptions = [
  { value: 'Principiante', label: 'Principiante' },
  { value: 'Intermedio', label: 'Intermedio' },
  { value: 'Avanzado', label: 'Avanzado' },
  { value: 'Profesional', label: 'Profesional' },
];

export default function EstilosDanzaPage() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEstilo, setEditingEstilo] = useState<EstiloDanza | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    estilo: EstiloDanza | null;
  }>({
    isOpen: false,
    estilo: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Redirigir si no es admin
  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [isAdmin]);

  const {
    data: estilos,
    loading,
    error,
    refetch,
  } = usePaginatedApi(estilosDanzaService.getAll, 50);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EstiloForm>({
    resolver: zodResolver(estiloSchema) as any,
    defaultValues: {
      activo: true,
      nivelDificultad: 'Principiante',
    },
  });

  const filteredEstilos = (estilos || []).filter((estilo) => {
    const matchesSearch =
      estilo.nombreEsti.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (estilo.descripcion &&
        estilo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesNivel = !filtroNivel || estilo.nivelDificultad === filtroNivel;
    const matchesActivo =
      !filtroActivo ||
      (filtroActivo === 'activo' && estilo.activo) ||
      (filtroActivo === 'inactivo' && !estilo.activo);
    return matchesSearch && matchesNivel && matchesActivo;
  });

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroNivel('');
    setFiltroActivo('');
  };

  const handleOpenModal = (estilo?: EstiloDanza) => {
    setEditingEstilo(estilo || null);
    if (estilo) {
      reset({
        nombreEsti: estilo.nombreEsti,
        descripcion: estilo.descripcion || '',
        nivelDificultad: estilo.nivelDificultad,
        edadMinima: estilo.edadMinima || undefined,
        edadMaxima: estilo.edadMaxima || undefined,
        precioBase: estilo.precioBase || undefined,
        activo: estilo.activo,
      });
    } else {
      reset({
        nombreEsti: '',
        descripcion: '',
        nivelDificultad: 'Principiante',
        edadMinima: undefined,
        edadMaxima: undefined,
        precioBase: undefined,
        activo: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEstilo(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      if (editingEstilo) {
        const updateData: EstiloDanzaUpdate = {
          nombreEsti: data.nombreEsti,
          descripcion: data.descripcion,
          nivelDificultad: data.nivelDificultad,
          edadMinima: data.edadMinima,
          edadMaxima: data.edadMaxima,
          precioBase: data.precioBase,
          activo: data.activo,
        };
        await estilosDanzaService.update(editingEstilo.idEstilo, updateData);
      } else {
        const createData: EstiloDanzaCreate = {
          nombreEsti: data.nombreEsti,
          descripcion: data.descripcion,
          nivelDificultad: data.nivelDificultad,
          edadMinima: data.edadMinima,
          edadMaxima: data.edadMaxima,
          precioBase: data.precioBase,
          activo: data.activo,
        };
        await estilosDanzaService.create(createData);
      }

      refetch();
      handleCloseModal();
    } catch (error) {
      alert('Error al guardar el estilo de danza');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (estilo: EstiloDanza) => {
    setDeleteModal({ isOpen: true, estilo });
  };

  const confirmDelete = async () => {
    if (!deleteModal.estilo) return;
    setIsDeleting(true);
    try {
      await estilosDanzaService.delete(deleteModal.estilo.idEstilo);
      refetch();
      setDeleteModal({ isOpen: false, estilo: null });
    } catch (error: any) {
      setDeleteModal({ isOpen: false, estilo: null });
      // Verificar si es error de asociaciones
      const errorMessage =
        error?.response?.data?.message || error?.message || '';
      const errorDetails = error?.response?.data?.details || '';

      if (
        error?.response?.status === 409 ||
        errorDetails === 'HAS_ASSOCIATIONS'
      ) {
        setInfoModal({
          isOpen: true,
          title: 'No se puede eliminar',
          message:
            'Este estilo de danza tiene clases asociadas. Para eliminarlo, primero debe eliminar o reasignar las clases que lo utilizan.',
        });
      } else {
        setInfoModal({
          isOpen: true,
          title: 'Error',
          message: errorMessage || 'Error al eliminar el estilo de danza',
        });
      }
    } finally {
      setIsDeleting(false);
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
            <h1 className="text-lg font-semibold text-gray-900">
              Estilos de Danza
            </h1>
            <p className="text-gray-600">
              Gestión de estilos y géneros de danza
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>Nuevo Estilo</Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Estilos</CardTitle>
            </div>
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <Input
                placeholder="Buscar estilos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                options={nivelesOptions}
                placeholder="Nivel de dificultad"
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
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
              <Button variant="outline" onClick={limpiarFiltros}>
                Limpiar Filtros
              </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEstilos.map((estilo) => (
                  <Card
                    key={estilo.idEstilo}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <CardTitle className="text-lg">
                            {estilo.nombreEsti}
                          </CardTitle>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleOpenModal(estilo)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                            title="Editar"
                          >
                            <span className="material-icons text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(estilo)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                            title="Eliminar"
                          >
                            <span className="material-icons text-sm">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-gray-600 text-sm">
                          {estilo.descripcion || 'Sin descripción'}
                        </p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Nivel: {estilo.nivelDificultad}</span>
                          <span
                            className={`px-2 py-1 rounded-full ${
                              estilo.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {estilo.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        {(estilo.edadMinima || estilo.edadMaxima) && (
                          <div className="text-xs text-gray-500">
                            Edad: {estilo.edadMinima || 0} -{' '}
                            {estilo.edadMaxima || '∞'} años
                          </div>
                        )}
                        {estilo.precioBase && (
                          <div className="text-xs text-gray-500">
                            Precio base: ${estilo.precioBase.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredEstilos.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron estilos de danza
              </div>
            )}
          </CardContent>
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={
            editingEstilo ? 'Editar Estilo de Danza' : 'Nuevo Estilo de Danza'
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nombre del Estilo"
              {...register('nombreEsti')}
              error={errors.nombreEsti?.message}
              placeholder="Ej: Ballet Clásico, Salsa, Tango"
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                {...register('descripcion')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe las características de este estilo de danza..."
              />
              {errors.descripcion && (
                <p className="text-sm text-red-600">
                  {errors.descripcion.message}
                </p>
              )}
            </div>

            <Select
              label="Nivel de Dificultad"
              options={nivelesOptions}
              {...register('nivelDificultad')}
              error={errors.nivelDificultad?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Edad Mínima"
                type="number"
                min="0"
                {...register('edadMinima', { valueAsNumber: true })}
                error={errors.edadMinima?.message}
                placeholder="0"
              />

              <Input
                label="Edad Máxima"
                type="number"
                min="0"
                {...register('edadMaxima', { valueAsNumber: true })}
                error={errors.edadMaxima?.message}
                placeholder="Sin límite"
              />
            </div>

            <Input
              label="Precio Base"
              type="number"
              step="0.01"
              min="0"
              {...register('precioBase', { valueAsNumber: true })}
              error={errors.precioBase?.message}
              placeholder="0.00"
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                {...register('activo')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="activo"
                className="text-sm font-medium text-gray-700"
              >
                Estilo activo
              </label>
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
                {editingEstilo ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, estilo: null })}
          onConfirm={confirmDelete}
          title="Eliminar Estilo de Danza"
          message={`¿Estás seguro de eliminar el estilo "${deleteModal.estilo?.nombreEsti}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          loading={isDeleting}
        />

        {/* Modal informativo para mensajes de asociaciones */}
        <Modal
          isOpen={infoModal.isOpen}
          onClose={() =>
            setInfoModal({ isOpen: false, title: '', message: '' })
          }
          title={infoModal.title}
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="shrink-0">
                <span className="material-icons text-amber-500 text-2xl">
                  info
                </span>
              </div>
              <p className="text-gray-600">{infoModal.message}</p>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() =>
                  setInfoModal({ isOpen: false, title: '', message: '' })
                }
              >
                Entendido
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
