'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks';
import { useState, useEffect } from 'react';
import {
  People,
  CalendarMonth,
  CheckBox,
  Description,
  Payment,
  MusicNote,
  Dashboard,
  Menu,
  History,
} from '@mui/icons-material';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navigation: NavItem[] = [
  // Dashboard
  { name: 'Dashboard', href: '/dashboard', icon: Dashboard },

  // Administrador
  {
    name: 'Personas',
    href: '/personas',
    icon: People,
    roles: ['administrador'],
  },
  {
    name: 'Cobros',
    href: '/cobros',
    icon: Payment,
    roles: ['administrador'],
  },

  // Compartido (Admin y Profesor)
  { name: 'Clases', href: '/clases', icon: CalendarMonth },
  { name: 'Asistencias', href: '/asistencias', icon: CheckBox },

  // Solo Administrador
  {
    name: 'Inscripciones',
    href: '/inscripciones',
    icon: Description,
    roles: ['administrador'],
  },

  // Configuración
  {
    name: 'Estilos de Danza',
    href: '/estilos-danza',
    icon: MusicNote,
    roles: ['administrador'],
  },
  {
    name: 'Auditoría',
    href: '/auditoria',
    icon: History,
    roles: ['administrador'],
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Cargar estado desde localStorage después del montaje
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  // Guardar estado en localStorage cuando cambie
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  // Evitar hydration mismatch renderizando el estado inicial hasta que se monte
  if (!mounted) {
    return (
      <div
        className="flex flex-col shadow-xl transition-all duration-300 w-64"
        style={{ backgroundColor: '#141414' }}
      >
        <div
          className="flex items-center h-14 px-4 border-b"
          style={{ borderColor: '#2a2a2a' }}
        >
          <div className="text-center flex-1">
            <h1 className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
              Academia
            </h1>
            <p className="text-xs font-semibold" style={{ color: '#B0C4DE' }}>
              de Danza
            </p>
          </div>
          <button
            className="p-2 rounded-md transition-colors ml-auto"
            style={{ backgroundColor: 'transparent' }}
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1"></nav>
      </div>
    );
  }

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true; // Sin restricciones de rol
    if (isAdmin()) return true; // Admin ve todo
    return item.roles.some((role) => user?.rol === role);
  });

  return (
    <div
      className={`flex flex-col shadow-xl transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      style={{ backgroundColor: '#141414' }}
    >
      {/* Header con botón hamburguesa */}
      <div
        className="flex items-center h-14 px-4 border-b"
        style={{ borderColor: '#2a2a2a' }}
      >
        {!isCollapsed && (
          <div className="text-center flex-1">
            <h1 className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
              Academia
            </h1>
            <p className="text-xs font-semibold" style={{ color: '#B0C4DE' }}>
              de Danza
            </p>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md transition-colors ml-auto"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2a2a2a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                // Evitar que el clic propague y abra el sidebar
                e.stopPropagation();
              }}
              className={clsx(
                'group flex items-center px-3 py-2 text-xs font-normal rounded-lg transition-all duration-200 ease-in-out',
                isActive ? 'shadow-sm' : 'hover:shadow-sm',
                isCollapsed ? 'justify-center' : ''
              )}
              style={{
                backgroundColor: isActive ? '#2a2a2a' : 'transparent',
                color: isActive ? '#FFFFFF' : '#CCCCCC',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
                const icon = e.currentTarget.querySelector('svg');
                if (icon instanceof HTMLElement) {
                  icon.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
                const icon = e.currentTarget.querySelector('svg');
                if (icon instanceof HTMLElement && !isActive) {
                  icon.style.color = '#CCCCCC';
                }
              }}
              title={isCollapsed ? item.name : ''}
            >
              <item.icon
                className={clsx(
                  'shrink-0 transition-colors',
                  isCollapsed ? 'h-4 w-4' : 'mr-3 h-4 w-4',
                  isActive ? 'text-white' : 'text-[#CCCCCC]'
                )}
              />
              {!isCollapsed && (
                <span className="text-xs font-normal">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
