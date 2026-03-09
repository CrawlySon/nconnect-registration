import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_token';
const TOKEN_EXPIRY = '8h';

function getSecret() {
  // Use ADMIN_PASSWORD + a salt as the signing secret
  // This way no extra env var is needed
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD not configured');
  return new TextEncoder().encode('nconnect-admin-jwt-' + secret);
}

export async function createAdminToken(): Promise<string> {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret());
  return token;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify admin authentication from cookies.
 * Returns true if authenticated, false otherwise.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return await verifyAdminToken(token);
  } catch {
    return false;
  }
}

/**
 * Use in API routes to check admin auth.
 * Returns a 401 NextResponse if not authenticated, or null if OK.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json(
      { error: 'Neautorizovaný prístup' },
      { status: 401 }
    );
  }
  return null;
}

/**
 * Set the admin auth cookie on the response.
 */
export async function setAdminCookie(response: NextResponse): Promise<void> {
  const token = await createAdminToken();
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours
  });
}

/**
 * Clear the admin auth cookie.
 */
export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export { COOKIE_NAME };
