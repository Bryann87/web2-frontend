import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/register'];

  // Si es una ruta pública, permitir acceso
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Para la ruta raíz, redirigir al dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Verificar si hay token en las cookies o headers
  const token =
    request.cookies.get('academia_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  // Si no hay token y no es una ruta pública, redirigir al login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar si el token está expirado
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      // Token expirado, redirigir al login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    // Token inválido, redirigir al login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar que el token no esté expirado
  const tokenPayload = decodeJWT(token);
  if (tokenPayload && tokenPayload.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (tokenPayload.exp < currentTime) {
      // Token expirado, redirigir al login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('academia_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
