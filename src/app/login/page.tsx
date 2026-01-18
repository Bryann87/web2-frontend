'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks';
import { Button, Input } from '@/components/ui';
import { LoginRequest } from '@/types';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated()) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    setError(null);

    try {
      await login(data);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Contenedor centrado */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Lado izquierdo - Formulario de credenciales */}
          <div className="w-full md:w-1/2 p-8 md:p-12">
            <div className="mb-8">
              <p className="text-gray-600">Ingresa tus credenciales</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Ingresa tu correo electrónico"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="Ingresa tu correo electrónico"
                />

                <div className="relative">
                  <Input
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    error={errors.password?.message}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                loading={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </div>

          {/* Lado derecho - SVG decorativo */}
          <div className="w-full md:w-1/2 bg-gray-800 p-8 md:p-12 flex items-center justify-center">
            <svg
              viewBox="0 0 400 400"
              className="w-full max-w-sm"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fondo con círculos decorativos */}
              <circle cx="200" cy="200" r="180" fill="rgba(255,255,255,0.1)" />
              <circle cx="200" cy="200" r="140" fill="rgba(255,255,255,0.1)" />
              <circle cx="200" cy="200" r="100" fill="rgba(255,255,255,0.15)" />

              {/* Figura de bailarina estilizada */}
              <g transform="translate(200, 200)">
                {/* Cabeza */}
                <circle cx="0" cy="-80" r="20" fill="white" opacity="0.9" />

                {/* Cuerpo */}
                <path
                  d="M 0 -60 Q -5 -30 0 0 Q 5 -30 0 -60"
                  fill="white"
                  opacity="0.9"
                />

                {/* Brazos en posición de ballet */}
                <path
                  d="M -5 -50 Q -40 -60 -60 -40"
                  stroke="white"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <path
                  d="M 5 -50 Q 40 -60 60 -40"
                  stroke="white"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.9"
                />

                {/* Tutú */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx="45"
                  ry="15"
                  fill="white"
                  opacity="0.8"
                />

                {/* Piernas */}
                <path
                  d="M -8 5 L -15 60"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <path
                  d="M 8 5 L 25 55"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.9"
                />

                {/* Zapatos de ballet */}
                <circle cx="-15" cy="65" r="5" fill="white" opacity="0.9" />
                <circle cx="25" cy="60" r="5" fill="white" opacity="0.9" />
              </g>

              {/* Notas musicales decorativas */}
              <g opacity="0.6" fill="white">
                <circle cx="80" cy="100" r="8" />
                <rect x="88" y="60" width="3" height="40" />
                <circle cx="320" cy="300" r="8" />
                <rect x="328" y="260" width="3" height="40" />
                <path
                  d="M 100 280 Q 105 275 110 280 Q 115 285 120 280"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                />
              </g>

              {/* Texto decorativo */}
              <text
                x="200"
                y="360"
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontWeight="bold"
                opacity="0.9"
              >
                Academia de Danza
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
