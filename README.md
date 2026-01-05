# Sistema de Gestión - Academia de Danza

Sistema completo de gestión para academias de danza desarrollado con Next.js 14, TypeScript y Tailwind CSS.

## 🚀 Características

### Para Administradores

- **Dashboard completo** con estadísticas y métricas
- **Gestión de personas** (crear, editar, eliminar usuarios)
- **Gestión de estudiantes** con información detallada
- **Gestión de profesores** y asignación de especialidades
- **Gestión de clases** con horarios y precios
- **Control de asistencias** de todos los estudiantes
- **Gestión de inscripciones** y estados
- **Control de cobros** y pagos
- **Gestión de representantes** de estudiantes menores
- **Reportes y estadísticas** del rendimiento de la academia

### Para Profesores

- **Dashboard personalizado** con sus clases asignadas
- **Vista de sus clases** y horarios
- **Control de asistencias** de sus estudiantes
- **Información de estudiantes** inscritos en sus clases
- **Registro rápido de asistencias** por clase y fecha

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React 19, TypeScript
- **Estilos**: Tailwind CSS
- **Formularios**: React Hook Form + Zod
- **Iconos**: Lucide React
- **Fechas**: date-fns
- **Backend**: ASP.NET Core Web API
- **Base de datos**: SQL Server / PostgreSQL

## 📋 Requisitos Previos

- Node.js 18+
- npm, yarn o pnpm
- Backend API ejecutándose en `http://localhost:5225`

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd frontend-danza
```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
# o
pnpm install
```

### 3. Configurar variables de entorno

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5225/api
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔐 Credenciales de Prueba

### Administrador

- **Email**: admin@academia.com
- **Contraseña**: admin123

### Profesor

- **Email**: profesor@academia.com
- **Contraseña**: profesor123

## 📱 Estructura del Proyecto

```
src/
├── app/                    # Páginas de Next.js 14 (App Router)
│   ├── dashboard/         # Dashboard principal
│   ├── estudiantes/       # Gestión de estudiantes
│   ├── profesores/        # Gestión de profesores
│   ├── clases/           # Gestión de clases
│   ├── asistencias/      # Control de asistencias
│   ├── personas/         # Gestión de personas
│   └── login/            # Página de login
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (Button, Input, etc.)
│   ├── layout/           # Componentes de layout
│   └── auth/             # Componentes de autenticación
├── hooks/                # Custom hooks
├── services/             # Servicios para API calls
├── types/                # Tipos TypeScript
└── config/               # Configuración de la aplicación
```

## 🎯 Funcionalidades Principales

### Dashboard

- Estadísticas en tiempo real
- Accesos rápidos a funciones principales
- Vista personalizada según el rol del usuario

### Gestión de Estudiantes

- Lista paginada de estudiantes
- Formularios de creación y edición
- Información de contacto y representantes
- Historial de asistencias

### Control de Asistencias

- Selección de clase y fecha
- Registro rápido de presentes/ausentes
- Estadísticas de asistencia por clase
- Guardado automático de cambios

### Gestión de Clases

- Creación y edición de clases
- Asignación de profesores y estilos de danza
- Configuración de horarios y precios
- Vista diferenciada para profesores (solo sus clases)

## 🔒 Sistema de Autenticación

- **JWT Tokens** para autenticación
- **Roles de usuario**: Administrador, Profesor, Estudiante
- **Protección de rutas** basada en roles
- **Middleware de autenticación** automático
- **Renovación automática** de sesiones

## 📊 Roles y Permisos

### Administrador

- Acceso completo a todas las funcionalidades
- Gestión de usuarios y roles
- Reportes y estadísticas avanzadas
- Configuración del sistema

### Profesor

- Vista de sus clases asignadas
- Control de asistencias de sus estudiantes
- Información de estudiantes inscritos
- Dashboard personalizado

### Estudiante (Futuro)

- Vista de sus clases inscritas
- Historial de asistencias
- Información de pagos
- Perfil personal

## 🎨 Diseño y UX

- **Diseño responsivo** para móviles y desktop
- **Tema consistente** con colores de la academia
- **Navegación intuitiva** con sidebar colapsible
- **Feedback visual** para todas las acciones
- **Loading states** y manejo de errores
- **Animaciones suaves** y transiciones

## 🔧 Configuración de la API

El frontend está configurado para conectarse con la API backend en:

- **URL Base**: `http://localhost:5225/api`
- **Autenticación**: Bearer Token (JWT)
- **Formato**: JSON

### Endpoints Principales

- `POST /Auth/login` - Iniciar sesión
- `GET /Estudiantes` - Listar estudiantes
- `GET /Clases` - Listar clases
- `POST /Asistencias` - Registrar asistencia
- `GET /Profesores` - Listar profesores

## 🚀 Despliegue

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

### Docker (Opcional)

```bash
docker build -t academia-frontend .
docker run -p 3000:3000 academia-frontend
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## � Noktas de Desarrollo

### Hooks Personalizados

- `useAuth`: Manejo de autenticación y roles
- `useApi`: Llamadas a la API con manejo de errores
- `usePagination`: Paginación de listas
- `useCrud`: Operaciones CRUD genéricas

### Componentes UI

- Componentes base reutilizables
- Consistencia en el diseño
- Props tipadas con TypeScript
- Accesibilidad incluida

### Servicios

- Servicios separados por entidad
- Manejo centralizado de errores
- Tipado completo de respuestas
- Interceptores para autenticación

## 🐛 Solución de Problemas

### Error de CORS

Verificar que el backend tenga configurado CORS para `http://localhost:3000`

### Token Expirado

El sistema redirige automáticamente al login cuando el token expira

### Problemas de Conexión

Verificar que la API esté ejecutándose en `http://localhost:5225`

## � Soporte

Para soporte técnico o preguntas sobre el sistema, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para academias de danza**
