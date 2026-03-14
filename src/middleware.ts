import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_token';

// --- Rate limiting (in-memory, per-instance) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMITS: Record<string, number> = {
  '/api/register': 5,      // 5 registrations per minute per IP
  '/api/login': 10,        // 10 login attempts per minute per IP
  '/api/admin/auth': 5,    // 5 admin login attempts per minute per IP
};

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up stale entries periodically (every 100 requests)
let requestCount = 0;
function cleanupRateLimitMap() {
  requestCount++;
  if (requestCount % 100 === 0) {
    const now = Date.now();
    rateLimitMap.forEach((entry, key) => {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    });
  }
}

// --- JWT verification ---
function getSecret() {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
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

  cleanupRateLimitMap();

  // Rate limiting for POST requests on sensitive endpoints
  if (request.method === 'POST') {
    const limit = RATE_LIMITS[pathname];
    if (limit) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
      const key = `${ip}:${pathname}`;

      if (!checkRateLimit(key, limit)) {
        return NextResponse.json(
          { error: 'Príliš veľa požiadaviek. Skús to znova o minútu.' },
          { status: 429 }
        );
      }
    }
  }

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
  matcher: [
    '/admin/:path+',
    '/api/admin/:path+',
    '/api/register',
    '/api/login',
  ],
};
