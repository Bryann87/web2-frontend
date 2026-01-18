import { API_CONFIG, ENDPOINTS } from '@/config/api';
import { LoginRequest, RegisterRequest, User, ApiResponse } from '@/types';

// Función para decodificar JWT sin verificar (solo para obtener el payload)
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const authService = {
  async login(credentials: LoginRequest): Promise<User> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.LOGIN}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const tokenPayload = decodeJWT(data.token);
        // El claim 'sub' contiene el idPersona, también puede venir como 'nameid' o con el nombre completo del claim
        const idPersonaFromToken = tokenPayload
          ? parseInt(
              tokenPayload.sub ||
                tokenPayload.nameid ||
                tokenPayload[
                  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
                ]
            )
          : undefined;

        const user: User = {
          token: data.token,
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          rol: data.rol,
          esProfesor: data.esProfesor,
          esAdmin: data.esAdmin,
          idPersona: data.idPersona || idPersonaFromToken,
        };

        localStorage.setItem(API_CONFIG.TOKEN_KEY, user.token);
        localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));

        document.cookie = `academia_token=${user.token}; path=/; max-age=${
          7 * 24 * 60 * 60
        }`; // 7 días

        return user;
      }

      throw new Error(data.message || 'Error en login');
    } catch (error) {
      throw error;
    }
  },

  // Registro
  async register(userData: RegisterRequest): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.REGISTER}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en registro');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout(): void {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.USER_KEY);

    // También limpiar cookies
    document.cookie =
      'academia_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    window.location.href = '/login';
  },

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem(API_CONFIG.TOKEN_KEY);
  },

  // Obtener información del usuario
  getCurrentUser(): User | null {
    const userInfo = localStorage.getItem(API_CONFIG.USER_KEY);
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);

    if (!userInfo || !token) {
      return null;
    }

    try {
      const user = JSON.parse(userInfo);

      // Verificar que el token no esté expirado
      const tokenPayload = decodeJWT(token);
      if (tokenPayload && tokenPayload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (tokenPayload.exp < currentTime) {
          this.logout();
          return null;
        }
      }

      return user;
    } catch (error) {
      // Si hay error parseando el usuario, limpiar datos
      this.logout();
      return null;
    }
  },

  // Verificar rol
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.rol === role;
  },

  // Verificar si es administrador
  isAdmin(): boolean {
    return this.hasRole('administrador');
  },

  // Verificar si es profesor
  isProfesor(): boolean {
    return this.hasRole('profesor');
  },
};
