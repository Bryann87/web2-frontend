'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
import { usePagination } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cobrosService, CobroFilters } from '@/services/cobrosService';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATES,
} from '@/config/constants';
import { personasService } from '@/services/personasService';
import { reportUtils } from '@/utils/reportUtils';
import {
  Persona,
  Cobro,
  ResumenPagoEstudiante,
  EstadoPagoEstudiante,
} from '@/types';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  formatSafeDate,
  toInputDateFormat,
  toISOWithCurrentTime,
} from '@/utils/dateUtils';

const cobroSchema = z.object({
  idEstudiante: z.number().min(1, 'Debe seleccionar un estudiante'),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  fechaPago: z.string().min(1, 'La fecha es requerida'),
  metodoPago: z.string().min(1, 'El método de pago es requerido'),
  tipoCobro: z.string().min(1, 'El tipo de cobro es requerido'),
  mesCorrespondiente: z.string().optional(),
  anioCorrespondiente: z.number().optional(),
  estadoCobro: z.string().optional(),
});

type CobroForm = z.infer<typeof cobroSchema>;

const tiposCobro = [{ value: 'mensual', label: 'Mensual' }];

const mesesOptions = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export default function CobrosPage() {
  const { isAdmin } = useAuth();

  // Definir metodosPago dentro del componente
  const metodosPago = PAYMENT_METHODS.map((method) => ({
    value: method,
    label: PAYMENT_METHOD_LABELS[method] || method,
  }));

  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Persona[]>([]);
  const [resumenPagos, setResumenPagos] = useState<ResumenPagoEstudiante[]>([]);
  const [estadoPagoModal, setEstadoPagoModal] =
    useState<EstadoPagoEstudiante | null>(null);
  const [viewMode, setViewMode] = useState<'cobros' | 'resumen'>('cobros');

  // Estado para historial de pagos en el modal
  const [historialPagos, setHistorialPagos] = useState<Cobro[]>([]);
  const [historialPage, setHistorialPage] = useState(1);
  const [historialTotalPages, setHistorialTotalPages] = useState(1);
  const [historialLoading, setHistorialLoading] = useState(false);
  const historialPageSize = 5;

  // Estado para edición de cobros
  const [editingCobro, setEditingCobro] = useState<Cobro | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState<CobroFilters>({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipoCobro, setFiltroTipoCobro] = useState('');
  const [filtroEstadoCobro, setFiltroEstadoCobro] = useState('');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [downloading, setDownloading] = useState(false);

  const { page, pageSize, goToPage } = usePagination();

  // WebSocket para recargar datos en tiempo real
  const { subscribe, isConnected } = useWebSocket();

  const loadCobros = async () => {
    try {
      setLoading(true);
      const response = await cobrosService.getAll({ page, pageSize }, filtros);
      setCobros(response.data);
      setTotalRecords(response.totalRecords);
    } catch (error) {
      console.error('Error loading cobros:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResumenPagos = async () => {
    try {
      setLoading(true);
      const mes = filtroMes ? parseInt(filtroMes) : undefined;
      const resumen = await cobrosService.getResumenPagos(mes, filtroAnio);
      setResumenPagos(resumen);
    } catch (error) {
      console.error('Error loading resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribe('nuevo_cobro', () => {
      // Recargar datos cuando llega una notificación de nuevo cobro
      loadCobros();
      loadResumenPagos();
    });
    return unsubscribe;
  }, [subscribe, page, pageSize, filtros, filtroMes, filtroAnio]);

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [isAdmin]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<CobroForm>({
    resolver: zodResolver(cobroSchema),
    defaultValues: {
      tipoCobro: 'mensual',
      anioCorrespondiente: new Date().getFullYear(),
    },
  });

  const tipoCobro = watch('tipoCobro');

  useEffect(() => {
    loadEstudiantes();
  }, []);

  useEffect(() => {
    if (viewMode === 'cobros') {
      loadCobros();
    } else {
      loadResumenPagos();
    }
  }, [page, filtros, viewMode, filtroAnio, filtroMes]);

  const loadEstudiantes = async () => {
    try {
      const estudiantesData = await personasService.getEstudiantes({
        page: 1,
        pageSize: 1000,
      });
      setEstudiantes(estudiantesData.data);
    } catch (error) {
      console.error('Error loading estudiantes:', error);
    }
  };

  // Aplicar filtros automáticamente cuando cambian
  useEffect(() => {
    const nuevosFiltros: CobroFilters = {};
    if (busqueda) nuevosFiltros.busqueda = busqueda;
    if (filtroTipoCobro) nuevosFiltros.tipoCobro = filtroTipoCobro;
    if (filtroEstadoCobro) nuevosFiltros.estadoCobro = filtroEstadoCobro;
    if (filtroMetodoPago) nuevosFiltros.metodoPago = filtroMetodoPago;
    if (filtroMes)
      nuevosFiltros.mesCorrespondiente = mesesOptions[parseInt(filtroMes) - 1];
    if (filtroAnio) nuevosFiltros.anioCorrespondiente = filtroAnio;
    if (filtroFechaInicio) nuevosFiltros.fechaInicio = filtroFechaInicio;
    if (filtroFechaFin) nuevosFiltros.fechaFin = filtroFechaFin;

    setFiltros(nuevosFiltros);
    goToPage(1);
  }, [
    busqueda,
    filtroTipoCobro,
    filtroEstadoCobro,
    filtroMetodoPago,
    filtroMes,
    filtroAnio,
    filtroFechaInicio,
    filtroFechaFin,
  ]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroTipoCobro('');
    setFiltroEstadoCobro('');
    setFiltroMetodoPago('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
    setFiltroMes('');
    setFiltroAnio(new Date().getFullYear());
  };

  const getReportFilters = () => ({
    fechaInicio: filtroFechaInicio || undefined,
    fechaFin: filtroFechaFin || undefined,
    tipoCobro: filtroTipoCobro || undefined,
    estadoCobro: filtroEstadoCobro || undefined,
  });

  const handleDescargarCsv = async () => {
    try {
      setDownloading(true);
      await reportUtils.descargarCobrosCsv(getReportFilters());
    } catch (error) {
      alert('Error al descargar el reporte CSV');
    } finally {
      setDownloading(false);
    }
  };

  const handleDescargarPdf = async () => {
    try {
      setDownloading(true);
      await reportUtils.descargarCobrosPdf(getReportFilters());
    } catch (error) {
      alert('Error al generar el reporte PDF');
    } finally {
      setDownloading(false);
    }
  };

  const verEstadoPago = async (estudianteId: number) => {
    try {
      const estado = await cobrosService.getEstadoPago(estudianteId);
      setEstadoPagoModal(estado);
      setHistorialPage(1);
      loadHistorialPagos(estudianteId, 1);
    } catch (error) {
      console.error('Error loading estado pago:', error);
    }
  };

  const loadHistorialPagos = async (estudianteId: number, page: number) => {
    try {
      setHistorialLoading(true);
      const response = await cobrosService.getHistorialPagos(estudianteId, {
        page,
        pageSize: historialPageSize,
      });
      setHistorialPagos(response.data);
      setHistorialTotalPages(
        Math.ceil(response.totalRecords / historialPageSize),
      );
    } catch (error) {
      console.error('Error loading historial:', error);
      setHistorialPagos([]);
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleHistorialPageChange = (newPage: number) => {
    if (estadoPagoModal) {
      setHistorialPage(newPage);
      loadHistorialPagos(estadoPagoModal.idEstudiante, newPage);
    }
  };

  const handleOpenModal = (cobro?: Cobro) => {
    if (cobro) {
      // Modo edición
      setEditingCobro(cobro);

      // Normalizar el método de pago para que coincida con las opciones del frontend
      let metodoPagoNormalizado = cobro.metodoPago || '';
      const metodoPagoLower = metodoPagoNormalizado.toLowerCase();

      // Mapear valores de BD a valores del frontend
      if (metodoPagoLower === 'efectivo') {
        metodoPagoNormalizado = 'Efectivo';
      } else if (
        metodoPagoLower.includes('transferencia') ||
        metodoPagoLower === 'transferencia'
      ) {
        metodoPagoNormalizado = 'Transferencia';
      }

      reset({
        idEstudiante: cobro.estudiante?.idPersona || 0,
        monto: cobro.monto,
        fechaPago: cobro.fechaPago
          ? toInputDateFormat(new Date(cobro.fechaPago))
          : toInputDateFormat(),
        metodoPago: metodoPagoNormalizado,
        tipoCobro: cobro.tipoCobro || 'mensual',
        mesCorrespondiente: cobro.mesCorrespondiente || '',
        anioCorrespondiente:
          cobro.anioCorrespondiente || new Date().getFullYear(),
        estadoCobro: cobro.estadoCobro || 'pagado',
      });
    } else {
      // Modo creación
      setEditingCobro(null);
      reset({
        idEstudiante: 0,
        monto: 0,
        fechaPago: toInputDateFormat(),
        metodoPago: '',
        tipoCobro: 'mensual',
        mesCorrespondiente: '',
        anioCorrespondiente: new Date().getFullYear(),
        estadoCobro: 'pagado',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCobro(null);
    reset();
  };

  const onSubmit = async (data: CobroForm) => {
    setIsLoading(true);
    try {
      // Extraer mes y año del mesCorrespondiente si viene en formato "Mes Año"
      let mesCorrespondiente = data.mesCorrespondiente || '';
      let anioCorrespondiente = data.anioCorrespondiente;

      // Si el mes viene en formato "Febrero 2025", extraer el año
      const mesAnioMatch = mesCorrespondiente.match(/^(\w+)\s+(\d{4})$/);
      if (mesAnioMatch) {
        mesCorrespondiente = mesAnioMatch[1]; // Solo el nombre del mes
        anioCorrespondiente = parseInt(mesAnioMatch[2]); // El año
      }

      // Validar que fechaPago y metodoPago no estén vacíos
      if (!data.fechaPago) {
        alert('La fecha de pago es requerida');
        setIsLoading(false);
        return;
      }
      if (!data.metodoPago) {
        alert('El método de pago es requerido');
        setIsLoading(false);
        return;
      }

      if (editingCobro) {
        // Actualizar cobro existente
        if (!editingCobro.idCobro) {
          throw new Error('No se pudo obtener el ID del cobro');
        }
        await cobrosService.update(editingCobro.idCobro, {
          monto: data.monto,
          fechaPago: toISOWithCurrentTime(data.fechaPago),
          metodoPago: data.metodoPago,
          tipoCobro: data.tipoCobro,
          mesCorrespondiente,
          anioCorrespondiente,
          estadoCobro: data.estadoCobro || 'pagado',
        });
      } else {
        // Crear nuevo cobro
        await cobrosService.create({
          idEstudiante: data.idEstudiante,
          monto: data.monto,
          fechaPago: toISOWithCurrentTime(data.fechaPago),
          metodoPago: data.metodoPago,
          tipoCobro: data.tipoCobro,
          mesCorrespondiente,
          anioCorrespondiente,
          estadoCobro: 'pagado',
        });
      }

      loadCobros();
      loadResumenPagos();
      handleCloseModal();
    } catch (error) {
      alert(
        editingCobro
          ? 'Error al actualizar el cobro'
          : 'Error al registrar el cobro',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const totalIngresos = cobros.reduce((total, cobro) => total + cobro.monto, 0);
  const cobrosMensuales = cobros.filter(
    (c) => c.tipoCobro === 'mensual',
  ).length;

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Cobros</h1>
            <p className="text-slate-600">Gestión de pagos mensuales</p>
            {isConnected && (
              <span className="inline-flex items-center text-xs text-green-600 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Conectado en tiempo real
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'cobros' ? 'primary' : 'outline'}
              onClick={() => setViewMode('cobros')}
            >
              Historial
            </Button>
            <Button
              variant={viewMode === 'resumen' ? 'primary' : 'outline'}
              onClick={() => setViewMode('resumen')}
            >
              Resumen Pagos
            </Button>
            <Button onClick={() => handleOpenModal()}>Registrar Cobro</Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <p className="text-sm font-medium text-slate-600 mb-1">
              Total Ingresos
            </p>
            <p className="text-2xl font-bold text-green-600">
              ${totalIngresos.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <p className="text-sm font-medium text-slate-600 mb-1">
              Total Cobros
            </p>
            <p className="text-2xl font-bold text-slate-800">{cobros.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <p className="text-sm font-medium text-slate-600 mb-1">
              Pagos Mensuales
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {cobrosMensuales}
            </p>
          </div>
        </div>

        {viewMode === 'cobros' ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <CardTitle>Historial de Cobros</CardTitle>
                <div className="flex gap-2">
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
                </div>
              </div>
              {/* Filtros */}
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar Estudiante
                    </label>
                    <Input
                      placeholder="Nombre o apellido..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Cobro
                    </label>
                    <Select
                      options={tiposCobro}
                      placeholder="Todos"
                      value={filtroTipoCobro}
                      onChange={(e) => setFiltroTipoCobro(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <Select
                      options={PAYMENT_STATES.map((state) => ({
                        value: state.value,
                        label: state.label,
                      }))}
                      placeholder="Todos"
                      value={filtroEstadoCobro}
                      onChange={(e) => setFiltroEstadoCobro(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago
                    </label>
                    <Select
                      options={metodosPago}
                      placeholder="Todos"
                      value={filtroMetodoPago}
                      onChange={(e) => setFiltroMetodoPago(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Desde
                    </label>
                    <Input
                      type="date"
                      value={filtroFechaInicio}
                      onChange={(e) => setFiltroFechaInicio(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Hasta
                    </label>
                    <Input
                      type="date"
                      value={filtroFechaFin}
                      onChange={(e) => setFiltroFechaFin(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={limpiarFiltros}
                      className="w-full"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cobros.length > 0 ? (
                        cobros.map((cobro) => (
                          <TableRow key={cobro.idCobro}>
                            <TableCell>
                              {formatSafeDate(cobro.fechaPago)}
                            </TableCell>
                            <TableCell>
                              {cobro.estudiante?.nombre}{' '}
                              {cobro.estudiante?.apellido}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Mensual
                              </span>
                            </TableCell>
                            <TableCell>{cobro.mesCorrespondiente}</TableCell>
                            <TableCell>{cobro.metodoPago}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  cobro.estadoCobro === 'pagado'
                                    ? 'bg-green-100 text-green-800'
                                    : cobro.estadoCobro === 'pendiente'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : cobro.estadoCobro === 'vencido'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {cobro.estadoCobro === 'pagado'
                                  ? 'Pagado'
                                  : cobro.estadoCobro === 'pendiente'
                                    ? 'Pendiente'
                                    : cobro.estadoCobro === 'vencido'
                                      ? 'Vencido'
                                      : cobro.estadoCobro === 'cancelado'
                                        ? 'Cancelado'
                                        : cobro.estadoCobro}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-600">
                                ${cobro.monto.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenModal(cobro)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    cobro.estudiante &&
                                    verEstadoPago(cobro.estudiante.idPersona)
                                  }
                                >
                                  Ver Estado
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            No hay cobros registrados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <div className="mt-6">
                    <Pagination
                      currentPage={page}
                      totalPages={Math.ceil(totalRecords / pageSize)}
                      onPageChange={goToPage}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Pagos por Estudiante</CardTitle>
              <div className="flex gap-4 mt-4">
                <Select
                  label="Mes"
                  options={mesesOptions.map((m, i) => ({
                    value: String(i + 1),
                    label: m,
                  }))}
                  placeholder="Todos los meses"
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                />
                <Input
                  label="Año"
                  type="number"
                  value={filtroAnio}
                  onChange={(e) => setFiltroAnio(parseInt(e.target.value))}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Estado del Mes</TableHead>
                      <TableHead>Tipo de Pago</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumenPagos.map((resumen) => (
                      <TableRow key={resumen.idEstudiante}>
                        <TableCell>{resumen.nombreCompleto}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              resumen.pagoMes
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {resumen.pagoMes ? 'Pagado' : 'Pendiente'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              resumen.tipoPago === 'mensual'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {resumen.tipoPago === 'mensual'
                              ? 'Mensual'
                              : 'Sin pago'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verEstadoPago(resumen.idEstudiante)}
                          >
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal Registrar Cobro */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingCobro ? 'Editar Cobro' : 'Registrar Cobro'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller<CobroForm, 'idEstudiante'>
              name="idEstudiante"
              control={control}
              render={({
                field,
              }: {
                field: { value: number; onChange: (v: number) => void };
              }) => (
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
                  disabled={!!editingCobro}
                />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de Cobro"
                options={tiposCobro}
                {...register('tipoCobro')}
                error={errors.tipoCobro?.message}
              />
              <Input
                label="Monto"
                type="number"
                step="0.01"
                {...register('monto', { valueAsNumber: true })}
                error={errors.monto?.message}
              />
            </div>

            {tipoCobro === 'mensual' ? (
              <Controller<CobroForm, 'mesCorrespondiente'>
                name="mesCorrespondiente"
                control={control}
                render={({
                  field,
                }: {
                  field: {
                    value: string | undefined;
                    onChange: (v: string) => void;
                  };
                }) => (
                  <SearchableSelect
                    label="Mes Correspondiente"
                    placeholder="Buscar mes..."
                    options={mesesOptions.map((mes) => ({
                      value: mes,
                      label: mes,
                    }))}
                    value={field.value || ''}
                    onChange={(val) => field.onChange(String(val))}
                  />
                )}
              />
            ) : (
              <Input
                label="Año Correspondiente"
                type="number"
                {...register('anioCorrespondiente', { valueAsNumber: true })}
                error={errors.anioCorrespondiente?.message}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de Pago"
                type="date"
                {...register('fechaPago')}
                error={errors.fechaPago?.message}
              />
              <Controller<CobroForm, 'metodoPago'>
                name="metodoPago"
                control={control}
                render={({
                  field,
                }: {
                  field: { value: string; onChange: (v: string) => void };
                }) => (
                  <SearchableSelect
                    label="Método de Pago"
                    placeholder="Buscar método..."
                    options={metodosPago}
                    value={field.value || ''}
                    onChange={(val) => field.onChange(String(val))}
                    error={errors.metodoPago?.message}
                  />
                )}
              />
            </div>

            {editingCobro && (
              <Controller<CobroForm, 'estadoCobro'>
                name="estadoCobro"
                control={control}
                render={({
                  field,
                }: {
                  field: {
                    value: string | undefined;
                    onChange: (v: string) => void;
                  };
                }) => (
                  <SearchableSelect
                    label="Estado del Cobro"
                    placeholder="Seleccionar estado..."
                    options={PAYMENT_STATES.map((state) => ({
                      value: state.value,
                      label: state.label,
                    }))}
                    value={field.value || 'pagado'}
                    onChange={(val) => field.onChange(String(val))}
                  />
                )}
              />
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isLoading}>
                {editingCobro ? 'Actualizar Cobro' : 'Registrar Cobro'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal Estado de Pago */}
        <Modal
          isOpen={!!estadoPagoModal}
          onClose={() => {
            setEstadoPagoModal(null);
            setHistorialPagos([]);
            setHistorialPage(1);
          }}
          title={`Estado de Pago - ${estadoPagoModal?.nombreCompleto}`}
          size="lg"
        >
          {estadoPagoModal && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">
                  Pagos Mensuales {new Date().getFullYear()}
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {estadoPagoModal.pagosMensuales.map((pago) => (
                    <div
                      key={pago.mes}
                      className={`p-2 rounded text-center text-sm ${
                        pago.pagado
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className="font-medium">{pago.mes}</div>
                      <div className="text-xs">
                        {pago.pagado ? 'Pagado' : 'Pendiente'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historial completo de pagos con paginación */}
              <div>
                <h4 className="font-medium mb-3">
                  Historial Completo de Pagos
                </h4>
                {historialLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : historialPagos.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Fecha</th>
                            <th className="text-left py-2 px-2">Tipo</th>
                            <th className="text-left py-2 px-2">Período</th>
                            <th className="text-left py-2 px-2">Método</th>
                            <th className="text-right py-2 px-2">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialPagos.map((cobro) => (
                            <tr key={cobro.idCobro} className="border-b">
                              <td className="py-2 px-2">
                                {cobro.fechaPago ? (
                                  formatSafeDate(cobro.fechaPago)
                                ) : (
                                  <span className="text-gray-400 italic">
                                    Sin fecha
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                  Mensual
                                </span>
                              </td>
                              <td className="py-2 px-2">
                                {cobro.mesCorrespondiente}
                              </td>
                              <td className="py-2 px-2">
                                {cobro.metodoPago || (
                                  <span className="text-gray-400 italic">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right text-green-600 font-medium">
                                ${cobro.monto.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {historialTotalPages > 1 && (
                      <div className="mt-4">
                        <Pagination
                          currentPage={historialPage}
                          totalPages={historialTotalPages}
                          onPageChange={handleHistorialPageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay pagos registrados
                  </p>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
