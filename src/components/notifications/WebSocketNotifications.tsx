'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks';
import { NotificacionData } from '@/services/websocketService';

export function WebSocketNotifications() {
  const { subscribeAll, isConnected } = useWebSocket();
  const { showToast } = useToast();
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    console.log(
      '[WebSocket] Estado conexión:',
      isConnected,
      '| Usuario:',
      user?.rol,
      '| isAdmin:',
      isAdmin()
    );
  }, [isConnected, user, isAdmin]);

  useEffect(() => {
    const unsubscribe = subscribeAll((notification: NotificacionData) => {
      console.log('[WebSocket] Notificación recibida:', notification);
      console.log(
        '[WebSocket] isAdmin():',
        isAdmin(),
        '| user.rol:',
        user?.rol
      );

      // Solo mostrar notificaciones a administradores
      if (!isAdmin()) {
        console.log('[WebSocket] Usuario no es admin, ignorando notificación');
        return;
      }

      switch (notification.tipo) {
        case 'nueva_asistencia': {
          const datos = notification.datos;
          // Buscar el nombre del profesor en diferentes ubicaciones posibles
          const profesorNombre =
            datos?.nombreProfesor ||
            datos?.asistencia?.registradoPorNombre ||
            datos?.registradoPorNombre ||
            'un profesor';
          console.log(
            '[WebSocket] Mostrando toast de asistencia, profesor:',
            profesorNombre
          );
          showToast(
            `[+] Nueva asistencia registrada por ${profesorNombre}`,
            'info'
          );
          break;
        }
        case 'nuevo_cobro':
          showToast('[$] Nuevo cobro registrado', 'success');
          break;
        case 'nuevo_estudiante':
          showToast('[*] Nuevo estudiante registrado', 'info');
          break;
        case 'cambio_clase':
          showToast('[~] Clase actualizada', 'info');
          break;
        // No mostrar toast para tipos desconocidos
      }
    });

    return unsubscribe;
  }, [subscribeAll, showToast, isAdmin, user]);

  return null; // Este componente no renderiza nada visible
}
