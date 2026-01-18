import { useEffect, useCallback, useState } from 'react';
import {
  websocketService,
  NotificacionData,
} from '@/services/websocketService';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] =
    useState<NotificacionData | null>(null);

  useEffect(() => {
    // Conectar al montar
    websocketService.connect().then(() => {
      setIsConnected(websocketService.isConnected());
    });

    // Suscribirse a todas las notificaciones para actualizar estado
    const unsubscribe = websocketService.subscribeAll((data) => {
      setLastNotification(data);
    });

    // Verificar estado de conexión periódicamente
    const interval = setInterval(() => {
      setIsConnected(websocketService.isConnected());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const subscribe = useCallback(
    (tipo: string, callback: (data: NotificacionData) => void) => {
      return websocketService.subscribe(tipo, callback);
    },
    []
  );

  const subscribeAll = useCallback(
    (callback: (data: NotificacionData) => void) => {
      return websocketService.subscribeAll(callback);
    },
    []
  );

  const joinGroup = useCallback(async (groupName: string) => {
    await websocketService.joinGroup(groupName);
  }, []);

  const leaveGroup = useCallback(async (groupName: string) => {
    await websocketService.leaveGroup(groupName);
  }, []);

  return {
    isConnected,
    lastNotification,
    subscribe,
    subscribeAll,
    joinGroup,
    leaveGroup,
  };
}

// Hook específico para notificaciones de asistencias
export function useAsistenciasNotifications(
  onNewAsistencia?: (data: any) => void
) {
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (onNewAsistencia) {
      const unsubscribe = subscribe('nueva_asistencia', (notification) => {
        onNewAsistencia(notification.datos);
      });
      return unsubscribe;
    }
  }, [subscribe, onNewAsistencia]);

  return { isConnected };
}

// Hook específico para notificaciones de cobros
export function useCobrosNotifications(onNewCobro?: (data: any) => void) {
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (onNewCobro) {
      const unsubscribe = subscribe('nuevo_cobro', (notification) => {
        onNewCobro(notification.datos);
      });
      return unsubscribe;
    }
  }, [subscribe, onNewCobro]);

  return { isConnected };
}
