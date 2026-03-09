import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_token';

function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  return new TextEncoder().encode('nconnect-admin-jwt-' + secret);
}

async function isValidToken(token: string): Promise<boolean> {
  try {
    const secret = getSecret();
    if (!secret) return false;
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin pages (except login page at /admin)
  if (pathname.startsWith('/admin/')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token || !(await isValidToken(token))) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Protect admin API routes (except auth endpoint)
  if (pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/auth')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token || !(await isValidToken(token))) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path+', '/api/admin/:path+'],
};
