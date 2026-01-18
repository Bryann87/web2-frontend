import { API_CONFIG, buildQueryParams } from '@/config/api';

export interface ReporteFilters {
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  idClase?: number;
  idEstudiante?: number;
  tipoCobro?: string;
  metodoPago?: string;
}

// Función auxiliar para descargar archivos
const descargarArchivo = (blob: Blob, nombreArchivo: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Función para generar PDF desde datos
const generarPDF = async (
  titulo: string,
  columnas: string[],
  datos: any[][],
  nombreArchivo: string
) => {
  // Crear contenido HTML para el PDF
  const estilos = `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #1e40af; text-align: center; margin-bottom: 10px; }
      .fecha { text-align: center; color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background-color: #1e40af; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
      td { padding: 10px 8px; border-bottom: 1px solid #ddd; font-size: 11px; }
      tr:nth-child(even) { background-color: #f8fafc; }
      tr:hover { background-color: #e2e8f0; }
      .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; }
      .resumen { margin-top: 20px; padding: 15px; background-color: #f1f5f9; border-radius: 8px; }
      .resumen p { margin: 5px 0; }
    </style>
  `;

  const tablaHTML = `
    <table>
      <thead>
        <tr>${columnas.map((col) => `<th>${col}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${datos
          .map(
            (fila) =>
              `<tr>${fila
                .map((celda) => `<td>${celda ?? 'N/A'}</td>`)
                .join('')}</tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;

  const contenidoHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      ${estilos}
    </head>
    <body>
      <h1>${titulo}</h1>
      <p class="fecha">Generado el: ${new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}</p>
      <div class="resumen">
        <p><strong>Total de registros:</strong> ${datos.length}</p>
      </div>
      ${tablaHTML}
      <div class="footer">
        <p>Academia de Danza - Sistema de Gestión</p>
      </div>
    </body>
    </html>
  `;

  // Abrir ventana de impresión para generar PDF
  const ventana = window.open('', '_blank');
  if (ventana) {
    ventana.document.write(contenidoHTML);
    ventana.document.close();
    ventana.print();
  }
};

// Función para generar CSV mejorado
const generarCSV = (
  columnas: string[],
  datos: any[][],
  nombreArchivo: string
) => {
  // BOM para UTF-8
  const BOM = '\uFEFF';

  // Función para escapar valores CSV
  const escaparCSV = (valor: any): string => {
    if (valor === null || valor === undefined) return '';
    const str = String(valor);
    // Si contiene comas, comillas o saltos de línea, envolver en comillas
    if (
      str.includes(',') ||
      str.includes('"') ||
      str.includes('\n') ||
      str.includes('\r')
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Crear contenido CSV
  const filaEncabezados = columnas.map(escaparCSV).join(',');
  const filasDatos = datos.map((fila) => fila.map(escaparCSV).join(','));

  const contenidoCSV = BOM + [filaEncabezados, ...filasDatos].join('\r\n');

  const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
  descargarArchivo(blob, nombreArchivo);
};

export const reportesService = {
  // ==================== INSCRIPCIONES ====================
  async descargarReporteInscripcionesPDF(
    inscripciones: any[],
    filtros?: ReporteFilters
  ): Promise<void> {
    const columnas = [
      'ID',
      'Estudiante',
      'Clase',
      'Día/Hora',
      'Fecha Inscripción',
      'Estado',
    ];
    const datos = inscripciones.map((i) => [
      i.idInsc,
      `${i.estudiante?.nombre || ''} ${i.estudiante?.apellido || ''}`.trim(),
      i.clase?.nombreClase || 'N/A',
      `${i.clase?.diaSemana || ''} ${i.clase?.hora || ''}`.trim(),
      i.fechaInsc ? new Date(i.fechaInsc).toLocaleDateString('es-ES') : 'N/A',
      i.estado || 'N/A',
    ]);

    await generarPDF(
      'Reporte de Inscripciones',
      columnas,
      datos,
      `reporte_inscripciones_${new Date().toISOString().split('T')[0]}.pdf`
    );
  },

  descargarReporteInscripcionesCSV(
    inscripciones: any[],
    filtros?: ReporteFilters
  ): void {
    const columnas = [
      'ID',
      'Estudiante',
      'Apellido',
      'Clase',
      'Día',
      'Hora',
      'Fecha Inscripción',
      'Estado',
    ];
    const datos = inscripciones.map((i) => [
      i.idInsc,
      i.estudiante?.nombre || '',
      i.estudiante?.apellido || '',
      i.clase?.nombreClase || '',
      i.clase?.diaSemana || '',
      i.clase?.hora || '',
      i.fechaInsc ? new Date(i.fechaInsc).toLocaleDateString('es-ES') : '',
      i.estado || '',
    ]);

    generarCSV(
      columnas,
      datos,
      `reporte_inscripciones_${new Date().toISOString().split('T')[0]}.csv`
    );
  },

  // ==================== COBROS ====================
  async descargarReporteCobrosPDF(
    cobros: any[],
    filtros?: ReporteFilters
  ): Promise<void> {
    const columnas = [
      'ID',
      'Estudiante',
      'Tipo',
      'Período',
      'Método Pago',
      'Estado',
      'Monto',
      'Fecha',
    ];
    const datos = cobros.map((c) => [
      c.idCobro,
      `${c.estudiante?.nombre || ''} ${c.estudiante?.apellido || ''}`.trim(),
      c.tipoCobro || 'N/A',
      c.mesCorrespondiente || 'N/A',
      c.metodoPago || 'N/A',
      c.estadoCobro || 'N/A',
      `$${(c.monto || 0).toFixed(2)}`,
      c.fechaPago ? new Date(c.fechaPago).toLocaleDateString('es-ES') : 'N/A',
    ]);

    // Calcular total
    const total = cobros.reduce((sum, c) => sum + (c.monto || 0), 0);

    await generarPDF(
      `Reporte de Cobros - Total: $${total.toFixed(2)}`,
      columnas,
      datos,
      `reporte_cobros_${new Date().toISOString().split('T')[0]}.pdf`
    );
  },

  descargarReporteCobrosCSV(cobros: any[], filtros?: ReporteFilters): void {
    const columnas = [
      'ID',
      'Estudiante',
      'Apellido',
      'Tipo Cobro',
      'Período',
      'Método Pago',
      'Estado',
      'Monto',
      'Fecha Pago',
    ];
    const datos = cobros.map((c) => [
      c.idCobro,
      c.estudiante?.nombre || '',
      c.estudiante?.apellido || '',
      c.tipoCobro || '',
      c.mesCorrespondiente || '',
      c.metodoPago || '',
      c.estadoCobro || '',
      (c.monto || 0).toFixed(2),
      c.fechaPago ? new Date(c.fechaPago).toLocaleDateString('es-ES') : '',
    ]);

    // Agregar fila de total
    const total = cobros.reduce((sum, c) => sum + (c.monto || 0), 0);
    datos.push(['', '', '', '', '', '', 'TOTAL:', total.toFixed(2), '']);

    generarCSV(
      columnas,
      datos,
      `reporte_cobros_${new Date().toISOString().split('T')[0]}.csv`
    );
  },

  // ==================== CLASES ====================
  async descargarReporteClasesPDF(
    clases: any[],
    filtros?: ReporteFilters
  ): Promise<void> {
    const columnas = [
      'ID',
      'Nombre',
      'Estilo',
      'Profesor',
      'Día',
      'Hora',
      'Duración',
      'Capacidad',
      'Inscritos',
      'Precio',
      'Estado',
    ];
    const datos = clases.map((c) => [
      c.idClase,
      c.nombreClase || 'N/A',
      c.estiloDanza?.nombreEsti || 'N/A',
      c.profesor ? `${c.profesor.nombre} ${c.profesor.apellido}` : 'N/A',
      c.diaSemana || 'N/A',
      c.hora || 'N/A',
      `${c.duracionMinutos || 0} min`,
      c.capacidadMax || 0,
      c.estudiantesInscritos || 0,
      `$${(c.precioMensuClas || 0).toLocaleString()}`,
      c.activa ? 'Activa' : 'Inactiva',
    ]);

    await generarPDF(
      'Reporte de Clases',
      columnas,
      datos,
      `reporte_clases_${new Date().toISOString().split('T')[0]}.pdf`
    );
  },

  descargarReporteClasesCSV(clases: any[], filtros?: ReporteFilters): void {
    const columnas = [
      'ID',
      'Nombre Clase',
      'Estilo',
      'Profesor',
      'Día',
      'Hora',
      'Duración (min)',
      'Capacidad Máx',
      'Estudiantes Inscritos',
      'Cupos Disponibles',
      'Precio Mensual',
      'Estado',
    ];
    const datos = clases.map((c) => [
      c.idClase,
      c.nombreClase || '',
      c.estiloDanza?.nombreEsti || '',
      c.profesor ? `${c.profesor.nombre} ${c.profesor.apellido}` : '',
      c.diaSemana || '',
      c.hora || '',
      c.duracionMinutos || 0,
      c.capacidadMax || 0,
      c.estudiantesInscritos || 0,
      c.cuposDisponibles || c.capacidadMax || 0,
      (c.precioMensuClas || 0).toFixed(2),
      c.activa ? 'Activa' : 'Inactiva',
    ]);

    generarCSV(
      columnas,
      datos,
      `reporte_clases_${new Date().toISOString().split('T')[0]}.csv`
    );
  },

  // ==================== ASISTENCIAS (mejorado) ====================
  async descargarReporteAsistenciasPDF(
    asistencias: any[],
    filtros?: ReporteFilters
  ): Promise<void> {
    const columnas = [
      'ID',
      'Estudiante',
      'Clase',
      'Fecha',
      'Estado',
      'Observaciones',
    ];
    const datos = asistencias.map((a) => [
      a.idAsistencia,
      a.estudiante ? `${a.estudiante.nombre} ${a.estudiante.apellido}` : 'N/A',
      a.clase?.nombreClase || 'N/A',
      a.fechaAsis ? new Date(a.fechaAsis).toLocaleDateString('es-ES') : 'N/A',
      a.estadoAsis || 'N/A',
      a.observaciones || '',
    ]);

    await generarPDF(
      'Reporte de Asistencias',
      columnas,
      datos,
      `reporte_asistencias_${new Date().toISOString().split('T')[0]}.pdf`
    );
  },

  descargarReporteAsistenciasCSV(
    asistencias: any[],
    filtros?: ReporteFilters
  ): void {
    const columnas = [
      'ID',
      'Estudiante',
      'Apellido',
      'Clase',
      'Fecha',
      'Estado',
      'Observaciones',
    ];
    const datos = asistencias.map((a) => [
      a.idAsistencia,
      a.estudiante?.nombre || '',
      a.estudiante?.apellido || '',
      a.clase?.nombreClase || '',
      a.fechaAsis ? new Date(a.fechaAsis).toLocaleDateString('es-ES') : '',
      a.estadoAsis || '',
      a.observaciones || '',
    ]);

    generarCSV(
      columnas,
      datos,
      `reporte_asistencias_${new Date().toISOString().split('T')[0]}.csv`
    );
  },

  // ==================== RESUMEN PAGOS ====================
  async descargarResumenPagosPDF(
    resumen: any[],
    mes?: string,
    anio?: number
  ): Promise<void> {
    const columnas = ['Estudiante', 'Estado del Mes', 'Tipo de Pago'];
    const datos = resumen.map((r) => [
      r.nombreCompleto || 'N/A',
      r.pagoMes ? 'Pagado' : 'Pendiente',
      r.tipoPago === 'mensual' ? 'Mensual' : 'Sin pago',
    ]);

    const titulo = mes
      ? `Resumen de Pagos - ${mes}/${anio || new Date().getFullYear()}`
      : `Resumen de Pagos - ${anio || new Date().getFullYear()}`;

    await generarPDF(
      titulo,
      columnas,
      datos,
      `resumen_pagos_${new Date().toISOString().split('T')[0]}.pdf`
    );
  },

  descargarResumenPagosCSV(resumen: any[], mes?: string, anio?: number): void {
    const columnas = [
      'ID Estudiante',
      'Nombre Completo',
      'Estado Pago Mes',
      'Tipo de Pago',
    ];
    const datos = resumen.map((r) => [
      r.idEstudiante,
      r.nombreCompleto || '',
      r.pagoMes ? 'Pagado' : 'Pendiente',
      r.tipoPago || 'Sin pago',
    ]);

    generarCSV(
      columnas,
      datos,
      `resumen_pagos_${new Date().toISOString().split('T')[0]}.csv`
    );
  },
};
