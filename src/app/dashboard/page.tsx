'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { DashboardLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { LoadingSpinner } from '@/components/ui';
import { personasService, clasesService, dashboardService } from '@/services';
import type { EstadisticasClases } from '@/services/dashboardService';

interface DashboardStats {
  totalEstudiantes: number;
  totalClases: number;
  asistenciasHoy: number;
  ingresosMes: number;
}

interface ClaseConEstudiantes {
  idClase: number;
  nombreClase: string;
  diaSemana: string;
  hora: string;
  estudiantesInscritos: number;
  capacidadMax: number;
  cuposDisponibles: number;
  profesor?: {
    nombre: string;
    apellido: string;
  };
  estiloDanza?: {
    nombre: string;
  };
}

export default function DashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEstudiantes: 0,
    totalClases: 0,
    asistenciasHoy: 0,
    ingresosMes: 0,
  });
  const [clases, setClases] = useState<ClaseConEstudiantes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esperar a que el usuario esté cargado antes de cargar datos
    if (!authLoading && user) {
      loadDashboardData();
    }
  }, [authLoading, user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Determinar si es admin basándose en el rol del usuario
      const esAdmin = user?.rol === 'administrador';

      const [estudiantesData, clasesData, estadisticasClasesData] =
        await Promise.all([
          personasService.getEstudiantes({ page: 1, pageSize: 1 }),
          esAdmin
            ? clasesService.getAll({ page: 1, pageSize: 50 })
            : user?.idPersona
            ? clasesService.getByProfesor(user.idPersona)
            : Promise.resolve([]),
          dashboardService.getEstadisticasClases().catch(() => null),
        ]);

      // Procesar datos de clases
      let clasesArray: any[] = [];
      if (Array.isArray(clasesData)) {
        clasesArray = clasesData;
      } else if (clasesData?.data) {
        clasesArray = clasesData.data;
      }

      // Mapear clases con información de estudiantes
      const clasesConEstudiantes: ClaseConEstudiantes[] = clasesArray.map(
        (clase: any) => ({
          idClase: clase.idClase,
          nombreClase: clase.nombreClase,
          diaSemana: clase.diaSemana,
          hora: clase.hora,
          estudiantesInscritos: clase.estudiantesInscritos || 0,
          capacidadMax: clase.capacidadMax || 0,
          cuposDisponibles: clase.cuposDisponibles || 0,
          profesor: clase.profesor,
          estiloDanza: clase.estiloDanza,
        })
      );

      setClases(clasesConEstudiantes);

      // Usar estadísticas del backend si están disponibles, sino usar datos locales
      const totalEstudiantes =
        estadisticasClasesData?.totalEstudiantes ||
        estudiantesData.totalRecords;
      const totalClases =
        estadisticasClasesData?.totalClases ||
        (Array.isArray(clasesData)
          ? clasesData.length
          : clasesData?.totalRecords || 0);

      setStats({
        totalEstudiantes,
        totalClases,
        asistenciasHoy: 0,
        ingresosMes: 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-8">
          <h1 className="text-lg font-medium text-slate-800 mb-2">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-slate-600">
            {isAdmin()
              ? 'Panel de administración de la academia'
              : 'Panel del profesor - Gestiona tus clases y estudiantes'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              Estudiantes
            </h3>
            <p className="text-xl font-semibold text-slate-800">
              {stats.totalEstudiantes}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin() ? 'Total' : 'Mis estudiantes'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-1">Clases</h3>
            <p className="text-xl font-semibold text-slate-800">
              {stats.totalClases}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin() ? 'Total' : 'Mis clases'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              Asistencias
            </h3>
            <p className="text-xl font-semibold text-slate-800">
              {stats.asistenciasHoy}
            </p>
            <p className="text-xs text-slate-500 mt-1">Hoy</p>
          </div>

          {isAdmin() && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-slate-600 mb-1">
                Ingresos
              </h3>
              <p className="text-xl font-semibold text-slate-800">
                ${stats.ingresosMes.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Este mes</p>
            </div>
          )}
        </div>

        {/* Nueva sección: Resumen de Clases */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-base font-medium text-slate-800 mb-3">
              Resumen de Clases
            </h2>
            {clases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clases.map((clase) => (
                  <div
                    key={clase.idClase}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-slate-800 text-sm">
                        {clase.nombreClase}
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {clase.diaSemana}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mb-3">
                      <p>{clase.hora}</p>
                      {clase.estiloDanza && (
                        <p className="text-purple-600">
                          {clase.estiloDanza.nombre}
                        </p>
                      )}
                      {clase.profesor && !isAdmin() && (
                        <p>
                          Prof. {clase.profesor.nombre}{' '}
                          {clase.profesor.apellido}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          <span className="text-sm font-medium text-slate-800">
                            {clase.estudiantesInscritos}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">
                            estudiantes
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">
                        {clase.cuposDisponibles > 0 ? (
                          <span className="text-green-600">
                            {clase.cuposDisponibles} cupos
                          </span>
                        ) : (
                          <span className="text-red-600">Llena</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (clase.estudiantesInscritos /
                                clase.capacidadMax) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>
                          {clase.estudiantesInscritos}/{clase.capacidadMax}
                        </span>
                        <span>
                          {Math.round(
                            (clase.estudiantesInscritos / clase.capacidadMax) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-3"></div>
                <p className="text-sm text-slate-600 mb-1">
                  No hay clases disponibles
                </p>
                <p className="text-xs text-slate-500">
                  {isAdmin()
                    ? 'Crea tu primera clase'
                    : 'No tienes clases asignadas'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-base font-medium text-slate-800 mb-3">
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isAdmin() && (
                <>
                  <a
                    href="/personas"
                    className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-lg mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Personas
                      </p>
                      <p className="text-xs text-slate-600">
                        Gestionar usuarios
                      </p>
                    </div>
                  </a>
                  <a
                    href="/inscripciones"
                    className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-lg mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Inscripciones
                      </p>
                      <p className="text-xs text-slate-600">
                        Gestionar matrículas
                      </p>
                    </div>
                  </a>
                </>
              )}
              <a
                href="/clases"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-lg mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Clases</p>
                  <p className="text-xs text-slate-600">Ver horarios</p>
                </div>
              </a>
              <a
                href="/asistencias"
                className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-lg mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Asistencias
                  </p>
                  <p className="text-xs text-slate-600">Registrar presencia</p>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-base font-medium text-slate-800 mb-3">
              Agenda de Hoy
            </h2>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-slate-600 mb-1">
                No hay clases programadas
              </p>
              <p className="text-xs text-slate-500">Disfruta tu día libre</p>
            </div>
          </div>
        </div>

        {isAdmin() && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-medium text-slate-800 mb-3">
                Actividad Reciente
              </h2>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-3"></div>
                <p className="text-sm text-slate-600 mb-1">
                  No hay actividad reciente
                </p>
                <p className="text-xs text-slate-500">
                  La actividad del sistema aparecerá aquí
                </p>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
