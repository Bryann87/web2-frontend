import { API_CONFIG } from '@/config/api';

type NotificacionCallback = (data: NotificacionData) => void;

export interface NotificacionData {
  tipo: string;
  datos: any;
  timestamp: string;
}

class WebSocketService {
  private connection: any = null;
  private callbacks: Map<string, NotificacionCallback[]> = new Map();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    if (this.connection?.state === 'Connected' || this.isConnecting) {
      return;
    }

    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    if (!token) {
      console.warn('No hay token para conectar WebSocket');
      return;
    }

    this.isConnecting = true;

    try {
      // Importar SignalR dinámicamente
      const signalR = await import('@microsoft/signalr');

      const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/hubs/notificaciones`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Manejar notificaciones
      this.connection.on('Notificacion', (data: NotificacionData) => {
        this.handleNotificacion(data);
      });

      // Eventos de conexión
      this.connection.onreconnecting(() => {
        console.log('WebSocket reconectando...');
      });

      this.connection.onreconnected(() => {
        console.log('WebSocket reconectado');
        this.reconnectAttempts = 0;
      });

      this.connection.onclose(() => {
        console.log('WebSocket desconectado');
        this.handleDisconnect();
      });

      await this.connection.start();
      console.log('WebSocket conectado');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.handleDisconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  private handleNotificacion(data: NotificacionData): void {
    // Notificar a todos los callbacks generales
    const generalCallbacks = this.callbacks.get('*') || [];
    generalCallbacks.forEach((cb) => cb(data));

    // Notificar a callbacks específicos por tipo
    const specificCallbacks = this.callbacks.get(data.tipo) || [];
    specificCallbacks.forEach((cb) => cb(data));
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Intentando reconectar en ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  // Suscribirse a notificaciones
  subscribe(tipo: string, callback: NotificacionCallback): () => void {
    if (!this.callbacks.has(tipo)) {
      this.callbacks.set(tipo, []);
    }
    this.callbacks.get(tipo)!.push(callback);

    // Retornar función para desuscribirse
    return () => {
      const callbacks = this.callbacks.get(tipo);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Suscribirse a todas las notificaciones
  subscribeAll(callback: NotificacionCallback): () => void {
    return this.subscribe('*', callback);
  }

  // Unirse a un grupo específico
  async joinGroup(groupName: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('UnirseAGrupo', groupName);
    }
  }

  // Salir de un grupo
  async leaveGroup(groupName: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('SalirDeGrupo', groupName);
    }
  }

  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }
}

export const websocketService = new WebSocketService();
